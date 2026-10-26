import { platformSteps } from "../platforms/steps.ts";
import type { CheckDefinition, KeywordResult, SiteContext } from "../types.ts";
import { tokens } from "../keywords/match.ts";
import { brandSuffix, path, plural, truncateAtWord } from "./util.ts";

// Checks for the target keywords a user enters (optional, up to 5). Without
// keywords these are skipped. Keyword-to-page matching lives in keywords/match.ts.

const NO_KEYWORDS = { skipped: "No target keywords entered. Add up to 5 when you start an audit to check how well your pages target them." };

const capitalize = (s: string) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

function suggestKeywordTitle(result: KeywordResult, ctx: SiteContext): string {
  const brand = brandSuffix(ctx);
  const core = (result.bestPageTitle ?? "").split(/\s[|–—-]\s/)[0]?.trim();
  const keyword = capitalize(result.keyword);
  // If the current title is already about the same topic, lead with the keyword
  // and the brand rather than repeating the topic twice.
  const keywordTokens = new Set(tokens(result.keyword));
  const overlap = core ? tokens(core).filter((t) => keywordTokens.has(t)).length : 0;
  const candidate = core && overlap === 0 ? `${keyword}: ${core}` : `${keyword} | ${brand}`;
  return truncateAtWord(candidate, 60);
}

const placementNames = { title: "title", h1: "H1", url: "URL", meta: "meta description", intro: "first paragraph" } as const;

export const keywordChecks: CheckDefinition[] = [
  {
    id: "keyword-no-page",
    category: "onpage",
    severity: "warning",
    title: "Target keywords with no matching page",
    why: "To rank for a search, you need a page that's clearly about it. If no page covers a keyword in its title, heading or content, search engines have nothing to rank for it.",
    learnSlug: "keyword-research",
    run: (ctx) => {
      if (!ctx.keywords.length) return NO_KEYWORDS;
      return ctx.keywordResults.filter((r) => !r.bestPage).map((r) => ({ detail: `“${r.keyword}” needs its own page. Best format: ${r.expectedPage.toLowerCase()}` }));
    },
    summarize: (items) => `${plural(items.length, "target keyword")} ${items.length === 1 ? "has" : "have"} no page targeting ${items.length === 1 ? "it" : "them"}.`,
    fix: () => ({
      kind: "content",
      summary: "Create one dedicated page per keyword. Google the keyword first and match what ranks: the same type of page, format and angle (the 3 C's of search intent).",
      steps: [
        "Search the keyword in Google and open the top 3 results.",
        "Note what they have in common: page type (article, product, tool), format (list, how-to) and angle.",
        "Create a page that matches that intent and covers the subtopics they all share, then link to it from related pages.",
      ],
    }),
  },
  {
    id: "keyword-title-h1",
    category: "onpage",
    severity: "warning",
    title: "Target keyword missing from title or H1",
    why: "The title tag and H1 are the strongest on-page signals of what a page is about. The keyword (or a close variant) should appear naturally in both.",
    learnSlug: "on-page-seo-checklist",
    run: (ctx) => {
      if (!ctx.keywords.length) return NO_KEYWORDS;
      return ctx.keywordResults
        .filter((r) => r.bestPage && r.placements && (!r.placements.title || !r.placements.h1))
        .map((r) => {
          const missing = [!r.placements!.title && "title", !r.placements!.h1 && "H1"].filter(Boolean).join(" and ");
          return {
            url: r.bestPage!,
            detail: r.partial
              ? `Closest page for “${r.keyword}” never uses ${r.missingWords.map((w) => `“${w}”`).join(", ")}. Match the search intent (e.g. a “best” list) in the title and H1`
              : `“${r.keyword}” is missing from the ${missing}`,
            current: r.bestPageTitle ?? undefined,
            suggested: !r.placements!.title ? suggestKeywordTitle(r, ctx) : undefined,
          };
        });
    },
    summarize: (items) => `${plural(items.length, "target keyword")} ${items.length === 1 ? "isn't" : "aren't"} in the title or H1 of ${items.length === 1 ? "its" : "their"} best page.`,
    fix: (_, ctx) => ({
      kind: "title",
      summary: "Work each keyword (or a natural variant) into the page's title and H1. Put it near the start, and keep the title under 60 characters.",
      platformSteps: platformSteps("title", ctx.platform),
    }),
  },
  {
    id: "keyword-supporting",
    category: "onpage",
    severity: "notice",
    title: "Target keyword missing from URL, description or first paragraph",
    why: "A short URL containing the keyword, a meta description that mentions it, and an opening paragraph that answers it all confirm the topic to searchers and search engines.",
    learnSlug: "on-page-seo-checklist",
    run: (ctx) => {
      if (!ctx.keywords.length) return NO_KEYWORDS;
      return ctx.keywordResults
        .filter((r) => r.bestPage && r.placements && (!r.placements.url || !r.placements.meta || !r.placements.intro))
        .map((r) => {
          const p = r.placements!;
          const missing = (["url", "meta", "intro"] as const).filter((k) => !p[k]).map((k) => placementNames[k]);
          return { url: r.bestPage!, detail: `“${r.keyword}” is missing from the ${missing.join(", ")}` };
        });
    },
    summarize: (items) => `${plural(items.length, "target keyword")} could be placed better on ${items.length === 1 ? "its" : "their"} page.`,
    fix: (_, ctx) => ({
      kind: "metaDescription",
      summary: "Mention the keyword naturally in the meta description and in the first paragraph (answer the search right away). Only change the URL for new pages, or add a 301 redirect from the old one.",
      platformSteps: platformSteps("metaDescription", ctx.platform),
    }),
  },
  {
    id: "keyword-cannibalization",
    category: "onpage",
    severity: "warning",
    title: "Several pages compete for the same keyword",
    why: "When two or more pages target the same keyword in their title and H1, Google has to guess which one to rank. They often split the ranking signals and both rank lower.",
    learnSlug: "search-intent",
    run: (ctx) => {
      if (!ctx.keywords.length) return NO_KEYWORDS;
      return ctx.keywordResults
        .filter((r) => r.competing.length > 0)
        .map((r) => ({ url: r.bestPage ?? undefined, detail: `“${r.keyword}” is also targeted by ${r.competing.map(path).join(", ")}` }));
    },
    summarize: (items) => `${plural(items.length, "keyword")} ${items.length === 1 ? "is" : "are"} targeted by more than one page.`,
    fix: (_, ctx) => ({
      kind: "redirects",
      summary: "Pick one page per keyword. Merge the others into it and 301-redirect them, or change their titles and H1s to target a different, more specific keyword.",
      platformSteps: platformSteps("redirects", ctx.platform),
    }),
  },
  {
    id: "keyword-stuffing",
    category: "content",
    severity: "notice",
    title: "Target keyword repeated too often",
    why: "Repeating the exact keyword over and over makes text awkward to read and looks manipulative. Google understands synonyms and variations, so write naturally.",
    learnSlug: "on-page-seo-checklist",
    run: (ctx) => {
      if (!ctx.keywords.length) return NO_KEYWORDS;
      return ctx.keywordResults
        .filter((r) => r.bestPage && r.density > 3)
        .map((r) => ({ url: r.bestPage!, detail: `“${r.keyword}” makes up ${r.density}% of the words on this page` }));
    },
    summarize: (items) => `${plural(items.length, "keyword")} ${items.length === 1 ? "is" : "are"} repeated more than natural writing would.`,
    fix: () => ({ kind: "content", summary: "Replace some exact repeats with natural variations, synonyms and pronouns. Write for the reader first." }),
  },
];
