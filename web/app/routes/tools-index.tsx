import { Link } from "react-router";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import type { Route } from "./+types/tools-index";
import { ToolIcon } from "~/components/ToolIcon";
import { PageHero } from "~/components/ui";
import { site } from "~/config/site";
import { tools } from "~/content/tools";
import { seo } from "~/seo/meta";

export function meta({}: Route.MetaArgs) {
  return seo({
    title: `Free SEO Tools: Checkers and Generators | ${site.name}`,
    description: "Free SEO tools: AI crawler checker, robots.txt checker and generator, schema markup generator, llms.txt generator, meta tag, redirect and sitemap checkers.",
    path: "/tools",
  });
}

const link = "font-medium text-brand-600 underline decoration-brand-300 underline-offset-4 hover:text-brand-700";

export default function ToolsIndex() {
  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Free tools", path: "/tools" },
        ]}
        eyebrow={`${tools.length + 1} free tools · no signup`}
        title="Free SEO tools"
        intro={
          <p>
            Quick, free tools for checking one thing at a time. No signup. For a full check of your whole site, run the{" "}
            <Link to="/" className="font-medium text-white underline decoration-brand-500 underline-offset-4">
              free SEO audit
            </Link>
            .
          </p>
        }
      />
      <div className="container-page">
        <ul className="relative z-10 -mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <Link to="/" className="card group relative flex h-full flex-col overflow-hidden border-brand-500 bg-brand-500 p-6 transition hover:-translate-y-0.5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-brand-500">
                <Sparkles size={19} aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-ink">Free SEO Audit</h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink/80">50+ SEO and AI-visibility checks across your whole site, with the fixes written for you.</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                Start an audit <ArrowRight size={15} aria-hidden />
              </span>
            </Link>
          </li>
          {tools.map((t) => (
            <li key={t.slug}>
              <Link to={`/tools/${t.slug}`} className="card card-hover group relative flex h-full flex-col p-6">
                <ArrowUpRight size={18} className="absolute right-5 top-5 text-neutral-300 transition group-hover:text-brand-500" aria-hidden />
                <ToolIcon icon={t.icon} />
                <h2 className="mt-4 text-lg font-semibold text-ink group-hover:text-brand-600">{t.name}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{t.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-24 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="which-tool">
          <div>
            <p className="eyebrow">Where to start</p>
            <h2 id="which-tool" className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Which tool do you need?
            </h2>
          </div>
          <div className="space-y-5 text-[1.05rem] leading-[1.8] text-neutral-700">
            <p>
              <strong className="text-ink">Not showing up in ChatGPT or Perplexity?</strong> Start with the{" "}
              <Link to="/tools/ai-crawler-checker" className={link}>
                AI crawler checker
              </Link>
              . If an AI crawler is blocked, that assistant can't read or cite your pages. Fix it with the{" "}
              <Link to="/tools/robots-txt-generator" className={link}>
                robots.txt generator
              </Link>
              .
            </p>
            <p>
              <strong className="text-ink">Pages missing from Google?</strong> Test the page in the{" "}
              <Link to="/tools/robots-txt-checker" className={link}>
                robots.txt checker
              </Link>
              , then make sure it's listed in your sitemap with the{" "}
              <Link to="/tools/sitemap-checker" className={link}>
                sitemap checker
              </Link>
              .
            </p>
            <p>
              <strong className="text-ink">Ranking but not getting clicks?</strong> Preview your search snippet with the{" "}
              <Link to="/tools/meta-tag-checker" className={link}>
                meta tag checker
              </Link>{" "}
              and add rich-result markup with the{" "}
              <Link to="/tools/schema-markup-generator" className={link}>
                schema markup generator
              </Link>
              .
            </p>
            <p>
              <strong className="text-ink">Moved or renamed pages?</strong> Trace them with the{" "}
              <Link to="/tools/redirect-checker" className={link}>
                redirect checker
              </Link>{" "}
              to catch chains and temporary redirects that leak ranking signals.
            </p>
            <p>
              Not sure where the problem is? The{" "}
              <Link to="/" className={link}>
                free SEO audit
              </Link>{" "}
              runs all of these checks and 40 more across up to 50 pages, then ranks the fixes by impact.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
