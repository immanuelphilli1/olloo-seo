import { Hono } from "hono";
import { and, desc, eq, gt } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { config } from "../config.ts";
import { db } from "../db/client.ts";
import { audits, findings as findingsTable, pages as pagesTable } from "../db/schema.ts";
import { normalizeInputUrl } from "../engine/crawler/crawl.ts";
import { assertAllowedUrl, assertPublicHost, BlockedTargetError } from "../engine/crawler/ssrf.ts";
import { buildFixZip } from "../engine/fixes/zip.ts";
import { normalizeKeywords } from "../engine/keywords/match.ts";
import { enqueueAudit, queuePosition } from "../jobs.ts";
import { consumeRateLimit, hashIp, verifyTurnstile } from "../services.ts";
import { clientIp } from "./ip.ts";

const newId = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 14);
const bareHost = (host: string) => host.toLowerCase().replace(/^www\./, "");

const createSchema = z.object({
  url: z.string().min(3).max(2048),
  turnstileToken: z.string().optional(),
  force: z.boolean().optional(),
  keywords: z.array(z.string().max(200)).max(10).optional(),
});

export const auditRoutes = new Hono();

auditRoutes.post("/", async (c) => {
  const parsed = createSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Please enter a website address." }, 400);

  let url: string;
  try {
    url = normalizeInputUrl(parsed.data.url);
    const u = assertAllowedUrl(url);
    await assertPublicHost(u.hostname);
  } catch (err) {
    const message = err instanceof BlockedTargetError || err instanceof Error ? err.message : "Invalid address.";
    return c.json({ error: message }, 400);
  }

  const host = bareHost(new URL(url).hostname);
  const ip = clientIp(c);
  const keywords = normalizeKeywords(parsed.data.keywords);
  const keywordKey = JSON.stringify(keywords.map((k) => k.toLowerCase()).sort());

  // Recent report for the same site (and the same keywords): reuse it instead of crawling again.
  if (!parsed.data.force) {
    const recent = db
      .select({ id: audits.id, keywords: audits.keywords })
      .from(audits)
      .where(and(eq(audits.host, host), gt(audits.createdAt, Date.now() - config.cacheHours * 3600_000), eq(audits.status, "done")))
      .orderBy(desc(audits.createdAt))
      .all()
      .find((a) => JSON.stringify((a.keywords ?? []).map((k) => k.toLowerCase()).sort()) === keywordKey);
    if (recent) return c.json({ id: recent.id, cached: true });
  }

  if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) {
    return c.json({ error: "Please complete the verification check and try again." }, 403);
  }
  const remaining = consumeRateLimit(`audit:${hashIp(ip)}`, config.auditsPerIpPerDay);
  if (remaining < 0) {
    return c.json({ error: `You've reached the limit of ${config.auditsPerIpPerDay} free audits per day. Please come back tomorrow.` }, 429);
  }

  const id = newId();
  const now = Date.now();
  db.insert(audits)
    .values({
      id,
      url,
      host,
      status: "queued",
      step: queuePosition() > 1 ? "Waiting in queue" : "Starting",
      ipHash: hashIp(ip),
      keywords,
      createdAt: now,
      expiresAt: now + config.reportTtlDays * 86_400_000,
    })
    .run();
  enqueueAudit(id);
  return c.json({ id, cached: false, remaining }, 201);
});

auditRoutes.get("/:id", (c) => {
  const audit = db.select().from(audits).where(eq(audits.id, c.req.param("id"))).get();
  if (!audit) return c.json({ error: "This report doesn't exist or has expired." }, 404);

  const { ipHash: _ip, ...publicAudit } = audit;
  if (audit.status !== "done") return c.json({ audit: publicAudit, findings: [], pages: [] });

  const findings = db.select().from(findingsTable).where(eq(findingsTable.auditId, audit.id)).all().map((f) => f.data);
  const pages = db
    .select()
    .from(pagesTable)
    .where(eq(pagesTable.auditId, audit.id))
    .all()
    .map(({ auditId: _a, id: _i, ...p }) => p);
  return c.json({ audit: publicAudit, findings, pages });
});

auditRoutes.get("/:id/fixes.zip", async (c) => {
  const audit = db.select().from(audits).where(eq(audits.id, c.req.param("id"))).get();
  if (!audit || audit.status !== "done") return c.json({ error: "Report not found." }, 404);
  const findings = db.select().from(findingsTable).where(eq(findingsTable.auditId, audit.id)).all().map((f) => f.data);
  const zip = await buildFixZip(audit.host, findings, audit.actionPlan ?? null);
  return new Response(new Uint8Array(zip), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="seo-fixes-${audit.host}.zip"`,
    },
  });
});
