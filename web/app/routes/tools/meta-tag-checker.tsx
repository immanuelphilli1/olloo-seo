import { Link } from "react-router";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { Route } from "./+types/meta-tag-checker";
import { ToolPage, UrlForm, toolMeta, useUrlTool } from "~/components/ToolPage";

const description = "Free meta tag checker with Google SERP preview. Check your title tag, meta description, canonical, robots, Open Graph and Twitter tags in one click.";

export function meta({}: Route.MetaArgs) {
  return toolMeta("meta-tag-checker", "Meta Tag Checker & SERP Preview (Free)", description);
}

interface Result {
  url: string;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robots: string | null;
  h1s: string[];
  og: Record<string, string>;
  twitter: Record<string, string>;
  schemaTypes: string[];
  issues: { level: "error" | "warning" | "ok"; message: string }[];
}

const ICONS = { error: XCircle, warning: AlertTriangle, ok: CheckCircle2 };
const COLORS = { error: "text-red-600", warning: "text-amber-600", ok: "text-emerald-600" };

function cut(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export default function MetaTagChecker() {
  const { result, error, loading, run } = useUrlTool<Result>("meta-tags");
  const host = result ? new URL(result.url).hostname : "";
  return (
    <ToolPage
      slug="meta-tag-checker"
      h1="Meta tag checker and SERP preview"
      intro="See exactly how your page looks in Google search results and when it's shared on social media. The checker reads your title, meta description, canonical, robots and Open Graph tags and flags anything missing or too long."
      description={description}
      learn={["on-page-seo-checklist", "search-intent"]}
      sections={[
        {
          heading: "How to write a title tag that ranks",
          body: (
            <>
              <p>
                Your title tag is the blue headline in Google results and the strongest on-page clue about what the page covers. Keep it under about 60 characters so
                it isn't cut off, put the main topic first, and make it match what searchers want.
              </p>
              <p>
                You don't need the exact keyword word-for-word. A page targeting "how to get YouTube subscribers" can rank with "9 Ways to Get More YouTube
                Subscribers", Google understands close variations.
              </p>
            </>
          ),
        },
        {
          heading: "Do meta descriptions matter?",
          body: (
            <p>
              Meta descriptions aren't a ranking factor, but they act as your ad copy in results and affect how many people click. Ahrefs found Google rewrites them
              about 63% of the time, so keep them short (70–155 characters), specific, and true to the page. Read our{" "}
              <Link to="/learn/on-page-seo-checklist">on-page SEO checklist</Link> for the full process.
            </p>
          ),
        },
        {
          heading: "Open Graph and Twitter tags",
          body: (
            <p>
              Open Graph tags (<code>og:title</code>, <code>og:description</code>, <code>og:image</code>) control the preview card on Facebook, LinkedIn, Slack,
              iMessage and WhatsApp. Twitter/X reads <code>twitter:card</code> plus the Open Graph tags. Use a 1200×630 image so previews look sharp everywhere.
            </p>
          ),
        },
      ]}
      faqs={[
        { q: "How long should a title tag be?", a: "Aim for 50–60 characters. Google cuts titles off at roughly 600 pixels, which is about 60 characters for most text." },
        { q: "How long should a meta description be?", a: "Between 70 and 155 characters. Longer descriptions get cut off on desktop, and mobile shows even less." },
        { q: "Why does Google show a different title than mine?", a: "Google rewrites titles that are too long, stuffed with keywords, or don't match the page content. A concise, accurate title that matches your H1 is rewritten less often." },
        { q: "Do I need a canonical tag on every page?", a: "It's a good habit. A self-referencing canonical tells search engines which URL is the main version, so tracking parameters and duplicate paths don't split your ranking signals." },
      ]}
    >
      <UrlForm label="Page URL" onSubmit={run} loading={loading} error={error} button="Check tags" />
      {result && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Google preview</p>
              <div className="mt-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-neutral-200">
                <p className="text-xs text-neutral-600">{host}</p>
                <p className="mt-1 text-xl leading-snug text-[#1a0dab]">{cut(result.title ?? "(no title)", 60)}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{cut(result.metaDescription ?? "Google will pick text from the page because there's no meta description.", 158)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">Social preview</p>
              <div className="mt-2 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-neutral-200">
                {result.og["og:image"] ? (
                  <img src={result.og["og:image"]} alt="" className="aspect-[1200/630] w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex aspect-[1200/630] items-center justify-center bg-neutral-100 text-sm text-neutral-500">No og:image set</div>
                )}
                <div className="p-3">
                  <p className="text-xs uppercase text-neutral-500">{host}</p>
                  <p className="font-semibold text-neutral-900">{result.og["og:title"] ?? result.title ?? "(no title)"}</p>
                  <p className="text-sm text-neutral-600">{cut(result.og["og:description"] ?? result.metaDescription ?? "", 120)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <ul className="space-y-2">
              {result.issues.map((i) => {
                const Icon = ICONS[i.level];
                return (
                  <li key={i.message} className="flex items-start gap-2 text-sm text-neutral-700">
                    <Icon size={18} className={`mt-0.5 shrink-0 ${COLORS[i.level]}`} aria-hidden /> {i.message}
                  </li>
                );
              })}
            </ul>
            <dl className="divide-y divide-neutral-100 rounded-lg bg-white text-sm ring-1 ring-neutral-200">
              {[
                ["Title", result.title],
                ["Description", result.metaDescription],
                ["Canonical", result.canonical],
                ["Robots", result.robots ?? "index, follow (default)"],
                ["H1", result.h1s.join(" | ") || null],
                ["Schema", result.schemaTypes.join(", ") || null],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[100px_1fr] gap-2 p-3">
                  <dt className="font-semibold text-neutral-600">{k}</dt>
                  <dd className="break-words text-neutral-900">{v ?? <span className="text-neutral-500">Missing</span>}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </ToolPage>
  );
}
