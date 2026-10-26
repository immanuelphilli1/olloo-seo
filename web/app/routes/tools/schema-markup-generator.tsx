import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/schema-markup-generator";
import { ToolPage, toolMeta } from "~/components/ToolPage";
import { CodeBlock } from "~/components/ui";

const description = "Free schema markup generator: create JSON-LD for Organization, LocalBusiness, Article, Product, FAQPage and Breadcrumbs. Copy and paste into your site.";

export function meta({}: Route.MetaArgs) {
  return toolMeta("schema-markup-generator", "Schema Markup Generator (JSON-LD, Free)", description);
}

type Field = { key: string; label: string; placeholder?: string; multiline?: boolean };
type SchemaType = "Organization" | "LocalBusiness" | "Article" | "Product" | "FAQPage" | "BreadcrumbList";

const FIELDS: Record<SchemaType, Field[]> = {
  Organization: [
    { key: "name", label: "Organization name", placeholder: "Acme Coffee Co" },
    { key: "url", label: "Website URL", placeholder: "https://example.com/" },
    { key: "logo", label: "Logo URL", placeholder: "https://example.com/logo.png" },
    { key: "description", label: "Short description" },
    { key: "sameAs", label: "Social profiles (one URL per line)", multiline: true, placeholder: "https://www.linkedin.com/company/acme\nhttps://www.youtube.com/@acme" },
  ],
  LocalBusiness: [
    { key: "name", label: "Business name" },
    { key: "url", label: "Website URL" },
    { key: "telephone", label: "Phone", placeholder: "+1 555 123 4567" },
    { key: "streetAddress", label: "Street address" },
    { key: "addressLocality", label: "City" },
    { key: "postalCode", label: "Postal code" },
    { key: "addressCountry", label: "Country code", placeholder: "US" },
    { key: "openingHours", label: "Opening hours", placeholder: "Mo-Fr 09:00-17:00" },
    { key: "priceRange", label: "Price range", placeholder: "$$" },
  ],
  Article: [
    { key: "headline", label: "Headline" },
    { key: "url", label: "Article URL" },
    { key: "image", label: "Image URL" },
    { key: "authorName", label: "Author name" },
    { key: "publisher", label: "Publisher name" },
    { key: "datePublished", label: "Date published", placeholder: "2026-10-20" },
    { key: "dateModified", label: "Date modified", placeholder: "2026-10-22" },
  ],
  Product: [
    { key: "name", label: "Product name" },
    { key: "image", label: "Image URL" },
    { key: "description", label: "Description" },
    { key: "brand", label: "Brand" },
    { key: "sku", label: "SKU" },
    { key: "price", label: "Price", placeholder: "29.99" },
    { key: "currency", label: "Currency", placeholder: "USD" },
    { key: "url", label: "Product URL" },
  ],
  FAQPage: [{ key: "faqs", label: "Questions and answers (question on one line, answer on the next, blank line between pairs)", multiline: true, placeholder: "How long does shipping take?\nOrders ship within 2 business days.\n\nDo you ship internationally?\nYes, to 40 countries." }],
  BreadcrumbList: [{ key: "crumbs", label: "Breadcrumbs (Name | URL, one per line, top level first)", multiline: true, placeholder: "Home | https://example.com/\nBlog | https://example.com/blog/\nMy post | https://example.com/blog/my-post" }],
};

function build(type: SchemaType, v: Record<string, string>): object {
  const clean = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, x]) => x !== "" && x !== undefined && !(Array.isArray(x) && !x.length)));
  const lines = (s = "") => s.split("\n").map((l) => l.trim()).filter(Boolean);
  const base = { "@context": "https://schema.org", "@type": type };
  switch (type) {
    case "Organization":
      return clean({ ...base, name: v.name, url: v.url, logo: v.logo, description: v.description, sameAs: lines(v.sameAs) });
    case "LocalBusiness":
      return clean({
        ...base,
        name: v.name,
        url: v.url,
        telephone: v.telephone,
        priceRange: v.priceRange,
        openingHours: v.openingHours,
        address: clean({ "@type": "PostalAddress", streetAddress: v.streetAddress, addressLocality: v.addressLocality, postalCode: v.postalCode, addressCountry: v.addressCountry }),
      });
    case "Article":
      return clean({
        ...base,
        headline: v.headline,
        mainEntityOfPage: v.url,
        image: v.image,
        datePublished: v.datePublished,
        dateModified: v.dateModified || v.datePublished,
        author: v.authorName ? { "@type": "Person", name: v.authorName } : undefined,
        publisher: v.publisher ? { "@type": "Organization", name: v.publisher } : undefined,
      });
    case "Product":
      return clean({
        ...base,
        name: v.name,
        image: v.image,
        description: v.description,
        sku: v.sku,
        brand: v.brand ? { "@type": "Brand", name: v.brand } : undefined,
        offers: v.price ? { "@type": "Offer", price: v.price, priceCurrency: v.currency || "USD", availability: "https://schema.org/InStock", url: v.url } : undefined,
      });
    case "FAQPage": {
      const pairs = (v.faqs ?? "").split(/\n\s*\n/).map((block) => lines(block)).filter((l) => l.length >= 2);
      return { ...base, mainEntity: pairs.map(([q, ...a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a.join(" ") } })) };
    }
    case "BreadcrumbList":
      return {
        ...base,
        itemListElement: lines(v.crumbs).map((line, i) => {
          const [name, url] = line.split("|").map((s) => s.trim());
          return { "@type": "ListItem", position: i + 1, name, item: url };
        }),
      };
  }
}

export default function SchemaMarkupGenerator() {
  const [type, setType] = useState<SchemaType>("Organization");
  const [values, setValues] = useState<Record<string, string>>({});
  const code = useMemo(() => `<script type="application/ld+json">\n${JSON.stringify(build(type, values), null, 2)}\n</script>`, [type, values]);

  return (
    <ToolPage
      slug="schema-markup-generator"
      h1="Schema markup generator"
      intro="Fill in a few fields and get valid JSON-LD structured data to paste into your page. Schema markup tells Google and other systems exactly what your content is: your business, articles, products or FAQs."
      description={description}
      learn={["schema-markup", "what-is-aeo"]}
      sections={[
        {
          heading: "Which schema should you add?",
          body: (
            <ul>
              <li>
                <strong>Organization</strong> on your homepage, every site. Include sameAs links to your social profiles.
              </li>
              <li>
                <strong>LocalBusiness</strong> instead of Organization if customers visit a physical location.
              </li>
              <li>
                <strong>Article</strong> on blog posts and guides, with a real author and dates.
              </li>
              <li>
                <strong>Product</strong> on product pages, with price and availability.
              </li>
              <li>
                <strong>FAQPage</strong> where the questions and answers are visible on the page.
              </li>
              <li>
                <strong>BreadcrumbList</strong> on pages below the top level of your site.
              </li>
            </ul>
          ),
        },
        {
          heading: "How to add the code",
          body: (
            <p>
              Paste the <code>&lt;script type="application/ld+json"&gt;</code> block into the page's <code>&lt;head&gt;</code> (or anywhere in the body). On WordPress,
              use a plugin like WPCode; on Shopify, edit <code>theme.liquid</code>; on Wix, use Advanced SEO → Structured data. Then test the page in Google's Rich
              Results Test. Read the <Link to="/learn/schema-markup">schema markup guide</Link> for full examples.
            </p>
          ),
        },
      ]}
      faqs={[
        { q: "Does schema markup improve rankings?", a: "Schema isn't a direct ranking factor, but it can earn rich results (stars, prices, breadcrumbs) that raise click-through rates, and it helps machines understand your content." },
        { q: "Does schema help with AI search?", a: "The evidence is mixed, there's no confirmed data that schema alone increases AI citations. It doesn't hurt, and it makes your content easier for any system to understand, so it's a good habit." },
        { q: "What format should I use?", a: "JSON-LD. It's the format Google recommends, and it sits in one script tag instead of being mixed into your HTML." },
        { q: "How do I check my schema is valid?", a: "Paste your URL into Google's Rich Results Test or validator.schema.org. Both show errors and which rich results the page is eligible for." },
      ]}
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div>
            <label htmlFor="sg-type" className="block text-sm font-semibold text-neutral-900">
              Schema type
            </label>
            <select
              id="sg-type"
              className="input mt-2"
              value={type}
              onChange={(e) => {
                setType(e.target.value as SchemaType);
                setValues({});
              }}
            >
              {(Object.keys(FIELDS) as SchemaType[]).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          {FIELDS[type].map((f) => (
            <div key={f.key}>
              <label htmlFor={`sg-${f.key}`} className="block text-sm font-medium text-neutral-800">
                {f.label}
              </label>
              {f.multiline ? (
                <textarea
                  id={`sg-${f.key}`}
                  rows={6}
                  className="input mt-1 text-sm"
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              ) : (
                <input
                  id={`sg-${f.key}`}
                  className="input mt-1 py-2 text-sm"
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <CodeBlock code={code} filename={`${type} JSON-LD`} />
        </div>
      </div>
    </ToolPage>
  );
}
