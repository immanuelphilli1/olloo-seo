import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuditForm } from "./AuditForm";
import { JsonLd } from "./JsonLd";
import { Faq, PageHero } from "./ui";
import { ToolIcon } from "./ToolIcon";
import { site } from "~/config/site";
import { articlesBySlug } from "~/content/articles";
import { tools } from "~/content/tools";
import { api } from "~/lib/api";
import { seo } from "~/seo/meta";
import { webAppSchema } from "~/seo/jsonld";

export function toolMeta(slug: string, title: string, description: string) {
  const full = `${title} | ${site.name}`;
  return seo({ title: full.length <= 60 ? full : title, description, path: `/tools/${slug}` });
}

interface ToolPageProps {
  slug: string;
  h1: string;
  intro: string;
  description: string;
  children: React.ReactNode;
  sections: { heading: string; body: React.ReactNode }[];
  faqs: { q: string; a: string }[];
  learn?: string[];
}

/** Shared layout for every free tool: tool first, then answer-first explainer + FAQ. */
export function ToolPage({ slug, h1, intro, description, children, sections, faqs, learn = [] }: ToolPageProps) {
  const tool = tools.find((t) => t.slug === slug)!;
  const others = tools.filter((t) => t.slug !== slug).slice(0, 4);
  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Free tools", path: "/tools" },
          { name: tool.name, path: `/tools/${slug}` },
        ]}
        eyebrow={
          <>
            <ToolIcon icon={tool.icon} small /> Free tool · no signup
          </>
        }
        title={h1}
        intro={<p>{intro}</p>}
      />

      <div className="container-page">
        <section
          className="relative z-10 -mt-6 rounded-3xl border border-neutral-200 bg-white p-5 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.35)] sm:p-8"
          aria-label={tool.name}
        >
          {children}
        </section>

        <div className="mt-20 grid gap-14 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-14">
            {sections.map((s) => (
              <section key={s.heading}>
                <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">{s.heading}</h2>
                <div className="mt-4 space-y-4 text-[1.05rem] leading-[1.8] text-neutral-700 [&_a]:font-medium [&_a]:text-brand-600 [&_a]:underline [&_a]:decoration-brand-300 [&_a]:underline-offset-4 [&_code]:rounded-md [&_code]:bg-neutral-100 [&_code]:px-1.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_li]:ml-5 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 marker:text-brand-500">
                  {s.body}
                </div>
              </section>
            ))}
            <Faq faqs={faqs} />
          </div>
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="dark-band rounded-2xl p-6">
              <div className="glow -right-16 -top-16 h-48 w-48" />
              <p className="font-semibold text-white">Want the full picture?</p>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">Run the free audit: 50+ SEO and AI-visibility checks across your whole site, with fixes.</p>
              <div className="mt-5">
                <AuditForm id={`${slug}-side`} size="md" stacked />
              </div>
            </div>
            {learn.length > 0 && (
              <div className="card p-6">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">Learn more</p>
                <ul className="mt-3 space-y-2.5 text-sm">
                  {learn.map((s) => {
                    const a = articlesBySlug.get(s);
                    return a ? (
                      <li key={s}>
                        <Link to={`/learn/${s}`} className="group inline-flex items-start gap-1.5 font-medium text-ink hover:text-brand-600">
                          <ArrowRight size={15} className="mt-0.5 shrink-0 text-brand-500" aria-hidden />
                          {a.h1 ?? a.title}
                        </Link>
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            )}
            <div className="card p-6">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">More free tools</p>
              <ul className="mt-4 space-y-3">
                {others.map((t) => (
                  <li key={t.slug}>
                    <Link to={`/tools/${t.slug}`} className="group flex items-center gap-3">
                      <ToolIcon icon={t.icon} />
                      <span className="text-sm font-medium text-neutral-800 group-hover:text-brand-600">{t.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
      <JsonLd data={webAppSchema({ name: `${site.name} ${tool.name}`, description, path: `/tools/${slug}` })} />
    </>
  );
}

/** URL input + submit for tools that call the API. */
export function useUrlTool<T>(endpoint: string) {
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async (url: string) => {
    if (!url.trim()) return setError("Enter a website address.");
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await api<T>(`/tools/${endpoint}`, { body: { url } }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  return { result, error, loading, run };
}

export function UrlForm({ onSubmit, loading, error, label, placeholder = "example.com", button = "Check" }: { onSubmit: (url: string) => void; loading: boolean; error: string | null; label: string; placeholder?: string; button?: string }) {
  const [url, setUrl] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(url);
      }}
      noValidate
    >
      <label htmlFor="tool-url" className="block text-sm font-semibold text-neutral-900">
        {label}
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          id="tool-url"
          type="text"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          className="input"
          placeholder={placeholder}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={loading}>
          {loading && <Loader2 size={18} className="animate-spin" aria-hidden />}
          {loading ? "Checking…" : button}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-bad">
          {error}
        </p>
      )}
    </form>
  );
}
