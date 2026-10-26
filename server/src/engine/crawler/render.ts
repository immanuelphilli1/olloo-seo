import { assertAllowedUrl, assertPublicHost } from "./ssrf.ts";
import { visibleWordCount } from "./parse.ts";
import { fetchUrl } from "./fetch.ts";
import { userAgent } from "../../config.ts";
import type { RenderResult } from "../types.ts";

/**
 * Compares what a non-JavaScript crawler (like ChatGPT's) sees with what a
 * browser shows. Playwright is optional: without it this step is skipped.
 */
export async function compareRendering(urls: string[]): Promise<{ results: RenderResult[]; skipped: string | null }> {
  let chromium: typeof import("playwright").chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return { results: [], skipped: "Playwright is not installed, so JavaScript rendering wasn't compared." };
  }

  let browser: Awaited<ReturnType<typeof chromium.launch>>;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    return {
      results: [],
      skipped: "No headless browser is available (run `npx playwright install chromium`), so JavaScript rendering wasn't compared.",
    };
  }

  const results: RenderResult[] = [];
  try {
    const context = await browser.newContext({ userAgent, javaScriptEnabled: true });
    // Every request the browser makes goes through the same SSRF checks as the crawler.
    await context.route("**/*", async (route) => {
      const request = route.request();
      if (["image", "media", "font"].includes(request.resourceType())) return route.abort();
      try {
        const url = assertAllowedUrl(request.url());
        await assertPublicHost(url.hostname);
        return route.continue();
      } catch {
        return route.abort();
      }
    });

    for (const url of urls) {
      const raw = await fetchUrl(url);
      if (!raw.body) continue;
      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 20_000 });
      } catch {
        // Pages that never go fully idle (chat widgets, polling) still rendered enough to count.
      }
      const renderedText = await page.evaluate(() => document.body?.innerText ?? "").catch(() => "");
      await page.close();
      const renderedWords = renderedText.split(/\s+/).filter(Boolean).length;
      results.push({ url, rawWords: visibleWordCount(raw.body), renderedWords });
    }
  } finally {
    await browser.close();
  }
  return { results, skipped: null };
}
