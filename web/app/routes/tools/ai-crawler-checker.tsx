import { Link } from "react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Route } from "./+types/ai-crawler-checker";
import { ToolPage, UrlForm, toolMeta, useUrlTool } from "~/components/ToolPage";
import { Badge } from "~/components/ui";

const description = "Check if ChatGPT, Perplexity, Claude, Gemini and Google can crawl your website. Free AI crawler checker that tests your robots.txt for every major AI bot.";

export function meta({}: Route.MetaArgs) {
  return toolMeta("ai-crawler-checker", "AI Crawler Checker: Is Your Site Blocked From ChatGPT?", description);
}

interface Result {
  url: string;
  robotsFound: boolean;
  cloudflareManaged: boolean;
  metaNoindex: boolean;
  headerNoindex: boolean;
  bots: { bot: string; owner: string; purpose: string; kind: "search" | "training"; allowed: boolean }[];
}

export default function AiCrawlerChecker() {
  const { result, error, loading, run } = useUrlTool<Result>("ai-crawler-check");
  const blockedSearch = result?.bots.filter((b) => b.kind === "search" && !b.allowed) ?? [];

  return (
    <ToolPage
      slug="ai-crawler-checker"
      h1="AI crawler checker"
      intro="Find out in seconds whether ChatGPT, Perplexity, Claude, Gemini and Google are allowed to crawl your website. If an AI crawler is blocked, that assistant can't read your pages so it can't cite or recommend you."
      description={description}
      learn={["robots-txt-ai-crawlers", "how-to-rank-in-chatgpt", "what-is-aeo"]}
      sections={[
        {
          heading: "Why AI crawler access matters",
          body: (
            <>
              <p>
                AI assistants find pages to cite by sending crawlers to your site. If your robots.txt blocks a crawler, that assistant treats your pages as off-limits.
                You can rank #1 in Google and still be invisible in ChatGPT.
              </p>
              <p>
                According to Ahrefs, about 5.9% of 140 million websites block GPTBot, OpenAI's crawler. Many site owners never chose this: old robots.txt templates
                and default security settings (like Cloudflare's AI bot blocking) add the rules for them.
              </p>
            </>
          ),
        },
        {
          heading: "Search crawlers vs training crawlers",
          body: (
            <>
              <p>AI companies run two kinds of crawlers, and it's worth treating them differently.</p>
              <ul>
                <li>
                  <strong>Search and citation crawlers</strong> (OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot) fetch pages to answer questions right
                  now. Block these and you lose citations and referral traffic.
                </li>
                <li>
                  <strong>Training crawlers</strong> (GPTBot, ClaudeBot, Google-Extended) collect content to train future models. Blocking them is a business choice,
                  but brands that appear widely in training data are more likely to be recommended later.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "How to unblock AI crawlers",
          body: (
            <>
              <p>
                Edit your robots.txt and remove any <code>Disallow: /</code> rule under the AI search bots you want to allow. Our{" "}
                <Link to="/tools/robots-txt-generator">robots.txt generator</Link> builds a file that welcomes AI search while letting you decide about training.
              </p>
              <p>
                If you use Cloudflare, also check its bot settings, Cloudflare can block AI crawlers at the network level even when your robots.txt allows them.
              </p>
            </>
          ),
        },
      ]}
      faqs={[
        { q: "Which AI crawlers should I allow?", a: "Allow the search and citation crawlers, OAI-SearchBot and ChatGPT-User (ChatGPT), PerplexityBot (Perplexity), Claude-SearchBot (Claude), Googlebot and Bingbot. These decide whether AI assistants can cite you today." },
        { q: "Does blocking GPTBot remove me from ChatGPT?", a: "Blocking GPTBot stops OpenAI from using your pages to train future models. ChatGPT's live search uses OAI-SearchBot and ChatGPT-User, so check those separately. this tool shows all three." },
        { q: "Does this check also look at noindex?", a: "Yes. A noindex tag or X-Robots-Tag header keeps pages out of search indexes that many AI assistants rely on, so the checker flags those too." },
        { q: "Is robots.txt enforced?", a: "robots.txt is a request, not a lock. Reputable crawlers from OpenAI, Anthropic, Google, Microsoft and Perplexity say they follow it, which is why a blocking rule usually means you're invisible to them." },
      ]}
    >
      <UrlForm label="Enter your website" onSubmit={run} loading={loading} error={error} button="Check AI access" />
      {result && (
        <div className="mt-8 space-y-4">
          {blockedSearch.length > 0 ? (
            <p className="rounded-lg bg-red-50 p-4 font-medium text-red-800 ring-1 ring-red-200">
              {blockedSearch.length} AI search {blockedSearch.length === 1 ? "crawler is" : "crawlers are"} blocked. These assistants can't read or cite your site.
            </p>
          ) : (
            <p className="rounded-lg bg-emerald-50 p-4 font-medium text-emerald-800 ring-1 ring-emerald-200">All AI search crawlers can access your homepage.</p>
          )}
          {!result.robotsFound && <p className="text-sm text-neutral-600">No robots.txt found, all crawlers are allowed by default.</p>}
          {result.cloudflareManaged && (
            <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">Your robots.txt contains Cloudflare-managed AI rules. Check your Cloudflare bot settings.</p>
          )}
          {(result.metaNoindex || result.headerNoindex) && (
            <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">This page has a noindex instruction, so search engines won't index it.</p>
          )}
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2">Crawler</th>
                  <th className="px-4 py-2">Used for</th>
                  <th className="px-4 py-2">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {result.bots.map((b) => (
                  <tr key={b.bot}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neutral-900">{b.bot}</p>
                      <p className="text-xs text-neutral-500">{b.owner}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {b.purpose} <Badge tone={b.kind === "search" ? "brand" : "neutral"}>{b.kind}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {b.allowed ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 size={16} aria-hidden /> Allowed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                          <XCircle size={16} aria-hidden /> Blocked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ToolPage>
  );
}
