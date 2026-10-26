import { botToken } from "../../config.ts";
import { parseRobots } from "../crawler/robots.ts";
import { buildRedirectRules, buildRobotsTxt, buildSitemapXml, httpsRedirectRules } from "../fixes/files.ts";
import { platformSteps } from "../platforms/steps.ts";
import type { CheckDefinition, FindingItem } from "../types.ts";
import { duplicates, indexablePages, isNoindex, linkSources, okPages, path, plural } from "./util.ts";

const LEARN = "technical-seo-checklist";

export const technicalChecks: CheckDefinition[] = [
  {
    id: "https-missing",
    category: "technical",
    severity: "critical",
    title: "Site is not served over HTTPS",
    why: "Browsers mark plain-HTTP sites as \"Not secure\", and HTTPS is a confirmed Google ranking signal. Visitors and AI assistants are less likely to trust or recommend an insecure site.",
    learnSlug: LEARN,
    run: (ctx) => (ctx.origin.startsWith("http:") && !ctx.origin.includes("localhost") && !/^http:\/\/(127\.|10\.|192\.168\.)/.test(ctx.origin) ? [{ url: ctx.origin }] : []),
    summarize: () => "Your site loads over insecure HTTP.",
    fix: (_, ctx) => ({
      kind: "https",
      summary: "Install a free TLS certificate and permanently redirect every http:// URL to https://.",
      snippets: [
        { language: "apache", code: httpsRedirectRules(ctx.host).apache, filename: ".htaccess" },
        { language: "nginx", code: httpsRedirectRules(ctx.host).nginx, filename: "nginx.conf" },
      ],
      platformSteps: platformSteps("https", ctx.platform),
    }),
  },
  {
    id: "http-not-redirecting",
    category: "technical",
    severity: "warning",
    title: "HTTP version doesn't redirect to HTTPS",
    why: "If http:// and https:// both load, search engines see two copies of every page and split your ranking signals (like backlinks) between them.",
    learnSlug: LEARN,
    run: (ctx) => {
      const v = ctx.httpVariant;
      if (!v || v.error || v.status === 0) return [];
      if (v.status >= 200 && v.status < 300) return [{ url: v.url, detail: `Returned ${v.status} instead of a 301 redirect` }];
      if (v.status >= 300 && v.status < 400 && v.redirectsTo && !v.redirectsTo.startsWith("https:")) {
        return [{ url: v.url, detail: `Redirects to ${v.redirectsTo} (not HTTPS)` }];
      }
      if (v.status === 302 || v.status === 307) return [{ url: v.url, detail: `Uses a temporary ${v.status} redirect, use a permanent 301` }];
      return [];
    },
    summarize: () => "http:// pages aren't permanently redirected to https://.",
    fix: (_, ctx) => ({
      kind: "https",
      summary: "Add a permanent (301) redirect from every http:// URL to its https:// version.",
      snippets: [
        { language: "apache", code: httpsRedirectRules(ctx.host).apache, filename: ".htaccess" },
        { language: "nginx", code: httpsRedirectRules(ctx.host).nginx, filename: "nginx.conf" },
      ],
      platformSteps: platformSteps("https", ctx.platform),
    }),
  },
  {
    id: "www-duplicate",
    category: "technical",
    severity: "warning",
    title: "Both www and non-www versions load",
    why: "When example.com and www.example.com both show the site, Google treats them as duplicates and your backlinks get split across two addresses. Pick one and redirect the other.",
    learnSlug: LEARN,
    run: (ctx) => {
      const v = ctx.wwwVariant;
      if (!v || v.error || v.status === 0) return [];
      if (v.status >= 200 && v.status < 300) return [{ url: v.url, detail: `Loads directly (status ${v.status}) instead of redirecting to ${ctx.origin}` }];
      return [];
    },
    summarize: (items) => `${new URL(items[0].url!).host} serves a duplicate copy of your site.`,
    fix: (_, ctx) => ({
      kind: "redirects",
      summary: `Permanently redirect the other hostname to ${ctx.host}.`,
      snippets: [
        { language: "apache", code: httpsRedirectRules(ctx.host).apache, filename: ".htaccess" },
        { language: "nginx", code: httpsRedirectRules(ctx.host).nginx, filename: "nginx.conf" },
      ],
      platformSteps: platformSteps("redirects", ctx.platform),
    }),
  },
  {
    id: "http-status-errors",
    category: "technical",
    severity: "critical",
    title: "Pages returning errors",
    why: "Pages that return 4xx or 5xx errors can't rank, and every internal link pointing at them wastes crawl budget and link authority.",
    learnSlug: LEARN,
    run: (ctx) =>
      [...ctx.fetched.values()]
        .filter((p) => p.status >= 400 || p.status === 0)
        .map((p) => ({ url: p.url, detail: p.status === 0 ? p.error ?? "No response" : `HTTP ${p.status}`, current: linkSources(ctx, p.url).join(", ") || undefined })),
    summarize: (items) => `${plural(items.length, "page")} returned an error when we crawled them.`,
    fix: () => ({
      kind: "links",
      summary: "Restore each page, or 301-redirect it to the most relevant live page and update the links pointing to it.",
      steps: [
        "If the page should exist, fix the server error or restore the content.",
        "If it was removed on purpose, add a 301 redirect to the closest replacement page.",
        "Update internal links (listed under \"Linked from\") so they point straight to a working page.",
      ],
    }),
  },
  {
    id: "broken-internal-links",
    category: "technical",
    severity: "warning",
    title: "Broken internal links",
    why: "Links to missing pages are dead ends for visitors and crawlers. They waste the authority your pages pass to each other.",
    learnSlug: LEARN,
    run: (ctx) => {
      const items: FindingItem[] = [];
      for (const [url, status] of ctx.linkStatus) {
        if ((status >= 400 || status === 0) && !ctx.fetched.has(url)) {
          items.push({ url, detail: status === 0 ? "No response" : `HTTP ${status}`, current: linkSources(ctx, url).join(", ") });
        }
      }
      return items;
    },
    summarize: (items) => `${plural(items.length, "internal link target")} ${items.length === 1 ? "is" : "are"} broken.`,
    fix: (_, ctx) => ({
      kind: "links",
      summary: "Edit the linking pages to point at a working URL, or redirect the broken URL.",
      platformSteps: platformSteps("redirects", ctx.platform),
    }),
  },
  {
    id: "broken-external-links",
    category: "technical",
    severity: "notice",
    title: "Broken outbound links",
    why: "Links to dead external pages hurt user experience and make content look neglected, a freshness signal that AI assistants and Google both notice.",
    learnSlug: LEARN,
    run: (ctx) =>
      [...ctx.externalStatus]
        .filter(([, status]) => status === 404 || status === 410 || (status >= 500 && status < 600))
        .map(([url, status]) => ({ url, detail: `HTTP ${status}`, current: linkSources(ctx, url).join(", ") })),
    summarize: (items) => `${plural(items.length, "outbound link")} point to pages that no longer exist.`,
    fix: () => ({ kind: "links", summary: "Replace each dead link with a current source, or remove it." }),
  },
  {
    id: "redirect-chains",
    category: "technical",
    severity: "warning",
    title: "Redirect chains",
    why: "Each extra redirect hop slows the page down and can lose link authority. Google may stop following after several hops. Point links straight at the final URL.",
    learnSlug: LEARN,
    run: (ctx) =>
      [...ctx.fetched.values()]
        .filter((p) => p.redirectChain.length >= 2)
        .map((p) => ({ url: p.url, detail: [...p.redirectChain.map((h) => `${path(h.url)} (${h.status})`), path(p.finalUrl)].join(" → ") })),
    summarize: (items) => `${plural(items.length, "URL")} go through 2 or more redirects.`,
    fix: (items, ctx) => {
      const rules = items.map((i) => {
        const page = ctx.fetched.get(i.url!)!;
        return { from: i.url!, to: page.finalUrl };
      });
      const r = buildRedirectRules(rules);
      return {
        kind: "redirects",
        summary: "Redirect each starting URL straight to its final destination in one hop, and update internal links to the final URL.",
        snippets: [
          { language: "apache", code: r.apache, filename: ".htaccess" },
          { language: "nginx", code: r.nginx, filename: "nginx.conf" },
          { language: "text", code: r.netlify, filename: "_redirects (Netlify)" },
          { language: "json", code: r.vercel, filename: "vercel.json" },
        ],
        platformSteps: platformSteps("redirects", ctx.platform),
      };
    },
  },
  {
    id: "internal-links-to-redirects",
    category: "technical",
    severity: "notice",
    title: "Internal links pointing at redirects",
    why: "Linking to a URL that redirects adds a wasted hop for visitors and crawlers. Link directly to the final address.",
    learnSlug: LEARN,
    run: (ctx) =>
      [...ctx.fetched.values()]
        .filter((p) => p.redirectChain.length === 1 && p.foundVia === "link" && new URL(p.finalUrl).hostname.replace(/^www\./, "") === ctx.host.replace(/^www\./, ""))
        .map((p) => ({ url: p.url, detail: `Redirects to ${path(p.finalUrl)}`, current: linkSources(ctx, p.url).join(", ") })),
    summarize: (items) => `${plural(items.length, "internal link")} point at URLs that redirect.`,
    fix: () => ({ kind: "links", summary: "Update these links to point at the final URL shown under each item." }),
  },
  {
    id: "noindex",
    category: "technical",
    severity: "critical",
    title: "Pages blocked from Google with noindex",
    why: "A noindex tag tells search engines to drop the page from results. It's often left behind by accident after a redesign, and it makes the page invisible to Google and to AI answers built on search indexes.",
    learnSlug: LEARN,
    run: (ctx) =>
      okPages(ctx)
        .filter((p) => isNoindex(p) && !/\/(cart|checkout|account|login|search|thank)/i.test(p.finalUrl))
        .map((p) => ({ url: p.finalUrl, detail: p.metaRobots?.includes("noindex") ? `<meta name="robots" content="${p.metaRobots}">` : `X-Robots-Tag: ${p.headers["x-robots-tag"]}` })),
    summarize: (items, ctx) =>
      items.some((i) => i.url === ctx.homepage.finalUrl)
        ? "Your HOMEPAGE tells search engines not to index it."
        : `${plural(items.length, "page")} tell search engines not to index them.`,
    fix: (_, ctx) => ({
      kind: "noindex",
      summary: "Remove the noindex instruction from every page you want to appear in Google and AI answers.",
      snippets: [{ language: "html", code: '<!-- Delete this line from the page <head>: -->\n<meta name="robots" content="noindex">\n\n<!-- Optional: replace it with -->\n<meta name="robots" content="index, follow">' }],
      platformSteps: platformSteps("noindex", ctx.platform),
    }),
  },
  {
    id: "robots-missing",
    category: "technical",
    severity: "notice",
    title: "No robots.txt file",
    why: "robots.txt tells crawlers what they may visit and where your sitemap is. Without one, crawlers still visit, but you lose an easy way to point them to your sitemap.",
    learnSlug: "robots-txt-ai-crawlers",
    run: (ctx) => (ctx.robots.status === 404 || ctx.robots.status === 410 ? [{ url: ctx.robots.url }] : []),
    summarize: () => "Your site has no robots.txt file.",
    fix: (_, ctx) => {
      const content = buildRobotsTxt(ctx);
      return {
        kind: "robotsTxt",
        summary: "Upload this robots.txt to the root of your site.",
        snippets: [{ language: "text", code: content, filename: "robots.txt" }],
        files: [{ filename: "robots.txt", content, mime: "text/plain" }],
        platformSteps: platformSteps("robotsTxt", ctx.platform),
      };
    },
  },
  {
    id: "robots-blocks-all",
    category: "technical",
    severity: "critical",
    title: "robots.txt blocks search engines from your site",
    why: "Your robots.txt tells Google (or all crawlers) not to crawl the site. Pages that can't be crawled can't rank, and AI assistants can't read them either.",
    learnSlug: "robots-txt-ai-crawlers",
    run: (ctx) => {
      if (!ctx.robots.body) return [];
      const robots = parseRobots(ctx.robots);
      const blocked = ["Googlebot", "Bingbot"].filter((bot) => robots.isDisallowed(ctx.homepage.finalUrl, bot));
      return blocked.length ? [{ url: ctx.robots.url, detail: `Blocks: ${blocked.join(", ")}` }] : [];
    },
    summarize: (items) => `robots.txt blocks ${items[0].detail?.replace("Blocks: ", "")} from crawling your homepage.`,
    fix: (_, ctx) => {
      const content = buildRobotsTxt(ctx);
      return {
        kind: "robotsTxt",
        summary: "Replace your robots.txt with this corrected version. Your other rules are kept; the full-site block is commented out.",
        snippets: [{ language: "text", code: content, filename: "robots.txt" }],
        files: [{ filename: "robots.txt", content, mime: "text/plain" }],
        platformSteps: platformSteps("robotsTxt", ctx.platform),
      };
    },
  },
  {
    id: "robots-blocks-pages",
    category: "technical",
    severity: "warning",
    title: "Pages in your sitemap are blocked by robots.txt",
    why: "Your sitemap asks Google to index these pages, while robots.txt forbids crawling them. Google gets mixed signals and the pages usually don't rank.",
    learnSlug: "robots-txt-ai-crawlers",
    run: (ctx) => {
      if (!ctx.robots.body) return [];
      const robots = parseRobots(ctx.robots);
      return ctx.sitemapUrls.filter((u) => robots.isDisallowed(u, "Googlebot")).slice(0, 200).map((url) => ({ url }));
    },
    summarize: (items) => `${plural(items.length, "sitemap URL")} ${items.length === 1 ? "is" : "are"} blocked by robots.txt.`,
    fix: () => ({
      kind: "robotsTxt",
      summary: "Either remove these URLs from your sitemap, or delete the robots.txt Disallow rule that blocks them.",
    }),
  },
  {
    id: "sitemap-missing",
    category: "technical",
    severity: "warning",
    title: "No XML sitemap found",
    why: "A sitemap lists every page you want found, helping Google and Bing discover new and updated pages faster, especially pages with few internal links.",
    learnSlug: LEARN,
    run: (ctx) => (ctx.sitemaps.some((s) => s.status === 200 && !s.error) ? [] : [{ url: `${ctx.origin}/sitemap.xml`, detail: ctx.sitemaps[0]?.error ?? (ctx.sitemaps[0] ? `HTTP ${ctx.sitemaps[0].status}` : "Not found") }]),
    summarize: () => "We couldn't find a working XML sitemap.",
    fix: (_, ctx) => {
      const xml = buildSitemapXml(ctx);
      return {
        kind: "sitemap",
        summary: "Publish a sitemap at /sitemap.xml (we generated one from your crawl), reference it in robots.txt, and submit it in Google Search Console and Bing Webmaster Tools.",
        files: [{ filename: "sitemap.xml", content: xml, mime: "application/xml" }],
        snippets: [{ language: "xml", code: xml.split("\n").slice(0, 12).join("\n") + "\n  …", filename: "sitemap.xml (preview)" }],
        platformSteps: platformSteps("sitemap", ctx.platform),
      };
    },
  },
  {
    id: "sitemap-not-in-robots",
    category: "technical",
    severity: "notice",
    title: "Sitemap isn't listed in robots.txt",
    why: "Adding a Sitemap: line to robots.txt lets every crawler, including Bing, which powers ChatGPT search, find your sitemap automatically.",
    learnSlug: LEARN,
    run: (ctx) => {
      const sitemap = ctx.sitemaps.find((s) => s.status === 200 && !s.error);
      if (!sitemap || !ctx.robots.body) return [];
      return /^\s*sitemap\s*:/im.test(ctx.robots.body) ? [] : [{ url: sitemap.url }];
    },
    summarize: () => "Your robots.txt doesn't point crawlers to your sitemap.",
    fix: (items) => ({
      kind: "robotsTxt",
      summary: "Add this line to the end of robots.txt.",
      snippets: [{ language: "text", code: `Sitemap: ${items[0].url}` }],
    }),
  },
  {
    id: "sitemap-bad-urls",
    category: "technical",
    severity: "warning",
    title: "Sitemap contains broken, redirected or noindexed URLs",
    why: "A sitemap should only list pages you want indexed. Errors, redirects and noindexed pages in it waste crawl budget and make Google trust the sitemap less.",
    learnSlug: LEARN,
    run: (ctx) =>
      ctx.sitemapUrls
        .map((u) => ctx.fetched.get(u))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .filter((p) => p.status !== 200 || p.redirectChain.length > 0 || isNoindex(p))
        .map((p) => ({ url: p.url, detail: p.status !== 200 ? `HTTP ${p.status || "error"}` : p.redirectChain.length ? `Redirects to ${path(p.finalUrl)}` : "Has noindex" })),
    summarize: (items) => `${plural(items.length, "URL")} in your sitemap shouldn't be there.`,
    fix: (_, ctx) => {
      const xml = buildSitemapXml(ctx);
      return {
        kind: "sitemap",
        summary: "Remove these URLs from the sitemap (or list the final URL instead of the redirecting one). A cleaned sitemap is attached.",
        files: [{ filename: "sitemap.xml", content: xml, mime: "application/xml" }],
        platformSteps: platformSteps("sitemap", ctx.platform),
      };
    },
  },
  {
    id: "canonical-missing",
    category: "technical",
    severity: "notice",
    title: "Pages without a canonical tag",
    why: "A canonical tag names the preferred URL for a page, so tracking parameters or duplicate paths don't split your ranking signals.",
    learnSlug: LEARN,
    run: (ctx) => okPages(ctx).filter((p) => !p.canonical && !isNoindex(p)).map((p) => ({ url: p.finalUrl, suggested: `<link rel="canonical" href="${p.finalUrl}">` })),
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "has" : "have"} no canonical tag.`,
    fix: (_, ctx) => ({
      kind: "canonical",
      summary: "Add a self-referencing canonical tag to each page's <head> (the exact tag for each page is listed above).",
      platformSteps: platformSteps("canonical", ctx.platform),
    }),
  },
  {
    id: "canonical-invalid",
    category: "technical",
    severity: "warning",
    title: "Canonical tags pointing to bad URLs",
    why: "If a canonical points to a broken page, a redirect, an http:// URL or another domain, Google may ignore it, or drop the page you actually wanted to rank.",
    learnSlug: LEARN,
    run: (ctx) => {
      const items: FindingItem[] = [];
      for (const page of okPages(ctx)) {
        if (!page.canonical || page.canonical === page.finalUrl) continue;
        const target = ctx.fetched.get(page.canonical);
        const status = target?.status ?? ctx.linkStatus.get(page.canonical);
        if (ctx.origin.startsWith("https:") && page.canonical.startsWith("http:")) items.push({ url: page.finalUrl, detail: `Canonical uses http://: ${page.canonical}` });
        else if (new URL(page.canonical).hostname.replace(/^www\./, "") !== ctx.host.replace(/^www\./, "")) items.push({ url: page.finalUrl, detail: `Canonical points to another domain: ${page.canonical}` });
        else if (status !== undefined && status !== 200) items.push({ url: page.finalUrl, detail: `Canonical target returns ${status || "an error"}: ${path(page.canonical)}` });
        else if (target && target.redirectChain.length) items.push({ url: page.finalUrl, detail: `Canonical target redirects: ${path(page.canonical)}` });
      }
      return items;
    },
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "has" : "have"} a canonical tag Google is likely to ignore.`,
    fix: (_, ctx) => ({
      kind: "canonical",
      summary: "Point each canonical at the final, working https:// URL of the preferred page, usually the page itself.",
      platformSteps: platformSteps("canonical", ctx.platform),
    }),
  },
  {
    id: "duplicate-content",
    category: "technical",
    severity: "warning",
    title: "Duplicate pages",
    why: "When several URLs show the same content, Google picks one to rank, maybe not the one you want, and splits links between them.",
    learnSlug: LEARN,
    run: (ctx) => {
      const groups = duplicates(indexablePages(ctx).filter((p) => p.wordCount > 50), (p) => p.contentHash);
      return [...groups.values()].map((list) => ({ url: list[0].finalUrl, detail: `Same content as: ${list.slice(1).map((p) => path(p.finalUrl)).join(", ")}` }));
    },
    summarize: (items) => `${plural(items.length, "group")} of pages have identical content.`,
    fix: (_, ctx) => ({
      kind: "canonical",
      summary: "Keep one version of each page. 301-redirect the copies to it, or add a canonical tag on the copies pointing to the main version.",
      platformSteps: platformSteps("canonical", ctx.platform),
    }),
  },
  {
    id: "orphan-pages",
    category: "technical",
    severity: "notice",
    title: "Orphan pages (no internal links)",
    why: "Pages only listed in the sitemap, with no links from your other pages, are hard for crawlers to find and get no internal link authority.",
    learnSlug: LEARN,
    run: (ctx) => {
      if (ctx.crawlTruncated) return { skipped: "Your site is larger than our crawl limit, so we can't be sure which pages have no links." };
      return ctx.pages.filter((p) => p.foundVia === "sitemap" && p.isHtml && !ctx.inlinks.get(p.url) && !ctx.inlinks.get(p.finalUrl)).map((p) => ({ url: p.finalUrl }));
    },
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "has" : "have"} no internal links pointing to ${items.length === 1 ? "it" : "them"}.`,
    fix: () => ({
      kind: "links",
      summary: "Link to each page from at least 2–3 related pages (and from a menu or hub page if it's important).",
      steps: ["Search your site for pages on a related topic (Google: site:yourdomain.com topic).", "Add a natural, descriptive link from those pages to the orphan page."],
    }),
  },
  {
    id: "deep-pages",
    category: "technical",
    severity: "notice",
    title: "Pages buried deep in the site",
    why: "Pages more than 3 clicks from the homepage get crawled less often and receive less internal authority. Important pages should be close to the homepage.",
    learnSlug: LEARN,
    run: (ctx) => indexablePages(ctx).filter((p) => p.depth > 3).map((p) => ({ url: p.finalUrl, detail: `${p.depth} clicks from the homepage` })),
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "is" : "are"} more than 3 clicks from the homepage.`,
    fix: () => ({ kind: "links", summary: "Link to important deep pages from the homepage, main menu, or category/hub pages." }),
  },
  {
    id: "mixed-content",
    category: "technical",
    severity: "warning",
    title: "Insecure (mixed) content on HTTPS pages",
    why: "HTTPS pages that load images or scripts over http:// trigger browser warnings, and the insecure files may be blocked outright.",
    learnSlug: LEARN,
    run: (ctx) => okPages(ctx).filter((p) => p.mixedContent.length).map((p) => ({ url: p.finalUrl, detail: p.mixedContent.slice(0, 3).join(", ") })),
    summarize: (items) => `${plural(items.length, "page")} load files over insecure http://.`,
    fix: () => ({ kind: "https", summary: "Change each http:// file URL to https:// (or a relative URL)." }),
  },
  {
    id: "viewport-missing",
    category: "technical",
    severity: "warning",
    title: "Missing mobile viewport tag",
    why: "Google ranks the mobile version of your site. Without a viewport tag, phones render a zoomed-out desktop page.",
    learnSlug: LEARN,
    run: (ctx) => okPages(ctx).filter((p) => !p.viewport).map((p) => ({ url: p.finalUrl })),
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "isn't" : "aren't"} set up for mobile screens.`,
    fix: (_, ctx) => ({
      kind: "viewport",
      summary: "Add the viewport tag to the <head> of every page.",
      snippets: [{ language: "html", code: '<meta name="viewport" content="width=device-width, initial-scale=1">' }],
      platformSteps: platformSteps("viewport", ctx.platform),
    }),
  },
  {
    id: "lang-missing",
    category: "technical",
    severity: "notice",
    title: "Missing language attribute",
    why: "The lang attribute tells search engines and screen readers which language the page is in, so it's shown to the right audience.",
    learnSlug: LEARN,
    run: (ctx) => okPages(ctx).filter((p) => !p.lang).map((p) => ({ url: p.finalUrl })),
    summarize: (items) => `${plural(items.length, "page")} don't declare a language.`,
    fix: (_, ctx) => ({
      kind: "lang",
      summary: "Add a lang attribute to the <html> tag.",
      snippets: [{ language: "html", code: '<html lang="en">' }],
      platformSteps: platformSteps("lang", ctx.platform),
    }),
  },
  {
    id: "hreflang-invalid",
    category: "technical",
    severity: "notice",
    title: "Invalid hreflang tags",
    why: "hreflang tags tell Google which language version to show each country. Invalid codes or relative URLs are ignored.",
    learnSlug: LEARN,
    run: (ctx) =>
      okPages(ctx).flatMap((p) =>
        p.hreflang
          .filter((h) => !/^(x-default|[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|\d{3}))?)$/i.test(h.lang) || !/^https?:\/\//.test(h.href))
          .map((h) => ({ url: p.finalUrl, detail: `hreflang="${h.lang}" href="${h.href}"` })),
      ),
    summarize: (items) => `${plural(items.length, "hreflang tag")} ${items.length === 1 ? "is" : "are"} invalid.`,
    fix: () => ({
      kind: "generic",
      summary: "Use ISO language codes (e.g. en, en-GB, fr-CA, x-default) and full absolute URLs in every hreflang tag.",
      snippets: [{ language: "html", code: '<link rel="alternate" hreflang="en-us" href="https://example.com/">\n<link rel="alternate" hreflang="x-default" href="https://example.com/">' }],
    }),
  },
  {
    id: "soft-404",
    category: "technical",
    severity: "warning",
    title: "Missing pages don't return a 404 error",
    why: "Your server answers \"200 OK\" for pages that don't exist. Search engines may index junk URLs, and AI assistants, which send visitors to made-up URLs nearly 3× more often than Google, send people to empty pages.",
    learnSlug: LEARN,
    run: (ctx) => (ctx.soft404 && ctx.soft404.status === 200 ? [{ url: ctx.soft404.url, detail: "Returned 200 instead of 404" }] : []),
    summarize: () => "Non-existent URLs on your site return \"200 OK\" instead of 404.",
    fix: (_, ctx) => ({
      kind: "notFound",
      summary: "Return a real 404 status for missing URLs, and show a helpful 404 page with search and links to your top pages.",
      platformSteps: platformSteps("notFound", ctx.platform),
    }),
  },
  {
    id: "robots-crawler-blocked",
    category: "technical",
    severity: "notice",
    title: "Some pages were skipped because robots.txt blocks crawlers",
    why: "We follow robots.txt like search engines do. Pages blocked for all crawlers are also blocked for Google and AI assistants.",
    learnSlug: "robots-txt-ai-crawlers",
    run: (ctx) => {
      if (!ctx.robots.body) return [];
      const robots = parseRobots(ctx.robots);
      const blocked = new Set<string>();
      for (const page of ctx.pages) {
        for (const link of page.links) {
          if (new URL(link.href).search || /\/(wp-admin|wp-login|admin|login|cart|checkout|account)/i.test(link.href)) continue;
          if (link.internal && robots.isDisallowed(link.href, botToken) && robots.isDisallowed(link.href, "Googlebot")) blocked.add(link.href);
        }
      }
      return [...blocked].slice(0, 50).map((url) => ({ url }));
    },
    summarize: (items) => `${plural(items.length, "linked URL")} ${items.length === 1 ? "is" : "are"} blocked for search engines.`,
    fix: () => ({ kind: "robotsTxt", summary: "If these pages should appear in search, remove the matching Disallow rule from robots.txt. If they're private (admin, cart), this is fine." }),
  },
];
