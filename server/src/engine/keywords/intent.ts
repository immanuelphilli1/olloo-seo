import type { SearchIntent } from "../types.ts";

// Search intent from a keyword's wording. The modifiers follow the courses:
// "best/top/vs/review" → comparison, "how/what/why" → informational,
// "buy/price/near me" → transactional or local, tool words → a tool page.

const has = (keyword: string, words: string[]) => words.some((w) => new RegExp(`(^|\\s)${w}(\\s|$)`, "i").test(keyword));

const QUESTION = ["how", "what", "why", "when", "where", "who", "which", "can", "does", "do", "is", "are", "should", "will"];
const INFO = ["guide", "tutorial", "tips", "ideas", "examples", "meaning", "definition", "explained", "for beginners", "learn", "steps", "checklist"];
const COMMERCIAL = ["best", "top", "vs", "versus", "review", "reviews", "alternative", "alternatives", "compare", "comparison", "cheap", "affordable", "rated"];
const TRANSACTIONAL = ["buy", "price", "prices", "pricing", "cost", "costs", "deal", "deals", "discount", "coupon", "order", "hire", "quote", "for sale", "free trial", "sign up", "book"];
// Service searches: people looking for someone to do the job.
const SERVICE = ["repair", "repairs", "service", "services", "installation", "install", "installer", "fitting", "fitter", "cleaning", "removal", "rental", "hire", "delivery", "company", "contractor", "agency"];
const LOCAL = ["near me", "nearby", "open now", "in my area"];
export const TOOL_WORDS = ["calculator", "checker", "generator", "template", "tool", "tools", "finder", "planner", "maker", "converter", "tester", "builder", "app", "software"];

export interface IntentInfo {
  intent: SearchIntent;
  /** The page type that usually ranks (the "content type" of the 3 C's). */
  expectedPage: string;
  /**
   * How likely an AI answer is to satisfy the search without a click:
   * "high" for questions/definitions, "low" for tools and buying searches.
   */
  aiRisk: "high" | "medium" | "low";
}

export function classifyIntent(raw: string): IntentInfo {
  const keyword = raw.toLowerCase().trim();
  if (has(keyword, LOCAL)) return { intent: "local", expectedPage: "Local service page or Google Business Profile", aiRisk: "low" };
  if (has(keyword, TOOL_WORDS)) return { intent: "transactional", expectedPage: "Free tool or interactive page", aiRisk: "low" };
  if (has(keyword, TRANSACTIONAL)) return { intent: "transactional", expectedPage: "Product, pricing or service page", aiRisk: "low" };
  if (has(keyword, SERVICE) && !has(keyword, QUESTION)) return { intent: "transactional", expectedPage: "Service page (with location if you serve an area)", aiRisk: "low" };
  if (has(keyword, COMMERCIAL)) return { intent: "commercial", expectedPage: "Comparison, review or \"best of\" list", aiRisk: "medium" };
  if (has(keyword, QUESTION) || has(keyword, INFO) || keyword.endsWith("?")) {
    return { intent: "informational", expectedPage: "Guide, how-to or explainer article", aiRisk: "high" };
  }
  const words = keyword.split(/\s+/).length;
  // Short head terms ("running shoes") usually show category/product pages; longer ones lean informational.
  if (words <= 2) return { intent: "commercial", expectedPage: "Category or service page (check the search results)", aiRisk: "medium" };
  return { intent: "informational", expectedPage: "Article or guide (check the search results)", aiRisk: "medium" };
}

/** Modifier groups for generating ideas, with the intent each signals. */
export const MODIFIERS: { group: string; intent: SearchIntent; before?: string[]; after?: string[] }[] = [
  { group: "Questions", intent: "informational", before: ["how to", "what is", "why", "how much does", "is", "can you"] },
  { group: "Guides", intent: "informational", after: ["for beginners", "guide", "tips", "examples", "ideas", "checklist", "mistakes"] },
  { group: "Comparisons", intent: "commercial", before: ["best", "top"], after: ["vs", "alternatives", "reviews", "for small business"] },
  { group: "Buying", intent: "transactional", after: ["price", "cost", "near me", "deals", "services", "for sale"] },
  { group: "Tools (AI can't replace these)", intent: "transactional", after: ["calculator", "checker", "generator", "template", "tool", "planner"] },
];

export interface KeywordIdea {
  keyword: string;
  intent: SearchIntent;
  expectedPage: string;
  aiRisk: IntentInfo["aiRisk"];
  group: string;
}

/** Seed + modifier ideas (the "seeds and modifiers" method from the courses). */
export function modifierIdeas(seed: string): KeywordIdea[] {
  const base = seed.toLowerCase().trim().replace(/\s+/g, " ");
  const ideas: KeywordIdea[] = [];
  const seen = new Set<string>();
  for (const m of MODIFIERS) {
    const phrases = [...(m.before ?? []).map((b) => `${b} ${base}`), ...(m.after ?? []).map((a) => `${base} ${a}`)];
    for (const phrase of phrases) {
      if (seen.has(phrase)) continue;
      seen.add(phrase);
      const info = classifyIntent(phrase);
      ideas.push({ keyword: phrase, intent: info.intent, expectedPage: info.expectedPage, aiRisk: info.aiRisk, group: m.group });
    }
  }
  return ideas;
}
