import { Link } from "react-router";
import type { Route } from "./+types/robots-txt-checker";
import { ToolPage, UrlForm, toolMeta, useUrlTool } from "~/components/ToolPage";
import { Badge, CodeBlock } from "~/components/ui";

const description = "Free robots.txt checker: fetch and test any site's robots.txt, see which search engines and AI crawlers are blocked, and find errors to fix.";

export function meta({}: Route.MetaArgs) {
  return toolMeta("robots-txt-checker", "robots.txt Checker & Tester (Free)", description);
}

interface Result {
  url: string;
  status: number;
  content: string | null;
  sitemaps: string[];
  testedUrl: string;
  bots: { bot: string; owner: string; kind: string; allowed: boolean }[];
  issues: string[];
}

export default function RobotsTxtChecker() {
  const { result, error, loading, run } = useUrlTool<Result>("robots-check");
  return (
    <ToolPage
      slug="robots-txt-checker"
      h1="robots.txt checker"
      intro="Paste any URL to fetch its robots.txt, test whether Google, Bing and AI crawlers can reach that page, and spot the mistakes that quietly block your site from search."
      description={description}
      learn={["robots-txt-ai-crawlers", "technical-seo-checklist"]}
      sections={[
        {
          heading: "What robots.txt does",
          body: (
            <>
              <p>
                robots.txt is a plain-text file at the root of your domain (<code>yourdomain.com/robots.txt</code>). It tells crawlers which parts of your site they
                may visit. Each group starts with a <code>User-agent</code> line naming a crawler, followed by <code>Disallow</code> and <code>Allow</code> rules.
              </p>
              <p>
                One wrong line can remove your whole site from Google. <code>User-agent: *</code> followed by <code>Disallow: /</code> tells every crawler to stay
                away from every page.
              </p>
            </>
          ),
        },
        {
          heading: "Common robots.txt mistakes",
          body: (
            <ul>
              <li>Leaving a development-site block (<code>Disallow: /</code>) in place after launch.</li>
              <li>Blocking CSS and JavaScript folders, so Google can't render your pages properly.</li>
              <li>Blocking AI search crawlers like OAI-SearchBot or PerplexityBot without meaning to.</li>
              <li>Not listing your sitemap with a <code>Sitemap:</code> line.</li>
              <li>Using robots.txt to hide pages from Google use a noindex tag for that instead; blocked pages can still be indexed from links.</li>
            </ul>
          ),
        },
        {
          heading: "Fixing your robots.txt",
          body: (
            <p>
              Use the <Link to="/tools/robots-txt-generator">robots.txt generator</Link> to create a clean file, upload it to your site root, then run this checker
              again. For a check of your whole site, including pages blocked by robots.txt that appear in your sitemap, run the <Link to="/">free SEO audit</Link>.
            </p>
          ),
        },
      ]}
      faqs={[
        { q: "Where is my robots.txt file?", a: "It always lives at the root of your domain, for example https://example.com/robots.txt. Each subdomain (like shop.example.com) has its own robots.txt." },
        { q: "What happens if I don't have a robots.txt?", a: "Crawlers assume everything is allowed, which is fine for most small sites. You just lose an easy way to point crawlers to your sitemap." },
        { q: "Does robots.txt remove pages from Google?", a: "No. robots.txt stops crawling, not indexing a blocked page can still appear in results if other sites link to it. To remove a page, allow crawling and add a noindex tag." },
        { q: "How do I test a specific page?", a: "Enter the full page URL instead of just the domain. The checker fetches the site's robots.txt and tests that exact URL for every crawler." },
      ]}
    >
      <UrlForm label="Website or page URL to test" onSubmit={run} loading={loading} error={error} button="Test robots.txt" />
      {result && (
        <div className="mt-8 space-y-5">
          <p className="text-sm text-neutral-600">
            {result.url} returned <Badge tone={result.status === 200 ? "good" : result.status === 404 ? "ok" : "bad"}>{result.status || "error"}</Badge>
          </p>
          {result.issues.length > 0 ? (
            <ul className="space-y-2">
              {result.issues.map((i) => (
                <li key={i} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
                  {i}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">No problems found in this robots.txt.</p>
          )}
          <div>
            <p className="text-sm font-semibold text-neutral-900">Can crawlers reach {result.testedUrl}?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.bots.map((b) => (
                <Badge key={b.bot} tone={b.allowed ? "good" : "bad"}>
                  {b.bot}: {b.allowed ? "allowed" : "blocked"}
                </Badge>
              ))}
            </div>
          </div>
          {result.sitemaps.length > 0 && (
            <p className="text-sm text-neutral-600">
              Sitemaps listed: {result.sitemaps.map((s) => <code key={s} className="mr-2 rounded bg-white px-1">{s}</code>)}
            </p>
          )}
          {result.content !== null && <CodeBlock code={result.content || "(empty file)"} filename="robots.txt" />}
        </div>
      )}
    </ToolPage>
  );
}
