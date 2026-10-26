import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useMatches } from "react-router";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import type { Route } from "./+types/learn-article";
import { AuditForm } from "~/components/AuditForm";
import { JsonLd } from "~/components/JsonLd";
import { PageHero } from "~/components/ui";
import { LogoMark } from "~/components/Layout";
import { site } from "~/config/site";
import { articles, articlesBySlug, clusters } from "~/content/articles";
import { articleSchema } from "~/seo/jsonld";
import { seo } from "~/seo/meta";

const slugFrom = (pathname: string) => pathname.replace(/\/$/, "").split("/").pop() ?? "";

export function meta({ location }: Route.MetaArgs) {
  const article = articlesBySlug.get(slugFrom(location.pathname));
  if (!article) return [];
  return seo({
    title: article.title.length + site.name.length + 3 <= 60 ? `${article.title} | ${site.name}` : article.title,
    description: article.description,
    path: `/learn/${article.slug}`,
    type: "article",
    publishedTime: article.published,
    modifiedTime: article.updated,
  });
}

const formatDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

/** Thin orange bar at the top of the viewport showing reading progress. */
function ReadingProgress({ target }: { target: React.RefObject<HTMLElement | null> }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = target.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [target]);
  return (
    <div className="no-print fixed inset-x-0 top-0 z-50 h-0.5" aria-hidden>
      <div className="h-full origin-left bg-brand-500 transition-transform duration-150" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

type Heading = { id: string; text: string };

/**
 * "On this page" navigation. The headings come from the article module (added
 * at build time by seo/mdx-headings.ts), so the menu is in the prerendered HTML;
 * the browser only adds the highlight for the section being read.
 */
function TableOfContents({ headings, target, pathname }: { headings: Heading[]; target: React.RefObject<HTMLElement | null>; pathname: string }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" },
    );
    el.querySelectorAll("h2[id]").forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [target, pathname]);

  if (headings.length < 3) return null;
  return (
    <nav aria-label="On this page">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">On this page</p>
      <ol className="mt-4 space-y-1 border-l border-neutral-200">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`-ml-px block border-l-2 py-1 pl-4 text-sm leading-snug transition ${
                active === h.id ? "border-brand-500 font-medium text-ink" : "border-transparent text-neutral-500 hover:text-ink"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function LearnArticle() {
  const { pathname } = useLocation();
  const article = articlesBySlug.get(slugFrom(pathname))!;
  const related = articles.filter((a) => a.cluster === article.cluster && a.slug !== article.slug).slice(0, 3);
  const path = `/learn/${article.slug}`;
  const bodyRef = useRef<HTMLElement>(null);
  const headings = (useMatches().find((m) => (m.handle as { headings?: Heading[] } | undefined)?.headings)?.handle as { headings: Heading[] } | undefined)?.headings ?? [];

  return (
    <>
      <ReadingProgress target={bodyRef} />
      <PageHero
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Guides", path: "/learn" },
          { name: article.h1 ?? article.title, path },
        ]}
        eyebrow={clusters[article.cluster].name}
        title={article.h1 ?? article.title}
        intro={<p className="max-w-2xl">{article.description}</p>}
      >
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-neutral-400">
          <span className="flex items-center gap-2.5">
            <LogoMark size={18} tone="dark" />
            <span>
              By{" "}
              <Link to={site.author.url} className="font-medium text-white hover:text-brand-400">
                {site.author.name}
              </Link>
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays size={15} aria-hidden /> Updated <time dateTime={article.updated}>{formatDate(article.updated)}</time>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={15} aria-hidden /> {article.minutes} min read
          </span>
        </div>
      </PageHero>

      <div className="container-page pt-14">
        <div className="grid gap-14 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
          <aside className="no-print hidden lg:block">
            <div className="sticky top-24">
              <TableOfContents headings={headings} target={bodyRef} pathname={pathname} />
            </div>
          </aside>

          <article ref={bodyRef} className="min-w-0">
            <div className="article max-w-[46rem]">
              <Outlet />
            </div>

            <aside className="dark-band mt-16 max-w-[46rem] rounded-3xl p-8 sm:p-10">
              <div className="glow -right-20 -top-20 h-64 w-64" />
              <p className="eyebrow-dark">Free audit</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Check your site in 2 minutes</h2>
              <p className="mt-3 text-neutral-400">
                The free {site.name} audit checks 50+ SEO and AI-visibility issues including everything in this guide and writes the fixes for you.
              </p>
              <div className="mt-7">
                <AuditForm id="article-cta" size="md" />
              </div>
            </aside>
          </article>

          <aside className="no-print hidden lg:block">
            <div className="sticky top-24 space-y-5">
              <div className="card p-6">
                <p className="font-semibold text-ink">Free SEO + AI audit</p>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">Find what's stopping you ranking in Google and ChatGPT with the fixes.</p>
                <Link to="/#audit" className="btn-primary mt-5 w-full py-2.5 text-sm">
                  Audit my site <ArrowRight size={15} aria-hidden />
                </Link>
              </div>
              {article.relatedTool && (
                <Link to={article.relatedTool.path} className="card card-hover group block p-6">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">Free tool</p>
                  <p className="mt-2 flex items-center gap-1.5 font-semibold text-ink group-hover:text-brand-600">
                    {article.relatedTool.name} <ArrowRight size={15} aria-hidden />
                  </p>
                </Link>
              )}
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-24 border-t border-neutral-200 pt-14" aria-labelledby="related-heading">
            <p className="eyebrow">Keep reading</p>
            <h2 id="related-heading" className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Related guides
            </h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {related.map((a) => (
                <li key={a.slug}>
                  <Link to={`/learn/${a.slug}`} className="card card-hover group flex h-full flex-col p-6">
                    <p className="font-mono text-xs uppercase tracking-wider text-neutral-500">{a.minutes} min read</p>
                    <span className="mt-2 text-lg font-semibold leading-snug text-ink group-hover:text-brand-600">{a.title}</span>
                    <span className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">{a.description}</span>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                      Read <ArrowRight size={15} aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <JsonLd
        data={articleSchema({ title: article.h1 ?? article.title, description: article.description, path, published: article.published, updated: article.updated })}
      />
    </>
  );
}
