import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import type { Route } from "./+types/not-found";
import { site } from "~/config/site";
import { articles } from "~/content/articles";
import { tools } from "~/content/tools";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Page not found | ${site.name}` }, { name: "robots", content: "noindex" }];
}

// A helpful 404: AI assistants sometimes send visitors to URLs that don't exist,
// so give them a useful next step instead of a dead end.
export default function NotFound() {
  return (
    <>
      <section className="dark-band">
        <div className="glow left-1/2 top-0 h-96 w-96 -translate-x-1/2" />
        <div className="container-page py-24 text-center">
          <p className="eyebrow-dark justify-center">Error 404</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">We couldn't find that page</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-400">It may have moved, or the link may be wrong. Here are the most popular places to go instead.</p>
          <Link to="/" className="btn-primary mt-9">
            Run a free SEO audit <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
      </section>
      <div className="container-page mt-16 grid max-w-4xl gap-12 sm:grid-cols-2">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">Free tools</h2>
          <ul className="mt-4 space-y-2.5">
            {tools.map((t) => (
              <li key={t.slug}>
                <Link to={`/tools/${t.slug}`} className="font-medium text-ink hover:text-brand-600">
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">Popular guides</h2>
          <ul className="mt-4 space-y-2.5">
            {articles.slice(0, 8).map((a) => (
              <li key={a.slug}>
                <Link to={`/learn/${a.slug}`} className="font-medium text-ink hover:text-brand-600">
                  {a.h1 ?? a.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
