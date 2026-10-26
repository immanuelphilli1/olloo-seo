import { useState } from "react";
import { MessageSquareText, Sparkles } from "lucide-react";
import { Badge, CodeBlock, CopyButton } from "~/components/ui";
import type { ActionPlan as Plan } from "~/lib/types";

const BUCKETS = {
  fix: { label: "Fix", text: "Correct what already exists" },
  build: { label: "Build", text: "Create new content and assets" },
  influence: { label: "Influence", text: "Earn mentions on other sites" },
} as const;

export function ActionPlan({ plan, auditId }: { plan: Plan; auditId: string }) {
  const storageKey = `plan-done-${auditId}`;
  const [done, setDone] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(storageKey) ?? "[]"));
    } catch {
      return new Set();
    }
  });
  const toggle = (task: string) => {
    const next = new Set(done);
    if (next.has(task)) next.delete(task);
    else next.add(task);
    setDone(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify([...next]));
    } catch {
      /* private mode: progress just isn't remembered */
    }
  };

  return (
    <div className="space-y-10">
      {plan.niche && (
        <p className="rounded-lg bg-brand-50 p-4 text-sm text-brand-900">
          <Sparkles size={16} className="mr-1 inline" aria-hidden /> We read your site as: <strong>{plan.niche}</strong>
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {plan.weeks.map((week) => (
          <div key={week.title} className="card p-5">
            <h3 className="font-semibold text-neutral-900">{week.title}</h3>
            <ul className="mt-3 space-y-2">
              {week.tasks.map((task) => (
                <li key={task}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm text-neutral-700">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={done.has(task)} onChange={() => toggle(task)} />
                    <span className={done.has(task) ? "text-neutral-500 line-through" : ""}>{task}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-neutral-900">Off-site plan: get mentioned where AI looks</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Brand mentions on other websites are the strongest signal for AI visibility we know of. These tasks happen off your site, so no code fix can do them
          for you.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(Object.keys(BUCKETS) as (keyof typeof BUCKETS)[]).map((bucket) => (
            <div key={bucket} className="card p-5">
              <Badge tone="brand">{BUCKETS[bucket].label}</Badge>
              <p className="mt-1 text-xs text-neutral-500">{BUCKETS[bucket].text}</p>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-neutral-700">
                {plan.offSite
                  .filter((t) => t.bucket === bucket)
                  .map((t) => (
                    <li key={t.task}>{t.task}</li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
          <MessageSquareText size={20} className="text-brand-600" aria-hidden /> Test your AI visibility
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          Open ChatGPT, Perplexity and Gemini in a private (incognito) window and ask these questions. Note whether your brand appears, and who appears instead.
          Those competitors, and the pages cited for them, are your targets.
        </p>
        <ol className="mt-4 divide-y divide-neutral-100 rounded-lg border border-neutral-200">
          {plan.prompts.map((prompt, i) => (
            <li key={prompt} className="flex items-center gap-3 p-3 text-sm">
              <span className="w-6 shrink-0 text-right font-semibold text-neutral-500">{i + 1}.</span>
              <span className="flex-1 text-neutral-800">{prompt}</span>
              <CopyButton text={prompt} />
            </li>
          ))}
        </ol>
      </div>

      {plan.faqSchema && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Bonus: FAQ content and schema for your homepage</h3>
          <p className="mt-1 text-sm text-neutral-600">
            We wrote FAQs from the facts on your site. Add the questions and answers visibly to your page, then paste this schema into the page's head. Check every
            answer before publishing.
          </p>
          <div className="mt-3">
            <CodeBlock code={plan.faqSchema} filename="faq-schema.html" />
          </div>
        </div>
      )}
    </div>
  );
}
