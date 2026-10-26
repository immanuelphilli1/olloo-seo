import type { FindingItem, PageData, SiteContext } from "../types.ts";

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function path(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

/** HTML pages that returned 200 — the pages most checks look at. */
export function okPages(ctx: SiteContext): PageData[] {
  return ctx.pages.filter((p) => p.status === 200 && p.isHtml);
}

export function isNoindex(page: PageData): boolean {
  return Boolean(page.metaRobots?.includes("noindex") || page.headers["x-robots-tag"]?.toLowerCase().includes("noindex"));
}

/** Pages a site owner expects to rank: 200, indexable, not canonicalized elsewhere. */
export function indexablePages(ctx: SiteContext): PageData[] {
  return okPages(ctx).filter((p) => !isNoindex(p) && (!p.canonical || p.canonical === p.finalUrl));
}

/** Utility pages where thin content / missing descriptions are expected. */
export function isUtilityPage(url: string): boolean {
  return /\/(cart|checkout|login|log-in|signin|sign-in|signup|register|account|my-account|search|wp-admin|admin|thank-you|thanks|privacy|terms|cookie|legal)(\/|$|\?)/i.test(url);
}

export function pagesWhere(ctx: SiteContext, predicate: (p: PageData) => boolean, detail?: (p: PageData) => string, current?: (p: PageData) => string | undefined): FindingItem[] {
  return indexablePages(ctx)
    .filter(predicate)
    .map((p) => ({ url: p.finalUrl, detail: detail?.(p), current: current?.(p) }));
}

/** Groups pages by a value and returns the groups with more than one page. */
export function duplicates(pages: PageData[], key: (p: PageData) => string | null): Map<string, PageData[]> {
  const groups = new Map<string, PageData[]>();
  for (const page of pages) {
    const value = key(page);
    if (!value) continue;
    const k = value.toLowerCase();
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(page);
  }
  return new Map([...groups].filter(([, list]) => list.length > 1));
}

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

/** Flesch–Kincaid grade level (English). */
export function readingGrade(text: string): number | null {
  const sentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().split(/\s+/).length >= 3);
  const words = text.split(/\s+/).filter((w) => /[a-z]/i.test(w));
  if (sentences.length < 3 || words.length < 100) return null;
  const syllableCount = words.reduce((sum, w) => sum + syllables(w), 0);
  const grade = 0.39 * (words.length / sentences.length) + 11.8 * (syllableCount / words.length) - 15.59;
  return Math.round(grade * 10) / 10;
}

export function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  // If the cut lands exactly at a word boundary, keep the whole last word.
  const lastSpace = text[max - 1] === " " ? cut.length : cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

/** A reasonable meta description from the page's first real paragraph. */
export function descriptionFromContent(page: PageData): string | undefined {
  const paragraph = page.paragraphs.find((p) => p.split(" ").length >= 12);
  if (!paragraph) return undefined;
  return truncateAtWord(paragraph, 155);
}

export function brandSuffix(ctx: SiteContext): string {
  const og = ctx.homepage.og["og:site_name"];
  if (og) return og;
  const title = ctx.homepage.title ?? "";
  const parts = title.split(/\s[|–—-]\s/);
  return (parts.length > 1 ? parts[parts.length - 1] : parts[0])?.trim() || ctx.host.replace(/^www\./, "");
}

/** Rule-based title suggestion: H1 + brand, kept under 60 characters. */
export function suggestTitle(page: PageData, ctx: SiteContext): string | undefined {
  const base = page.h1s[0] ?? page.title ?? undefined;
  if (!base) return undefined;
  const brand = brandSuffix(ctx);
  const core = truncateAtWord(base.split(/\s[|–—-]\s/)[0], 60);
  const withBrand = `${core} | ${brand}`;
  return withBrand.length <= 60 && !core.toLowerCase().includes(brand.toLowerCase()) ? withBrand : core;
}

export function linkSources(ctx: SiteContext, target: string, limit = 3): string[] {
  return ctx.pages
    .filter((p) => p.links.some((l) => l.href === target))
    .slice(0, limit)
    .map((p) => path(p.finalUrl));
}
