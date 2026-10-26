import { XMLParser } from "fast-xml-parser";
import { fetchUrl } from "./fetch.ts";
import { normalizeUrl } from "./parse.ts";
import type { SitemapInfo } from "../types.ts";

const MAX_SITEMAP_FILES = 10;
const MAX_URLS = 5000;

const parser = new XMLParser({ ignoreAttributes: true, isArray: (name) => name === "url" || name === "sitemap" });

function locs(entries: unknown): string[] {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((e) => (e && typeof e === "object" ? (e as Record<string, unknown>).loc : null))
    .filter((loc): loc is string => typeof loc === "string")
    .map((loc) => loc.trim());
}

/**
 * Reads sitemaps listed in robots.txt (or the conventional locations) and
 * returns every page URL they contain, following sitemap indexes.
 */
export async function collectSitemaps(origin: string, declared: string[]): Promise<{ sitemaps: SitemapInfo[]; urls: string[] }> {
  const queue = declared.length ? [...declared] : [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`];
  const usedFallback = declared.length === 0;
  const seen = new Set<string>();
  const urls = new Set<string>();
  const sitemaps: SitemapInfo[] = [];

  while (queue.length && seen.size < MAX_SITEMAP_FILES && urls.size < MAX_URLS) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);

    const res = await fetchUrl(url, { accept: "application/xml,text/xml,*/*", maxBytes: 10 * 1024 * 1024 });
    const info: SitemapInfo = { url, status: res.status, urlCount: 0, error: res.error };
    if (res.status !== 200 || !res.body) {
      // Conventional locations that don't exist aren't errors worth listing.
      if (!usedFallback || res.status !== 404) sitemaps.push(info);
      continue;
    }
    if (url.endsWith(".gz")) {
      info.error = "Compressed (.gz) sitemaps can't be read here, they are still fine for Google.";
      sitemaps.push(info);
      continue;
    }

    try {
      const doc = parser.parse(res.body) as Record<string, any>;
      if (doc.sitemapindex) {
        queue.push(...locs(doc.sitemapindex.sitemap));
        info.urlCount = 0;
      } else if (doc.urlset) {
        for (const loc of locs(doc.urlset.url)) {
          const norm = normalizeUrl(loc);
          if (norm) urls.add(norm);
          if (urls.size >= MAX_URLS) break;
        }
        info.urlCount = locs(doc.urlset.url).length;
      } else {
        info.error = "This file is not a valid XML sitemap (no <urlset> or <sitemapindex>).";
      }
    } catch (err) {
      info.error = `Invalid XML: ${(err as Error).message}`;
    }
    sitemaps.push(info);
    // If /sitemap.xml worked we don't need to also try /sitemap_index.xml.
    if (usedFallback && !info.error) queue.length = 0;
  }

  return { sitemaps, urls: [...urls] };
}
