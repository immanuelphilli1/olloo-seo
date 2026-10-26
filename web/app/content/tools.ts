// The free tools. Each has its own prerendered page targeting a "tool" search
// (checker, generator) — searches AI answers can't satisfy, so the click stays.

export interface ToolInfo {
  slug: string;
  name: string;
  /** Short line for cards and menus. */
  blurb: string;
  icon: "bot" | "file" | "wand" | "code" | "sparkles" | "tag" | "route" | "map" | "key";
}

export const tools: ToolInfo[] = [
  { slug: "keyword-generator", name: "Keyword Generator", blurb: "Find keyword ideas from real Google searches, sorted by search intent.", icon: "key" },
  { slug: "ai-crawler-checker", name: "AI Crawler Checker", blurb: "See if ChatGPT, Perplexity, Claude and Google can crawl your site.", icon: "bot" },
  { slug: "robots-txt-checker", name: "robots.txt Checker", blurb: "Test your robots.txt for errors and blocked search engines.", icon: "file" },
  { slug: "robots-txt-generator", name: "robots.txt Generator", blurb: "Create a robots.txt that welcomes search and AI crawlers.", icon: "wand" },
  { slug: "schema-markup-generator", name: "Schema Markup Generator", blurb: "Generate JSON-LD for organizations, articles, products, FAQs and more.", icon: "code" },
  { slug: "llms-txt-generator", name: "llms.txt Generator", blurb: "Build an llms.txt file from your site's pages in seconds.", icon: "sparkles" },
  { slug: "meta-tag-checker", name: "Meta Tag Checker", blurb: "Preview your Google snippet and check titles, descriptions and social tags.", icon: "tag" },
  { slug: "redirect-checker", name: "Redirect Checker", blurb: "Trace every redirect hop and find chains, loops and 302s.", icon: "route" },
  { slug: "sitemap-checker", name: "Sitemap Checker", blurb: "Validate your XML sitemap and test the URLs inside it.", icon: "map" },
];

export const toolPaths = tools.map((t) => `/tools/${t.slug}`);
