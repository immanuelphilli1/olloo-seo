# What's left: gaps between the SEO courses and the app

This compares everything taught in the three transcripts with what the app does today, and lists what we haven't built yet. For each gap there's a **free way to build it** where one exists. Paid options are only mentioned when there's no free route.

**Sources checked:**
- `samoh-seo.md`: Ahrefs SEO course (keywords, search intent, on-page, link building, technical SEO)
- `samoh-aeo.md`: Ahrefs AI search (AEO) course
- `seo.md`: Surfer SEO + AI SEO course. **Note:** this transcript is incomplete. It jumps from chapter 2 to the AI chapter, so the middle chapters (keyword "sweet spot" framework, topic clusters, content blueprint, outreach) are missing. Those topics are covered below using the two Ahrefs courses, which teach the same material. If you can export the full Surfer transcript, I can check it again.

**Status:** ✅ Done · 🟡 Partly done · ❌ Not built
**Effort:** S = a few hours · M = a day or two · L = several days

---

## Summary

The app already covers the **technical, on-page and AI-crawler basics** well. The biggest gaps are in four areas that matter most for a premium product and for click rates:

1. **Click-through rate (CTR) tools.** We check title length but not what makes people click: rich results, favicon, site name, real pixel width, and pages with lots of impressions but few clicks.
2. **Content intelligence.** No competitor/content-gap analysis, no topic-coverage check for AI "query fan-out", no internal-link suggestions.
3. **Authority and mentions.** No help finding link and mention opportunities, no outreach templates, no backlink data.
4. **Monitoring.** No re-audit comparison, no measurement setup for AI traffic, no YouTube optimization.

Almost all of these can be built **for free**: with our own crawler, Google autocomplete (already in use), and free Google and Bing tools.

---

## 1. Keyword research and search intent

| # | What the courses teach | Status | Free solution | Effort |
|---|---|---|---|---|
| 1.1 | **Search volume and traffic potential**: pick keywords people actually search; traffic potential beats raw volume (Ahrefs SEO) | ❌ | **Google Search Console API** (free) shows a site's real searches, impressions and positions. Needs the user to sign in with Google once (OAuth). Google Keyword Planner is free but has no open API. Paid fallback: DataForSEO. | L |
| 1.2 | **Business potential score 0–3** for each keyword (Ahrefs SEO) | ❌ | Let users rate each idea 0–3 in the Keyword Generator and sort by it. Save in the browser. | S |
| 1.3 | **B.I.D. test** and ranking difficulty: links, website authority and topical authority of the top results (Ahrefs SEO + AEO) | 🟡 Explained in the tool, no data | "Check difficulty" panel: the user pastes the top 3 ranking URLs and we show each site's authority using the **Open PageRank API** (free key, domain-level score). Our crawler can also check topical focus (how much of their site is about the topic). | M |
| 1.4 | **3 C's of intent**: content type, format and angle of the top results (Ahrefs SEO) | 🟡 We label intent and best page type only | User pastes the top 3 URLs; our crawler detects their **type** (product, article, tool), **format** (list, how-to, comparison) and **angle** (year, "for beginners", price), and compares with the user's page. | M |
| 1.5 | **Competitor top pages**: find keywords through what competitors rank for (Ahrefs SEO) | ❌ | **Competitor topic gap**: crawl a competitor's site and sitemap with our existing crawler, then list topics they cover (titles, H1s) that the user's site doesn't. | M |
| 1.6 | **Keyword list of 10–15** with a "sweet spot" of volume, difficulty and relevance (Surfer) | 🟡 Generator + 5 keywords per audit | Saved keyword list in the browser across visits; allow up to 10–15 keywords per audit (very cheap to run). | S |
| 1.7 | **Topic clusters, money pages and funnel stages** (Surfer) | ❌ | Group generator keywords into clusters by shared core words, map each cluster to an existing pillar page, and mark "money pages" (pricing, product, service, contact) in the report. | M |
| 1.8 | **Update pages ranking on page 2–3** before writing new ones (Surfer) | ❌ | Needs ranking data: the Search Console connection from 1.1 finds pages at positions 8–20 ("striking distance"). | L |

## 2. Content and on-page

| # | What the courses teach | Status | Free solution | Effort |
|---|---|---|---|---|
| 2.1 | **Add internal links** from related pages to new and important pages (Ahrefs SEO) | 🟡 We flag weak linking but don't say where to add links | **Internal link suggestions**: from the crawl, find pages that mention a page's topic or keyword but don't link to it, and suggest the exact anchor text. | S–M |
| 2.2 | **Page-level content gap**: cover the subtopics the top 3 pages share (Ahrefs SEO) | ❌ | **Content brief**: user enters a keyword and the top 3 URLs; we crawl them, extract shared H2/H3 subtopics and questions, and list what the user's page is missing. AI summary optional. A strong premium feature. | M |
| 2.3 | **Readability around grade 6** (Hemingway) (Ahrefs SEO) | 🟡 Only flags pages above grade 11 | Show the grade for every page, target 6–8, and list the 5 hardest sentences to rewrite. | S |
| 2.4 | **Compress images** (ShortPixel) and use descriptive file names (Ahrefs SEO) | 🟡 We flag large images; the user does the work | Actually fix it: compress and convert flagged images to WebP with **sharp** (free open-source library), rename them descriptively, and include them in the fixes ZIP. | M |
| 2.5 | **Answer first, self-contained sections, specific names, short sentences** (Ahrefs AEO) | 🟡 Only with the paid AI key | Free rule-based version: check whether each H2 section opens with a short direct sentence, flags sections starting with "This/It/They" (not self-contained), measures sentence length and density of names and numbers. AI stays as an optional extra. | S–M |
| 2.6 | **Formats AI cites most**: listicles (43.8% of ChatGPT citations), comparisons, original data (Ahrefs AEO) | ❌ | **Format gap**: classify crawled pages by title and URL (best/top lists, "vs" comparisons, reviews, statistics pages) and flag missing formats. | S |
| 2.7 | **Refresh "sleeper pages"**: pages that lost traffic but still have links (Ahrefs AEO) | ❌ | Needs traffic and link data: Search Console (traffic decline, free) plus Bing Webmaster Tools (links, free). Without data: flag pages not updated in 6+ months that have the most internal links. | M–L |
| 2.8 | **Name your own frameworks after your brand** (Ahrefs AEO) | 🟡 Advice in the action plan only | Fine as advice; no build needed. | – |

## 3. Click-through rate (CTR): your priority

| # | What the courses teach | Status | Free solution | Effort |
|---|---|---|---|---|
| 3.1 | **Titles and descriptions are your ad in search results**; Google rewrites descriptions ~63% of the time (Ahrefs SEO) | 🟡 Length checks + rewrites | Find pages with **high impressions and low CTR** through the Search Console connection (1.1), then rewrite those titles first. The single most effective CTR feature. | L |
| 3.2 | **Schema powers rich results** (stars, prices, recipe info) (Ahrefs SEO) | 🟡 We check schema exists and parses | **Rich result eligibility check**: validate Google's required and recommended fields per type (Product price/rating, Article image/dates, Breadcrumb, Organization logo, Video) and say exactly what's missing. | S–M |
| 3.3 | **Content angle** in titles: year, "for beginners", deals (Ahrefs SEO, 3 C's) | ❌ | Title suggestions that add the winning angle (current year, number, audience, benefit) when it fits the keyword's intent. | S |
| 3.4 | Titles get cut off around 600 pixels (Ahrefs SEO) | 🟡 We count characters | Measure **pixel width** like Google does (character-width table) and preview the exact cut-off. | S |
| 3.5 | (Not in the courses, but Google shows these in results) **Favicon** and **site name** | ❌ | Check the favicon exists, is at least 48 px and is crawlable; check WebSite schema has the site name Google displays. | S |
| 3.6 | Freshness angle: visible dates (Ahrefs SEO + AEO) | 🟡 Stale content check only | Check articles show a visible "updated" date that matches `dateModified` in schema. | S |

## 4. Technical SEO

| # | What the courses teach | Status | Free solution | Effort |
|---|---|---|---|---|
| 4.1 | **Run scheduled audits** (weekly) to catch new problems (Ahrefs SEO) | ❌ | **Audit history and comparison**: when a site is re-audited, show what's fixed, what's new and how the score moved. Optional weekly email via a free email tier (e.g. Brevo or Resend, check current limits) or a server cron job. | M |
| 4.2 | **Redirect URLs that AI made up** (AI sends visitors to 404s 2.87× more than Google) (Ahrefs AEO) | 🟡 We check 404 handling | **404 redirect mapper**: user pastes 404 URLs from analytics; we match each to the closest real page from the crawl and generate the redirect rules. | S–M |
| 4.3 | Crawl the whole site (Ahrefs Webmaster Tools crawls up to 10,000 pages) (Ahrefs SEO) | 🟡 50 pages per audit | Raise the limit via `CRAWL_MAX_PAGES` (costs only server time); offer bigger crawls as a premium tier later. | S |
| 4.4 | **Indexing**: if pages aren't indexed, nothing else matters (Ahrefs SEO) | 🟡 We check things that block indexing | Confirm real index status with the **Search Console URL Inspection API** (free, needs the sign-in from 1.1). | L |

## 5. Links, authority and mentions

| # | What the courses teach | Status | Free solution | Effort |
|---|---|---|---|---|
| 5.1 | **Backlinks are a top ranking signal** (Ahrefs SEO) | ❌ No link data | Free sources: **Bing Webmaster Tools** (inbound links report and API for verified sites), Google Search Console Links report, **Open PageRank** for domain authority. | M |
| 5.2 | **Find link and mention prospects**: "write for us" pages, listicles that mention competitors, Reddit and Quora threads (Ahrefs SEO + AEO) | 🟡 Advice only | **Opportunity finder**: generate ready-to-click Google searches per keyword, e.g. `intitle:"write for us" keyword`, `intitle:best keyword -yourbrand`, `site:reddit.com keyword`, `site:quora.com keyword`, `"yourbrand" -site:yourdomain.com` (unlinked mentions). Zero cost, high value. | S |
| 5.3 | **Outreach emails**: subject, intro, qualification, pitch, conversation starter; no spam (Ahrefs SEO) | ❌ | **Outreach email templates** for guest posts, listicle inclusion and broken-link/stat updates, filled with the user's site and keyword. AI personalization optional. | S |
| 5.4 | **Journalist requests** (HARO, now Featured.com / Qwoted / Source of Sources) (Ahrefs SEO, Surfer) | 🟡 In the action plan | Add direct links and an answer template ("lead with your credentials, keep it short, reply fast") to the plan. | S |
| 5.5 | **Monitor mentions**: catch removed mentions and wrong information (Ahrefs AEO) | ❌ | Prefilled **Google Alerts** setup for the brand name (free), plus the unlinked-mention search from 5.2. | S |
| 5.6 | **Vet prospects**: relevance, authority, steady organic traffic (Ahrefs SEO) | ❌ | Open PageRank score plus a quick relevance check by crawling the prospect's homepage. | M |

## 6. AI search visibility (AEO)

| # | What the courses teach | Status | Free solution | Effort |
|---|---|---|---|---|
| 6.1 | **Query fan-out**: AI splits one question into many sub-questions, so cover the whole topic (Ahrefs AEO) | ❌ | **Topic coverage check**: for each target keyword, pull question variants from Google autocomplete (already built) and check which ones the best page answers in its headings and text. Show a coverage %. | M |
| 6.2 | **Track AI visibility**: mentions, citations, share of voice vs competitors (Ahrefs Brand Radar, Surfer AI tracker; both paid) | 🟡 Manual prompt kit | **AI visibility log**: users run the prompts, then record "mentioned / cited / competitors named" in a tracker saved in the browser, with a chart over time. Fully automatic tracking needs paid AI APIs. | S–M |
| 6.3 | **Brand gap analysis**: visibility, narrative, topic, format, web-mentions and demand gaps (Ahrefs AEO) | ❌ | Free pieces: **demand gap** via autocomplete on the brand name (what people search about you); **narrative** prompts ("What is X known for?", "X pricing", "X reviews") added to the prompt kit; **format gap** from 2.6; **web mentions** from 5.2. | M |
| 6.4 | **YouTube**: title has the keyword, real description with keyword early, timestamps/chapters, say the keyword, match the format; target "search hits" (Ahrefs AEO) | ❌ | **YouTube video checker** using the **YouTube Data API** (free daily quota with a key): paste a video URL and check title, description, chapters and tags. Plus YouTube topic ideas from YouTube's autocomplete (same free endpoint, YouTube mode). | M |
| 6.5 | **Fill information gaps with an official FAQ** so AI doesn't repeat wrong facts (Ahrefs AEO) | 🟡 FAQ schema only with the AI key | Free template: an FAQ page outline built from autocomplete questions about the brand (6.3), ready for the owner to answer. | S |
| 6.6 | **Freshness**: 76% of pages ChatGPT cites were updated in the last 30 days (Ahrefs AEO) | 🟡 We flag pages older than 12 months | Show the age of each key page and suggest a refresh schedule (top pages monthly or quarterly). | S |
| 6.7 | **Measure AI traffic**: GA4 AI channel with a regex, AI bot analytics, "How did you hear about us?" (Ahrefs AEO) | ❌ In reports | **Measurement setup** section in every report: the copy-paste GA4 regex and steps, a survey-question template, and how to see AI crawler visits in Cloudflare. Free. | S |

## 7. Search result features (Surfer)

| # | What the courses teach | Status | Free solution | Effort |
|---|---|---|---|---|
| 7.1 | Results now include **AI Overviews, People Also Ask, videos, local map pack, knowledge panels** | ❌ | We can't read Google's results pages directly (against Google's terms). Free partial coverage: question research through autocomplete (6.1), video readiness (6.4), and **local SEO checks** for local keywords: LocalBusiness schema, name/address/phone consistent across pages, Google Business Profile reminder. | M |

## 8. Our own site (what the courses say we should do for ourselves)

Most of these are already in `to-do.md` (Search Console, Bing, YouTube, Reddit, listicles, original data, "How did you hear about us?", AI traffic channel, real author). Two content items aren't:

| # | What the courses teach | Status | Free solution | Effort |
|---|---|---|---|---|
| 8.1 | **Write your own listicles and comparisons**: they're the most-cited page type, and you can write them yourself (Surfer, Ahrefs AEO) | ❌ | Add guides like "Best free SEO audit tools (2026)" (an honest comparison that includes us) and "[Competitor] alternatives". | M |
| 8.2 | **Readability around grade 6** for our own guides (Ahrefs SEO) | ❓ Not measured | Run our own audit's grade check on all 12 guides and simplify the hardest sections. | S |

---

## Recommended premium roadmap (all free to run)

Ordered by impact on rankings and click rates versus effort:

| Order | Feature | Helps with | Effort |
|---|---|---|---|
| 1 | **CTR pack**: rich result eligibility, favicon and site-name checks, pixel-width title preview, angle suggestions (3.2–3.6) | Click rates | S–M |
| 2 | **Internal link suggestions** (2.1) | Rankings | S–M |
| 3 | **Opportunity finder + outreach templates** (5.2–5.5) | Authority, AI mentions | S |
| 4 | **Measurement setup** in every report (6.7) | Proving results | S |
| 5 | **Topic coverage / fan-out check** (6.1) | AI citations, rankings | M |
| 6 | **Content brief from the top 3 results** (2.2, 1.4) | Rankings | M |
| 7 | **Competitor topic gap** (1.5) | Keyword ideas | M |
| 8 | **Image compression to WebP in the ZIP** (2.4) | Speed, "we fix it" promise | M |
| 9 | **Audit history and comparison** (4.1) | Retention, monitoring | M |
| 10 | **404 redirect mapper** (4.2) | AI traffic recovery | S–M |
| 11 | **YouTube video checker** (6.4) | AI citations, video results | M |
| 12 | **Google Search Console connection** (1.1, 1.8, 3.1, 4.4) | Biggest unlock: real searches, low-CTR pages, page-2 opportunities, index status | L |

Items 1–4 are small and would noticeably raise the "premium" feel quickly. Item 12 is the most powerful but needs Google sign-in (OAuth) and a verified Google Cloud project.

**Free services these rely on** (check current limits before building): Google Search Console API, YouTube Data API, Open PageRank API, Bing Webmaster Tools, Google Alerts, the `sharp` image library, and Google autocomplete (unofficial, already in use and cached).
