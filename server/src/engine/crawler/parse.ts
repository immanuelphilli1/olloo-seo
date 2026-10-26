import crypto from "node:crypto";
import * as cheerio from "cheerio";
import type { Heading, ImageRef, JsonLdBlock, LinkRef, PageData } from "../types.ts";

export function sameSite(a: string, b: string): boolean {
  return a.replace(/^www\./, "") === b.replace(/^www\./, "");
}

/** Normalizes a URL for de-duplication: no hash, default ports and trailing "?" removed. */
export function normalizeUrl(href: string, base?: string): string | null {
  try {
    const url = new URL(href, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    if ((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443")) url.port = "";
    return url.href;
  } catch {
    return null;
  }
}

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function collectTypes(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    node.forEach((n) => collectTypes(n, out));
    return;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const type = obj["@type"];
    if (typeof type === "string") out.add(type);
    if (Array.isArray(type)) type.forEach((t) => typeof t === "string" && out.add(t));
    if (obj["@graph"]) collectTypes(obj["@graph"], out);
    for (const [key, value] of Object.entries(obj)) {
      if (key !== "@graph" && typeof value === "object") collectTypes(value, out);
    }
  }
}

function findDateModified(blocks: JsonLdBlock[]): string | null {
  let found: string | null = null;
  const walk = (node: unknown) => {
    if (found || !node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    const obj = node as Record<string, unknown>;
    if (typeof obj.dateModified === "string") found = obj.dateModified;
    else if (typeof obj.datePublished === "string" && !found) found = obj.datePublished;
    Object.values(obj).forEach(walk);
  };
  blocks.forEach((b) => walk(b.data));
  return found;
}

const EMPTY_PAGE_FIELDS = {
  title: null,
  titleCount: 0,
  metaDescription: null,
  metaDescriptionCount: 0,
  metaRobots: null,
  canonical: null,
  lang: null,
  viewport: null,
  generator: null,
  h1s: [],
  headings: [],
  wordCount: 0,
  text: "",
  paragraphs: [],
  images: [],
  links: [],
  og: {},
  twitter: {},
  jsonLd: [],
  hreflang: [],
  mixedContent: [],
  renderBlocking: 0,
  dateModified: null,
  hasAuthor: false,
  contentHash: "",
} satisfies Partial<PageData>;

export function emptyParsed(): Omit<PageData, "url" | "finalUrl" | "status" | "redirectChain" | "depth" | "foundVia" | "contentType" | "headers" | "ttfbMs" | "htmlBytes" | "isHtml" | "error"> {
  return structuredClone(EMPTY_PAGE_FIELDS);
}

/** Extracts every SEO-relevant signal from an HTML document. */
export function parseHtml(html: string, pageUrl: string): ReturnType<typeof emptyParsed> {
  const $ = cheerio.load(html);
  const pageHost = new URL(pageUrl).hostname;
  const isHttps = pageUrl.startsWith("https:");

  // SVG icons can contain <title> elements, so only count document titles.
  const titles = $("head > title").length ? $("head > title") : $("html > title, body > title");
  const title = titles.length ? clean(titles.first().text()) : null;
  const metaDescriptions = $('meta[name="description" i]');
  const metaDescription = metaDescriptions.length ? clean(metaDescriptions.first().attr("content") ?? "") : null;
  const robotsMetas = $('meta[name="robots" i], meta[name="googlebot" i]')
    .map((_, el) => $(el).attr("content") ?? "")
    .get()
    .filter(Boolean);
  const canonicalHref = $('link[rel="canonical" i]').first().attr("href");
  const canonical = canonicalHref ? normalizeUrl(canonicalHref, pageUrl) : null;

  const og: Record<string, string> = {};
  $('meta[property^="og:" i]').each((_, el) => {
    const key = ($(el).attr("property") ?? "").toLowerCase();
    if (key && !og[key]) og[key] = $(el).attr("content") ?? "";
  });
  const twitter: Record<string, string> = {};
  $('meta[name^="twitter:" i]').each((_, el) => {
    const key = ($(el).attr("name") ?? "").toLowerCase();
    if (key && !twitter[key]) twitter[key] = $(el).attr("content") ?? "";
  });

  const jsonLd: JsonLdBlock[] = [];
  $('script[type="application/ld+json" i]').each((_, el) => {
    const raw = $(el).text().trim();
    try {
      const data = JSON.parse(raw);
      const types = new Set<string>();
      collectTypes(data, types);
      jsonLd.push({ raw, data, error: null, types: [...types] });
    } catch (err) {
      jsonLd.push({ raw: raw.slice(0, 2000), data: null, error: (err as Error).message, types: [] });
    }
  });

  const hreflang = $('link[rel="alternate" i][hreflang]')
    .map((_, el) => ({ lang: $(el).attr("hreflang") ?? "", href: $(el).attr("href") ?? "" }))
    .get();

  const generator = $('meta[name="generator" i]').attr("content") ?? null;
  const renderBlocking =
    $('head script[src]:not([async]):not([defer]):not([type="module"])').length +
    $('head link[rel="stylesheet" i]:not([media="print"])').length;

  const mixedContent: string[] = [];
  if (isHttps) {
    $("img[src], script[src], link[rel=stylesheet][href], iframe[src], video[src], audio[src], source[src]").each((_, el) => {
      const ref = $(el).attr("src") ?? $(el).attr("href") ?? "";
      if (ref.startsWith("http://")) mixedContent.push(ref);
    });
  }

  const dateModified =
    $('meta[property="article:modified_time" i]').attr("content") ??
    $('meta[property="og:updated_time" i]').attr("content") ??
    findDateModified(jsonLd) ??
    $("time[datetime]").first().attr("datetime") ??
    null;

  const hasAuthor =
    $('meta[name="author" i]').length > 0 ||
    $('[rel="author"], [itemprop="author"], .author, .byline, .post-author').length > 0 ||
    jsonLd.some((b) => b.raw.includes('"author"'));

  // Content analysis runs on the body without navigation chrome.
  const body = $("body").clone();
  body.find("script, style, noscript, template, svg, iframe").remove();

  const headings: Heading[] = [];
  body.find("h1, h2, h3, h4, h5, h6").each((_, el) => {
    headings.push({ level: Number(el.tagName.slice(1)), text: clean($(el).text()) });
  });
  const h1s = headings.filter((h) => h.level === 1).map((h) => h.text);

  const images: ImageRef[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") ?? $(el).attr("data-src") ?? "";
    if (!src || src.startsWith("data:")) return;
    const abs = normalizeUrl(src, pageUrl);
    if (!abs) return;
    const altAttr = $(el).attr("alt");
    const decorative = $(el).attr("role") === "presentation" || $(el).attr("aria-hidden") === "true";
    images.push({ src: abs, alt: altAttr === undefined ? (decorative ? "" : null) : altAttr.trim() });
  });

  const links: LinkRef[] = [];
  $("a[href]").each((_, el) => {
    const raw = ($(el).attr("href") ?? "").trim();
    if (!raw || raw.startsWith("#") || /^(mailto|tel|javascript|sms|whatsapp):/i.test(raw)) return;
    const href = normalizeUrl(raw, pageUrl);
    if (!href) return;
    const text = clean($(el).text()) || clean($(el).find("img").attr("alt") ?? "") || clean($(el).attr("aria-label") ?? "");
    links.push({
      href,
      text,
      internal: sameSite(new URL(href).hostname, pageHost),
      rel: ($(el).attr("rel") ?? "").toLowerCase(),
    });
  });

  const main = body.find("main, article, [role=main]").first();
  const contentRoot = main.length ? main : body;
  const contentClone = contentRoot.clone();
  if (!main.length) contentClone.find("nav, header, footer, aside").remove();
  const text = clean(contentClone.text());
  const wordCount = text ? text.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
  const paragraphs = contentClone
    .find("p")
    .map((_, el) => clean($(el).text()))
    .get()
    .filter((p) => p.length > 0);

  return {
    title,
    titleCount: titles.length,
    metaDescription,
    metaDescriptionCount: metaDescriptions.length,
    metaRobots: robotsMetas.length ? robotsMetas.join(", ").toLowerCase() : null,
    canonical,
    lang: $("html").attr("lang")?.trim() || null,
    viewport: $('meta[name="viewport" i]').attr("content") ?? null,
    generator,
    h1s,
    headings,
    wordCount,
    text: text.slice(0, 20_000),
    paragraphs: paragraphs.slice(0, 200),
    images,
    links,
    og,
    twitter,
    jsonLd,
    hreflang,
    mixedContent,
    renderBlocking,
    dateModified,
    hasAuthor,
    contentHash: crypto.createHash("sha1").update(text).digest("hex"),
  };
}

/** Visible word count of raw HTML (used to compare with the JS-rendered version). */
export function visibleWordCount(html: string): number {
  const $ = cheerio.load(html);
  $("script, style, noscript, template, svg").remove();
  const text = clean($("body").text());
  return text ? text.split(" ").length : 0;
}
