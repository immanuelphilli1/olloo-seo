import { Link } from "react-router";
import type { Route } from "./+types/sitemap-checker";
import { ToolPage, UrlForm, toolMeta, useUrlTool } from "~/components/ToolPage";
import { Badge } from "~/components/ui";

const description = "Free XML sitemap checker: find your sitemap, validate it, count its URLs and test that the pages inside actually load.";

export function meta({}: Route.MetaArgs) {
  return toolMeta("sitemap-checker", "XML Sitemap Checker & Validator (Free)", description);
}

interface Result {
  sitemaps: { url: string; status: number; urlCount: number; error: string | null }[];
  urlCount: number;
  sample: { url: string; status: number }[];
  issues: string[];
  declaredInRobots: boolean;
}

export default function SitemapChecker() {
  const { result, error, loading, run } = useUrlTool<Result>("sitemap-check");
  return (
    <ToolPage
      slug="sitemap-checker"
      h1="XML sitemap checker"
      intro="Enter your domain or sitemap URL. We find your sitemap (from robots.txt or the usual locations), validate the XML, count the URLs and test a sample of them, so you know Google is being sent to working pages."
      description={description}
      learn={["technical-seo-checklist", "seo-checklist"]}
      sections={[
        {
          heading: "What an XML sitemap is for",
          body: (
            <p>
              An XML sitemap lists the pages you want search engines to find. It helps Google and Bing discover new and updated pages faster, especially pages with
              few internal links. Most platforms create one automatically: WordPress SEO plugins at <code>/sitemap_index.xml</code>, Shopify, Wix and Squarespace at{" "}
              <code>/sitemap.xml</code>.
            </p>
          ),
        },
        {
          heading: "What belongs in a sitemap",
          body: (
            <ul>
              <li>Only pages that return 200 OK, no redirects, no 404s.</li>
              <li>Only pages you want indexed, no noindex pages, no pages blocked by robots.txt.</li>
              <li>The canonical version of each URL, using https://.</li>
              <li>Accurate lastmod dates, updated only when the content really changes.</li>
            </ul>
          ),
        },
        {
          heading: "After you fix your sitemap",
          body: (
            <p>
              Add a <code>Sitemap:</code> line to your robots.txt and submit the sitemap in Google Search Console and Bing Webmaster Tools. Bing matters for AI
              search too, ChatGPT's web search leans on Bing's index. The <Link to="/">free SEO audit</Link> generates a clean sitemap.xml from your crawl if you
              don't have one.
            </p>
          ),
        },
      ]}
      faqs={[
        { q: "Where is my sitemap?", a: "Check yourdomain.com/robots.txt for a Sitemap: line. If there isn't one, try /sitemap.xml and /sitemap_index.xml, this checker tries all three." },
        { q: "How many URLs can a sitemap have?", a: "Up to 50,000 URLs or 50 MB per file. Larger sites split them into several sitemaps listed in a sitemap index." },
        { q: "Does a sitemap guarantee indexing?", a: "No. A sitemap helps search engines find pages, but they still decide what to index based on quality, duplication and crawl signals." },
      ]}
    >
      <UrlForm label="Domain or sitemap URL" onSubmit={run} loading={loading} error={error} button="Check sitemap" />
      {result && (
        <div className="mt-8 space-y-5">
          <p className="text-sm text-neutral-700">
            Found <strong>{result.urlCount.toLocaleString()}</strong> URLs in {result.sitemaps.length} sitemap file{result.sitemaps.length === 1 ? "" : "s"}.
            {result.declaredInRobots ? " Listed in robots.txt ✓" : ""}
          </p>
          <ul className="space-y-2">
            {result.sitemaps.map((s) => (
              <li key={s.url} className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 text-sm ring-1 ring-neutral-200">
                <Badge tone={s.status === 200 && !s.error ? "good" : "bad"}>{s.status || "error"}</Badge>
                <span className="break-all text-neutral-800">{s.url}</span>
                {s.urlCount > 0 && <span className="text-neutral-500">{s.urlCount} URLs</span>}
                {s.error && <span className="w-full text-red-700">{s.error}</span>}
              </li>
            ))}
          </ul>
          {result.issues.length > 0 && (
            <ul className="space-y-2">
              {result.issues.map((i) => (
                <li key={i} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
                  {i}
                </li>
              ))}
            </ul>
          )}
          {result.sample.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-neutral-900">Sample of URLs tested</p>
              <ul className="mt-2 divide-y divide-neutral-100 rounded-lg bg-white text-sm ring-1 ring-neutral-200">
                {result.sample.map((s) => (
                  <li key={s.url} className="flex items-center gap-3 p-2.5">
                    <Badge tone={s.status === 200 ? "good" : "bad"}>{s.status || "error"}</Badge>
                    <span className="truncate text-neutral-700">{s.url}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </ToolPage>
  );
}
