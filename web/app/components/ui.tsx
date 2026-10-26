import { useState } from "react";
import { Link } from "react-router";
import { Check, ChevronRight, Copy, Download, Plus } from "lucide-react";
import { JsonLd } from "./JsonLd";
import { breadcrumbSchema, faqSchema } from "~/seo/jsonld";

export function CopyButton({ text, label = "Copy", dark = false }: { text: string; label?: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`no-print inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
        dark ? "bg-white/10 text-neutral-200 hover:bg-white/20" : "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
      }`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard blocked: user can still select the text */
        }
      }}
    >
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DownloadButton({ filename, content, mime }: { filename: string; content: string; mime?: string }) {
  return (
    <button
      type="button"
      onClick={() => downloadText(filename, content, mime)}
      className="no-print inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-2.5 py-1 font-mono text-xs font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50"
    >
      <Download size={14} aria-hidden /> {filename}
    </button>
  );
}

export function CodeBlock({ code, filename, language }: { code: string; filename?: string; language?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
          <span className="truncate font-mono text-xs text-neutral-400">{filename ?? language ?? "code"}</span>
        </span>
        <CopyButton text={code} dark />
      </div>
      <pre className="max-h-96 overflow-auto p-4 font-mono text-[13px] leading-relaxed text-neutral-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Breadcrumbs({ items, dark = false }: { items: { name: string; path: string }[]; dark?: boolean }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className={`text-sm ${dark ? "text-neutral-500" : "text-neutral-500"}`}>
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, i) => (
            <li key={item.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={14} aria-hidden />}
              {i === items.length - 1 ? (
                <span aria-current="page" className={dark ? "text-neutral-300" : "text-neutral-700"}>
                  {item.name}
                </span>
              ) : (
                <Link to={item.path} className={dark ? "hover:text-white" : "hover:text-brand-600"}>
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbSchema(items)} />
    </>
  );
}

/** Visible FAQ plus matching FAQPage schema (Google requires the answers to be visible). */
export function Faq({
  faqs,
  heading = "Frequently asked questions",
  intro,
  split = false,
}: {
  faqs: { q: string; a: string }[];
  heading?: string;
  intro?: React.ReactNode;
  split?: boolean;
}) {
  const list = (
    <div className="divide-y divide-neutral-200 border-y border-neutral-200">
      {faqs.map((f) => (
        <details key={f.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 [&::-webkit-details-marker]:hidden">
            <h3 className="text-base font-medium text-ink sm:text-lg">{f.q}</h3>
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition group-open:rotate-45 group-open:border-brand-500 group-open:bg-brand-500 group-open:text-ink">
              <Plus size={16} aria-hidden />
            </span>
          </summary>
          <p className="mt-3 max-w-2xl leading-relaxed text-neutral-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
  return (
    <section aria-labelledby="faq-heading" className={split ? "grid gap-10 lg:grid-cols-[0.8fr_1.2fr]" : ""}>
      <div>
        <p className="eyebrow">FAQ</p>
        <h2 id="faq-heading" className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {heading}
        </h2>
        {intro && <div className="mt-4 text-neutral-600">{intro}</div>}
      </div>
      <div className={split ? "" : "mt-8"}>{list}</div>
      <JsonLd data={faqSchema(faqs)} />
    </section>
  );
}

export function Badge({ tone, children }: { tone: "good" | "ok" | "bad" | "neutral" | "brand"; children: React.ReactNode }) {
  const tones = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    ok: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-red-50 text-red-700 ring-red-200",
    neutral: "bg-neutral-100 text-neutral-700 ring-neutral-200",
    brand: "bg-brand-50 text-brand-700 ring-brand-200",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>{children}</span>;
}

/** Dark page header used on inner pages: breadcrumbs, H1 and intro on ink with a glow. */
export function PageHero({
  breadcrumbs,
  eyebrow,
  title,
  intro,
  children,
}: {
  breadcrumbs: { name: string; path: string }[];
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  intro?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="dark-band">
      <div className="glow -top-48 right-0 h-112 w-112 opacity-60" />
      <div className="container-page pb-14 pt-8 sm:pb-16">
        <Breadcrumbs items={breadcrumbs} dark />
        <div className="mt-8 max-w-3xl">
          {eyebrow && <p className="eyebrow-dark">{eyebrow}</p>}
          <h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            {title}
          </h1>
          {intro && (
            <div className="mt-5 text-lg leading-relaxed text-neutral-400">
              {intro}
            </div>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export { ChevronRight };
