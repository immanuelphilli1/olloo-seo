import { platformSteps } from "../platforms/steps.ts";
import type { CheckDefinition, FindingItem } from "../types.ts";
import { okPages, plural } from "./util.ts";

const LEARN = "core-web-vitals";

export const performanceChecks: CheckDefinition[] = [
  {
    id: "core-web-vitals",
    category: "performance",
    severity: "warning",
    title: "Core Web Vitals need work",
    why: "Core Web Vitals measure loading speed (LCP), responsiveness (INP) and visual stability (CLS). They're part of Google's ranking system, and slow pages can be dropped by AI systems fetching them in real time.",
    learnSlug: LEARN,
    run: (ctx) => {
      if (ctx.pagespeed.skipped) return { skipped: ctx.pagespeed.skipped };
      const items: FindingItem[] = [];
      for (const r of ctx.pagespeed.results) {
        if (r.lcpMs !== null && r.lcpMs > 2500) items.push({ url: r.url, detail: `Largest Contentful Paint ${(r.lcpMs / 1000).toFixed(1)}s (good: under 2.5s)` });
        if (r.inpMs !== null && r.inpMs > 200) items.push({ url: r.url, detail: `Interaction to Next Paint ${Math.round(r.inpMs)}ms (good: under 200ms)` });
        else if (r.inpMs === null && r.tbtMs !== null && r.tbtMs > 600) items.push({ url: r.url, detail: `Total Blocking Time ${Math.round(r.tbtMs)}ms, page is slow to respond (good: under 200ms)` });
        if (r.cls !== null && r.cls > 0.1) items.push({ url: r.url, detail: `Cumulative Layout Shift ${r.cls.toFixed(2)} (good: under 0.1)` });
      }
      return items;
    },
    summarize: (items) => `${plural(items.length, "Core Web Vitals measurement")} ${items.length === 1 ? "is" : "are"} outside Google's \"good\" range on mobile.`,
    fix: (_, ctx) => ({
      kind: "performance",
      summary: "Fix the slowest metric first: compress and resize images (LCP), reserve space for images and ads (CLS), and remove or defer heavy scripts (INP).",
      steps: [
        "LCP: make the main hero image small (WebP/AVIF), don't lazy-load it, and use fast hosting or a CDN.",
        "CLS: set width and height on images and embeds; avoid inserting banners above content after load.",
        "INP: remove unused plugins, chat widgets and trackers; defer non-essential JavaScript.",
      ],
      platformSteps: platformSteps("images", ctx.platform),
    }),
  },
  {
    id: "pagespeed-score",
    category: "performance",
    severity: "notice",
    title: "Low mobile performance score",
    why: "Google's Lighthouse score summarizes how fast your page feels on a mid-range phone. Below 50 usually means real visitors are waiting.",
    learnSlug: LEARN,
    run: (ctx) => {
      if (ctx.pagespeed.skipped) return { skipped: ctx.pagespeed.skipped };
      return ctx.pagespeed.results.filter((r) => r.performanceScore !== null && r.performanceScore < 50).map((r) => ({ url: r.url, detail: `Mobile performance score ${r.performanceScore}/100` }));
    },
    summarize: (items) => `${plural(items.length, "page")} score below 50/100 for mobile performance.`,
    fix: () => ({ kind: "performance", summary: "Run the page through pagespeed.web.dev and work through its \"Opportunities\" list, biggest savings first." }),
  },
  {
    id: "slow-server",
    category: "performance",
    severity: "warning",
    title: "Slow server response",
    why: "If your server takes long to start sending the page, everything else waits. Slow responses hurt Core Web Vitals and can make AI fetchers time out.",
    learnSlug: LEARN,
    run: (ctx) =>
      okPages(ctx)
        .filter((p) => p.redirectChain.length === 0 && p.ttfbMs > 1000)
        .map((p) => ({ url: p.finalUrl, detail: `${p.ttfbMs}ms to first byte (good: under 800ms)` })),
    summarize: (items) => `${plural(items.length, "page")} took over a second to start loading.`,
    fix: (_, ctx) => ({
      kind: "caching",
      summary: "Turn on page caching, use a CDN (Cloudflare's free plan works), and upgrade slow shared hosting if caching isn't enough.",
      platformSteps: platformSteps("caching", ctx.platform),
    }),
  },
  {
    id: "compression-missing",
    category: "performance",
    severity: "notice",
    title: "Pages served without compression",
    why: "Gzip or Brotli compression typically shrinks HTML by 70% or more, so pages download much faster on mobile.",
    learnSlug: LEARN,
    run: (ctx) =>
      okPages(ctx)
        .filter((p) => p.htmlBytes > 2048 && !p.headers["content-encoding"])
        .map((p) => ({ url: p.finalUrl, detail: `${Math.round(p.htmlBytes / 1024)} KB uncompressed` })),
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "is" : "are"} sent without gzip/Brotli compression.`,
    fix: (_, ctx) => ({
      kind: "compression",
      summary: "Enable gzip or Brotli compression on your server or CDN.",
      snippets: [
        { language: "apache", code: "<IfModule mod_deflate.c>\n  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml\n</IfModule>", filename: ".htaccess" },
        { language: "nginx", code: "gzip on;\ngzip_types text/css application/javascript application/json image/svg+xml;\ngzip_min_length 1024;", filename: "nginx.conf" },
      ],
      platformSteps: platformSteps("compression", ctx.platform),
    }),
  },
  {
    id: "html-size",
    category: "performance",
    severity: "notice",
    title: "Very large HTML pages",
    why: "HTML over 500 KB usually means inlined data or bloated page builders. It slows down loading and parsing for browsers and crawlers alike.",
    learnSlug: LEARN,
    run: (ctx) => okPages(ctx).filter((p) => p.htmlBytes > 500 * 1024).map((p) => ({ url: p.finalUrl, detail: `${Math.round(p.htmlBytes / 1024)} KB of HTML` })),
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "has" : "have"} more than 500 KB of HTML.`,
    fix: () => ({ kind: "performance", summary: "Remove inlined data, unused page-builder sections and huge inline SVGs; paginate very long lists." }),
  },
  {
    id: "render-blocking",
    category: "performance",
    severity: "notice",
    title: "Many render-blocking files",
    why: "Every stylesheet and synchronous script in <head> must download before the page can appear. Fewer blocking files means a faster first paint.",
    learnSlug: LEARN,
    run: (ctx) => okPages(ctx).filter((p) => p.renderBlocking > 6).map((p) => ({ url: p.finalUrl, detail: `${p.renderBlocking} blocking files in <head>` })),
    summarize: (items) => `${plural(items.length, "page")} load more than 6 render-blocking files.`,
    fix: () => ({
      kind: "performance",
      summary: "Add defer to scripts that don't need to run immediately, combine small stylesheets, and remove plugins you don't use.",
      snippets: [{ language: "html", code: '<script src="/analytics.js" defer></script>' }],
    }),
  },
];
