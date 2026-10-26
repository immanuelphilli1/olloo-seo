import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { compress } from "hono/compress";
import { eq, sql } from "drizzle-orm";
import { config } from "./config.ts";
import { db } from "./db/client.ts";
import { audits, checkStats } from "./db/schema.ts";
import { checksById } from "./engine/checks/registry.ts";
import { startMaintenance } from "./jobs.ts";
import { auditRoutes } from "./routes/audits.ts";
import { toolRoutes } from "./routes/tools.ts";

const app = new Hono();
app.use("*", secureHeaders({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: undefined }));
app.use("*", compress());

// API responses are data, not pages.
app.use("/api/*", async (c, next) => {
  await next();
  c.header("X-Robots-Tag", "noindex");
});

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/config", (c) =>
  c.json({
    siteName: config.siteName,
    aiEnabled: Boolean(config.anthropicApiKey),
    turnstileSiteKey: config.turnstileSiteKey || null,
    auditsPerDay: config.auditsPerIpPerDay,
  }),
);

/** Public aggregate stats ("we've audited N sites; X% block AI crawlers"). */
app.get("/api/stats", (c) => {
  const completed = db.select({ n: sql<number>`count(*)` }).from(audits).where(eq(audits.status, "done")).get()?.n ?? 0;
  const rows = db
    .select({ checkId: checkStats.checkId, affected: sql<number>`sum(${checkStats.sitesAffected})`, audited: sql<number>`sum(${checkStats.sitesAudited})` })
    .from(checkStats)
    .groupBy(checkStats.checkId)
    .all();
  const topIssues = rows
    .filter((r) => r.audited > 0)
    .map((r) => ({ checkId: r.checkId, title: checksById.get(r.checkId)?.title ?? r.checkId, percent: Math.round((r.affected / r.audited) * 100) }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 10);
  return c.json({ auditsCompleted: completed, topIssues });
});

app.route("/api/audits", auditRoutes);
app.route("/api/tools", toolRoutes);
app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

// In production (`npm start` after `npm run build`), this server also serves
// the prerendered website so everything runs on one port.
if (config.isProduction) {
  const clientDir = path.resolve(fileURLToPath(new URL("../../web/build/client", import.meta.url)));
  const spaFallback = path.join(clientDir, "__spa-fallback.html");
  const relRoot = path.relative(process.cwd(), clientDir);

  // One URL per page: redirect /page/ and /page/index.html to /page so search
  // engines never see duplicates.
  app.use("*", async (c, next) => {
    const url = new URL(c.req.url);
    let clean = url.pathname;
    if (clean.endsWith("/index.html")) clean = clean.slice(0, -"index.html".length);
    if (clean.length > 1 && clean.endsWith("/")) clean = clean.replace(/\/+$/, "");
    if (clean !== url.pathname) return c.redirect(`${clean || "/"}${url.search}`, 301);
    if (url.pathname === "/__spa-fallback.html") return c.text("Not found", 404);
    await next();
  });

  app.use("*", async (c, next) => {
    await next();
    const p = new URL(c.req.url).pathname;
    if (p.startsWith("/assets/")) c.header("Cache-Control", "public, max-age=31536000, immutable");
    else if (/\.(txt|xml|webmanifest)$/.test(p)) c.header("Cache-Control", "public, max-age=3600");
    else if (/\.(png|svg|ico|jpg|webp)$/.test(p)) c.header("Cache-Control", "public, max-age=86400");
    else c.header("Cache-Control", "public, max-age=0, must-revalidate");
    // Reports are private: keep them out of search results even if a link is shared publicly.
    if (p.startsWith("/audit/")) c.header("X-Robots-Tag", "noindex, nofollow");
  });
  app.use("*", serveStatic({ root: relRoot }));
  app.get("*", (c) => {
    const reqPath = decodeURIComponent(new URL(c.req.url).pathname).replace(/\/+$/, "");
    const prerendered = path.join(clientDir, reqPath, "index.html");
    if (prerendered.startsWith(clientDir) && fs.existsSync(prerendered)) return c.html(fs.readFileSync(prerendered, "utf8"));
    if (!fs.existsSync(spaFallback)) return c.text("Not found", 404);
    // Client-rendered routes (the report pages) get the SPA shell; everything
    // else is a real 404 so search engines never index junk URLs.
    const isAppRoute = /^\/audit\/[a-z0-9]+$/i.test(reqPath);
    return c.html(fs.readFileSync(spaFallback, "utf8"), isAppRoute ? 200 : 404);
  });
}

startMaintenance();
serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}${config.isProduction ? " (serving the built site too)" : ""}`);
  if (!config.anthropicApiKey) console.log("AI fixes are off — set ANTHROPIC_API_KEY in .env to enable them.");
  if (config.allowPrivateTargets) console.warn("WARNING: ALLOW_PRIVATE_TARGETS is on. Only use this for local testing.");
});
