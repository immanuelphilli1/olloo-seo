import PQueue from "p-queue";
import { and, eq, inArray, lt, notInArray, sql } from "drizzle-orm";
import { db, today } from "./db/client.ts";
import { audits, checkStats, findings as findingsTable, pages as pagesTable } from "./db/schema.ts";
import { checks } from "./engine/checks/registry.ts";
import { runAudit } from "./engine/runAudit.ts";
import { aiBudget } from "./services.ts";

// In-process job queue. Swap for BullMQ + Redis when running several servers.
const queue = new PQueue({ concurrency: 2 });

export function enqueueAudit(id: string): void {
  void queue.add(() => processAudit(id));
}

export function queuePosition(): number {
  return queue.size + queue.pending;
}

async function processAudit(id: string): Promise<void> {
  const audit = db.select().from(audits).where(eq(audits.id, id)).get();
  if (!audit) return;

  let lastWrite = 0;
  const onProgress = (update: { step: string; progress: number; pagesCrawled?: number }) => {
    const now = Date.now();
    if (now - lastWrite < 400 && update.progress < 95) return;
    lastWrite = now;
    db.update(audits)
      .set({
        status: update.progress < 60 ? "crawling" : update.progress < 85 ? "analyzing" : "fixing",
        step: update.step,
        progress: update.progress,
        ...(update.pagesCrawled !== undefined ? { pagesCrawled: update.pagesCrawled } : {}),
      })
      .where(eq(audits.id, id))
      .run();
  };

  try {
    db.update(audits).set({ status: "crawling", step: "Starting", progress: 1 }).where(eq(audits.id, id)).run();
    const result = await runAudit(audit.url, { onProgress, budget: aiBudget, keywords: audit.keywords ?? [] });
    const { ctx, findings, outcomes, scores, actionPlan, aiUsed, keywordReport } = result;

    const issuesByUrl = new Map<string, number>();
    for (const f of findings) for (const item of f.items) if (item.url) issuesByUrl.set(item.url, (issuesByUrl.get(item.url) ?? 0) + 1);

    db.transaction((tx) => {
      for (const p of ctx.pages) {
        tx.insert(pagesTable)
          .values({
            auditId: id,
            url: p.finalUrl,
            status: p.status,
            depth: p.depth,
            redirectChain: p.redirectChain,
            title: p.title,
            metaDescription: p.metaDescription,
            h1: p.h1s[0] ?? null,
            wordCount: p.wordCount,
            canonical: p.canonical,
            robotsMeta: p.metaRobots,
            schemaTypes: [...new Set(p.jsonLd.flatMap((b) => b.types))],
            inlinks: ctx.inlinks.get(p.finalUrl) ?? ctx.inlinks.get(p.url) ?? 0,
            outlinks: p.links.filter((l) => l.internal).length,
            ttfbMs: p.ttfbMs,
            htmlBytes: p.htmlBytes,
            issueCount: issuesByUrl.get(p.finalUrl) ?? 0,
          })
          .run();
      }
      for (const f of findings) {
        tx.insert(findingsTable)
          .values({ auditId: id, checkId: f.checkId, category: f.category, severity: f.severity, itemCount: f.items.length, data: f })
          .run();
      }
      // Anonymous aggregates for future "most common SEO mistakes" research.
      const failed = new Set(findings.map((f) => f.checkId));
      for (const check of checks) {
        tx.insert(checkStats)
          .values({ day: today(), checkId: check.id, sitesAffected: failed.has(check.id) ? 1 : 0, sitesAudited: 1 })
          .onConflictDoUpdate({
            target: [checkStats.day, checkStats.checkId],
            set: {
              sitesAffected: sql`${checkStats.sitesAffected} + ${failed.has(check.id) ? 1 : 0}`,
              sitesAudited: sql`${checkStats.sitesAudited} + 1`,
            },
          })
          .run();
      }
      tx.update(audits)
        .set({
          status: "done",
          step: "Done",
          progress: 100,
          pagesCrawled: ctx.pages.length,
          platform: ctx.platform,
          scores,
          outcomes,
          actionPlan,
          aiUsed,
          keywordReport,
          completedAt: Date.now(),
        })
        .where(eq(audits.id, id))
        .run();
    });
  } catch (err) {
    console.error(`[audit ${id}]`, err);
    db.update(audits)
      .set({ status: "failed", step: "Failed", error: (err as Error).message || "The audit failed unexpectedly.", completedAt: Date.now() })
      .where(eq(audits.id, id))
      .run();
  }
}

/** Re-queues audits interrupted by a restart and deletes expired reports. */
export function startMaintenance(): void {
  const interrupted = db.select({ id: audits.id }).from(audits).where(notInArray(audits.status, ["done", "failed"])).all();
  for (const { id } of interrupted) enqueueAudit(id);

  const cleanup = () => {
    const expired = db.select({ id: audits.id }).from(audits).where(lt(audits.expiresAt, Date.now())).all().map((a) => a.id);
    if (!expired.length) return;
    db.transaction((tx) => {
      tx.delete(pagesTable).where(inArray(pagesTable.auditId, expired)).run();
      tx.delete(findingsTable).where(inArray(findingsTable.auditId, expired)).run();
      tx.delete(audits).where(and(inArray(audits.id, expired))).run();
    });
    console.log(`[maintenance] deleted ${expired.length} expired audits`);
  };
  cleanup();
  setInterval(cleanup, 6 * 60 * 60 * 1000).unref();
}
