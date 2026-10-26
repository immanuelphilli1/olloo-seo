# olloo SEO: free SEO & AI-search audit

Paste a website address. olloo SEO crawls up to 50 pages, runs 50+ checks for Google and AI search (ChatGPT, Perplexity, Claude, Gemini, AI Overviews), and writes the fixes: rewritten titles and descriptions, a corrected robots.txt, a sitemap, schema code, redirect rules and step-by-step instructions for WordPress, Shopify, Wix, Squarespace and Webflow.

The name is set in one place; see [Renaming the site](#renaming-the-site).

## Run it locally

Requirements: Node.js 22+.

```bash
npm install
npx playwright install chromium   # optional: enables the "content only appears with JavaScript" check
npm run dev
```

Open **http://localhost:5180**. The API runs on port 8787; Vite proxies `/api` to it.

Everything works without configuration. To turn on optional features, copy `.env.example` to `.env`:

| Setting | What it does |
|---|---|
| `ANTHROPIC_API_KEY` | AI-written fixes: titles, meta descriptions, alt text, content review, personalized action plan and FAQ schema (Claude Haiku 5.5, a few cents per audit) |
| `AI_DAILY_BUDGET_USD` | Stops AI calls for the day after this much spend (default $2) |
| `PAGESPEED_API_KEY` | Free Google key for reliable Core Web Vitals (without it, Google's shared quota often runs out) |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare captcha on the audit form (off when empty) |
| `AUTOCOMPLETE_DAILY_LIMIT` | Daily cap on Google autocomplete requests for the Keyword Generator (default 2000) |
| `ALLOW_PRIVATE_TARGETS` | **Local testing only.** Lets you audit `localhost` sites |

### Production mode on your machine

```bash
npm run build      # prerenders every public page to static HTML
npm start          # one server on http://localhost:8787 serving the site + API
```

## Test it

```bash
npm test           # 73 tests: every check against a broken and a clean fixture site, SSRF protection, parsing
npm run fixtures   # serves the test sites on :4001 (broken) and :4002 (clean)
```

To audit the fixture sites from the UI, start the app with `ALLOW_PRIVATE_TARGETS=true npm run dev` and enter `http://localhost:4001`.

## How it's built

```
web/      React + Vite + Tailwind (React Router framework mode). Every public page is
          prerendered to full HTML at build time — crawlers that don't run JavaScript
          (like ChatGPT's) see all content. Report pages (/audit/:id) are client-rendered
          and noindexed.
  app/routes/          pages (home, tools/*, learn, about, audit report…)
  app/content/learn/   the 12 guides (MDX)
  app/content/*.ts     article + tool registries (drive menus, sitemap, prerendering)
  seo/generate.ts      generates robots.txt, sitemap.xml, llms.txt, llms-full.txt, rss.xml and
                       site.webmanifest — served live in dev, written into build/client by
                       `npm run build` (open http://localhost:5180/robots.txt to see them)
  scripts/make-images.ts  re-renders the logo, favicons and social image (Geist, black + orange)
  scripts/critical-css.ts runs after every build: inlines each page's critical CSS (Beasties) and
                       starts loading React after the page has loaded, so content paints first
  seo/mdx-headings.ts  build plugin that gives each article its "On this page" headings

server/   Node + Hono API, SQLite (Drizzle), in-process job queue
  src/engine/crawler/  SSRF-safe fetcher, robots.txt, sitemaps, crawl, JS-render test, PageSpeed
  src/engine/checks/   the 50+ checks (technical, onpage, content, aeo, performance)
  src/engine/fixes/    generated files, AI fixes, action plan, ZIP bundle
  src/engine/platforms/ CMS detection + per-platform instructions
  src/engine/keywords/  target-keyword matching, search-intent labels, Google autocomplete
```

**Adding a check:** add an object to the relevant file in `server/src/engine/checks/` (`id`, `severity`, `why`, `run`, `summarize`, `fix`), then a planted example in `server/test/fixtures/sites.ts` and its id in `server/test/audit.test.ts`.

**Adding an article:** add an entry in `web/app/content/articles.ts` and a matching `web/app/content/learn/<slug>.mdx` (no frontmatter, no H1; start with the answer). It's automatically routed, prerendered, added to the sitemap, llms.txt and the Learn hub.

## Renaming the site

1. `web/app/config/site.ts`: `name` (full name), `brand` (short name used in "SEO Score"), `botName` (crawler name, no spaces), `email`, `author` (use a real person), `sameAs` (your social profiles).
2. `.env`: `SITE_URL=https://yourdomain.com`, `SITE_NAME` and `BOT_NAME` (same as in site.ts).
3. `cd web && npx tsx scripts/make-images.ts` regenerates the logo and social images.
4. `npm run build`.

Articles use `{site.name}`, so they update automatically.

## Keywords

- **Target keyword check:** users can add up to 5 keywords when starting an audit. Each is matched to the page that best targets it (word stems, any order — not exact match), then checked in the title, H1, URL, meta description and first paragraph. It also flags keywords with no page, pages competing for the same keyword, and keyword stuffing. When no page uses every word, the closest page on the core topic is shown as a partial match.
- **Keyword Generator** (`/tools/keyword-generator`): real searches from Google autocomplete (labeled "From Google") plus built-in seed + modifier ideas (labeled "Ideas to test"), each tagged with search intent and whether an AI answer is likely to take the click. Users can tick up to 5 and audit their site for them.
- Google autocomplete is an unofficial public endpoint used by most free keyword tools. Google could rate-limit or block it, and automated use is a grey area in Google's terms. Results are cached for 7 days and capped per day; if it fails, the tool falls back to built-in ideas. There are no search volumes (those need paid data).

## SEO built into the site

- Every public page is prerendered HTML with a unique title, description, canonical URL, Open Graph/Twitter tags and JSON-LD (Organization, WebSite, WebApplication, Article, BreadcrumbList, FAQPage).
- robots.txt welcomes Google, Bing and AI crawlers; sitemap.xml, llms.txt, llms-full.txt and an RSS feed are generated from the content registries.
- The production server 301-redirects duplicate URLs (`/page/`, `/page/index.html`) to one clean URL, returns real 404s for unknown pages, and sends `X-Robots-Tag: noindex` on private report pages and the API.
- Our own audit scores the site 100 (SEO) / 99 (AI visibility — add your social profiles to `sameAs` for 100). Lighthouse: Accessibility, Best Practices and SEO 100; Performance 91–95 (mobile).

## Before launch

See [docs/launch-checklist.md](docs/launch-checklist.md).
