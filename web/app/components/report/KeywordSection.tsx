import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Check, KeyRound, Loader2, X } from "lucide-react";
import { KeywordInput } from "~/components/KeywordInput";
import { Badge } from "~/components/ui";
import { api } from "~/lib/api";
import { INTENT_LABELS, type Audit, type KeywordResult } from "~/lib/types";

const PLACEMENTS = [
  ["title", "Title"],
  ["h1", "H1"],
  ["url", "URL"],
  ["meta", "Meta"],
  ["intro", "Intro"],
] as const;

function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function Mark({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex flex-col items-center gap-1 text-[11px] font-medium text-neutral-500" title={`${label}: ${ok ? "contains the keyword" : "missing"}`}>
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${ok ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200" : "bg-red-50 text-red-500 ring-1 ring-red-200"}`}>
        {ok ? <Check size={13} aria-hidden /> : <X size={13} aria-hidden />}
      </span>
      {label}
      <span className="sr-only">{ok ? "contains the keyword" : "missing the keyword"}</span>
    </span>
  );
}

function KeywordRow({ r }: { r: KeywordResult }) {
  return (
    <li className="grid gap-4 p-5 md:grid-cols-[1.1fr_1.2fr_auto] md:items-center">
      <div>
        <p className="font-semibold text-ink">“{r.keyword}”</p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
          <Badge tone="neutral">{INTENT_LABELS[r.intent]}</Badge>
          <span>Ranks best as: {r.expectedPage}</span>
        </p>
      </div>
      <div className="min-w-0">
        {r.bestPage ? (
          <>
            <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">{r.partial ? "Closest page (partial match)" : "Best page"}</p>
            <a href={r.bestPage} target="_blank" rel="noopener noreferrer nofollow" className="block truncate font-medium text-ink hover:text-brand-600" title={r.bestPage}>
              {r.bestPageTitle ?? pathOf(r.bestPage)}
            </a>
            <p className="truncate text-xs text-neutral-500">{pathOf(r.bestPage)}</p>
            {r.missingWords.length > 0 && (
              <p className="mt-1.5 text-xs font-medium text-amber-700">
                Never uses {r.missingWords.map((w) => `“${w}”`).join(", ")}, adjust the page to match this search, or create a new one
              </p>
            )}
            {r.competing.length > 0 && (
              <p className="mt-1.5 text-xs font-medium text-amber-700">Also targeted by {r.competing.map(pathOf).join(", ")}, pages compete</p>
            )}
            {r.density > 3 && <p className="mt-1.5 text-xs font-medium text-amber-700">Repeated a lot ({r.density}% of words)</p>}
          </>
        ) : (
          <p className="text-sm font-medium text-red-700">No page targets this keyword yet.</p>
        )}
      </div>
      {r.placements ? (
        <div className="flex gap-3">
          {PLACEMENTS.map(([key, label]) => (
            <Mark key={key} ok={r.placements![key]} label={label} />
          ))}
        </div>
      ) : (
        <span className="text-sm text-neutral-500">Create a page →</span>
      )}
    </li>
  );
}

export function KeywordSection({ audit }: { audit: Audit }) {
  const navigate = useNavigate();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const report = audit.keywordReport ?? [];

  async function rerun() {
    if (!keywords.length) return setError("Add at least one keyword.");
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ id: string }>("/audits", { body: { url: audit.url, keywords } });
      navigate(`/audit/${res.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <section className="mt-14" aria-labelledby="keywords-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">
            <KeyRound size={14} aria-hidden /> Keyword targeting
          </p>
          <h2 id="keywords-heading" className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {report.length ? "How your pages target your keywords" : "Check your target keywords"}
          </h2>
        </div>
        <Link to="/tools/keyword-generator" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          Find more keywords →
        </Link>
      </div>

      {report.length > 0 ? (
        <ul className="card mt-6 divide-y divide-neutral-100">
          {report.map((r) => (
            <KeywordRow key={r.keyword} r={r} />
          ))}
        </ul>
      ) : (
        <div className="no-print card mt-6 p-6">
          <p className="max-w-2xl text-neutral-600">
            Add up to 5 keywords you want to rank for. We'll find the page that best targets each one, check it's in the title, H1, URL, description and first
            paragraph, and flag pages competing for the same keyword.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
            <KeywordInput id="report-keywords" keywords={keywords} onChange={setKeywords} />
            <button type="button" onClick={rerun} disabled={loading} className="btn-primary">
              {loading && <Loader2 size={17} className="animate-spin" aria-hidden />}
              Re-run with keywords
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-bad">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
