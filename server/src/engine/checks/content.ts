import type { CheckDefinition, FindingItem } from "../types.ts";
import { indexablePages, isUtilityPage, plural, readingGrade } from "./util.ts";

const LEARN = "seo-checklist";
const MONTH = 30 * 24 * 60 * 60 * 1000;

export const contentChecks: CheckDefinition[] = [
  {
    id: "thin-content",
    category: "content",
    severity: "warning",
    title: "Pages with very little content",
    why: "Length isn't a ranking factor, depth is. A page needs enough substance to fully answer the searcher's question. Pages with almost no text rarely rank and are rarely cited by AI.",
    learnSlug: "search-intent",
    run: (ctx) =>
      indexablePages(ctx)
        .filter((p) => p.wordCount < 150 && !isUtilityPage(p.finalUrl) && p.images.length < 6)
        .map((p) => ({ url: p.finalUrl, detail: `${p.wordCount} words of text` })),
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "has" : "have"} very little text.`,
    fix: () => ({
      kind: "content",
      summary: "Expand each page so it fully answers what a visitor came for. Look at the top 3 Google results for the page's topic and cover the subtopics they all share.",
      steps: [
        "Google the main topic of the page and open the top 3 results.",
        "Note the subtopics, questions and details they all cover.",
        "Add the ones you're missing. Answer first, then explain. Add a short FAQ if people ask follow-up questions.",
      ],
    }),
  },
  {
    id: "readability",
    category: "content",
    severity: "notice",
    title: "Hard-to-read content",
    why: "Content written at a grade 6–8 reading level is easier for everyone to scan, and short, declarative sentences are easier for AI to quote accurately.",
    learnSlug: "how-to-rank-in-chatgpt",
    run: (ctx) => {
      const lang = ctx.homepage.lang?.toLowerCase() ?? "en";
      if (!lang.startsWith("en")) return { skipped: "Readability scoring is only available for English pages." };
      return indexablePages(ctx)
        // Score paragraph text only: headings, buttons and cards have no full
        // stops and would otherwise merge into giant "sentences".
        .map((p) => ({ page: p, grade: p.wordCount >= 300 ? readingGrade(p.paragraphs.join(" ")) : null }))
        .filter((x) => x.grade !== null && x.grade > 11)
        .map((x) => ({ url: x.page.finalUrl, detail: `Reading grade ${x.grade}` }));
    },
    summarize: (items) => `${plural(items.length, "page")} read above a grade 11 level.`,
    fix: () => ({
      kind: "content",
      summary: "Shorten sentences (aim for under 20 words), use everyday words, and keep one idea per sentence.",
      steps: ["Paste the text into hemingwayapp.com to find the hardest sentences.", "Split long sentences and replace jargon with plain words."],
    }),
  },
  {
    id: "wall-of-text",
    category: "content",
    severity: "notice",
    title: "Walls of text",
    why: "People skim. Long paragraphs and few subheadings make content hard to scan, and make it harder for AI systems to pull out a self-contained answer.",
    learnSlug: "how-to-rank-in-chatgpt",
    run: (ctx) =>
      indexablePages(ctx)
        .map((p) => {
          const longParagraphs = p.paragraphs.filter((para) => para.split(" ").length > 150).length;
          const subheadings = p.headings.filter((h) => h.level >= 2).length;
          if (longParagraphs > 0) return { url: p.finalUrl, detail: `${plural(longParagraphs, "paragraph")} over 150 words` };
          if (p.wordCount > 700 && subheadings < 2) return { url: p.finalUrl, detail: `${p.wordCount} words with ${subheadings} subheadings` };
          return null;
        })
        .filter((x) => x !== null) as FindingItem[],
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "is" : "are"} hard to skim.`,
    fix: () => ({
      kind: "content",
      summary: "Break content into short paragraphs (2–4 sentences) under descriptive H2/H3 subheadings. Start each section with its main point.",
    }),
  },
  {
    id: "stale-content",
    category: "content",
    severity: "notice",
    title: "Content that hasn't been updated in over a year",
    why: "Freshness matters for AI search: pages cited by AI are about 26% fresher than typical Google results, and most pages ChatGPT cites were updated recently. Meaningful updates, not just a new date, keep pages competitive.",
    learnSlug: "what-is-aeo",
    run: (ctx) =>
      indexablePages(ctx)
        .map((p) => {
          const raw = p.dateModified ?? p.headers["last-modified"] ?? null;
          if (!raw) return null;
          const date = new Date(raw);
          if (Number.isNaN(date.getTime())) return null;
          const months = Math.floor((Date.now() - date.getTime()) / MONTH);
          return months >= 12 ? { url: p.finalUrl, detail: `Last updated ${date.toISOString().slice(0, 10)} (${months} months ago)` } : null;
        })
        .filter((x) => x !== null) as FindingItem[],
    summarize: (items) => `${plural(items.length, "page")} haven't been updated in over a year.`,
    fix: () => ({
      kind: "content",
      summary: "Refresh your most important pages: update facts, stats, examples and screenshots, add what's changed, then update the visible \"last updated\" date and dateModified in your schema.",
      steps: ["Start with pages that used to get traffic and have backlinks, they recover fastest.", "Don't just change the date; Google can tell. Make real improvements."],
    }),
  },
  {
    id: "aeo-writing",
    category: "content",
    severity: "notice",
    title: "Content structure for AI answers",
    why: "AI assistants quote content that puts the answer first, keeps each section self-contained, names specific things (brands, products, numbers) and uses short, clear sentences.",
    learnSlug: "how-to-rank-in-chatgpt",
    // Filled in by the AI review step (fixes/ai.ts); without an API key it's skipped.
    run: () => ({ skipped: "AI content review is off (no ANTHROPIC_API_KEY configured)." }),
    summarize: (items) => `${plural(items.length, "page")} could be easier for AI to quote.`,
  },
];
