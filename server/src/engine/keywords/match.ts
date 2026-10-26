import { indexablePages } from "../checks/util.ts";
import type { KeywordPlacement, KeywordResult, PageData, SiteContext } from "../types.ts";
import { classifyIntent } from "./intent.ts";

// Matches target keywords to pages. Google understands plurals, word order and
// close variants, so we match on word stems rather than the exact phrase — the
// courses are explicit that exact-match keyword stuffing is outdated.

const STOPWORDS = new Set(["a", "an", "the", "and", "or", "of", "for", "to", "in", "on", "at", "with", "by", "from", "my", "your", "is", "are", "do", "does"]);

export function stem(word: string): string {
  let w = word.toLowerCase();
  if (w.length > 4 && w.endsWith("ies")) return `${w.slice(0, -3)}y`;
  if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith("es") && /(s|x|z|ch|sh)es$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  return w;
}

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/[\s-]+/)
    .filter((t) => t && !STOPWORDS.has(t))
    .map(stem);
}

/** True when every meaningful word of the keyword appears in the text (in any order or form). */
export function containsKeyword(text: string | null | undefined, keyword: string): boolean {
  if (!text) return false;
  const needed = tokens(keyword);
  if (!needed.length) return false;
  const have = new Set(tokens(text));
  return needed.every((t) => have.has(t));
}

function exactCount(text: string, keyword: string): number {
  const phrase = keyword.toLowerCase().trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (text.toLowerCase().match(new RegExp(`\\b${phrase}\\b`, "g")) ?? []).length;
}

function urlWords(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname).replace(/[/_.-]+/g, " ");
  } catch {
    return url;
  }
}

function intro(page: PageData): string {
  return page.text.split(/\s+/).slice(0, 120).join(" ");
}

function rawPlacements(page: PageData, keyword: string): KeywordPlacement {
  return {
    title: containsKeyword(page.title, keyword),
    h1: page.h1s.some((h) => containsKeyword(h, keyword)),
    url: containsKeyword(urlWords(page.finalUrl), keyword),
    meta: containsKeyword(page.metaDescription, keyword),
    intro: containsKeyword(intro(page), keyword),
  };
}

/** Placements shown in the report. A homepage's URL is just the domain, so it isn't counted against it. */
export function placementsFor(page: PageData, keyword: string): KeywordPlacement {
  const placements = rawPlacements(page, keyword);
  try {
    if (new URL(page.finalUrl).pathname === "/") placements.url = true;
  } catch {
    /* keep raw value */
  }
  return placements;
}

// Intent modifiers: a page about "coffee beans" is the natural home for
// "best coffee beans" even if it doesn't say "best" yet.
const MODIFIER_WORDS = new Set([
  "best", "top", "cheap", "cheapest", "affordable", "review", "reviews", "vs", "versus", "alternative", "alternatives",
  "how", "what", "why", "when", "where", "who", "which", "can", "guide", "tips", "ideas", "examples",
  "buy", "price", "prices", "cost", "costs", "deal", "deals", "near", "me", "nearby", "online", "free", "new",
]);

function coreKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => !MODIFIER_WORDS.has(w))
    .join(" ");
}

function score(page: PageData, keyword: string, inlinks: number): number {
  const p = rawPlacements(page, keyword);
  const inBody = containsKeyword(page.text, keyword);
  return (p.title ? 4 : 0) + (p.h1 ? 4 : 0) + (p.url ? 3 : 0) + (p.meta ? 1 : 0) + (p.intro ? 2 : 0) + (inBody ? 1 : 0) + Math.min(inlinks, 10) / 100;
}

/** Finds the best page for each keyword and how well it's targeted. */
export function analyzeKeywords(ctx: Pick<SiteContext, "pages" | "inlinks" | "homepage"> & Partial<SiteContext>, keywords: string[]): KeywordResult[] {
  const pages = indexablePages(ctx as SiteContext);
  return keywords.map((keyword) => {
    const info = classifyIntent(keyword);
    const rank = (k: string) =>
      pages
        .map((page) => ({ page, score: score(page, k, ctx.inlinks.get(page.finalUrl) ?? 0) }))
        .filter((r) => r.score >= 1)
        .sort((a, b) => b.score - a.score);
    let ranked = rank(keyword);
    let partial = false;
    const core = coreKeyword(keyword);
    if (!ranked.length && core && core !== keyword.toLowerCase()) {
      ranked = rank(core);
      partial = ranked.length > 0;
    }
    const best = ranked[0]?.page ?? null;
    const bestWords = best ? new Set(tokens(`${best.title ?? ""} ${best.h1s.join(" ")} ${best.text}`)) : new Set<string>();
    const missingWords = best ? keyword.split(/\s+/).filter((w) => tokens(w).some((t) => !bestWords.has(t))) : [];
    const competing = pages
      .filter((p) => p !== best && containsKeyword(p.title, keyword) && p.h1s.some((h) => containsKeyword(h, keyword)))
      .map((p) => p.finalUrl);
    const density = best && best.wordCount > 0 ? Math.round((exactCount(best.text, keyword) / best.wordCount) * 1000) / 10 : 0;
    return {
      keyword,
      intent: info.intent,
      expectedPage: info.expectedPage,
      bestPage: best?.finalUrl ?? null,
      bestPageTitle: best?.title ?? null,
      partial,
      missingWords,
      placements: best ? placementsFor(best, keyword) : null,
      density,
      competing,
    };
  });
}

/** Cleans user input: trims, de-duplicates, max 5 keywords of up to 80 characters. */
export function normalizeKeywords(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const k = raw.replace(/\s+/g, " ").trim().slice(0, 80);
    if (!k || seen.has(k.toLowerCase())) continue;
    seen.add(k.toLowerCase());
    out.push(k);
    if (out.length === 5) break;
  }
  return out;
}
