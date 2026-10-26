import { AI_BOTS } from "../crawler/robots.ts";
import type { PageData, SiteContext } from "../types.ts";

const SEARCH_BOTS = AI_BOTS.filter((b) => b.important).map((b) => b.token.toLowerCase());

/**
 * Rewrites robots.txt so search engines and AI search crawlers can reach the
 * site, while keeping every other rule the owner wrote. Full-site blocks on
 * search crawlers are commented out (not deleted) so the change is visible.
 * Training-only crawlers (GPTBot, ClaudeBot, Google-Extended) are left as the
 * owner set them — that's a business decision, not an SEO error.
 */
export function buildRobotsTxt(ctx: SiteContext): string {
  const sitemapUrl = ctx.sitemaps.find((s) => s.status === 200 && !s.error)?.url ?? `${ctx.origin}/sitemap.xml`;
  const original = ctx.robots.body ?? "";
  const out: string[] = [];
  let groupAgents: string[] = [];
  let lastWasAgent = false;
  let hasSitemap = false;

  for (const line of original.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z-]+)\s*:\s*(.*?)\s*(#.*)?$/);
    if (!match) {
      out.push(line);
      continue;
    }
    const field = match[1].toLowerCase();
    const value = match[2];
    if (field === "user-agent") {
      if (!lastWasAgent) groupAgents = [];
      groupAgents.push(value.toLowerCase());
      lastWasAgent = true;
      out.push(line);
      continue;
    }
    lastWasAgent = false;
    if (field === "sitemap") hasSitemap = true;
    const blocksEverything = field === "disallow" && value === "/";
    const affectsSearch = groupAgents.some((a) => a === "*" || SEARCH_BOTS.includes(a));
    if (blocksEverything && affectsSearch) {
      out.push(`# ${line.trim()}   <- removed: this blocked search engines / AI search from your whole site`);
      out.push("Allow: /");
      continue;
    }
    out.push(line);
  }

  const body = out.join("\n").trim();
  const sections = [
    body || "User-agent: *\nAllow: /",
    [
      "# Let AI search engines read and cite your pages",
      "User-agent: OAI-SearchBot",
      "User-agent: ChatGPT-User",
      "User-agent: PerplexityBot",
      "User-agent: Claude-SearchBot",
      "Allow: /",
    ].join("\n"),
  ];
  if (!hasSitemap) sections.push(`Sitemap: ${sitemapUrl}`);
  return sections.join("\n\n") + "\n";
}

function isIndexable(page: PageData): boolean {
  if (page.status !== 200 || !page.isHtml) return false;
  if (page.metaRobots?.includes("noindex") || page.headers["x-robots-tag"]?.toLowerCase().includes("noindex")) return false;
  if (page.canonical && page.canonical !== page.finalUrl) return false;
  return true;
}

function isoDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** A sitemap.xml of every indexable page we found. */
export function buildSitemapXml(ctx: SiteContext): string {
  const urls = new Map<string, string | null>();
  for (const page of ctx.pages) {
    if (isIndexable(page)) urls.set(page.finalUrl, isoDate(page.dateModified));
  }
  for (const url of ctx.sitemapUrls) if (!urls.has(url) && !ctx.fetched.has(url)) urls.set(url, null);
  const entries = [...urls.entries()]
    .map(([loc, lastmod]) => `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export function siteName(ctx: SiteContext): string {
  const og = ctx.homepage.og["og:site_name"];
  if (og) return og;
  const title = ctx.homepage.title ?? ctx.host;
  return title.split(/\s[|–—-]\s/)[0]?.trim() || ctx.host;
}

/** llms.txt: a short, Markdown map of the site for AI assistants. */
export function buildLlmsTxt(ctx: SiteContext): string {
  const name = siteName(ctx);
  const description = ctx.homepage.metaDescription ?? ctx.homepage.og["og:description"] ?? `Official website of ${name}.`;
  const pages = ctx.pages
    .filter((p) => isIndexable(p) && p.finalUrl !== ctx.homepage.finalUrl)
    .sort((a, b) => (ctx.inlinks.get(b.finalUrl) ?? 0) - (ctx.inlinks.get(a.finalUrl) ?? 0))
    .slice(0, 25);
  const lines = [
    `# ${name}`,
    "",
    `> ${description}`,
    "",
    "## Key pages",
    "",
    `- [Home](${ctx.homepage.finalUrl})${ctx.homepage.metaDescription ? `: ${ctx.homepage.metaDescription}` : ""}`,
    ...pages.map((p) => `- [${p.title ?? p.finalUrl}](${p.finalUrl})${p.metaDescription ? `: ${p.metaDescription}` : ""}`),
    "",
  ];
  return lines.join("\n");
}

function looksLikeArticle(page: PageData): boolean {
  return /\/(blog|news|articles?|posts?|guides?|insights)\//i.test(page.finalUrl) || page.og["og:type"] === "article";
}

/** Ready-to-paste JSON-LD blocks pre-filled from what we crawled. */
export function buildJsonLd(ctx: SiteContext): { label: string; code: string }[] {
  const name = siteName(ctx);
  const logo = ctx.homepage.og["og:image"] ?? `${ctx.origin}/logo.png`;
  const sameAs = ctx.homepage.links
    .filter((l) => /(facebook|instagram|linkedin|twitter|x|youtube|tiktok|pinterest|github)\.com\//i.test(l.href))
    .map((l) => l.href);

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: ctx.origin + "/",
    logo,
    description: ctx.homepage.metaDescription ?? undefined,
    sameAs: sameAs.length ? [...new Set(sameAs)] : ["https://www.linkedin.com/company/REPLACE-ME"],
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: ctx.origin + "/",
  };
  const blocks = [
    { label: "Organization (homepage)", code: JSON.stringify(organization, null, 2) },
    { label: "WebSite (homepage)", code: JSON.stringify(website, null, 2) },
  ];

  const deepPage = ctx.pages.find((p) => p.depth >= 1 && p.isHtml && new URL(p.finalUrl).pathname.split("/").filter(Boolean).length >= 2);
  if (deepPage) {
    const segments = new URL(deepPage.finalUrl).pathname.split("/").filter(Boolean);
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: ctx.origin + "/" },
        ...segments.map((segment, i) => ({
          "@type": "ListItem",
          position: i + 2,
          name: i === segments.length - 1 && deepPage.h1s[0] ? deepPage.h1s[0] : segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          item: `${ctx.origin}/${segments.slice(0, i + 1).join("/")}${i === segments.length - 1 && deepPage.finalUrl.endsWith("/") ? "/" : ""}`,
        })),
      ],
    };
    blocks.push({ label: `BreadcrumbList (example for ${new URL(deepPage.finalUrl).pathname})`, code: JSON.stringify(breadcrumb, null, 2) });
  }

  const article = ctx.pages.find(looksLikeArticle);
  if (article) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.h1s[0] ?? article.title ?? "",
      description: article.metaDescription ?? undefined,
      image: article.og["og:image"] ?? undefined,
      datePublished: isoDate(article.dateModified) ?? "YYYY-MM-DD",
      dateModified: isoDate(article.dateModified) ?? "YYYY-MM-DD",
      author: { "@type": "Person", name: "Author Name", url: `${ctx.origin}/about` },
      publisher: { "@type": "Organization", name, logo: { "@type": "ImageObject", url: logo } },
      mainEntityOfPage: article.finalUrl,
    };
    blocks.push({ label: `Article (example for ${new URL(article.finalUrl).pathname})`, code: JSON.stringify(schema, null, 2) });
  }
  return blocks;
}

export function wrapJsonLd(code: string): string {
  return `<script type="application/ld+json">\n${code}\n</script>`;
}

export interface RedirectRule {
  from: string;
  to: string;
}

/** The same 301 redirects in every common server format. */
export function buildRedirectRules(rules: RedirectRule[]): { apache: string; nginx: string; netlify: string; vercel: string } {
  const path = (u: string) => {
    try {
      const url = new URL(u);
      return url.pathname + url.search;
    } catch {
      return u;
    }
  };
  return {
    apache: rules.map((r) => `Redirect 301 ${path(r.from)} ${r.to}`).join("\n"),
    nginx: rules.map((r) => `location = ${new URL(r.from).pathname} { return 301 ${r.to}; }`).join("\n"),
    netlify: rules.map((r) => `${path(r.from)}  ${r.to}  301`).join("\n"),
    vercel: JSON.stringify({ redirects: rules.map((r) => ({ source: new URL(r.from).pathname, destination: r.to, permanent: true })) }, null, 2),
  };
}

export function httpsRedirectRules(host: string): { apache: string; nginx: string } {
  return {
    apache: [
      "RewriteEngine On",
      "RewriteCond %{HTTPS} off [OR]",
      `RewriteCond %{HTTP_HOST} !^${host.replace(/\./g, "\\.")}$ [NC]`,
      `RewriteRule ^(.*)$ https://${host}/$1 [L,R=301]`,
    ].join("\n"),
    nginx: [
      "server {",
      "    listen 80;",
      `    server_name ${host} ${host.startsWith("www.") ? host.slice(4) : `www.${host}`};`,
      `    return 301 https://${host}$request_uri;`,
      "}",
    ].join("\n"),
  };
}
