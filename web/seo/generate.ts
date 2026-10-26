// Generates the site's root SEO files: robots.txt, sitemap.xml, llms.txt,
// llms-full.txt, rss.xml and site.webmanifest. Used by the build script (writes
// them into build/client) and by a Vite dev plugin (serves them in development).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { articles } from "../app/content/articles";
import { tools } from "../app/content/tools";

const webRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export interface SeoFile {
  path: string;
  type: string;
  content: string;
}

function configValue(key: string, fallback: string): string {
  const src = fs.readFileSync(path.join(webRoot, "app/config/site.ts"), "utf8");
  return src.match(new RegExp(`\\b${key}:\\s*"([^"]+)"`))?.[1] ?? fallback;
}

export function siteNameFromConfig(): string {
  return configValue("name", "olloo SEO");
}

const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function generateSeoFiles(siteUrlInput: string): SeoFile[] {
  const siteUrl = siteUrlInput.replace(/\/$/, "");
  const siteName = siteNameFromConfig();
  const brand = configValue("brand", "olloo");
  const botName = configValue("botName", "ollooSEOBot");
  const today = new Date().toISOString().slice(0, 10);

  // robots.txt — welcome search engines and AI crawlers. Report pages are NOT
  // disallowed: they carry noindex (meta + header), and crawlers must be able
  // to fetch them to see it. /api/ returns JSON, not pages.
  const robots = `# ${siteName} — search engines and AI assistants are welcome
User-agent: *
Allow: /
Disallow: /api/

# AI search and AI assistants
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: GPTBot
User-agent: PerplexityBot
User-agent: Claude-SearchBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Applebot-Extended
Allow: /
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`;

  const pages: { loc: string; lastmod: string }[] = [
    { loc: "/", lastmod: today },
    { loc: "/tools", lastmod: today },
    ...tools.map((t) => ({ loc: `/tools/${t.slug}`, lastmod: today })),
    { loc: "/learn", lastmod: [...articles].sort((a, b) => b.updated.localeCompare(a.updated))[0]?.updated ?? today },
    ...articles.map((a) => ({ loc: `/learn/${a.slug}`, lastmod: a.updated })),
    { loc: "/about", lastmod: today },
    { loc: "/bot", lastmod: today },
    { loc: "/privacy", lastmod: today },
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url>\n    <loc>${siteUrl}${p.loc}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n  </url>`).join("\n")}
</urlset>
`;

  const llms = `# ${siteName}

> ${siteName} is a free SEO and AI-search audit tool. Enter a website and it checks 50+ issues that stop the site ranking in Google or being cited by ChatGPT, Perplexity, Gemini and Google AI Overviews — then writes the fixes (titles, meta descriptions, robots.txt, sitemap.xml, JSON-LD schema, redirect rules) with steps for WordPress, Shopify, Wix, Squarespace and Webflow. No signup required.

Key facts:
- Free to use, no account needed; up to 5 full audits per day.
- Crawls up to 50 pages per audit and produces two scores: the ${brand} SEO Score and the ${brand} AI Visibility Score (0–100).
- Checks five areas: technical SEO, on-page SEO, content, AI visibility and performance (Core Web Vitals via Google PageSpeed Insights).

## Tools

- [Free SEO audit](${siteUrl}/): full-site SEO and AI-visibility audit with fixes
${tools.map((t) => `- [${t.name}](${siteUrl}/tools/${t.slug}): ${t.blurb}`).join("\n")}

## Guides

${articles.map((a) => `- [${a.title}](${siteUrl}/learn/${a.slug}): ${a.description}`).join("\n")}

## About

- [About ${siteName}](${siteUrl}/about)
- [${botName} crawler](${siteUrl}/bot)
- [Full guide text for AI assistants](${siteUrl}/llms-full.txt)
`;

  const full = articles
    .map((a) => {
      const file = path.join(webRoot, "app/content/learn", `${a.slug}.mdx`);
      if (!fs.existsSync(file)) return "";
      const body = fs.readFileSync(file, "utf8").replace(/^import .*$/gm, "").replace(/\{site\.name\}/g, siteName).trim();
      return `# ${a.title}\n\nSource: ${siteUrl}/learn/${a.slug}\nUpdated: ${a.updated}\n\n${body}`;
    })
    .filter(Boolean)
    .join("\n\n---\n\n");

  // RSS lets feed readers, aggregators and some AI systems discover new guides.
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)} guides</title>
    <link>${siteUrl}/learn</link>
    <description>Free guides to SEO and AI search: ranking in Google, ChatGPT, Perplexity and AI Overviews.</description>
    <language>en</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
${[...articles]
  .sort((a, b) => b.updated.localeCompare(a.updated))
  .map(
    (a) => `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${siteUrl}/learn/${a.slug}</link>
      <guid isPermaLink="true">${siteUrl}/learn/${a.slug}</guid>
      <description>${escapeXml(a.description)}</description>
      <pubDate>${new Date(`${a.updated}T12:00:00Z`).toUTCString()}</pubDate>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>
`;

  const manifest = JSON.stringify(
    {
      name: `${siteName} — Free SEO & AI search audit`,
      short_name: siteName,
      start_url: "/",
      display: "browser",
      background_color: "#fafaf7",
      theme_color: "#fafaf7",
      icons: [
        { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        { src: "/logo.png", sizes: "512x512", type: "image/png" },
      ],
    },
    null,
    2,
  );

  return [
    { path: "/robots.txt", type: "text/plain; charset=utf-8", content: robots },
    { path: "/sitemap.xml", type: "application/xml; charset=utf-8", content: sitemap },
    { path: "/llms.txt", type: "text/plain; charset=utf-8", content: llms },
    { path: "/llms-full.txt", type: "text/plain; charset=utf-8", content: `# ${siteName} guides\n\n${full}\n` },
    { path: "/rss.xml", type: "application/rss+xml; charset=utf-8", content: rss },
    { path: "/site.webmanifest", type: "application/manifest+json; charset=utf-8", content: manifest + "\n" },
  ];
}
