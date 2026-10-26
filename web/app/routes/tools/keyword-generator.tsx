import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Download, Loader2, Search } from "lucide-react";
import type { Route } from "./+types/keyword-generator";
import { ToolPage, toolMeta } from "~/components/ToolPage";
import { Badge, CopyButton, downloadText } from "~/components/ui";
import { api } from "~/lib/api";
import { INTENT_LABELS, type SearchIntent } from "~/lib/types";

const description = "Free keyword generator: keyword ideas from real Google searches, sorted by search intent, with a flag for searches AI answers might take.";

export function meta({}: Route.MetaArgs) {
  return toolMeta("keyword-generator", "Free Keyword Generator: Ideas by Search Intent", description);
}

interface Idea {
  keyword: string;
  intent: SearchIntent;
  expectedPage: string;
  aiRisk: "high" | "medium" | "low";
  group: string;
}

interface Result {
  seed: string;
  countryName: string;
  seedIntent: { intent: SearchIntent; expectedPage: string; aiRisk: Idea["aiRisk"] };
  real: Idea[];
  ideas: Idea[];
  liveSource: boolean;
  note: string | null;
}

const COUNTRIES = [
  ["us", "United States"],
  ["gb", "United Kingdom"],
  ["ca", "Canada"],
  ["au", "Australia"],
  ["ie", "Ireland"],
  ["in", "India"],
  ["ng", "Nigeria"],
  ["za", "South Africa"],
  ["nz", "New Zealand"],
] as const;

const GROUP_ORDER = ["Questions", "Guides", "Comparisons", "Buying", "Tools (AI can't replace these)", "Other searches"];

const RISK = {
  high: { label: "AI may answer this", tone: "ok" as const, hint: "Question searches often get a full AI answer, aim to be cited, not just clicked." },
  medium: { label: "Mixed", tone: "neutral" as const, hint: "Google it to see whether an AI Overview fully answers it." },
  low: { label: "Click likely", tone: "good" as const, hint: "Tool, buying and local searches need a website, AI can't replace the click." },
};

function IdeaList({ title, badge, ideas, selected, toggle }: { title: string; badge: string; ideas: Idea[]; selected: Set<string>; toggle: (k: string) => void }) {
  const groups = GROUP_ORDER.map((g) => [g, ideas.filter((i) => i.group === g)] as const).filter(([, list]) => list.length);
  if (!ideas.length) return null;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <Badge tone="brand">{badge}</Badge>
        <span className="text-sm text-neutral-500">{ideas.length} keywords</span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {groups.map(([group, list]) => (
          <div key={group} className="rounded-2xl border border-neutral-200">
            <p className="border-b border-neutral-100 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-neutral-500">{group}</p>
            <ul className="divide-y divide-neutral-100">
              {list.map((idea) => (
                <li key={idea.keyword} className="flex items-center gap-3 px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label={`Select ${idea.keyword}`}
                    className="h-4 w-4 shrink-0 accent-brand-500"
                    checked={selected.has(idea.keyword)}
                    onChange={() => toggle(idea.keyword)}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink" title={idea.keyword}>
                    {idea.keyword}
                  </span>
                  <span className="hidden sm:inline">
                    <Badge tone="neutral">{INTENT_LABELS[idea.intent]}</Badge>
                  </span>
                  <span title={RISK[idea.aiRisk].hint}>
                    <Badge tone={RISK[idea.aiRisk].tone}>{RISK[idea.aiRisk].label}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KeywordGenerator() {
  const navigate = useNavigate();
  const [seed, setSeed] = useState("");
  const [country, setCountry] = useState("us");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState<SearchIntent | "all">("all");
  const [hideAi, setHideAi] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (seed.trim().length < 2) return setError("Enter a topic or keyword, like “coffee beans”.");
    setLoading(true);
    setError(null);
    setSelected(new Set());
    try {
      setResult(await api<Result>("/tools/keyword-ideas", { body: { seed, country } }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const filter = (list: Idea[]) => list.filter((i) => (intent === "all" || i.intent === intent) && !(hideAi && i.aiRisk === "high"));
  const real = useMemo(() => (result ? filter(result.real) : []), [result, intent, hideAi]);
  const ideas = useMemo(() => (result ? filter(result.ideas) : []), [result, intent, hideAi]);
  const all = [...real, ...ideas];

  const toggle = (k: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else if (next.size < 5) next.add(k);
      return next;
    });

  const csv = () =>
    ["keyword,source,intent,ranks_best_as,ai_risk", ...[...(result?.real ?? []).map((i) => ({ ...i, s: "google" })), ...(result?.ideas ?? []).map((i) => ({ ...i, s: "idea" }))].map((i) => `"${i.keyword}",${i.s},${i.intent},"${i.expectedPage}",${i.aiRisk}`)].join("\n");

  return (
    <ToolPage
      slug="keyword-generator"
      h1="Free keyword generator"
      intro="Enter a topic and get keyword ideas from real Google searches, plus proven modifier ideas, each labeled by search intent and by whether AI answers are likely to take the click. Tick up to 5 and check how well your site targets them."
      description={description}
      learn={["keyword-research", "search-intent", "how-to-rank-in-chatgpt"]}
      sections={[
        {
          heading: "How to pick keywords worth targeting",
          body: (
            <>
              <p>
                A keyword is worth targeting when it passes three tests, the <strong>B.I.D.</strong> check from Ahrefs' SEO course:
              </p>
              <ul>
                <li>
                  <strong>Business potential:</strong> if you ranked #1, would it bring customers? "Best espresso machine under $500" beats "what is espresso" for a coffee
                  shop.
                </li>
                <li>
                  <strong>Intent:</strong> Google it. If every result is a product page and you planned a blog post, it won't rank. Match what's already there.
                </li>
                <li>
                  <strong>Difficulty:</strong> look at who ranks. If the top 10 are all huge sites with thousands of links, pick a more specific keyword for now.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "The AI filter: will an AI answer steal the click?",
          body: (
            <>
              <p>
                Before committing to a keyword, ask whether an AI answer fully satisfies it. According to Ahrefs, AI Overviews appear on nearly 58% of question
                searches, and when one does, clicks to the #1 result drop sharply.
              </p>
              <p>
                That's why each idea is labeled. <strong>"Click likely"</strong> searches tools, calculators, prices, "near me" need a real website, so the
                click is still there. <strong>"AI may answer this"</strong> searches are still worth covering, but the goal shifts to being the source the AI
                cites. See <Link to="/learn/how-to-rank-in-chatgpt">how to rank in ChatGPT and AI search</Link>.
              </p>
            </>
          ),
        },
        {
          heading: "Where these ideas come from",
          body: (
            <>
              <p>
                <strong>Real searches</strong> come from Google's autocomplete, the suggestions Google shows as people type. They're real queries, but Google
                doesn't share exact search volumes for them.
              </p>
              <p>
                <strong>Ideas to test</strong> combine your topic with proven modifiers ("best", "how to", "vs", "near me", "calculator"). This is the
                seeds-and-modifiers method from our <Link to="/learn/keyword-research">keyword research guide</Link>. Google each one before you commit.
              </p>
            </>
          ),
        },
      ]}
      faqs={[
        {
          q: "Why don't you show search volumes?",
          a: "Search volumes come from Google Ads data or paid tools like Ahrefs and Semrush. This tool is free, so it shows real searches from Google's autocomplete instead a strong sign people search for them without exact numbers.",
        },
        {
          q: "What is search intent?",
          a: "It's the reason behind a search: to learn (informational), to compare (commercial), to buy or use something (transactional), or to find something nearby (local). The page you create has to match it, or it won't rank.",
        },
        {
          q: "How many keywords should one page target?",
          a: "One main keyword per page, plus its close variations. A well-targeted page usually ranks for hundreds of related searches on its own. Two pages chasing the same keyword compete with each other.",
        },
        {
          q: "What do I do after choosing keywords?",
          a: "Tick up to 5 and run the free audit with them. It finds the page that best targets each keyword, checks the title, H1, URL, description and first paragraph, and tells you which keywords still need a page.",
        },
      ]}
    >
      <form onSubmit={run} noValidate className="grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
        <div>
          <label htmlFor="kg-seed" className="block text-sm font-semibold text-ink">
            Topic or keyword
          </label>
          <div className="relative mt-2">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
            <input id="kg-seed" className="input pl-11" placeholder="e.g. coffee beans" value={seed} onChange={(e) => setSeed(e.target.value)} maxLength={80} />
          </div>
        </div>
        <div>
          <label htmlFor="kg-country" className="block text-sm font-semibold text-ink">
            Country
          </label>
          <select id="kg-country" className="input mt-2" value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading && <Loader2 size={18} className="animate-spin" aria-hidden />}
          {loading ? "Finding keywords…" : "Find keywords"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-bad">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-8 space-y-8">
          <div className="rounded-2xl bg-paper p-5 ring-1 ring-neutral-200">
            <p className="text-sm text-neutral-600">
              <strong className="text-ink">“{result.seed}”</strong> looks <strong className="text-ink">{INTENT_LABELS[result.seedIntent.intent].toLowerCase()}</strong>{" "}
              , it usually ranks best as a {result.seedIntent.expectedPage.toLowerCase()}. {RISK[result.seedIntent.aiRisk].hint}
            </p>
            {result.note && <p className="mt-2 text-sm font-medium text-amber-700">{result.note}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by intent">
            {(["all", "informational", "commercial", "transactional", "local"] as const).map((i) => (
              <button
                key={i}
                type="button"
                aria-pressed={intent === i}
                onClick={() => setIntent(i)}
                className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${intent === i ? "bg-ink text-white ring-ink" : "bg-white text-neutral-700 ring-neutral-300 hover:bg-neutral-50"}`}
              >
                {i === "all" ? "All intents" : INTENT_LABELS[i]}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={hideAi} onChange={(e) => setHideAi(e.target.checked)} />
              Hide searches AI may answer
            </label>
          </div>

          <IdeaList title={`Real searches in ${result.countryName}`} badge="From Google" ideas={real} selected={selected} toggle={toggle} />
          {!result.liveSource && !real.length && <p className="text-sm text-neutral-600">Live Google suggestions aren't available right now, try again later.</p>}
          <IdeaList title="Ideas to test" badge="Built-in modifiers" ideas={ideas} selected={selected} toggle={toggle} />

          {all.length === 0 && <p className="text-sm text-neutral-600">No keywords match these filters.</p>}

          <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-ink p-4 text-white shadow-2xl">
            <span className="text-sm text-neutral-300">
              <strong className="text-white">{selected.size}</strong>/5 selected
            </span>
            <button
              type="button"
              disabled={!selected.size}
              onClick={() => navigate(`/?kw=${encodeURIComponent([...selected].join(","))}#audit`)}
              className="btn-primary px-4 py-2 text-sm"
            >
              Audit my site for these <ArrowRight size={15} aria-hidden />
            </button>
            <span className="ml-auto flex gap-2">
              <CopyButton dark text={all.map((i) => i.keyword).join("\n")} label="Copy all" />
              <button
                type="button"
                onClick={() => downloadText(`keywords-${result.seed.replace(/\s+/g, "-")}.csv`, csv(), "text/csv")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-neutral-200 hover:bg-white/20"
              >
                <Download size={14} aria-hidden /> CSV
              </button>
            </span>
          </div>
        </div>
      )}
    </ToolPage>
  );
}
