import type { Category, CheckDefinition, CheckOutcome, Finding, Scores, SiteContext } from "../types.ts";
import { aeoChecks } from "./aeo.ts";
import { contentChecks } from "./content.ts";
import { keywordChecks } from "./keywords.ts";
import { onpageChecks } from "./onpage.ts";
import { performanceChecks } from "./performance.ts";
import { technicalChecks } from "./technical.ts";

export const checks: CheckDefinition[] = [
  ...technicalChecks,
  ...onpageChecks,
  ...keywordChecks,
  ...contentChecks,
  ...aeoChecks,
  ...performanceChecks,
];

export const checksById = new Map(checks.map((c) => [c.id, c]));

const MAX_ITEMS = 200;
const SEVERITY_ORDER = { critical: 0, warning: 1, notice: 2 } as const;

export function runChecks(ctx: SiteContext): { findings: Finding[]; outcomes: CheckOutcome[] } {
  const findings: Finding[] = [];
  const outcomes: CheckOutcome[] = [];

  for (const check of checks) {
    let result;
    try {
      result = check.run(ctx);
    } catch (err) {
      outcomes.push({ checkId: check.id, title: check.title, category: check.category, status: "skipped", reason: `Check failed: ${(err as Error).message}` });
      continue;
    }
    if (!Array.isArray(result)) {
      outcomes.push({ checkId: check.id, title: check.title, category: check.category, status: "skipped", reason: result.skipped });
      continue;
    }
    if (result.length === 0) {
      outcomes.push({ checkId: check.id, title: check.title, category: check.category, status: "passed" });
      continue;
    }
    const items = result.slice(0, MAX_ITEMS);
    outcomes.push({ checkId: check.id, title: check.title, category: check.category, status: "failed" });
    findings.push({
      checkId: check.id,
      category: check.category,
      severity: check.severity,
      title: check.title,
      why: check.why,
      learnSlug: check.learnSlug,
      summary: check.summarize(result, ctx),
      items,
      fix: check.fix?.(items, ctx) ?? null,
    });
  }

  findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.items.length - a.items.length);
  return { findings, outcomes };
}

const WEIGHTS = { critical: 35, warning: 15, notice: 4 } as const;
const CATEGORY_WEIGHTS: Record<Category, number> = { technical: 0.25, onpage: 0.2, content: 0.15, aeo: 0.25, performance: 0.15 };

/**
 * Each category starts at 100 and loses points per finding, scaled by how much
 * of the site is affected. Categories where every check was skipped get no score.
 */
export function computeScores(findings: Finding[], outcomes: CheckOutcome[], pageCount: number): Scores {
  const categories = {} as Record<Category, number | null>;
  for (const category of Object.keys(CATEGORY_WEIGHTS) as Category[]) {
    const ran = outcomes.filter((o) => o.category === category && o.status !== "skipped");
    if (ran.length === 0) {
      categories[category] = null;
      continue;
    }
    let score = 100;
    for (const f of findings.filter((f) => f.category === category)) {
      const spread = Math.min(1, f.items.length / Math.max(3, pageCount));
      score -= WEIGHTS[f.severity] * (0.4 + 0.6 * spread);
    }
    categories[category] = Math.max(0, Math.round(score));
  }

  const scored = (Object.keys(CATEGORY_WEIGHTS) as Category[]).filter((c) => categories[c] !== null);
  const totalWeight = scored.reduce((sum, c) => sum + CATEGORY_WEIGHTS[c], 0);
  let overall = Math.round(scored.reduce((sum, c) => sum + (categories[c] as number) * CATEGORY_WEIGHTS[c], 0) / (totalWeight || 1));
  // A single critical problem (noindex, blocked crawlers, HTTP errors) can wipe
  // out a site's visibility, so it caps the overall score however good the rest is.
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  if (criticalCount > 0) overall = Math.min(overall, 75 - 10 * (criticalCount - 1));

  const aeo = categories.aeo ?? 100;
  const technical = categories.technical ?? 100;
  const content = categories.content ?? 100;
  let aiVisibility = Math.round(aeo * 0.6 + technical * 0.25 + content * 0.15);
  if (findings.some((f) => f.checkId === "ai-search-blocked" || f.checkId === "js-dependent-content")) aiVisibility = Math.min(aiVisibility, 40);

  return { overall: Math.max(0, overall), aiVisibility, categories };
}
