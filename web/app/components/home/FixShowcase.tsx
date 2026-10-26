import { useState } from "react";
import { Check, X } from "lucide-react";

// Interactive before/after examples of fixes the audit writes. Illustrative
// content (example.com), not real customer data.

const examples = [
  {
    id: "title",
    tab: "Title & description",
    file: "<head> of /pricing",
    before: `<title>Pricing</title>
<!-- no meta description -->`,
    after: `<title>Pricing Plans for Small Teams | Example Co</title>
<meta name="description" content="Compare Example Co
plans from $9/month. Every plan includes unlimited
projects, 24/7 support and a 14-day free trial.">`,
    note: "Titles and descriptions rewritten for every flagged page, sized to fit Google's results.",
  },
  {
    id: "robots",
    tab: "robots.txt",
    file: "example.com/robots.txt",
    before: `User-agent: GPTBot
Disallow: /

User-agent: *
Disallow: /`,
    after: `User-agent: GPTBot
Disallow: /

User-agent: *
# Disallow: /   <- removed: this blocked search engines
Allow: /

# Let AI search engines read and cite your pages
User-agent: OAI-SearchBot
User-agent: PerplexityBot
Allow: /

Sitemap: https://example.com/sitemap.xml`,
    note: "Your existing rules are kept. Only the lines blocking Google and AI search are changed.",
  },
  {
    id: "schema",
    tab: "Schema",
    file: "<head> of the homepage",
    before: `<!-- no structured data -->`,
    after: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Example Co",
  "url": "https://example.com/",
  "logo": "https://example.com/logo.png",
  "sameAs": ["https://www.linkedin.com/company/example"]
}
</script>`,
    note: "JSON-LD pre-filled from your own pages, ready to paste.",
  },
  {
    id: "redirects",
    tab: "Redirects",
    file: ".htaccess",
    before: `/old-pricing → /pricing-2023 → /pricing
(2 hops)`,
    after: `Redirect 301 /old-pricing https://example.com/pricing
Redirect 301 /pricing-2023 https://example.com/pricing`,
    note: "Chains collapsed to one hop, also generated for nginx, Netlify and Vercel.",
  },
];

export function FixShowcase() {
  const [active, setActive] = useState(examples[0].id);
  const example = examples.find((e) => e.id === active)!;
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Example fixes">
        {examples.map((e) => (
          <button
            key={e.id}
            type="button"
            role="tab"
            aria-selected={active === e.id}
            aria-controls={`fix-panel-${e.id}`}
            id={`fix-tab-${e.id}`}
            onClick={() => setActive(e.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active === e.id ? "bg-brand-500 text-ink" : "bg-white/5 text-neutral-300 ring-1 ring-white/10 hover:bg-white/10"
            }`}
          >
            {e.tab}
          </button>
        ))}
      </div>
      <div id={`fix-panel-${example.id}`} role="tabpanel" aria-labelledby={`fix-tab-${example.id}`} className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-800">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-xs">
            <X size={14} className="text-red-400" aria-hidden />
            <span className="font-medium text-neutral-300">Before</span>
            <span className="ml-auto truncate font-mono text-neutral-400">{example.file}</span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-neutral-400">
            <code>{example.before}</code>
          </pre>
        </div>
        <div className="overflow-hidden rounded-2xl border border-brand-500/30 bg-ink-800 shadow-[0_20px_60px_-25px_rgba(255,90,31,0.5)]">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-xs">
            <Check size={14} className="text-emerald-400" aria-hidden />
            <span className="font-medium text-white">After: written by the audit</span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-neutral-100">
            <code>{example.after}</code>
          </pre>
        </div>
      </div>
      <p className="mt-4 text-sm text-neutral-400">{example.note}</p>
    </div>
  );
}
