import type { ActionPlan, Finding, SiteContext } from "../types.ts";
import { siteName } from "./files.ts";

/**
 * A personalized 30-day plan built from the audit's findings, following the
 * Foundation → Money page → First cluster → Promote & monitor structure.
 */
export function buildActionPlan(ctx: SiteContext, findings: Finding[]): ActionPlan {
  const critical = findings.filter((f) => f.severity === "critical").map((f) => f.title);
  const onpage = findings.filter((f) => f.category === "onpage").map((f) => f.title);
  const has = (id: string) => findings.some((f) => f.checkId === id);

  const week1 = [
    ...critical.map((t) => `Fix: ${t}`),
    "Verify your site in Google Search Console and Bing Webmaster Tools (ChatGPT search leans on Bing's index).",
    has("sitemap-missing") ? "Publish the sitemap.xml from this report and submit it in both tools." : "Submit your sitemap in both tools if you haven't already.",
    ...(ctx.keywords.length
      ? [
          `Your target keywords: ${ctx.keywords.map((k) => `“${k}”`).join(", ")}. Google each one and note what type of page ranks (blog post, product page, tool).`,
          ...ctx.keywordResults.filter((r) => !r.bestPage).map((r) => `Create a page for “${r.keyword}”. Best format: ${r.expectedPage.toLowerCase()}.`),
          "Grow your list to 10–15 keywords with the free Keyword Generator, then re-run this audit with them.",
        ]
      : ["List 10–15 keywords your customers search for (try the free Keyword Generator). Google each one and note what type of page ranks (blog post, product page, tool)."]),
  ];
  const week2 = [
    ...onpage.slice(0, 4).map((t) => `Fix: ${t}`),
    "Pick your single most important \"money page\", the page that turns visitors into customers, and make it the best answer on the web for its keyword.",
    "Add internal links to your money page from your other relevant pages.",
  ];
  const week3 = [
    has("stale-content") ? "Refresh your 3 most important outdated pages with new facts, examples and a visible updated date." : "Update your top 3 pages with fresh stats and examples.",
    "Publish one supporting article in a topic cluster around your money page (a how-to, comparison or \"best X\" list) and link it to the money page.",
    "Rewrite key sections to put the answer first, keep each section self-contained, and name specific products, brands and numbers.",
  ];
  const week4 = [
    "Spend 15 minutes a day answering journalist requests on Featured.com, Qwoted or Help a B2B Writer to earn mentions and links.",
    "Ask ChatGPT, Perplexity and Gemini the questions below in a private window, note whether your brand appears and who appears instead.",
    "In Search Console, look for rising impressions and new keywords, those are your next pages to improve.",
    "Plan your next topic cluster (not a random topic).",
  ];

  const name = siteName(ctx);
  return {
    niche: null,
    weeks: [
      { title: "Week 1 — Foundation", tasks: week1 },
      { title: "Week 2 — Your most important page", tasks: week2 },
      { title: "Week 3 — Your first topic cluster", tasks: week3 },
      { title: "Week 4 — Promote and monitor", tasks: week4 },
    ],
    offSite: [
      { bucket: "fix", task: `Search for "${name}" and correct any outdated or wrong information about you on directories, review sites and social profiles.` },
      { bucket: "build", task: "Create comparison and \"best [your category]\" content, listicles are the most-cited page type in ChatGPT answers." },
      { bucket: "build", task: "Publish original data (a survey, benchmark or stats from your own customers). Specific numbers get cited and linked." },
      { bucket: "build", task: "Make YouTube videos for searches where videos already rank on Google, YouTube is one of the most-cited sources in AI answers." },
      { bucket: "influence", task: "Find \"best [your category]\" listicles that mention your competitors but not you, and pitch the authors a reason to include you." },
      { bucket: "influence", task: "Answer real questions in Reddit and niche forums where your product genuinely helps, no spam." },
      { bucket: "influence", task: "Name your own frameworks and methods after your brand so AI credits you when it repeats the idea." },
    ],
    prompts: [
      "What are the best [your product category] for [your target customer]?",
      `Is ${name} any good?`,
      `What are the alternatives to ${name}?`,
      `${name} vs [your main competitor], which is better?`,
      "How do I [the main problem you solve]?",
      "What should I look for when choosing a [your product category]?",
      "Recommend a [your product category] under [typical budget].",
      "Which [your product category] do experts recommend in [current year]?",
      "What's the easiest way to [the main job your customers hire you for]?",
      `Who are the leading companies for [your product category] in [your city/country]?`,
    ],
    faqSchema: null,
    aiGenerated: false,
  };
}
