import { useState } from "react";
import { Link } from "react-router";
import { AlertOctagon, AlertTriangle, ChevronRight, Info, Sparkles } from "lucide-react";
import { Badge, CodeBlock, CopyButton, DownloadButton } from "~/components/ui";
import { PLATFORM_LABELS, type Finding, type Platform, type Severity } from "~/lib/types";

export const SEVERITY: Record<Severity, { label: string; tone: "bad" | "ok" | "neutral"; Icon: typeof Info; color: string }> = {
  critical: { label: "Critical", tone: "bad", Icon: AlertOctagon, color: "text-red-600" },
  warning: { label: "Warning", tone: "ok", Icon: AlertTriangle, color: "text-amber-600" },
  notice: { label: "Notice", tone: "neutral", Icon: Info, color: "text-neutral-500" },
};

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search || "/";
  } catch {
    return url;
  }
}

const PAGE_SIZE = 20;

export function FindingCard({ finding, platform }: { finding: Finding; platform: Platform | null }) {
  const [showAll, setShowAll] = useState(false);
  const sev = SEVERITY[finding.severity];
  const items = showAll ? finding.items : finding.items.slice(0, PAGE_SIZE);
  const hasSuggestions = finding.items.some((i) => i.suggested);
  const fix = finding.fix;

  return (
    <details id={`issue-${finding.checkId}`} className="group card scroll-mt-24 open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-start gap-3 p-5">
        <sev.Icon className={`mt-0.5 shrink-0 ${sev.color}`} size={20} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-neutral-900">{finding.title}</h3>
            <Badge tone={sev.tone}>{sev.label}</Badge>
            {fix?.aiGenerated && (
              <Badge tone="brand">
                <Sparkles size={12} className="mr-1" aria-hidden /> AI-written fix
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-600">{finding.summary}</p>
        </div>
        <ChevronRight className="mt-1 shrink-0 text-neutral-400 transition group-open:rotate-90" size={18} aria-hidden />
      </summary>

      <div className="space-y-6 border-t border-neutral-100 px-5 pb-6 pt-5">
        <div>
          <h4 className="text-sm font-semibold text-neutral-900">Why it matters</h4>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">
            {finding.why}{" "}
            {finding.learnSlug && (
              <Link to={`/learn/${finding.learnSlug}`} className="font-medium text-brand-700 underline underline-offset-2">
                Learn more
              </Link>
            )}
          </p>
        </div>

        {fix && (
          <div className="rounded-lg bg-emerald-50/60 p-4 ring-1 ring-emerald-100">
            <h4 className="text-sm font-semibold text-emerald-900">How to fix it</h4>
            <p className="mt-1 text-sm leading-relaxed text-emerald-950">{fix.summary}</p>
            {fix.steps && (
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-neutral-700">
                {fix.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            )}
            {fix.platformSteps && platform && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">On {PLATFORM_LABELS[platform]}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-neutral-700">
                  {fix.platformSteps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </div>
            )}
            {fix.snippets && fix.snippets.length > 0 && (
              <div className="mt-4 space-y-3">
                {fix.snippets.map((s, i) => (
                  <CodeBlock key={i} code={s.code} filename={s.filename} language={s.language} />
                ))}
              </div>
            )}
            {fix.files && fix.files.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-neutral-600">Download:</span>
                {fix.files.map((f) => (
                  <DownloadButton key={f.filename} filename={f.filename} content={f.content} mime={f.mime} />
                ))}
              </div>
            )}
          </div>
        )}

        {finding.items.length > 0 && (finding.items.some((i) => i.url || i.detail)) && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">
              Affected {finding.items.length === 1 ? "item" : `items (${finding.items.length})`}
            </h4>
            <ul className="mt-2 divide-y divide-neutral-100 rounded-lg border border-neutral-200 text-sm">
              {items.map((item, i) => (
                <li key={`${item.url}-${i}`} className="space-y-1.5 p-3">
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="block break-all font-medium text-brand-700 hover:underline" title={item.url}>
                      {shortUrl(item.url)}
                    </a>
                  )}
                  {item.detail && <p className="break-words text-neutral-600">{item.detail}</p>}
                  {item.current && (
                    <p className="break-words text-neutral-500">
                      <span className="font-semibold text-neutral-600">{hasSuggestions ? "Now: " : "Linked from: "}</span>
                      {item.current}
                    </p>
                  )}
                  {item.suggested && (
                    <div className="flex flex-wrap items-start gap-2 rounded-md bg-emerald-50 p-2">
                      <p className="min-w-0 flex-1 break-words text-emerald-900">
                        <span className="font-semibold">Use: </span>
                        {item.suggested}
                      </p>
                      <CopyButton text={item.suggested} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {finding.items.length > PAGE_SIZE && (
              <button type="button" className="no-print mt-2 text-sm font-medium text-brand-700" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Show fewer" : `Show all ${finding.items.length}`}
              </button>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
