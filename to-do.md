# To-do: what's left before and after launch

Everything in the app is built and tested locally. These are the remaining services, accounts and decisions, in the order to do them. Tick them off as you go.

Most items are switched on by adding a value to the `.env` file (copy `.env.example` to `.env` first), then restarting the app. No code changes needed unless noted.

---

## 1. Before launch

### Brand
- [x] **Choose the name:** olloo SEO (chosen 26 Oct 2026).
- [ ] **Choose the web address.** Options: a subdomain of your olloo domain (e.g. `seo.yourolloodomain.com`, free if you own the domain) or a separate domain (about $10–15/year for a `.com`). A subdomain is simplest to set up; a subfolder (`/seo`) shares more authority but needs both apps behind one server.
- [ ] **Check the name** "olloo SEO" with the trademark office (USPTO / UKIPO) and grab matching social handles.
- [x] **Rename the site** to olloo SEO (done 26 Oct 2026).
- [ ] **Replace the placeholder email** `hello@example.com` in `web/app/config/site.ts` with a real inbox.
- [ ] **Add a real author** (`author` in `web/app/config/site.ts`): a real person's name and a short bio on the About page. Named experts are a trust signal for Google and AI.
- [ ] **Create social profiles** (LinkedIn, X, YouTube) with the same name, and add their URLs to `sameAs` in `web/app/config/site.ts`. This is the last point our own audit is missing (99 to 100).

### Content and legal
- [ ] **Review the 12 guides** in `web/app/content/learn/`. Add your own experience, examples and screenshots.
- [ ] **Fact-check** the items listed under "Facts to verify" in `docs/launch-checklist.md` (Core Web Vitals thresholds, AI crawler descriptions, llms.txt origin, Cloudflare menu names).
- [ ] **Have the privacy policy reviewed** by a legal professional (`web/app/routes/privacy.tsx`).

### API keys
- [ ] **Google PageSpeed Insights key** (free). Without it, speed checks are often skipped.
  - Get it: Google Cloud Console > APIs & Services > enable "PageSpeed Insights API" > Credentials > Create API key.
  - Turn on: `PAGESPEED_API_KEY=...` in `.env`.
- [ ] **Anthropic API key** (optional, paid per use, capped). Turns on AI-written titles, descriptions, alt text, content review and personalized action plans.
  - Get it: console.anthropic.com > API keys (needs billing set up).
  - Turn on: `ANTHROPIC_API_KEY=...` in `.env`. Set the daily spend cap with `AI_DAILY_BUDGET_USD` (default $2/day, so at most about $60/month).
- [ ] **Set a secret salt** for hashing visitor IPs: `IP_HASH_SALT=` any long random text in `.env`.

### Optional before launch
- [x] **Performance pass** (done 23 Oct 2026): critical CSS inlined, fonts lightened, React loads after the page. Lighthouse performance went from 90–94 to 96–99.
- [x] **Git repository** (done 26 Oct 2026): pushed to github.com/immanuelphilli1/olloo-seo, branch `main`.

---

## 2. Going live (deployment)

- [ ] **Rent a server (VPS)** with at least 2 GB RAM, e.g. Hetzner or DigitalOcean. Cost: about $5–12/month.
- [ ] **Install Node.js 22+** on it, copy the project, run `npm install`, then `npx playwright install --with-deps chromium` (needed for the "content only appears with JavaScript" check).
- [ ] **Production `.env`** on the server:
  - `SITE_URL=https://yourdomain.com`
  - `SITE_NAME=YourName`
  - `TRUST_PROXY=true`
  - `ALLOW_PRIVATE_TARGETS=false` (must stay false)
  - your API keys and `IP_HASH_SALT`
- [ ] **Build and start:** `npm run build` then `npm start` (one server on port 8787 serves the site and the API).
- [ ] **Keep it running** after crashes and reboots with pm2 or systemd.
- [ ] **HTTPS** with Caddy or nginx in front of the app, pointing your domain at the server.
- [ ] **Cloudflare (free plan)** in front for speed and caching. Important: turn OFF "Block AI bots" / managed robots.txt in Cloudflare, or it will block the AI crawlers we want.
- [ ] **Cloudflare Turnstile** (free captcha, stops bots using up your audits and AI budget).
  - Get it: Cloudflare dashboard > Turnstile > Add site (your domain).
  - Turn on: `TURNSTILE_SITE_KEY=...` and `TURNSTILE_SECRET_KEY=...` in `.env`.
- [ ] **Back up the database** (`server/data.sqlite`) daily, e.g. a cron job copying it off the server.
- [ ] **Run our own audit on the live site** and fix anything it reports. It should score 100.

---

## 3. First week after launch

- [ ] **Google Search Console** (free): verify the domain and submit `https://yourdomain.com/sitemap.xml`.
- [ ] **Bing Webmaster Tools** (free): verify and submit the sitemap. ChatGPT search leans on Bing's index, so this matters for AI visibility.
- [ ] **Request indexing** for the homepage and the top tools (Search Console "URL inspection", and IndexNow in Bing).
- [ ] **Analytics** (Plausible, Umami or GA4) with an "AI traffic" channel matching chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com and claude.ai.
- [ ] **"How did you hear about us?"** question after an audit, with an "AI assistant (ChatGPT, Perplexity…)" option. Most AI influence never shows up in analytics. *(Needs a small code change: ask Claude.)*

---

## 4. Months 1–3: earn trust and mentions

- [ ] **Directories and listings:** Product Hunt launch, AlternativeTo, G2, Capterra, SaaSHub, "free SEO tools" directories.
- [ ] **Listicles:** search Google for "best free SEO audit tools", "free SEO checker", "AI SEO tools" and pitch the authors to include you.
- [ ] **Journalist requests:** 15 minutes a day on Featured.com, Qwoted or Source of Sources answering SEO questions.
- [ ] **Reddit and forums:** genuinely helpful answers in r/SEO, r/smallbusiness, r/Wordpress, r/shopify. Mention the tool only where it truly helps.
- [ ] **YouTube:** a short walkthrough video targeting "free SEO audit" and "is my site blocked from ChatGPT".
- [ ] **Original research post:** after a few hundred audits, `https://yourdomain.com/api/stats` shows how often each problem appears. Publish "We audited N websites: the most common SEO and AI-visibility mistakes".

## 5. Ongoing

- [ ] **Monthly:** ask ChatGPT, Perplexity and Gemini "what's the best free SEO audit tool?" in a private window. Note who appears and target the sites they cite.
- [ ] **Quarterly:** refresh each guide with new facts and examples, and update its `updated` date in `web/app/content/articles.ts`.
- [ ] **Monthly:** add a new topic cluster of guides (e.g. local SEO, e-commerce SEO, WordPress SEO), ideally with a matching free tool.
- [ ] **Watch the Google autocomplete limit** for the Keyword Generator (`AUTOCOMPLETE_DAILY_LIMIT`, default 2000 requests/day). If Google starts blocking it, the tool falls back to built-in ideas automatically.

---

## 6. Later features (not built, optional)

| Feature | What it adds | Cost |
|---|---|---|
| Paid keyword data (e.g. DataForSEO) | Search volumes, difficulty, competitor keywords | Pay per lookup |
| User accounts | Saved projects, history | Free (build work) |
| Google Search Console connection | Users' real searches, impressions and rankings | Free, needs accounts |
| Scheduled re-audits and email alerts | Weekly monitoring of a site | Email service (small) |
| WordPress plugin | One-click apply of fixes | Free (build work) |
| AI visibility tracking | How often AI assistants mention a brand | Paid AI API calls |
| Scaling up | Postgres instead of SQLite, Redis job queue for many simultaneous audits | Hosting |
| Automated browser tests and Lighthouse CI | Catch regressions automatically before deploys | Free (build work) |

More detail on launch and growth steps: `docs/launch-checklist.md`. How to run and rename the app: `README.md`.
