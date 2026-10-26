import type { Category } from "./types";

// The five audit categories in plain English. The SEO terms stay (people search
// for them), but every place we show them also answers "what does this mean?".

export const CATEGORY_INFO: Record<Category, { name: string; question: string; plain: string; covers: string }> = {
  technical: {
    name: "Technical SEO",
    question: "Can search engines find and read your site?",
    plain:
      "The behind-the-scenes setup that lets Google and AI tools reach your pages, read them and list them in results. If this is broken, nothing else matters.",
    covers: "noindex mistakes, robots.txt, sitemaps, redirects, canonicals, broken links, HTTPS and duplicate pages.",
  },
  onpage: {
    name: "On-page SEO",
    question: "Does each page clearly say what it's about?",
    plain:
      "The labels on every page: the headline people see in Google, the short description under it, headings, image descriptions and the links between your pages.",
    covers: "Titles, meta descriptions, headings, image alt text, internal links, URLs and social sharing tags.",
  },
  content: {
    name: "Content",
    question: "Is your writing helpful and easy to read?",
    plain: "Whether your pages fully answer what visitors came for, in plain words that are quick to skim and kept up to date.",
    covers: "Thin pages, readability, walls of text, outdated content and whether AI can quote your answers.",
  },
  aeo: {
    name: "AI visibility",
    question: "Can ChatGPT and other AI assistants find and recommend you?",
    plain:
      "Whether AI tools like ChatGPT, Perplexity and Google's AI Overviews are allowed to read your site, can understand it, and trust it enough to mention you.",
    covers: "Whether ChatGPT, Perplexity and Claude can crawl you, JavaScript-only content, schema and trust signals.",
  },
  performance: {
    name: "Performance",
    question: "How fast does your site load?",
    plain: "How quickly your pages appear and respond, especially on phones. Slow pages lose visitors and rank lower.",
    covers: "Core Web Vitals (LCP, INP, CLS), server speed, compression, image weight and render-blocking files.",
  },
};
