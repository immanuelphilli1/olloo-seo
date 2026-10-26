import { Link } from "react-router";
import { ArrowDown } from "lucide-react";
import type { Route } from "./+types/redirect-checker";
import { ToolPage, UrlForm, toolMeta, useUrlTool } from "~/components/ToolPage";
import { Badge } from "~/components/ui";

const description = "Free redirect checker: trace every hop from a URL to its final destination, with status codes. Find redirect chains, loops and temporary 302s.";

export function meta({}: Route.MetaArgs) {
  return toolMeta("redirect-checker", "Redirect Checker: Trace 301 & 302 Chains (Free)", description);
}

interface Result {
  url: string;
  finalUrl: string;
  status: number;
  timeMs: number;
  hops: { url: string; status: number }[];
  issues: string[];
}

const tone = (status: number) => (status >= 200 && status < 300 ? "good" : status === 301 || status === 308 ? "brand" : status >= 300 && status < 400 ? "ok" : "bad");

export default function RedirectChecker() {
  const { result, error, loading, run } = useUrlTool<Result>("redirects");
  return (
    <ToolPage
      slug="redirect-checker"
      h1="Redirect checker"
      intro="Enter a URL to see every redirect between it and the final page, with the status code of each hop. Use it to find redirect chains, loops and temporary redirects that leak ranking signals."
      description={description}
      learn={["technical-seo-checklist"]}
      sections={[
        {
          heading: "301 vs 302 redirects",
          body: (
            <>
              <p>
                A <strong>301</strong> (or 308) redirect says a page has moved permanently. Search engines pass the old URL's ranking signals, like backlinks, to the
                new one. A <strong>302</strong> (or 307) says the move is temporary, so search engines may keep the old URL indexed.
              </p>
              <p>Use 301 for anything permanent: changed URLs, merged pages, HTTP to HTTPS, and www to non-www.</p>
            </>
          ),
        },
        {
          heading: "Why redirect chains hurt",
          body: (
            <p>
              A redirect chain is when URL A redirects to B, which redirects to C. Every hop adds load time, and Google may stop following long chains. Fix chains by
              pointing A straight at C, and update your internal links to use the final URL. The <Link to="/">free SEO audit</Link> finds every chain across your
              site and generates the redirect rules for Apache, nginx, Netlify and Vercel.
            </p>
          ),
        },
      ]}
      faqs={[
        { q: "How many redirects is too many?", a: "Aim for one redirect at most. Two or more hops is a chain worth fixing, and Google may stop following after several hops." },
        { q: "Do redirects lose SEO value?", a: "A single 301 redirect passes ranking signals to the new URL. Long chains, redirect loops and temporary 302 redirects are where value gets lost or delayed." },
        { q: "What is a redirect loop?", a: "A loop happens when URLs redirect to each other in a circle, so the page never loads. Browsers show an error, and search engines drop the page." },
      ]}
    >
      <UrlForm label="URL to trace" onSubmit={run} loading={loading} error={error} button="Trace redirects" placeholder="http://example.com/old-page" />
      {result && (
        <div className="mt-8 space-y-5">
          <ol className="space-y-1">
            {result.hops.map((hop, i) => (
              <li key={`${hop.url}-${i}`}>
                <div className="flex items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-neutral-200">
                  <Badge tone={tone(hop.status)}>{hop.status || "error"}</Badge>
                  <span className="break-all text-sm text-neutral-800">{hop.url}</span>
                </div>
                {i < result.hops.length - 1 && <ArrowDown size={16} className="mx-auto my-1 text-neutral-400" aria-hidden />}
              </li>
            ))}
          </ol>
          <p className="text-sm text-neutral-600">
            {result.hops.length - 1} {result.hops.length - 1 === 1 ? "redirect" : "redirects"} · {result.timeMs} ms total
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
            <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">No redirect problems found.</p>
          )}
        </div>
      )}
    </ToolPage>
  );
}
