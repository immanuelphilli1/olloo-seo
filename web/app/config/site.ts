// One place for the brand. Rename the site here (and set VITE_SITE_URL) before
// launch — every title, canonical URL, schema block and article picks it up.

export const site = {
  /** Full product name, used in titles and copy. */
  name: "olloo SEO",
  /** Short brand, used for named frameworks ("olloo SEO Score") so nothing reads "SEO SEO". */
  brand: "olloo",
  /** Our crawler's user-agent token (no spaces allowed). */
  botName: "ollooSEOBot",
  url: (import.meta.env.VITE_SITE_URL || "http://localhost:5180").replace(/\/$/, ""),
  tagline: "Free SEO & AI search audit",
  description:
    "Free SEO audit tool that checks your website for 50+ Google and AI search issues, then writes the exact fixes. See why you're not ranking in Google, ChatGPT and Perplexity.",
  /** Official profiles, used in Organization schema (sameAs). Add real URLs before launch. */
  sameAs: [] as string[],
  /** Default article author. Replace with a real person — named experts are a trust signal. */
  author: {
    name: "olloo SEO Editorial Team",
    url: "/about",
  },
  email: "hello@example.com",
  ogImage: "/og-image.png",
  locale: "en_US",
};

export const absoluteUrl = (path: string) => `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
