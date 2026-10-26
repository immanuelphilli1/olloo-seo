import { config } from "../../config.ts";
import type { PageSpeedResult } from "../types.ts";

const ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

function numeric(audits: Record<string, any> | undefined, id: string): number | null {
  const value = audits?.[id]?.numericValue;
  return typeof value === "number" ? value : null;
}

async function runOne(url: string): Promise<PageSpeedResult> {
  const params = new URLSearchParams({ url, strategy: "mobile", category: "performance" });
  if (config.pagespeedApiKey) params.set("key", config.pagespeedApiKey);
  try {
    // This is a fixed Google endpoint, not a user-controlled URL, so plain fetch is fine.
    const res = await fetch(`${ENDPOINT}?${params}`, { signal: AbortSignal.timeout(90_000) });
    if (!res.ok) {
      const reason = res.status === 429 ? "Google's free PageSpeed quota is used up, add a PAGESPEED_API_KEY" : `PageSpeed Insights returned ${res.status}`;
      return { url, performanceScore: null, lcpMs: null, cls: null, tbtMs: null, inpMs: null, error: reason };
    }
    const data = (await res.json()) as any;
    const audits = data.lighthouseResult?.audits;
    const field = data.loadingExperience?.metrics;
    return {
      url,
      performanceScore: typeof data.lighthouseResult?.categories?.performance?.score === "number"
        ? Math.round(data.lighthouseResult.categories.performance.score * 100)
        : null,
      lcpMs: field?.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? numeric(audits, "largest-contentful-paint"),
      cls: field?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile !== undefined
        ? field.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
        : numeric(audits, "cumulative-layout-shift"),
      tbtMs: numeric(audits, "total-blocking-time"),
      inpMs: field?.INTERACTION_TO_NEXT_PAINT?.percentile ?? null,
      error: null,
    };
  } catch (err) {
    return { url, performanceScore: null, lcpMs: null, cls: null, tbtMs: null, inpMs: null, error: `PageSpeed Insights failed: ${(err as Error).message}` };
  }
}

/** Core Web Vitals from Google PageSpeed Insights (mobile). */
export async function runPageSpeed(urls: string[]): Promise<{ results: PageSpeedResult[]; skipped: string | null }> {
  const host = urls[0] ? new URL(urls[0]).hostname : "";
  if (config.allowPrivateTargets && (host === "localhost" || /^127\.|^10\.|^192\.168\./.test(host))) {
    return { results: [], skipped: "Google PageSpeed Insights can't reach local test sites." };
  }
  if (process.env.SKIP_PAGESPEED === "true") {
    return { results: [], skipped: "PageSpeed checks are disabled (SKIP_PAGESPEED=true)." };
  }
  const results = await Promise.all(urls.map(runOne));
  const ok = results.filter((r) => !r.error);
  if (!ok.length) return { results: [], skipped: results[0]?.error ?? "PageSpeed Insights was unavailable." };
  return { results: ok, skipped: null };
}
