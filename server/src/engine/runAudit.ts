import { crawlSite, type ProgressFn } from "./crawler/crawl.ts";
import { runPageSpeed } from "./crawler/pagespeed.ts";
import { compareRendering } from "./crawler/render.ts";
import { computeScores, runChecks } from "./checks/registry.ts";
import { indexablePages } from "./checks/util.ts";
import { AiFixer, type AiBudget } from "./fixes/ai.ts";
import { buildActionPlan } from "./fixes/plan.ts";
import { analyzeKeywords } from "./keywords/match.ts";
import { detectPlatform } from "./platforms/detect.ts";
import type { ActionPlan, CheckOutcome, Finding, KeywordResult, Scores, SiteContext } from "./types.ts";

export interface AuditResult {
  ctx: SiteContext;
  findings: Finding[];
  outcomes: CheckOutcome[];
  scores: Scores;
  actionPlan: ActionPlan;
  aiUsed: boolean;
  keywordReport: KeywordResult[];
}

export interface AuditOptions {
  onProgress: ProgressFn;
  budget: AiBudget;
  /** Skip the slow external steps (browser rendering, PageSpeed) — used in tests. */
  fast?: boolean;
  /** Optional target keywords (already normalized, max 5). */
  keywords?: string[];
}

export async function runAudit(url: string, options: AuditOptions): Promise<AuditResult> {
  const { onProgress, budget, fast, keywords = [] } = options;
  const crawl = await crawlSite(url, onProgress);

  const others = crawl.pages.filter((p) => p.finalUrl !== crawl.homepage.finalUrl && p.isHtml && p.status === 200);
  const byLinks = [...others].sort((a, b) => (crawl.inlinks.get(b.finalUrl) ?? 0) - (crawl.inlinks.get(a.finalUrl) ?? 0));
  // For the JavaScript check, pages with almost no text in their raw HTML are
  // the likeliest client-rendered shells, so test those first.
  const suspicious = others.filter((p) => p.wordCount < 50).sort((a, b) => a.wordCount - b.wordCount);
  const renderPages = [...new Set([crawl.homepage.finalUrl, ...suspicious.map((p) => p.finalUrl), ...byLinks.map((p) => p.finalUrl)])].slice(0, 3);
  const speedPages = [crawl.homepage.finalUrl, ...byLinks.map((p) => p.finalUrl)].slice(0, 2);

  onProgress({ step: "Testing what AI crawlers see and measuring Core Web Vitals", progress: 68 });
  const [render, pagespeed] = fast
    ? [{ results: [], skipped: "Skipped in fast mode." }, { results: [], skipped: "Skipped in fast mode." }]
    : await Promise.all([compareRendering(renderPages), runPageSpeed(speedPages)]);

  const ctx: SiteContext = {
    ...crawl,
    render,
    pagespeed,
    platform: detectPlatform(crawl.homepage),
    keywords,
    keywordResults: keywords.length ? analyzeKeywords(crawl, keywords) : [],
  };

  onProgress({ step: "Running 50+ SEO and AI-visibility checks", progress: 80 });
  const { findings, outcomes } = runChecks(ctx);
  let actionPlan = buildActionPlan(ctx, findings);

  const ai = new AiFixer(budget);
  if (ai.enabled) {
    onProgress({ step: "Writing your fixes with AI", progress: 85 });
    const [review] = await Promise.all([
      ai.reviewContent(ctx, findings),
      ai.rewriteTitlesAndDescriptions(ctx, findings),
      ai.writeAltText(ctx, findings),
    ]);
    if (review) {
      findings.push(review);
      const outcome = outcomes.find((o) => o.checkId === "aeo-writing");
      if (outcome) {
        outcome.status = "failed";
        delete outcome.reason;
      }
    } else if (ai.wasUsed) {
      const outcome = outcomes.find((o) => o.checkId === "aeo-writing");
      if (outcome) {
        outcome.status = "passed";
        delete outcome.reason;
      }
    }
    onProgress({ step: "Building your personalized action plan", progress: 94 });
    actionPlan = await ai.personalizePlan(ctx, findings, actionPlan);
  }

  const scores = computeScores(findings, outcomes, indexablePages(ctx).length);
  return { ctx, findings, outcomes, scores, actionPlan, aiUsed: ai.wasUsed, keywordReport: ctx.keywordResults };
}
