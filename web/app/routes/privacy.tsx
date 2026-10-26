import type { Route } from "./+types/privacy";
import { PageHero } from "~/components/ui";
import { site } from "~/config/site";
import { seo } from "~/seo/meta";

export function meta({}: Route.MetaArgs) {
  return seo({
    title: `Privacy Policy | ${site.name}`,
    description: `How ${site.name} handles data: what we store when you run an audit, how long we keep it, and what we never collect.`,
    path: "/privacy",
  });
}

export default function Privacy() {
  return (
    <>
      <PageHero
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Privacy policy", path: "/privacy" },
        ]}
        eyebrow="Legal"
        title="Privacy policy"
      />
      <div className="container-page">
        <article className="article mx-auto mt-14 max-w-3xl">
        <p>
          <em>Draft, review with a legal professional before launch.</em>
        </p>
        <h2>What we collect</h2>
        <ul>
          <li>The website address you submit and the public pages we crawl from it.</li>
          <li>The audit results we generate (issues, scores and fixes).</li>
          <li>A one-way hash of your IP address, used only to apply the daily audit limit. We never store your IP address itself.</li>
        </ul>
        <h2>What we don't collect</h2>
        <p>We don't require an account, and we don't collect your name, email address or payment details. We don't sell data.</p>
        <h2>How long we keep it</h2>
        <p>Audit reports are deleted automatically 30 days after they're created. Anyone with a report's link can view it until then.</p>
        <h2>AI processing</h2>
        <p>
          When AI-written fixes are enabled, text from the public pages we crawl is sent to Anthropic's Claude API to write suggestions. Only public page content is
          sent.
        </p>
        <h2>Aggregate statistics</h2>
        <p>We count how often each type of issue appears across all audits (for example, "12% of sites block AI crawlers"). These counts contain no website addresses.</p>
        <h2>Contact</h2>
        <p>
          Email <a href={`mailto:${site.email}`}>{site.email}</a> with any privacy question or to request deletion of a report.
        </p>
        </article>
      </div>
    </>
  );
}
