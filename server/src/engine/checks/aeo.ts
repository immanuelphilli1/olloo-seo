import { AI_BOTS, looksLikeCloudflareManaged, parseRobots } from "../crawler/robots.ts";
import { buildJsonLd, buildLlmsTxt, buildRobotsTxt, wrapJsonLd } from "../fixes/files.ts";
import { platformSteps } from "../platforms/steps.ts";
import type { CheckDefinition, FindingItem, SiteContext } from "../types.ts";
import { indexablePages, okPages, plural } from "./util.ts";

function blockedBots(ctx: SiteContext, important: boolean) {
  if (!ctx.robots.body) return [];
  const robots = parseRobots(ctx.robots);
  return AI_BOTS.filter((b) => b.important === important && !["Googlebot", "Bingbot"].includes(b.token)).filter((b) =>
    robots.isDisallowed(ctx.homepage.finalUrl, b.token),
  );
}

function robotsFix(ctx: SiteContext) {
  const content = buildRobotsTxt(ctx);
  return {
    kind: "robotsTxt" as const,
    summary: "Replace your robots.txt with this version. It keeps your existing rules and explicitly lets AI search crawlers in.",
    snippets: [{ language: "text" as const, code: content, filename: "robots.txt" }],
    files: [{ filename: "robots.txt", content, mime: "text/plain" }],
    platformSteps: platformSteps("robotsTxt", ctx.platform),
  };
}

function hasType(ctx: SiteContext, types: string[]): boolean {
  return [ctx.homepage, ...ctx.pages].some((p) => p.jsonLd.some((b) => b.types.some((t) => types.includes(t))));
}

export const aeoChecks: CheckDefinition[] = [
  {
    id: "ai-search-blocked",
    category: "aeo",
    severity: "critical",
    title: "AI search engines are blocked",
    why: "Your robots.txt blocks the crawlers that ChatGPT, Perplexity or Claude use to find and cite pages. If they can't read your site, they can't recommend it.",
    learnSlug: "robots-txt-ai-crawlers",
    run: (ctx) => blockedBots(ctx, true).map((b) => ({ detail: `${b.token} (${b.owner}) — ${b.purpose}` })),
    summarize: (items) => `${plural(items.length, "AI search crawler")} ${items.length === 1 ? "is" : "are"} blocked from your site.`,
    fix: (_, ctx) => robotsFix(ctx),
  },
  {
    id: "ai-training-blocked",
    category: "aeo",
    severity: "notice",
    title: "AI training crawlers are blocked",
    why: "Training crawlers (GPTBot, ClaudeBot, Google-Extended) feed future AI models. Blocking them is a valid choice, but brands mentioned widely in training data are more likely to be recommended by AI later.",
    learnSlug: "robots-txt-ai-crawlers",
    run: (ctx) => blockedBots(ctx, false).map((b) => ({ detail: `${b.token} (${b.owner}) — ${b.purpose}` })),
    summarize: (items) => `${plural(items.length, "AI training crawler")} ${items.length === 1 ? "is" : "are"} blocked.`,
    fix: () => ({
      kind: "robotsTxt",
      summary: "This is your call. If you want AI models to learn about your brand, remove the Disallow rules for these bots in robots.txt.",
    }),
  },
  {
    id: "cloudflare-ai-block",
    category: "aeo",
    severity: "warning",
    title: "Cloudflare may be blocking AI crawlers for you",
    why: "Cloudflare's managed robots.txt and \"Block AI bots\" setting are on by default for many sites, silently telling AI crawlers to stay away.",
    learnSlug: "robots-txt-ai-crawlers",
    run: (ctx) =>
      looksLikeCloudflareManaged(ctx.robots.body) && (blockedBots(ctx, true).length || blockedBots(ctx, false).length)
        ? [{ url: ctx.robots.url, detail: "Your robots.txt contains Cloudflare-managed AI rules" }]
        : [],
    summarize: () => "Your robots.txt includes Cloudflare's AI-blocking rules.",
    fix: () => ({
      kind: "robotsTxt",
      summary: "In Cloudflare, go to Security → Bots (or AI Crawl Control) and turn off \"Block AI bots\" / \"Manage your robots.txt\" for the AI search crawlers you want to allow.",
    }),
  },
  {
    id: "js-dependent-content",
    category: "aeo",
    severity: "critical",
    title: "Content only appears with JavaScript",
    why: "ChatGPT's crawler doesn't run JavaScript. If your text only appears after scripts run, ChatGPT sees an almost empty page, and Google indexes it slower.",
    learnSlug: "how-to-rank-in-chatgpt",
    run: (ctx) => {
      if (ctx.render.skipped) return { skipped: ctx.render.skipped };
      return ctx.render.results
        .filter((r) => r.renderedWords > 100 && r.rawWords < r.renderedWords * 0.5)
        .map((r) => ({ url: r.url, detail: `${r.rawWords} words without JavaScript vs ${r.renderedWords} with it` }));
    },
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "is" : "are"} mostly invisible without JavaScript.`,
    fix: () => ({
      kind: "generic",
      summary: "Serve your content as HTML from the server (server-side rendering or pre-rendering) instead of building it in the browser.",
      steps: [
        "React: use Next.js, React Router framework mode or Astro with server rendering/pre-rendering.",
        "Vue: use Nuxt. Angular: use Angular SSR.",
        "Quick test: disable JavaScript in your browser and reload. Whatever disappears is invisible to ChatGPT.",
      ],
    }),
  },
  {
    id: "schema-missing",
    category: "aeo",
    severity: "warning",
    title: "No structured data (schema markup)",
    why: "Schema markup labels your content (organization, articles, products, FAQs) in a machine-readable way. It powers rich results in Google and makes your pages easier for any system to understand.",
    learnSlug: "schema-markup",
    run: (ctx) => {
      const pages = indexablePages(ctx);
      const without = pages.filter((p) => p.jsonLd.length === 0);
      if (without.length === 0) return [];
      if (without.length === pages.length) return [{ url: ctx.homepage.finalUrl, detail: "No JSON-LD on any page we crawled" }];
      return without.map((p) => ({ url: p.finalUrl }));
    },
    summarize: (items, ctx) =>
      items.length === 1 && items[0].detail ? "Your site has no structured data at all." : `${plural(items.length, "page")} of ${indexablePages(ctx).length} have no structured data.`,
    fix: (_, ctx) => {
      const blocks = buildJsonLd(ctx);
      return {
        kind: "schema",
        summary: "Add these JSON-LD blocks (pre-filled from your site. Check the values). Organization and WebSite go on the homepage.",
        snippets: blocks.map((b) => ({ language: "html" as const, code: wrapJsonLd(b.code), filename: b.label })),
        files: [{ filename: "schema.html", content: blocks.map((b) => `<!-- ${b.label} -->\n${wrapJsonLd(b.code)}`).join("\n\n"), mime: "text/html" }],
        platformSteps: platformSteps("schema", ctx.platform),
      };
    },
  },
  {
    id: "schema-invalid",
    category: "aeo",
    severity: "warning",
    title: "Broken structured data",
    why: "JSON-LD with syntax errors is ignored completely by Google and other systems.",
    learnSlug: "schema-markup",
    run: (ctx) => okPages(ctx).flatMap((p) => p.jsonLd.filter((b) => b.error).map((b) => ({ url: p.finalUrl, detail: b.error!, current: b.raw.slice(0, 300) }))),
    summarize: (items) => `${plural(items.length, "structured data block")} can't be parsed.`,
    fix: () => ({
      kind: "schema",
      summary: "Fix the JSON syntax (often a trailing comma or unescaped quote), then test the page in Google's Rich Results Test (search.google.com/test/rich-results).",
    }),
  },
  {
    id: "schema-organization",
    category: "aeo",
    severity: "notice",
    title: "No Organization schema",
    why: "Organization schema tells search engines and AI exactly who you are: your name, logo, website and social profiles, so they connect mentions of your brand to your site.",
    learnSlug: "schema-markup",
    run: (ctx) => (hasType(ctx, ["Organization", "LocalBusiness", "Corporation", "OnlineStore", "Store", "Restaurant", "ProfessionalService", "Person"]) || ctx.homepage.jsonLd.length === 0 ? [] : [{ url: ctx.homepage.finalUrl }]),
    summarize: () => "Your homepage doesn't describe your organization with schema.",
    fix: (_, ctx) => {
      const org = buildJsonLd(ctx)[0];
      return {
        kind: "schema",
        summary: "Add Organization (or LocalBusiness) schema to your homepage.",
        snippets: [{ language: "html", code: wrapJsonLd(org.code) }],
        platformSteps: platformSteps("schema", ctx.platform),
      };
    },
  },
  {
    id: "schema-sameas",
    category: "aeo",
    severity: "notice",
    title: "Organization schema without social profiles",
    why: "The sameAs property links your site to your LinkedIn, YouTube and other profiles. Consistent brand signals across the web help AI recognize your brand as one entity.",
    learnSlug: "what-is-aeo",
    run: (ctx) => {
      const orgs = ctx.homepage.jsonLd.filter((b) => b.types.some((t) => ["Organization", "LocalBusiness", "Corporation"].includes(t)));
      if (!orgs.length) return [];
      return orgs.some((b) => b.raw.includes('"sameAs"')) ? [] : [{ url: ctx.homepage.finalUrl }];
    },
    summarize: () => "Your Organization schema doesn't list your social profiles.",
    fix: () => ({
      kind: "schema",
      summary: "Add a sameAs array with the full URLs of your official profiles.",
      snippets: [{ language: "json", code: '"sameAs": [\n  "https://www.linkedin.com/company/your-brand",\n  "https://www.youtube.com/@yourbrand",\n  "https://x.com/yourbrand"\n]' }],
    }),
  },
  {
    id: "trust-pages",
    category: "aeo",
    severity: "notice",
    title: "No About or Contact page found",
    why: "About and Contact pages are basic trust signals for visitors, Google's quality raters and AI systems deciding whether your brand is a credible source.",
    learnSlug: "seo-checklist",
    run: (ctx) => {
      const all = ctx.pages.flatMap((p) => p.links.filter((l) => l.internal)).map((l) => `${l.href} ${l.text}`.toLowerCase());
      const missing: FindingItem[] = [];
      if (!all.some((s) => /about|who-we-are|our-story|team/.test(s))) missing.push({ detail: "No About page linked" });
      if (!all.some((s) => /contact|get-in-touch|support/.test(s))) missing.push({ detail: "No Contact page linked" });
      return missing;
    },
    summarize: (items) => items.map((i) => i.detail).join(" and ") + ".",
    fix: () => ({
      kind: "content",
      summary: "Create an About page (who you are, why you're qualified, real people) and a Contact page, and link both from your footer.",
    }),
  },
  {
    id: "author-missing",
    category: "aeo",
    severity: "notice",
    title: "Articles without an author",
    why: "Named authors with real expertise are a trust signal for Google (E-E-A-T) and help AI decide which sources to cite.",
    learnSlug: "seo-checklist",
    run: (ctx) =>
      indexablePages(ctx)
        .filter((p) => (/\/(blog|news|articles?|posts?|guides?)\//i.test(p.finalUrl) || p.og["og:type"] === "article") && !p.hasAuthor)
        .map((p) => ({ url: p.finalUrl })),
    summarize: (items) => `${plural(items.length, "article")} ${items.length === 1 ? "has" : "have"} no visible author.`,
    fix: () => ({
      kind: "content",
      summary: "Show the author's name on each article, link it to an author bio page, and add author to your Article schema.",
    }),
  },
  {
    id: "llms-txt-missing",
    category: "aeo",
    severity: "notice",
    title: "No llms.txt file",
    why: "llms.txt is a proposed standard that summarizes your site for AI assistants. No major AI company has confirmed using it yet, so it's low priority, but it's quick and harmless to add.",
    learnSlug: "llms-txt",
    run: (ctx) => (ctx.llmsTxt && !ctx.llmsTxt.isText ? [{ url: `${ctx.origin}/llms.txt` }] : []),
    summarize: () => "Your site has no llms.txt file (optional).",
    fix: (_, ctx) => {
      const content = buildLlmsTxt(ctx);
      return {
        kind: "llmsTxt",
        summary: "Optional: upload this llms.txt to the root of your site.",
        snippets: [{ language: "text", code: content, filename: "llms.txt" }],
        files: [{ filename: "llms.txt", content, mime: "text/plain" }],
        platformSteps: platformSteps("llmsTxt", ctx.platform),
      };
    },
  },
];
