# Launch checklist

The site is built to rank, but code is only the foundation. These are the steps that decide whether it actually reaches page one and gets cited by AI assistants. They follow the same playbook as the courses this project is based on: fix the foundations, publish the best page for each search, then earn trust and mentions.

## 1. Before going live

- [ ] **Pick the name and buy the domain.** Short, brandable, ideally a `.com`. Then follow "Renaming the site" in the README.
- [ ] **Set `SITE_URL`** to the real `https://` domain and rebuild — canonicals, sitemap, schema and llms.txt all use it.
- [ ] **Add a real author** in `web/app/config/site.ts` (name + an about/bio page). Named people with real experience are a trust signal for Google and AI.
- [ ] **Add your social profiles** to `sameAs` (LinkedIn, X, YouTube…). This is the one notice our own audit still reports.
- [ ] **Review all 12 articles.** They were drafted from the course transcripts. Add your own experience, examples and screenshots — original insight is what makes content worth citing. Fact-check the items listed under "Facts to verify" below.
- [ ] **Review the privacy policy** with a legal professional.
- [ ] **Get API keys:** `ANTHROPIC_API_KEY` (AI fixes), `PAGESPEED_API_KEY` (free, from Google Cloud), Cloudflare Turnstile keys.
- [ ] **Run our own audit on the live site** and fix anything it finds. It should score 100.

## 2. Deployment (to plan next)

The app is one Node server (API + prerendered site) plus a SQLite file. Simple options:

- A small VPS (Hetzner, DigitalOcean) running `npm run build && npm start` behind Caddy or nginx for HTTPS. Set `TRUST_PROXY=true`.
- Put Cloudflare in front for caching and speed — **but turn off "Block AI bots"/managed robots.txt**, or you'll block the AI crawlers we want.
- For more traffic later: Postgres instead of SQLite, BullMQ + Redis instead of the in-process queue.

## 3. Week 1 after launch: get indexed

- [ ] Verify the domain in **Google Search Console** and submit `/sitemap.xml`.
- [ ] Verify in **Bing Webmaster Tools** and submit the sitemap. ChatGPT search leans on Bing's index, so this matters for AI visibility.
- [ ] Use IndexNow (Bing) or "Request indexing" (Google) for the homepage and top tools.
- [ ] Add privacy-friendly analytics (Plausible, Umami or GA4) with an "AI traffic" channel for referrals from chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com and claude.ai.
- [ ] Add a one-question "How did you hear about us?" prompt (e.g. after an audit) with an "AI assistant (ChatGPT, Perplexity…)" option — most AI influence never shows up in analytics.

## 4. Months 1–3: earn trust and mentions

Brand mentions on other sites are the strongest signal for AI visibility, and backlinks remain one of Google's strongest ranking signals.

- [ ] **Directories and listings:** Product Hunt launch, AlternativeTo, G2, Capterra, SaaSHub, "free SEO tools" directories.
- [ ] **Listicles:** search Google for "best free SEO audit tools", "free SEO checker", "AI SEO tools" and pitch the authors. Listicles are the most-cited page type in ChatGPT answers.
- [ ] **Journalist requests:** 15 minutes a day on Featured.com, Qwoted or Source of Sources answering SEO questions.
- [ ] **Reddit and forums:** genuinely answer questions in r/SEO, r/smallbusiness, r/Wordpress, r/shopify. Mention the tool only where it truly helps.
- [ ] **YouTube:** a short walkthrough targeting "free SEO audit" and "is my site blocked from ChatGPT". YouTube is one of the most-cited sources in AI answers.
- [ ] **Original data:** after a few hundred audits, `GET /api/stats` shows how often each problem appears. Publish "We audited N websites: the most common SEO and AI-visibility mistakes" — original statistics attract links and citations.

## 5. Ongoing

- [ ] Refresh each article every quarter with new facts and examples, and update its `updated` date in `web/app/content/articles.ts`. AI-cited content is markedly fresher than average.
- [ ] Add a new topic cluster each month (e.g. local SEO, e-commerce SEO, WordPress SEO), each with a supporting free tool if possible.
- [ ] Monthly: ask ChatGPT, Perplexity and Gemini "what's the best free SEO audit tool?" in a private window and note who appears. Target the sites they cite.

## Facts to verify in the drafted articles

The article drafts flagged these as coming from general knowledge rather than the course transcripts:

- Core Web Vitals thresholds (good / needs improvement / poor), the 75th-percentile rule, the 28-day field-data window, and INP replacing FID in March 2024.
- FAQ rich results being limited to government and health sites.
- The descriptions of PerplexityBot, Claude-SearchBot and Applebot-Extended, and that Google-Extended / Applebot-Extended are control tokens rather than separate crawlers.
- That llms.txt was proposed in 2024 by Jeremy Howard (Answer.AI).
- Cloudflare's current menu names for AI-bot blocking.
