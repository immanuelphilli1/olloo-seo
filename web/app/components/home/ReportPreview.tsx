import { AlertOctagon, AlertTriangle, Check, Info, Sparkles } from "lucide-react";
import { CategoryBars, ScoreRing } from "~/components/report/Scores";
import { site } from "~/config/site";
import type { Scores } from "~/lib/types";

// An example report built from the real report components, shown in a browser
// frame in the hero. Labeled as an example; the data is illustrative.

const scores: Scores = {
  overall: 68,
  aiVisibility: 41,
  categories: { technical: 72, onpage: 58, content: 81, aeo: 41, performance: 88 },
};

const issues = [
  { Icon: AlertOctagon, color: "text-red-600", tone: "bg-red-50 text-red-700 ring-red-200", label: "Critical", title: "AI search crawlers are blocked", detail: "OAI-SearchBot and PerplexityBot can't read your site." },
  { Icon: AlertTriangle, color: "text-amber-600", tone: "bg-amber-50 text-amber-800 ring-amber-200", label: "Warning", title: "12 pages have no meta description", detail: "Rewritten descriptions included for every page." },
  { Icon: Info, color: "text-neutral-500", tone: "bg-neutral-100 text-neutral-700 ring-neutral-200", label: "Notice", title: "No Organization schema", detail: "JSON-LD generated from your homepage." },
];

export function ReportPreview() {
  return (
    <div className="tilt-in mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_50px_100px_-40px_rgba(10,10,10,0.35),0_0_0_1px_rgba(10,10,10,0.02)]">
        <div className="flex items-center gap-2 border-b border-neutral-200 bg-paper px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          <span className="mx-auto truncate rounded-md bg-white px-3 py-0.5 font-mono text-xs text-neutral-500 ring-1 ring-neutral-200">
            {site.brand}-seo · report for example-store.com
          </span>
          <span className="rounded-full bg-neutral-200/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-600">Example</span>
        </div>

        <div className="grid gap-px bg-neutral-200 md:grid-cols-[1fr_1fr_1.1fr]">
          <div className="bg-white p-5">
            <ScoreRing score={scores.overall} label={`${site.brand} SEO Score`} sublabel="How well your site is set up to rank in Google." />
          </div>
          <div className="bg-white p-5">
            <ScoreRing score={scores.aiVisibility} label={`${site.brand} AI Visibility Score`} sublabel="How easily AI assistants can find and quote you." />
          </div>
          <div className="hidden bg-white p-5 md:block">
            <CategoryBars scores={scores} />
          </div>
        </div>

        <div className="grid border-t border-neutral-200 md:grid-cols-[1.15fr_1fr]">
          <div className="p-5">
            <p className="text-sm font-semibold text-ink">Fix these first</p>
            <ul className="mt-3 space-y-2.5">
              {issues.map((issue) => (
                <li key={issue.title} className="flex items-start gap-3 rounded-xl border border-neutral-200 p-3">
                  <issue.Icon size={17} className={`mt-0.5 shrink-0 ${issue.color}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                      {issue.title}
                      <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold ring-1 ring-inset ${issue.tone}`}>{issue.label}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-neutral-500">{issue.detail}</p>
                  </div>
                  <span className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 sm:inline-flex">
                    <Check size={11} aria-hidden /> Fix ready
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden border-t border-neutral-200 bg-ink p-5 md:block md:border-l md:border-t-0">
            <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
              <Sparkles size={13} className="text-brand-500" aria-hidden /> robots.txt, written for you
            </p>
            <pre className="mt-3 overflow-hidden font-mono text-[12px] leading-relaxed">
              <span className="block text-neutral-400"># Let AI search engines read and cite you</span>
              <span className="block">
                <span className="text-emerald-400">+ </span>
                <span className="text-neutral-100">User-agent: OAI-SearchBot</span>
              </span>
              <span className="block">
                <span className="text-emerald-400">+ </span>
                <span className="text-neutral-100">User-agent: PerplexityBot</span>
              </span>
              <span className="block">
                <span className="text-emerald-400">+ </span>
                <span className="text-neutral-100">Allow: /</span>
              </span>
              <span className="block truncate text-neutral-400">{"  "}Sitemap: https://example-store.com/sitemap.xml</span>
            </pre>
            <p className="mt-4 text-xs text-neutral-400">Steps for WordPress included · platform detected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
