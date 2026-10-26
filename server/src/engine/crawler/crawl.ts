import crypto from "node:crypto";
import { config, botToken } from "../../config.ts";
import { fetchUrl, fetchWithHttpFallback, checkStatus, type FetchResult } from "./fetch.ts";
import { emptyParsed, normalizeUrl, parseHtml, sameSite } from "./parse.ts";
import { fetchRobots, parseRobots } from "./robots.ts";
import { collectSitemaps } from "./sitemap.ts";
import type { PageData, SiteContext, VariantCheck } from "../types.ts";

export type ProgressFn = (update: { step: string; progress: number; pagesCrawled?: number }) => void;

// Links search engines don't treat as content: CMS actions (share, reply,
// print), feeds, admin and login screens.
const NON_CONTENT = /[?&](share|replytocom|print|action|add-to-cart|orderby|filter_[a-z]+)=|\/(feed|wp-json|wp-admin|wp-login\.php|xmlrpc\.php|cart|checkout|my-account)(\/|$)/i;

const NON_HTML_EXT = /\.(pdf|jpe?g|png|gif|webp|avif|svg|ico|css|js|mjs|json|xml|txt|zip|gz|rar|7z|mp4|webm|mov|mp3|wav|woff2?|ttf|eot|docx?|xlsx?|pptx?|csv|exe|dmg)$/i;

function toPageData(res: FetchResult, depth: number, foundVia: PageData["foundVia"]): PageData {
  const contentType = res.headers["content-type"] ?? "";
  const isHtml = res.status >= 200 && res.status < 300 && /html/i.test(contentType) && res.body !== null;
  const parsed = isHtml ? parseHtml(res.body!, res.finalUrl) : emptyParsed();
  return {
    url: res.url,
    finalUrl: res.finalUrl,
    status: res.status,
    redirectChain: res.redirectChain,
    depth,
    foundVia,
    contentType,
    headers: res.headers,
    ttfbMs: res.ttfbMs,
    htmlBytes: res.body ? Buffer.byteLength(res.body) : res.bytes,
    isHtml,
    error: res.error,
    ...parsed,
  };
}

async function variantCheck(url: string): Promise<VariantCheck> {
  const res = await fetchUrl(url, { followRedirects: false, method: "GET", maxBytes: 64 * 1024, timeoutMs: 10_000 });
  const location = res.headers.location;
  return {
    url,
    status: res.status,
    redirectsTo: location ? new URL(location, url).href : null,
    error: res.error,
  };
}

async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}

type CrawlResult = Omit<SiteContext, "render" | "pagespeed" | "platform" | "keywords" | "keywordResults">;

/**
 * Breadth-first crawl of one site. The submitted URL is always fetched (it's a
 * user-initiated check); everything discovered afterwards respects robots.txt.
 */
export async function crawlSite(startUrl: string, onProgress: ProgressFn): Promise<CrawlResult> {
  onProgress({ step: "Fetching your homepage", progress: 3 });
  const first = await fetchWithHttpFallback(startUrl);
  if (first.status === 0) {
    throw new Error(`We couldn't load ${startUrl}: ${first.error ?? "no response"}.`);
  }
  const homepage = toPageData(first, 0, "start");
  const origin = new URL(first.finalUrl).origin;
  const host = new URL(first.finalUrl).hostname;

  onProgress({ step: "Reading robots.txt and sitemaps", progress: 8 });
  const robots = await fetchRobots(origin);
  const robotsTxt = parseRobots(robots);
  const declaredSitemaps = robots.body ? robotsTxt.getSitemaps() : [];
  const { sitemaps, urls: sitemapUrls } = await collectSitemaps(origin, declaredSitemaps);

  const fetched = new Map<string, PageData>();
  const visited = new Set<string>();
  const inlinkSources = new Map<string, Set<string>>();
  const pagesByFinal = new Map<string, PageData>();

  const register = (page: PageData) => {
    fetched.set(page.url, page);
    visited.add(page.url);
    visited.add(page.finalUrl);
    // A link that redirects off-site (e.g. a share button) isn't one of this site's pages.
    const onSite = sameSite(new URL(page.finalUrl).hostname, host);
    if (page.isHtml && onSite && !pagesByFinal.has(page.finalUrl)) pagesByFinal.set(page.finalUrl, page);
  };
  register(homepage);

  const queue: { url: string; depth: number; via: PageData["foundVia"] }[] = [];
  const enqueueLinks = (page: PageData) => {
    if (!page.isHtml) return;
    const seenOnPage = new Set<string>();
    for (const link of page.links) {
      if (!link.internal || seenOnPage.has(link.href)) continue;
      seenOnPage.add(link.href);
      if (!inlinkSources.has(link.href)) inlinkSources.set(link.href, new Set());
      inlinkSources.get(link.href)!.add(page.finalUrl);
      if (visited.has(link.href) || queue.some((q) => q.url === link.href)) continue;
      if (NON_HTML_EXT.test(new URL(link.href).pathname) || NON_CONTENT.test(link.href)) continue;
      // Like Googlebot, don't treat nofollow links as paths to crawl.
      if (link.rel.includes("nofollow")) continue;
      if (!sameSite(new URL(link.href).hostname, host)) continue;
      queue.push({ url: link.href, depth: page.depth + 1, via: "link" });
    }
  };
  enqueueLinks(homepage);

  const maxPages = config.crawl.maxPages;
  const maxFetches = Math.ceil(maxPages * 1.5);
  let fetchCount = 1;
  let sitemapSeeded = false;

  while (pagesByFinal.size < maxPages && fetchCount < maxFetches) {
    if (queue.length === 0) {
      if (sitemapSeeded) break;
      sitemapSeeded = true;
      for (const url of sitemapUrls) {
        if (!visited.has(url) && sameSite(new URL(url).hostname, host)) queue.push({ url, depth: -1, via: "sitemap" });
      }
      if (queue.length === 0) break;
    }
    const batch: typeof queue = [];
    while (queue.length && batch.length < config.crawl.concurrency) {
      const next = queue.shift()!;
      if (visited.has(next.url)) continue;
      if (!robotsTxt.isAllowed(next.url, botToken) && robots.body) {
        visited.add(next.url);
        continue;
      }
      visited.add(next.url);
      batch.push(next);
    }
    await Promise.all(
      batch.map(async (item) => {
        fetchCount++;
        const res = await fetchUrl(item.url);
        const page = toPageData(res, item.depth, item.via);
        register(page);
        enqueueLinks(page);
      }),
    );
    onProgress({
      step: `Crawling pages (${pagesByFinal.size} found)`,
      progress: Math.min(55, 10 + Math.round((pagesByFinal.size / maxPages) * 45)),
      pagesCrawled: pagesByFinal.size,
    });
  }

  const crawlTruncated =
    queue.some((q) => !visited.has(q.url)) || sitemapUrls.some((u) => !visited.has(u) && sameSite(new URL(u).hostname, host));

  const inlinks = new Map<string, number>();
  for (const [target, sources] of inlinkSources) inlinks.set(target, sources.size);

  // Status of internal link targets we didn't crawl (e.g. PDFs, or past the page limit).
  onProgress({ step: "Checking links and images", progress: 58 });
  const linkStatus = new Map<string, number>();
  const uncrawled = [...inlinkSources.keys()].filter((u) => !fetched.has(u) && !visited.has(u) && !NON_CONTENT.test(u)).slice(0, 60);
  for (const [url, page] of fetched) linkStatus.set(url, page.status);
  await pool(uncrawled, 5, async (url) => {
    if (robots.body && !robotsTxt.isAllowed(url, botToken)) return;
    linkStatus.set(url, (await checkStatus(url)).status);
  });

  const externalStatus = new Map<string, number>();
  const external = [...new Set([...pagesByFinal.values()].flatMap((p) => p.links.filter((l) => !l.internal).map((l) => l.href)))].slice(0, 25);
  await pool(external, 5, async (url) => {
    externalStatus.set(url, (await checkStatus(url)).status);
  });

  const imageBytes = new Map<string, number | null>();
  const images = [...new Set([...pagesByFinal.values()].flatMap((p) => p.images.map((i) => i.src)))].slice(0, 40);
  await pool(images, 6, async (src) => {
    const res = await checkStatus(src);
    imageBytes.set(src, res.status >= 200 && res.status < 300 ? res.bytes : null);
  });

  onProgress({ step: "Checking redirects, 404 handling and llms.txt", progress: 63 });
  const probeUrl = `${origin}/${crypto.randomBytes(6).toString("hex")}-page-that-should-not-exist`;
  const [probe, llms] = await Promise.all([
    fetchUrl(probeUrl, { maxBytes: 256 * 1024 }),
    fetchUrl(`${origin}/llms.txt`, { accept: "text/plain,text/markdown,*/*", maxBytes: 256 * 1024 }),
  ]);
  const soft404 = probe.status === 0 ? null : { url: probeUrl, status: probe.status };
  const llmsTxt = { status: llms.status, isText: llms.status === 200 && !/html/i.test(llms.headers["content-type"] ?? "") };

  const isHttps = origin.startsWith("https:");
  const altHost = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
  const port = new URL(origin).port ? `:${new URL(origin).port}` : "";
  const [httpVariant, wwwVariant] = await Promise.all([
    isHttps ? variantCheck(`http://${host}${port}/`) : Promise.resolve(null),
    /^\d+\.\d+\.\d+\.\d+$/.test(host) || host === "localhost" ? Promise.resolve(null) : variantCheck(`${new URL(origin).protocol}//${altHost}${port}/`),
  ]);

  return {
    startUrl,
    origin,
    host,
    homepage,
    pages: [...pagesByFinal.values()],
    fetched,
    linkStatus,
    externalStatus,
    imageBytes,
    inlinks,
    robots,
    sitemaps,
    sitemapUrls,
    crawlTruncated,
    soft404,
    httpVariant,
    wwwVariant,
    llmsTxt,
  };
}

/** Normalizes user input like "example.com" into a full URL. */
export function normalizeInputUrl(input: string): string {
  let value = input.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = `https://${value}`;
  const url = normalizeUrl(value);
  if (!url) throw new Error("That doesn't look like a valid website address.");
  const parsed = new URL(url);
  if (!parsed.hostname.includes(".") && !config.allowPrivateTargets) {
    throw new Error("That doesn't look like a valid website address.");
  }
  return url;
}
