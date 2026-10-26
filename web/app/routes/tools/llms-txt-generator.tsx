import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/llms-txt-generator";
import { ToolPage, UrlForm, toolMeta, useUrlTool } from "~/components/ToolPage";
import { CopyButton, DownloadButton } from "~/components/ui";

const description = "Free llms.txt generator: create an llms.txt file for your website from its pages in seconds. Edit it, then download and upload it to your site root.";

export function meta({}: Route.MetaArgs) {
  return toolMeta("llms-txt-generator", "llms.txt Generator: Create Your File Free", description);
}

export default function LlmsTxtGenerator() {
  const { result, error, loading, run } = useUrlTool<{ content: string }>("llms-txt");
  const [text, setText] = useState("");
  useEffect(() => {
    if (result) setText(result.content);
  }, [result]);

  return (
    <ToolPage
      slug="llms-txt-generator"
      h1="llms.txt generator"
      intro="Enter your homepage and we'll read your site's main pages to draft an llms.txt file: a short Markdown summary of who you are and where your key content lives. Edit the draft, then download it."
      description={description}
      learn={["llms-txt", "how-to-rank-in-chatgpt"]}
      sections={[
        {
          heading: "What llms.txt is (and isn't)",
          body: (
            <>
              <p>
                llms.txt is a proposed standard: a Markdown file at <code>yourdomain.com/llms.txt</code> that gives AI systems a summary of your site and links to
                your most important pages. Think of it as a short, AI-friendly table of contents.
              </p>
              <p>
                Be realistic about it. As of the Ahrefs AEO course, no major AI company has confirmed its crawlers use llms.txt. It's quick and harmless to add, but
                it matters far less than letting AI crawlers in and serving your content as HTML. Read more in{" "}
                <Link to="/learn/llms-txt">what is llms.txt?</Link>
              </p>
            </>
          ),
        },
        {
          heading: "What to put in it",
          body: (
            <ul>
              <li>An H1 with your brand name.</li>
              <li>A one-paragraph summary in a blockquote: what you do and for whom.</li>
              <li>Sections of links to your key pages, each with a one-line description.</li>
              <li>Specific facts AI often gets wrong about you, pricing model, locations, founding year.</li>
            </ul>
          ),
        },
      ]}
      faqs={[
        { q: "Where do I upload llms.txt?", a: "To the root of your site, next to robots.txt, so it loads at https://yourdomain.com/llms.txt. Hosted platforms like Shopify and Wix usually can't serve custom root files." },
        { q: "Does llms.txt help me rank in ChatGPT?", a: "There's no evidence yet that it does. Focus first on allowing AI search crawlers, serving content as HTML and earning mentions on sites AI cites." },
        { q: "What's the difference between llms.txt and robots.txt?", a: "robots.txt tells crawlers what they may access and is widely followed. llms.txt is a voluntary summary of your content for AI, with no confirmed support from major providers." },
      ]}
    >
      <UrlForm label="Your homepage" onSubmit={run} loading={loading} error={error} button="Generate llms.txt" />
      {result && (
        <div className="mt-8">
          <label htmlFor="llms-output" className="block text-sm font-semibold text-neutral-900">
            Your llms.txt (edit before downloading)
          </label>
          <textarea id="llms-output" rows={18} className="input mt-2 font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="mt-3 flex gap-2">
            <DownloadButton filename="llms.txt" content={text} />
            <CopyButton text={text} />
          </div>
        </div>
      )}
    </ToolPage>
  );
}
