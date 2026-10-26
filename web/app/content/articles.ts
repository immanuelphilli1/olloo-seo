// Registry of Learn articles. The body of each lives in content/learn/<slug>.mdx.
// Slugs match the `learnSlug` used by the audit checks, so every issue in a
// report links to the article that explains it.

export interface Article {
  slug: string;
  title: string;
  /** Shorter H1 shown on the page (defaults to title). */
  h1?: string;
  description: string;
  cluster: "seo" | "ai-search";
  published: string;
  updated: string;
  minutes: number;
  relatedTool?: { name: string; path: string };
}

export const articles: Article[] = [
  {
    slug: "what-is-seo",
    title: "What Is SEO? A Plain-English Guide for 2026",
    h1: "What is SEO?",
    description: "SEO is how you get your website found in Google and AI search for free. Learn how search engines work, what ranks pages, and where to start.",
    cluster: "seo",
    published: "2026-10-20",
    updated: "2026-10-20",
    minutes: 8,
  },
  {
    slug: "seo-checklist",
    title: "SEO Checklist 2026: 35 Steps to Rank in Google and AI Search",
    h1: "The SEO checklist for 2026",
    description: "A practical SEO checklist covering setup, keywords, on-page, technical SEO, links and AI search in the order that gets results fastest.",
    cluster: "seo",
    published: "2026-10-20",
    updated: "2026-10-20",
    minutes: 12,
    relatedTool: { name: "Free SEO audit", path: "/" },
  },
  {
    slug: "technical-seo-checklist",
    title: "Technical SEO Checklist: Fix Crawling, Indexing and Speed",
    h1: "Technical SEO checklist",
    description: "Make sure Google and AI crawlers can find, read and index your pages. Covers noindex, robots.txt, sitemaps, redirects, canonicals and speed.",
    cluster: "seo",
    published: "2026-10-20",
    updated: "2026-10-20",
    minutes: 10,
    relatedTool: { name: "Redirect checker", path: "/tools/redirect-checker" },
  },
  {
    slug: "on-page-seo-checklist",
    title: "On-Page SEO Checklist: Titles, Headings, Links and Images",
    h1: "On-page SEO checklist",
    description: "How to optimize a page to rank: match search intent, write titles and meta descriptions, structure headings, add internal links and optimize images.",
    cluster: "seo",
    published: "2026-10-20",
    updated: "2026-10-20",
    minutes: 9,
    relatedTool: { name: "Meta tag checker", path: "/tools/meta-tag-checker" },
  },
  {
    slug: "search-intent",
    title: "Search Intent: Give Searchers What They Want (the 3 C's)",
    h1: "Search intent explained",
    description: "Search intent is the reason behind a search. Learn the four types of intent and the 3 C's method to match it: the most important skill in SEO.",
    cluster: "seo",
    published: "2026-10-20",
    updated: "2026-10-20",
    minutes: 7,
    relatedTool: { name: "Keyword Generator", path: "/tools/keyword-generator" },
  },
  {
    slug: "keyword-research",
    title: "Keyword Research for Beginners: Find Keywords to Rank For",
    h1: "Keyword research for beginners",
    description: "A simple keyword research process: find seed keywords, add modifiers, then vet each keyword for business potential, intent and difficulty.",
    cluster: "seo",
    published: "2026-10-20",
    updated: "2026-10-20",
    minutes: 10,
    relatedTool: { name: "Keyword Generator", path: "/tools/keyword-generator" },
  },
  {
    slug: "what-is-aeo",
    title: "What Is AEO? Answer Engine Optimization Explained",
    h1: "What is AEO (answer engine optimization)?",
    description: "AEO is optimizing your brand to be mentioned and cited in AI answers from ChatGPT, Perplexity, Gemini and Google AI Overviews. Here's how it works.",
    cluster: "ai-search",
    published: "2026-10-20",
    updated: "2026-10-20",
    minutes: 9,
  },
  {
    slug: "how-to-rank-in-chatgpt",
    title: "How to Rank in ChatGPT and AI Search: 9 Steps That Work",
    h1: "How to rank in ChatGPT and AI search",
    description: "How to rank in ChatGPT and AI search: nine practical steps to get your brand cited by ChatGPT, Perplexity, Gemini and Google AI Overviews.",
    cluster: "ai-search",
    published: "2026-10-20",
    updated: "2026-10-20",
    minutes: 11,
    relatedTool: { name: "AI crawler checker", path: "/tools/ai-crawler-checker" },
  },
  {
    slug: "robots-txt-ai-crawlers",
    title: "robots.txt for AI Crawlers: GPTBot, ClaudeBot & More",
    h1: "robots.txt for AI crawlers",
    description: "Which AI bots crawl your site, what each one does, and the exact robots.txt rules to allow AI search while choosing what to do about training.",
    cluster: "ai-search",
    published: "2026-10-20",
    updated: "2026-10-20",
    minutes: 8,
    relatedTool: { name: "robots.txt generator", path: "/tools/robots-txt-generator" },
  },
  {
    slug: "llms-txt",
    title: "What Is llms.txt? Should You Add One to Your Site?",
    h1: "What is llms.txt?",
    description: "llms.txt is a proposed file that summarizes your site for AI assistants. Here's what it is, who supports it, and how to create one in two minutes.",
    cluster: "ai-search",
    published: "2026-10-20",
    updated: "2026-10-20",
    minutes: 5,
    relatedTool: { name: "llms.txt generator", path: "/tools/llms-txt-generator" },
  },
  {
    slug: "schema-markup",
    title: "Schema Markup for Beginners: JSON-LD Examples You Can Copy",
    h1: "Schema markup for beginners",
    description: "What schema markup is, which types matter (Organization, Article, Product, FAQ, LocalBusiness), and copy-paste JSON-LD examples for each.",
    cluster: "ai-search",
    published: "2026-10-20",
    updated: "2026-10-20",
    minutes: 9,
    relatedTool: { name: "Schema markup generator", path: "/tools/schema-markup-generator" },
  },
  {
    slug: "core-web-vitals",
    title: "Core Web Vitals Explained: LCP, INP and CLS (+ Fixes)",
    h1: "Core Web Vitals explained",
    description: "What LCP, INP and CLS measure, the scores Google considers good, and the most common fixes for slow, janky pages.",
    cluster: "seo",
    published: "2026-10-20",
    updated: "2026-10-20",
    minutes: 8,
  },
];

export const articlesBySlug = new Map(articles.map((a) => [a.slug, a]));

export const clusters = {
  seo: { name: "SEO fundamentals", description: "How to rank in Google: keywords, search intent, on-page and technical SEO." },
  "ai-search": { name: "AI search (AEO)", description: "How to get mentioned and cited by ChatGPT, Perplexity, Gemini and AI Overviews." },
} as const;
