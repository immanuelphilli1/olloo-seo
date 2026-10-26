import { Link } from "react-router";
import { ArrowRight, ArrowUpRight, Check, FileSearch, Wrench, Zap } from "lucide-react";
import type { Route } from "./+types/home";
import { AuditForm } from "~/components/AuditForm";
import { JsonLd } from "~/components/JsonLd";
import { Faq } from "~/components/ui";
import { FixShowcase } from "~/components/home/FixShowcase";
import { ReportPreview } from "~/components/home/ReportPreview";
import { site } from "~/config/site";
import { CATEGORY_INFO } from "~/lib/categories";
import { articles, clusters } from "~/content/articles";
import { tools } from "~/content/tools";
import { seo } from "~/seo/meta";
import { webAppSchema } from "~/seo/jsonld";

const title = `Free SEO Audit Tool for Google & AI Search | ${site.name}`;
const description = `Free SEO audit: check your website for 50+ issues that stop it ranking in Google, ChatGPT and Perplexity, and get the exact fixes. No signup.`;

export function meta({}: Route.MetaArgs) {
  return seo({ title, description, path: "/" });
}

// Plain-English definitions live in lib/categories.ts (shared with the report).
const categories = [CATEGORY_INFO.technical, CATEGORY_INFO.onpage, CATEGORY_INFO.content, CATEGORY_INFO.aeo, CATEGORY_INFO.performance];

const engines = ["Google", "Bing", "ChatGPT", "Perplexity", "Gemini", "Claude", "AI Overviews"];

const facts = [
  { value: "50+", label: "SEO and AI-visibility checks" },
  { value: "50", label: "pages crawled per audit" },
  { value: "~2 min", label: "from URL to full report" },
  { value: "6", label: "platforms with step-by-step fixes" },
];

const aiStats = [
  { value: "58%", text: "fewer clicks to the #1 Google result when an AI Overview appears.", source: "Ahrefs" },
  { value: "23×", text: "higher conversion rate from AI search visitors than from organic search.", source: "Ahrefs" },
  { value: "900M", text: "people use ChatGPT every week, many of them to ask for recommendations.", source: "Ahrefs" },
];

const steps = [
  { icon: FileSearch, title: "1. We crawl your site", text: "Our crawler reads up to 50 pages like Googlebot does, then tests your robots.txt, sitemap, redirects, links and images." },
  { icon: Zap, title: "2. We run 50+ checks", text: "Every page is checked for technical, on-page, content, AI-visibility and speed problems, ranked by how much they hurt you." },
  { icon: Wrench, title: "3. You get the fixes", text: "Rewritten titles and descriptions, a corrected robots.txt, a sitemap, schema code and redirect rules, with steps for your platform." },
];

const faqs = [
  {
    q: "Is this SEO audit really free?",
    a: `Yes. ${site.name} is free to use with no signup and no credit card. You can run up to 5 full audits per day, and every free tool on the site is free too.`,
  },
  {
    q: "What does an SEO audit check?",
    a: "An SEO audit checks whether search engines can crawl and index your pages, whether each page is optimized for the searches you want, and whether anything slows your site down. Our audit also checks AI search visibility: whether ChatGPT, Perplexity and Claude can read and cite your site.",
  },
  {
    q: "Do you change anything on my website?",
    a: "No. We only read your public pages, the same way Google does. You get a report with ready-to-use fixes, rewritten titles, a corrected robots.txt, a sitemap, schema code, plus step-by-step instructions for your platform.",
  },
  {
    q: "How long does an audit take?",
    a: "Most audits finish in 1–3 minutes. We crawl up to 50 pages, check links and images, test your site without JavaScript, and measure Core Web Vitals with Google PageSpeed Insights.",
  },
  {
    q: "Can this help my website show up in ChatGPT?",
    a: "Yes. AI assistants mostly cite pages that already rank in search and that their crawlers can read. The audit finds the blockers AI crawlers blocked in robots.txt, content that only loads with JavaScript, missing schema, and gives you an action plan to earn mentions on the sites AI cites.",
  },
  {
    q: `What is the ${site.brand} AI Visibility Score?`,
    a: `The ${site.brand} AI Visibility Score rates from 0 to 100 how easy it is for AI assistants to find, read, trust and quote your website. It combines AI crawler access, JavaScript rendering, structured data, content structure and technical health.`,
  },
  {
    q: "What do Technical SEO, On-page SEO, Content, AI visibility and Performance mean?",
    a: "They're the five things that decide whether people find you. Technical SEO: can search engines find and read your site? On-page SEO: does each page clearly say what it's about? Content: is your writing helpful and easy to read? AI visibility: can ChatGPT and other AI assistants find and recommend you? Performance: how fast does your site load, especially on phones?",
  },
  {
    q: "Which website platforms do you support?",
    a: "Any public website. We detect WordPress, Shopify, Wix, Squarespace and Webflow automatically and show where to make each fix in that platform. For custom sites you get the code to paste.",
  },
  {
    q: "How often should I run an SEO audit?",
    a: "Run one now, fix the critical issues, then audit again after each batch of fixes. After that, a monthly audit catches new problems like broken links, accidental noindex tags or blocked crawlers before they cost you traffic.",
  },
];

/** Small sentence-case section label with an orange dot. */
function Label({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`flex items-center gap-2 text-sm font-medium ${dark ? "text-neutral-400" : "text-neutral-600"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
      {children}
    </p>
  );
}

const h2 = "text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-paper">
        <div className="container-page pt-16 text-center sm:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full  border-neutral-200 px-3.5 py-1.5 text-xs font-medium text-neutral-600 ">
            
            Free · No signup · Google + ChatGPT + Perplexity
          </p>
          <h1 className="mx-auto mt-7 max-w-4xl text-[2.9rem] font-semibold leading-[1.02] tracking-[-0.04em] text-ink sm:text-7xl lg:text-[5.4rem]">
            Free SEO audit for Google and <span className="accent whitespace-nowrap pr-1">AI search</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-neutral-600 sm:text-xl" id="audit">
            Enter your website. {site.name} checks 50+ issues that stop you ranking in Google and getting recommended by AI assistants, then writes the exact fixes for your
            site.
          </p>
          <div className="mx-auto mt-10 max-w-2xl text-left">
            <AuditForm id="hero" tone="light" />
          </div>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-neutral-600">
            {["Crawls up to 50 pages", "Results in about 2 minutes", "Fix instructions for WordPress, Shopify, Wix and more"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check size={15} className="text-brand-600" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="container-page mt-16 sm:mt-20">
          <ReportPreview />
        </div>

        <div className="mt-20 border-y border-neutral-200 bg-white">
          <div className="container-page flex flex-col items-center gap-3 py-6 sm:flex-row sm:gap-8">
            <p className="shrink-0 text-sm text-neutral-500">Checks your visibility in</p>
            <div className="marquee w-full overflow-hidden">
              <ul className="marquee-track">
                {[...engines, ...engines].map((e, i) => (
                  <li key={`${e}-${i}`} aria-hidden={i >= engines.length || undefined} className="mx-7 whitespace-nowrap text-lg font-semibold tracking-tight text-neutral-500">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Facts */}
      <section className="bg-white">
        <dl className="container-page grid grid-cols-2 lg:grid-cols-4">
          {facts.map((f, i) => (
            <div key={f.label} className={`py-10 pl-6 ${i % 2 === 1 ? "border-l" : ""} border-neutral-200 lg:border-l ${i === 0 ? "lg:border-l-0 lg:pl-0" : ""}`}>
              <dt className="sr-only">{f.label}</dt>
              <dd className="text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">{f.value}</dd>
              <dd className="mt-2 text-sm text-neutral-500">{f.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* What we check */}
      <section className="border-t border-neutral-200 bg-white py-24 sm:py-28" aria-labelledby="checks-heading">
        <div className="container-page grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Label>What we check</Label>
            <h2 id="checks-heading" className={`${h2} mt-4 text-ink`}>
              50+ checks across the five things that decide your <span className="accent">rankings</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-neutral-600">
              Search engines and AI assistants need to find your pages, understand them, trust them and load them fast. The audit checks each step and tells you exactly
              what's broken.
            </p>
            <div className="mt-10 rounded-2xl bg-ink p-7 text-white">
              <h3 className="text-lg font-semibold">Plus a 30-day action plan</h3>
              <p className="mt-2 leading-relaxed text-neutral-400">
                Every report ends with a week-by-week plan and the questions to test in ChatGPT, so you know what to do next.
              </p>
              <Link to="/#audit" className="btn-primary mt-6 px-4 py-2.5 text-sm">
                Get my plan <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </div>
          <ol className="divide-y divide-neutral-200 border-y border-neutral-200">
            {categories.map((c, i) => (
              <li key={c.name} className="grid grid-cols-[3.25rem_1fr] gap-x-4 py-8 sm:grid-cols-[4.5rem_1fr]">
                <span className="accent text-4xl leading-none sm:text-5xl" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-ink">{c.name}</h3>
                  <p className="mt-1 font-medium text-neutral-500">{c.question}</p>
                  <p className="mt-3 leading-relaxed text-neutral-700">{c.plain}</p>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                    <span className="font-medium text-neutral-700">What we check: </span>
                    {c.covers}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-neutral-200 bg-paper py-24 sm:py-28" aria-labelledby="how-heading">
        <div className="container-page">
          <Label>How it works</Label>
          <h2 id="how-heading" className={`${h2} mt-4 text-ink`}>
            How the audit <span className="accent">works</span>
          </h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step) => (
              <li key={step.title} className="border-t-2 border-ink pt-6">
                <step.icon size={22} className="text-brand-600" aria-hidden />
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-neutral-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Fixes written for you */}
      <section className="bg-ink py-24 text-white sm:py-28" aria-labelledby="fixes-heading">
        <div className="container-page">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <div>
              <Label dark>Fixes written for you</Label>
              <h2 id="fixes-heading" className={`${h2} mt-4`}>
                We don't just list <span className="accent text-brand-400!">problems</span>
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-neutral-400">
              Each issue comes with the fix: new title tags, meta descriptions, alt text, robots.txt, sitemap.xml, JSON-LD schema and redirect rules you can copy or
              download.
            </p>
          </div>
          <div className="mt-12">
            <FixShowcase />
          </div>
        </div>
      </section>

      {/* Why AI search matters */}
      <section className="bg-white py-24 sm:py-28" aria-labelledby="ai-heading">
        <div className="container-page grid items-start gap-14 lg:grid-cols-[1fr_1fr]">
          <div>
            <Label>Why AI search matters</Label>
            <h2 id="ai-heading" className={`${h2} mt-4 text-ink`}>
              SEO is the foundation of <span className="accent">AI search</span>
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-neutral-600">
              <p>
                AI assistants like ChatGPT and Perplexity answer questions by searching the web and citing pages. Pages that rank well in Google and Bing have a head
                start, but only if AI crawlers are allowed in and can read the content.
              </p>
              <p>
                According to Ahrefs, an AI Overview at the top of Google cuts clicks to the #1 result by 58%. Their AI visitors also converted 23 times better than
                regular search visitors. Being the brand AI recommends is now as important as ranking.
              </p>
            </div>
            <Link to="/learn/how-to-rank-in-chatgpt" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-ink underline decoration-brand-500 decoration-2 underline-offset-4 hover:text-brand-600">
              Learn how to rank in ChatGPT and AI search <ArrowRight size={17} aria-hidden />
            </Link>
          </div>
          <div>
            <dl className="divide-y divide-neutral-200 border-y border-neutral-200">
              {aiStats.map((s) => (
                <div key={s.value} className="grid grid-cols-[7.5rem_1fr] items-center gap-4 py-6 sm:grid-cols-[9rem_1fr]">
                  <dt className="accent text-5xl leading-none sm:text-6xl">{s.value}</dt>
                  <dd className="leading-relaxed text-neutral-600">
                    {s.text} <span className="text-sm text-neutral-500">({s.source})</span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 p-6">
                <p className="text-sm font-medium text-neutral-500">The {site.brand} SEO Score</p>
                <p className="mt-2 text-5xl font-semibold tracking-[-0.03em] text-ink">0–100</p>
                <p className="mt-3 text-neutral-600">How well your site is set up to rank in Google, weighted by how much each issue hurts and how many pages it affects.</p>
              </div>
              <div className="rounded-2xl bg-ink p-6 text-white">
                <p className="text-sm font-medium text-neutral-400">The {site.brand} AI Visibility Score</p>
                <p className="mt-2 text-5xl font-semibold tracking-[-0.03em] text-brand-500">0–100</p>
                <p className="mt-3 text-neutral-400">How easily ChatGPT, Perplexity, Claude and Google AI can find, read, trust and quote your site.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free tools */}
      <section className="border-y border-neutral-200 bg-paper py-24 sm:py-28" aria-labelledby="tools-heading">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Label>Free tools</Label>
              <h2 id="tools-heading" className={`${h2} mt-4 text-ink`}>
                Free SEO <span className="accent">tools</span>
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-neutral-600">Need to check one thing quickly? Each tool runs in seconds.</p>
            </div>
            <Link to="/tools" className="inline-flex items-center gap-1 font-semibold text-ink hover:text-brand-600">
              All tools <ArrowRight size={17} aria-hidden />
            </Link>
          </div>
          <ul className="mt-12 grid border-t border-neutral-200 md:grid-cols-2 md:gap-x-12">
            {tools.map((t) => (
              <li key={t.slug} className="border-b border-neutral-200">
                <Link to={`/tools/${t.slug}`} className="group flex items-center justify-between gap-6 py-5">
                  <span>
                    <span className="block text-lg font-semibold tracking-tight text-ink group-hover:text-brand-600">{t.name}</span>
                    <span className="mt-0.5 block text-neutral-600">{t.blurb}</span>
                  </span>
                  <ArrowUpRight
                    size={20}
                    className="shrink-0 text-neutral-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Learn */}
      <section className="bg-white py-24 sm:py-28" aria-labelledby="learn-heading">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Label>Guides</Label>
              <h2 id="learn-heading" className={`${h2} mt-4 text-ink`}>
                Learn SEO and <span className="accent">AI search</span>
              </h2>
            </div>
            <Link to="/learn" className="inline-flex items-center gap-1 font-semibold text-ink hover:text-brand-600">
              All guides <ArrowRight size={17} aria-hidden />
            </Link>
          </div>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {articles
              .filter((a) => ["seo-checklist", "how-to-rank-in-chatgpt", "what-is-aeo"].includes(a.slug))
              .map((a) => (
                <Link key={a.slug} to={`/learn/${a.slug}`} className="group flex flex-col border-t-2 border-ink pt-6">
                  <p className="text-sm text-neutral-500">
                    {clusters[a.cluster].name} · {a.minutes} min read
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-ink group-hover:text-brand-600">{a.title}</h3>
                  <p className="mt-3 flex-1 leading-relaxed text-neutral-600">{a.description}</p>
                  <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-ink group-hover:text-brand-600">
                    Read the guide <ArrowRight size={15} aria-hidden />
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-neutral-200 bg-paper py-24">
        <div className="container-page">
          <Faq
            faqs={faqs}
            heading="Questions, answered"
            split
            intro={
              <>
                Still unsure? Read{" "}
                <Link to="/about" className="font-medium text-ink underline decoration-brand-500 underline-offset-4">
                  how the audit works
                </Link>{" "}
                or{" "}
                <a href={`mailto:${site.email}`} className="font-medium text-ink underline decoration-brand-500 underline-offset-4">
                  email us
                </a>
                .
              </>
            }
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-paper pb-4">
        <div className="container-page">
          <div className="rounded-3xl bg-ink px-6 py-20 text-center text-white sm:px-12">
            <h2 className={h2}>
              See what's holding your site <span className="accent text-brand-400!">back</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-400">Free, no signup. Get your SEO Score, AI Visibility Score and every fix in about two minutes.</p>
            <div className="mx-auto mt-10 max-w-2xl text-left">
              <AuditForm id="footer-cta" size="md" />
            </div>
          </div>
        </div>
      </section>

      <JsonLd data={webAppSchema({ name: `${site.name} Audit`, description, path: "/" })} />
    </>
  );
}
