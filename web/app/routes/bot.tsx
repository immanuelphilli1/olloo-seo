import type { Route } from "./+types/bot";
import { PageHero } from "~/components/ui";
import { site } from "~/config/site";
import { seo } from "~/seo/meta";

export function meta({}: Route.MetaArgs) {
  return seo({
    title: `${site.botName}: Our Website Crawler`,
    description: `What ${site.botName} is, why it visited your website, how it behaves, and how to block it with robots.txt.`,
    path: "/bot",
  });
}

export default function Bot() {
  const token = site.botName;
  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Our crawler", path: "/bot" },
        ]}
        eyebrow="Crawler information"
        title={token}
        intro={
          <p>
          {token} is the crawler behind the free {site.name} audit. It visits a website only when someone requests an audit of it, reads up to 50 pages, and
          then stops.
          </p>
        }
      />
      <div className="container-page">
        <article className="article mx-auto mt-14 max-w-3xl">
        <h2>Why did {token} visit my site?</h2>
        <p>
          Someone entered your website address into the free {site.name} audit. That could be you, a colleague, an agency you work with, or anyone curious about
          your site's SEO. We don't crawl the web on our own, every visit starts with a person's request.
        </p>
        <h2>What it collects</h2>
        <p>
          It reads the same public HTML that any visitor or search engine sees: titles, headings, text, links, images, structured data, robots.txt and your sitemap.
          It also checks response codes and load times. It never submits forms, logs in, or reads anything behind a password. Reports are deleted after 30 days.
        </p>
        <h2>How it identifies itself</h2>
        <pre>
          <code>{`${token}/1.0 (+${site.url}/bot)`}</code>
        </pre>
        <h2>How it behaves</h2>
        <ul>
          <li>It follows robots.txt rules for discovered pages. The single URL a person submits is always fetched once, like a browser visit.</li>
          <li>It fetches at most 3 pages at a time and 50 pages per audit.</li>
          <li>It only reads public pages. It never submits forms or logs in.</li>
        </ul>
        <h2>How to block it</h2>
        <p>Add this to your robots.txt:</p>
        <pre>
          <code>{`User-agent: ${token}\nDisallow: /`}</code>
        </pre>
        <p>
          Questions? Email <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
        </article>
      </div>
    </>
  );
}
