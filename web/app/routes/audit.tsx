import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { CheckCircle2, Circle, Download, ExternalLink, Loader2, Printer, RefreshCw, XCircle } from "lucide-react";
import type { Route } from "./+types/audit";
import { ActionPlan } from "~/components/report/ActionPlan";
import { KeywordSection } from "~/components/report/KeywordSection";
import { FindingCard, SEVERITY } from "~/components/report/FindingCard";
import { CategoryBars, ScoreRing } from "~/components/report/Scores";
import { Badge } from "~/components/ui";
import { site } from "~/config/site";
import { api } from "~/lib/api";
import { CATEGORY_INFO } from "~/lib/categories";
import { CATEGORY_LABELS, PLATFORM_LABELS, type AuditResponse, type Category, type Severity } from "~/lib/types";

export function meta({}: Route.MetaArgs) {
  return [{ title: `SEO report | ${site.name}` }, { name: "robots", content: "noindex, nofollow" }];
}

const STAGES = [
  { at: 3, label: "Fetching your homepage" },
  { at: 8, label: "Reading robots.txt and sitemaps" },
  { at: 10, label: "Crawling your pages" },
  { at: 58, label: "Checking links, images and redirects" },
  { at: 68, label: "Testing what AI crawlers see + Core Web Vitals" },
  { at: 80, label: "Running 50+ SEO and AI-visibility checks" },
  { at: 85, label: "Writing your fixes" },
  { at: 94, label: "Building your action plan" },
];

function Progress({ data }: { data: AuditResponse }) {
  const { audit } = data;
  return (
    <section className="dark-band min-h-[80vh]">
      <div className="glow left-1/2 top-0 h-96 w-96 -translate-x-1/2" />
      <div className="container-page mx-auto max-w-2xl py-20">
      <p className="eyebrow-dark">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" /> Auditing
      </p>
      <h1 className="mt-3 break-all text-4xl font-semibold tracking-tight sm:text-5xl">{audit.host}</h1>
      <p className="mt-3 text-neutral-400" aria-live="polite">
        {audit.step}
        {audit.pagesCrawled > 0 && ` · ${audit.pagesCrawled} pages found`}
      </p>
      <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={audit.progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-linear-to-r from-brand-500 to-amber-400 transition-all duration-700" style={{ width: `${Math.max(audit.progress, 2)}%` }} />
      </div>
      <ol className="mt-10 space-y-3.5">
        {STAGES.map((stage, i) => {
          const next = STAGES[i + 1]?.at ?? 100;
          const state = audit.progress >= next ? "done" : audit.progress >= stage.at ? "active" : "todo";
          return (
            <li key={stage.label} className="flex items-center gap-3 text-sm">
              {state === "done" && <CheckCircle2 size={18} className="text-emerald-400" aria-hidden />}
              {state === "active" && <Loader2 size={18} className="animate-spin text-brand-500" aria-hidden />}
              {state === "todo" && <Circle size={18} className="text-neutral-700" aria-hidden />}
              <span className={state === "todo" ? "text-neutral-600" : "text-neutral-200"}>{stage.label}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-12 text-sm text-neutral-500">This usually takes 1–3 minutes. You can keep this tab open, the report appears here automatically.</p>
      </div>
    </section>
  );
}

const SEVERITY_ORDER: Severity[] = ["critical", "warning", "notice"];

function Report({ data, onRerun, rerunning }: { data: AuditResponse; onRerun: () => void; rerunning: boolean }) {
  const { audit, findings, pages } = data;
  const scores = audit.scores!;
  const [filter, setFilter] = useState<Severity | "all">("all");
  const counts = useMemo(() => Object.fromEntries(SEVERITY_ORDER.map((s) => [s, findings.filter((f) => f.severity === s).length])) as Record<Severity, number>, [findings]);
  const passed = (audit.outcomes ?? []).filter((o) => o.status === "passed");
  const skipped = (audit.outcomes ?? []).filter((o) => o.status === "skipped");
  const visible = findings.filter((f) => filter === "all" || f.severity === filter);
  const topFixes = findings.slice(0, 5);

  return (
    <div className="print-expand">
      <section className="dark-band">
      <div className="glow -top-40 right-0 h-112 w-112 opacity-50" />
      <div className="container-page pb-12 pt-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow-dark">SEO & AI visibility report</p>
          <h1 className="mt-2 break-all text-4xl font-semibold tracking-tight sm:text-5xl">{audit.host}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-neutral-400">
            <span>{new Date(audit.completedAt ?? audit.createdAt).toLocaleString()}</span>
            <span>·</span>
            <span>{audit.pagesCrawled} pages crawled</span>
            {audit.platform && (
              <>
                <span>·</span>
                <Badge tone="neutral">{PLATFORM_LABELS[audit.platform]}</Badge>
              </>
            )}
            <a href={audit.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-brand-400 hover:underline">
              Visit site <ExternalLink size={13} aria-hidden />
            </a>
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <a href={`/api/audits/${audit.id}/fixes.zip`} className="btn-primary px-4 py-2 text-sm">
            <Download size={16} aria-hidden /> Download all fixes
          </a>
          <button type="button" onClick={() => window.print()} className="btn-ghost-dark text-sm">
            <Printer size={16} aria-hidden /> Save PDF
          </button>
          <button type="button" onClick={onRerun} disabled={rerunning} className="btn-ghost-dark text-sm">
            <RefreshCw size={16} className={rerunning ? "animate-spin" : ""} aria-hidden /> Re-run
          </button>
        </div>
      </div>

      <section className="mt-10 grid gap-4 lg:grid-cols-3" aria-label="Scores">
        <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <ScoreRing dark score={scores.overall} label={`${site.brand} SEO Score`} sublabel="How well your site is set up to rank in Google." />
        </div>
        <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <ScoreRing dark score={scores.aiVisibility} label={`${site.brand} AI Visibility Score`} sublabel="How easily AI assistants can find, read and quote you." />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <CategoryBars dark scores={scores} />
        </div>
      </section>
      </div>
      </section>

      <div className="container-page">
      <section className="relative z-10 -mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Summary">
        {SEVERITY_ORDER.map((s) => {
          const Icon = SEVERITY[s].Icon;
          return (
            <div key={s} className="card p-5 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.35)]">
              <Icon size={18} className={SEVERITY[s].color} aria-hidden />
              <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{counts[s]}</p>
              <p className="text-sm text-neutral-600">{s === "critical" ? "Critical" : `${SEVERITY[s].label}${counts[s] === 1 ? "" : "s"}`}</p>
            </div>
          );
        })}
        <div className="card p-5 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.35)]">
          <CheckCircle2 size={18} className="text-emerald-600" aria-hidden />
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{passed.length}</p>
          <p className="text-sm text-neutral-600">Checks passed</p>
        </div>
      </section>

      {!audit.aiUsed && (
        <p className="no-print mt-6 rounded-xl bg-paper p-4 text-sm text-neutral-600 ring-1 ring-neutral-200">
          Fixes in this report are rule-based. When AI is enabled on the server, {site.name} also rewrites your titles and descriptions, writes alt text, reviews
          your content for AI answers and tailors your action plan.
        </p>
      )}

      {topFixes.length > 0 && (
        <section className="mt-12" aria-labelledby="first-heading">
          <h2 id="first-heading" className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Fix these first
          </h2>
          <ol className="mt-4 space-y-2">
            {topFixes.map((f, i) => (
              <li key={f.checkId}>
                <a
                  href={`#issue-${f.checkId}`}
                  onClick={() => {
                    const el = document.getElementById(`issue-${f.checkId}`) as HTMLDetailsElement | null;
                    if (el) el.open = true;
                  }}
                  className="card card-hover flex items-center gap-4 p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-sm font-medium text-brand-500">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-neutral-900">{f.title}</span>
                    <span className="block text-sm text-neutral-600">{f.summary}</span>
                  </span>
                  <Badge tone={SEVERITY[f.severity].tone}>{SEVERITY[f.severity].label}</Badge>
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      <KeywordSection audit={audit} />

      <section className="mt-12" aria-labelledby="issues-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="issues-heading" className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            All issues and fixes
          </h2>
          <div className="no-print flex flex-wrap gap-2" role="group" aria-label="Filter by severity">
            {(["all", ...SEVERITY_ORDER] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={filter === s}
                onClick={() => setFilter(s)}
                className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${filter === s ? "bg-ink text-white ring-ink" : "bg-white text-neutral-700 ring-neutral-300 hover:bg-neutral-50"}`}
              >
                {s === "all" ? `All (${findings.length})` : `${SEVERITY[s].label} (${counts[s]})`}
              </button>
            ))}
          </div>
        </div>
        {findings.length === 0 && <p className="mt-6 rounded-lg bg-emerald-50 p-6 text-emerald-900">No issues found. Your site passed every check we ran.</p>}
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => {
          const list = visible.filter((f) => f.category === category);
          if (!list.length) return null;
          return (
            <div key={category} className="mt-8">
              <h3 className="text-lg font-semibold text-ink">
                {CATEGORY_INFO[category].name} <span className="font-normal text-neutral-500">· {CATEGORY_INFO[category].question}</span>
              </h3>
              <p className="mt-1 max-w-3xl text-sm text-neutral-600">{CATEGORY_INFO[category].plain}</p>
              <div className="mt-3 space-y-3">
                {list.map((f) => (
                  <FindingCard key={f.checkId} finding={f} platform={audit.platform} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {audit.actionPlan && (
        <section className="mt-16" aria-labelledby="plan-heading">
          <h2 id="plan-heading" className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Your 30-day action plan
          </h2>
          <p className="mt-1 text-neutral-600">Tick tasks off as you go, your progress is saved in this browser.</p>
          <div className="mt-6">
            <ActionPlan plan={audit.actionPlan} auditId={audit.id} />
          </div>
        </section>
      )}

      <section className="mt-16" aria-labelledby="passed-heading">
        <h2 id="passed-heading" className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Passed checks ({passed.length})
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {passed.map((o) => (
            <li key={o.checkId} className="flex items-start gap-2 text-sm text-neutral-700">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden /> {o.title}
            </li>
          ))}
        </ul>
        {skipped.length > 0 && (
          <>
            <h3 className="mt-8 font-semibold text-neutral-900">Not checked</h3>
            <ul className="mt-2 space-y-1 text-sm text-neutral-600">
              {skipped.map((o) => (
                <li key={o.checkId}>
                  <span className="font-medium text-neutral-700">{o.title}:</span> {o.reason}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {pages.length > 0 && (
        <section className="mt-16" aria-labelledby="pages-heading">
          <h2 id="pages-heading" className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Pages crawled ({pages.length})
          </h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Page</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Words</th>
                  <th className="px-3 py-2 font-semibold">Links in</th>
                  <th className="px-3 py-2 font-semibold">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pages.map((p) => (
                  <tr key={p.url}>
                    <td className="max-w-md px-3 py-2">
                      <p className="truncate font-medium text-neutral-900" title={p.title ?? ""}>
                        {p.title ?? <span className="italic text-neutral-500">No title</span>}
                      </p>
                      <p className="truncate text-xs text-neutral-500" title={p.url}>
                        {new URL(p.url).pathname}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={p.status === 200 ? "good" : "bad"}>{p.status || "Error"}</Badge>
                    </td>
                    <td className="px-3 py-2 text-neutral-700">{p.wordCount}</td>
                    <td className="px-3 py-2 text-neutral-700">{p.inlinks}</td>
                    <td className="px-3 py-2 text-neutral-700">{p.issueCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="mt-12 text-center text-xs text-neutral-500">
        This report is private to anyone with the link and is deleted after {Math.round((audit.expiresAt - audit.createdAt) / 86_400_000)} days.
      </p>
      </div>
    </div>
  );
}

export default function AuditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rerunning, setRerunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    setData(null);
    setError(null);
    const poll = async () => {
      try {
        const res = await api<AuditResponse>(`/audits/${id}`);
        if (cancelled) return;
        setData(res);
        if (res.audit.status !== "done" && res.audit.status !== "failed") timer = setTimeout(poll, 1500);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  async function rerun() {
    if (!data) return;
    setRerunning(true);
    try {
      const res = await api<{ id: string }>("/audits", { body: { url: data.audit.url, force: true } });
      navigate(`/audit/${res.id}`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setRerunning(false);
    }
  }

  return (
    <>
      {error && (
        <div className="container-page mx-auto max-w-xl py-24 text-center">
          <XCircle className="mx-auto text-red-500" size={40} aria-hidden />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{error}</h1>
          <Link to="/" className="btn-primary mt-8">
            Run a new audit
          </Link>
        </div>
      )}
      {!error && !data && (
        <div className="dark-band flex min-h-[70vh] justify-center py-32">
          <Loader2 className="animate-spin text-brand-500" size={32} aria-label="Loading report" />
        </div>
      )}
      {data && data.audit.status === "failed" && (
        <div className="container-page mx-auto max-w-xl py-24 text-center">
          <XCircle className="mx-auto text-red-500" size={40} aria-hidden />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">We couldn't audit {data.audit.host}</h1>
          <p className="mt-3 text-neutral-600">{data.audit.error}</p>
          <div className="mt-8 flex justify-center gap-3">
            <button type="button" onClick={rerun} className="btn-primary" disabled={rerunning}>
              Try again
            </button>
            <Link to="/" className="btn-secondary">
              Audit another site
            </Link>
          </div>
        </div>
      )}
      {data && data.audit.status !== "done" && data.audit.status !== "failed" && <Progress data={data} />}
      {data && data.audit.status === "done" && <Report data={data} onRerun={rerun} rerunning={rerunning} />}
    </>
  );
}
