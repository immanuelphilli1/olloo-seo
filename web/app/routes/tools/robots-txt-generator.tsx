import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/robots-txt-generator";
import { ToolPage, toolMeta } from "~/components/ToolPage";
import { CodeBlock, DownloadButton } from "~/components/ui";

const description = "Free robots.txt generator. Create a robots.txt that lets Google, Bing and AI search crawlers in, blocks private folders, and lists your sitemap.";

export function meta({}: Route.MetaArgs) {
  return toolMeta("robots-txt-generator", "robots.txt Generator for SEO & AI Crawlers", description);
}

const SEARCH_AI = ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Claude-SearchBot"];
const TRAINING_AI = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot"];
const PRESETS: Record<string, string> = {
  wordpress: "/wp-admin/\n/?s=\n/search/",
  shopify: "/cart\n/checkout\n/account\n/search",
  generic: "/admin/\n/cart/\n/checkout/\n/search",
};

export default function RobotsTxtGenerator() {
  const [domain, setDomain] = useState("");
  const [allowSearchAi, setAllowSearchAi] = useState(true);
  const [allowTraining, setAllowTraining] = useState(true);
  const [disallow, setDisallow] = useState("/admin/\n/cart/\n/checkout/");
  const [allowAdminAjax, setAllowAdminAjax] = useState(false);

  const content = useMemo(() => {
    const host = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "example.com";
    const paths = disallow
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => (p.startsWith("/") ? p : `/${p}`));
    const lines = ["# robots.txt generated with care for search engines and AI assistants", "User-agent: *"];
    lines.push(...(paths.length ? paths.map((p) => `Disallow: ${p}`) : ["Allow: /"]));
    if (allowAdminAjax) lines.push("Allow: /wp-admin/admin-ajax.php");
    lines.push("");
    if (allowSearchAi) {
      lines.push("# AI search crawlers: let them read and cite your pages", ...SEARCH_AI.map((b) => `User-agent: ${b}`), "Allow: /", "");
    } else {
      lines.push("# AI search crawlers blocked (your pages won't be cited in AI answers)", ...SEARCH_AI.map((b) => `User-agent: ${b}`), "Disallow: /", "");
    }
    if (!allowTraining) {
      lines.push("# AI training crawlers blocked", ...TRAINING_AI.map((b) => `User-agent: ${b}`), "Disallow: /", "");
    }
    lines.push(`Sitemap: https://${host}/sitemap.xml`);
    return lines.join("\n") + "\n";
  }, [domain, allowSearchAi, allowTraining, disallow, allowAdminAjax]);

  return (
    <ToolPage
      slug="robots-txt-generator"
      h1="robots.txt generator"
      intro="Build a correct robots.txt in seconds. It lets Google, Bing and AI search crawlers read your site, keeps private folders out of search, lists your sitemap, and lets you decide whether AI companies may train on your content."
      description={description}
      learn={["robots-txt-ai-crawlers", "technical-seo-checklist"]}
      sections={[
        {
          heading: "How to use the generated file",
          body: (
            <ol>
              <li>Fill in your domain and the folders you want to keep out of search.</li>
              <li>Choose how to treat AI search and AI training crawlers.</li>
              <li>Download robots.txt and upload it to the root of your site so it loads at yourdomain.com/robots.txt.</li>
              <li>
                Test it with the <Link to="/tools/robots-txt-checker">robots.txt checker</Link> and the <Link to="/tools/ai-crawler-checker">AI crawler checker</Link>.
              </li>
            </ol>
          ),
        },
        {
          heading: "Should you allow AI crawlers?",
          body: (
            <>
              <p>
                For most businesses, yes, at least the search crawlers. ChatGPT, Perplexity and Claude can only cite pages their crawlers are allowed to read. Ahrefs
                found AI search visitors converted 23 times better than regular organic visitors on their site.
              </p>
              <p>
                Training crawlers are a separate choice. Allowing them means your content may help train future models; blocking them doesn't affect today's AI
                search results.
              </p>
            </>
          ),
        },
        {
          heading: "What not to block",
          body: (
            <p>
              Don't block your CSS, JavaScript or image folders, Google needs them to render your pages. And don't use robots.txt to remove pages from Google: a
              blocked page can still be indexed from links. Use a noindex tag instead.
            </p>
          ),
        },
      ]}
      faqs={[
        { q: "Where do I upload robots.txt?", a: "To the root folder of your website, so it loads at https://yourdomain.com/robots.txt. On WordPress you can edit it in Yoast (Tools → File editor) or Rank Math (General Settings → Edit robots.txt)." },
        { q: "Does Shopify let me edit robots.txt?", a: "Yes, through a robots.txt.liquid template in your theme code. Shopify's default file is already sensible, so only add the AI crawler rules you need." },
        { q: "What does Disallow: / mean?", a: "It blocks the whole site for the crawlers in that group. Under User-agent: * it blocks every crawler, a common accident when a site goes live from a staging server." },
        { q: "Is blocking AI training crawlers bad for SEO?", a: "No. Training crawlers don't affect Google rankings or live AI search. The trade-off is long-term: brands mentioned widely in training data may be recommended more by future models." },
      ]}
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <div>
            <label htmlFor="rg-domain" className="block text-sm font-semibold text-neutral-900">
              Your domain
            </label>
            <input id="rg-domain" className="input mt-2" placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
          </div>
          <fieldset>
            <legend className="text-sm font-semibold text-neutral-900">AI crawlers</legend>
            <label className="mt-2 flex items-start gap-2 text-sm text-neutral-700">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={allowSearchAi} onChange={(e) => setAllowSearchAi(e.target.checked)} />
              Allow AI search crawlers (ChatGPT, Perplexity, Claude) — recommended
            </label>
            <label className="mt-2 flex items-start gap-2 text-sm text-neutral-700">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={allowTraining} onChange={(e) => setAllowTraining(e.target.checked)} />
              Allow AI training crawlers (GPTBot, ClaudeBot, Google-Extended)
            </label>
          </fieldset>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="rg-disallow" className="text-sm font-semibold text-neutral-900">
                Folders to keep out of search (one per line)
              </label>
              <div className="flex gap-1 text-xs">
                {Object.keys(PRESETS).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="rounded border border-neutral-300 bg-white px-2 py-0.5 capitalize text-neutral-700 hover:bg-neutral-50"
                    onClick={() => {
                      setDisallow(PRESETS[p]);
                      setAllowAdminAjax(p === "wordpress");
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <textarea id="rg-disallow" rows={6} className="input mt-2 font-mono text-sm" value={disallow} onChange={(e) => setDisallow(e.target.value)} />
          </div>
        </div>
        <div>
          <CodeBlock code={content} filename="robots.txt" />
          <div className="mt-3">
            <DownloadButton filename="robots.txt" content={content} />
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
