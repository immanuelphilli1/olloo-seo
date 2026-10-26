import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import type { Route } from "./+types/learn-index";
import { PageHero } from "~/components/ui";
import { site } from "~/config/site";
import { articles, clusters } from "~/content/articles";
import { seo } from "~/seo/meta";

export function meta({}: Route.MetaArgs) {
  return seo({
    title: `Learn SEO and AI Search: Free Guides | ${site.name}`,
    description: "Free, practical guides to SEO and AI search: keyword research, search intent, technical SEO, schema, Core Web Vitals and how to rank in ChatGPT.",
    path: "/learn",
  });
}

export default function LearnIndex() {
  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Guides", path: "/learn" },
        ]}
        eyebrow={`${articles.length} free guides`}
        title="Learn SEO and AI search"
        intro={
          <p>
            Plain-English guides to getting found in Google, ChatGPT, Perplexity and AI Overviews. Each guide explains one topic, starts with the answer, and links to
            a free tool so you can check your own site.
          </p>
        }
      />
      <div className="container-page">
        {(Object.keys(clusters) as (keyof typeof clusters)[]).map((key) => (
          <section key={key} className="mt-16" aria-labelledby={`cluster-${key}`}>
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-neutral-200 pb-5">
              <div>
                <h2 id={`cluster-${key}`} className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  {clusters[key].name}
                </h2>
                <p className="mt-1.5 text-neutral-600">{clusters[key].description}</p>
              </div>
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">{articles.filter((a) => a.cluster === key).length} guides</span>
            </div>
            <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {articles
                .filter((a) => a.cluster === key)
                .map((a) => (
                  <li key={a.slug}>
                    <Link to={`/learn/${a.slug}`} className="card card-hover group flex h-full flex-col p-6">
                      <p className="font-mono text-xs uppercase tracking-wider text-neutral-500">{a.minutes} min read</p>
                      <h3 className="mt-2 text-lg font-semibold leading-snug text-ink group-hover:text-brand-600">{a.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">{a.description}</p>
                      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                        Read the guide <ArrowRight size={15} aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
