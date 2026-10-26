import { Link } from "react-router";
import type { Route } from "./+types/about";
import { PageHero } from "~/components/ui";
import { site } from "~/config/site";
import { seo } from "~/seo/meta";

export function meta({}: Route.MetaArgs) {
  return seo({
    title: `About ${site.name}: Free SEO and AI Search Audits`,
    description: `${site.name} is a free tool that audits websites for Google and AI search visibility and writes the fixes. Here's who we are and how the audit works.`,
    path: "/about",
  });
}

export default function About() {
  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]}
        eyebrow="Our story"
        title={<>About {site.name}</>}
        intro={
          <p>
          {site.name} is a free SEO and AI-search audit. You enter a website, we check it for more than 50 issues that stop it ranking in Google or being
          recommended by AI assistants, and we write the fixes.
          </p>
        }
      />
      <div className="container-page">
        <article className="article mx-auto mt-14 max-w-3xl">

        <h2>Why we built it</h2>
        <p>
          Most SEO tools are built for SEO professionals. They show long lists of problems, assume you know what a canonical tag is, and leave the fixing to you.
          Small business owners and marketers end up with a report they can't act on.
        </p>
        <p>
          Search has also changed. People now ask ChatGPT, Perplexity, Gemini and Google's AI Overviews for recommendations. Being visible there depends on the same
          foundations as SEO crawlable pages, clear content, trust plus a few new ones, like letting AI crawlers in. We wanted one free audit that covers both.
        </p>

        <h2>How the audit works</h2>
        <ul>
          <li>
            <strong>Crawl:</strong> our crawler (<Link to="/bot">{site.botName}</Link>) reads up to 50 pages of your site and follows your robots.txt.
          </li>
          <li>
            <strong>Check:</strong> we run 50+ checks across technical SEO, on-page SEO, content, AI visibility and performance, using Google PageSpeed Insights
            for Core Web Vitals.
          </li>
          <li>
            <strong>Fix:</strong> every issue comes with a fix: code to paste, files to upload, rewritten text and steps for WordPress, Shopify, Wix, Squarespace
            and Webflow.
          </li>
          <li>
            <strong>Plan:</strong> a 30-day action plan covers the work no tool can do for you, like earning mentions on the sites AI assistants cite.
          </li>
        </ul>

        <h2>Our principles</h2>
        <ul>
          <li>
            <strong>Fundamentals first.</strong> No tricks. Search engines and AI reward pages that answer people's questions well and are easy to access.
          </li>
          <li>
            <strong>Honest advice.</strong> If something is unproven like llms.txt, we say so and rank it low.
          </li>
          <li>
            <strong>Free and private.</strong> No signup. Reports are private to whoever has the link and are deleted after 30 days. See our{" "}
            <Link to="/privacy">privacy policy</Link>.
          </li>
        </ul>

        <h2>Contact</h2>
        <p>
          Questions, bug reports or ideas: email <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
        <p>
          <Link to="/">Run a free audit →</Link>
        </p>
        </article>
      </div>
    </>
  );
}
