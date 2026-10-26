import { platformSteps } from "../platforms/steps.ts";
import type { CheckDefinition, FindingItem } from "../types.ts";
import {
  descriptionFromContent,
  duplicates,
  indexablePages,
  isUtilityPage,
  path,
  plural,
  suggestTitle,
  truncateAtWord,
} from "./util.ts";

const LEARN = "on-page-seo-checklist";

export const onpageChecks: CheckDefinition[] = [
  {
    id: "title-missing",
    category: "onpage",
    severity: "critical",
    title: "Missing page titles",
    why: "The title tag is the blue headline in Google results and the strongest on-page hint about what a page is about. Without one, Google guesses, usually badly.",
    learnSlug: LEARN,
    run: (ctx) => indexablePages(ctx).filter((p) => !p.title).map((p) => ({ url: p.finalUrl, suggested: suggestTitle(p, ctx) })),
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "has" : "have"} no title tag.`,
    fix: (_, ctx) => ({
      kind: "title",
      summary: "Add a unique, descriptive title (under 60 characters) to each page. Suggestions are listed per page.",
      platformSteps: platformSteps("title", ctx.platform),
    }),
  },
  {
    id: "title-length",
    category: "onpage",
    severity: "notice",
    title: "Titles too long or too short",
    why: "Google cuts titles off at roughly 60 characters (about 600 pixels). Very short titles waste space you could use to describe the page and win the click.",
    learnSlug: LEARN,
    run: (ctx) =>
      indexablePages(ctx)
        .filter((p) => p.title && (p.title.length > 60 || p.title.length < 20))
        .map((p) => ({
          url: p.finalUrl,
          detail: `${p.title!.length} characters`,
          current: p.title!,
          suggested: p.title!.length > 60 ? truncateAtWord(p.title!, 60) : suggestTitle(p, ctx),
        })),
    summarize: (items) => `${plural(items.length, "title")} ${items.length === 1 ? "is" : "are"} outside the ideal 20–60 character range.`,
    fix: (_, ctx) => ({
      kind: "title",
      summary: "Rewrite each title to 20–60 characters with the main topic first. Suggested rewrites are listed per page.",
      platformSteps: platformSteps("title", ctx.platform),
    }),
  },
  {
    id: "title-duplicate",
    category: "onpage",
    severity: "warning",
    title: "Duplicate titles",
    why: "When several pages share the same title, Google can't tell which one to show for a search, and they end up competing with each other.",
    learnSlug: LEARN,
    run: (ctx) => {
      const items: FindingItem[] = [];
      for (const [, list] of duplicates(indexablePages(ctx), (p) => p.title)) {
        for (const p of list) items.push({ url: p.finalUrl, current: p.title!, detail: `Shared with ${list.length - 1} other ${list.length === 2 ? "page" : "pages"}`, suggested: suggestTitle(p, ctx) });
      }
      return items;
    },
    summarize: (items) => `${plural(items.length, "page")} share a title with another page.`,
    fix: (_, ctx) => ({
      kind: "title",
      summary: "Give every page its own title that describes what makes that page different.",
      platformSteps: platformSteps("title", ctx.platform),
    }),
  },
  {
    id: "meta-description-missing",
    category: "onpage",
    severity: "warning",
    title: "Missing meta descriptions",
    why: "Meta descriptions aren't a ranking factor, but they're your ad copy in search results. A good one raises click-through rate. Google rewrites them often, so keep them short and specific.",
    learnSlug: LEARN,
    run: (ctx) =>
      indexablePages(ctx)
        .filter((p) => !p.metaDescription && !isUtilityPage(p.finalUrl))
        .map((p) => ({ url: p.finalUrl, suggested: descriptionFromContent(p) })),
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "has" : "have"} no meta description.`,
    fix: (_, ctx) => ({
      kind: "metaDescription",
      summary: "Write a 70–155 character summary for each page that tells searchers what they'll get. Suggestions are listed per page.",
      platformSteps: platformSteps("metaDescription", ctx.platform),
    }),
  },
  {
    id: "meta-description-length",
    category: "onpage",
    severity: "notice",
    title: "Meta descriptions too long or too short",
    why: "Google shows about 155 characters on desktop and fewer on mobile. Longer descriptions get cut off; very short ones waste the space.",
    learnSlug: LEARN,
    run: (ctx) =>
      indexablePages(ctx)
        .filter((p) => p.metaDescription && (p.metaDescription.length > 160 || p.metaDescription.length < 70))
        .map((p) => ({
          url: p.finalUrl,
          detail: `${p.metaDescription!.length} characters`,
          current: p.metaDescription!,
          suggested: p.metaDescription!.length > 160 ? truncateAtWord(p.metaDescription!, 155) : descriptionFromContent(p),
        })),
    summarize: (items) => `${plural(items.length, "meta description")} ${items.length === 1 ? "is" : "are"} outside the 70–160 character range.`,
    fix: (_, ctx) => ({ kind: "metaDescription", summary: "Rewrite each description to 70–155 characters.", platformSteps: platformSteps("metaDescription", ctx.platform) }),
  },
  {
    id: "meta-description-duplicate",
    category: "onpage",
    severity: "notice",
    title: "Duplicate meta descriptions",
    why: "Identical descriptions make your search results look the same and give searchers no reason to pick one page over another.",
    learnSlug: LEARN,
    run: (ctx) => {
      const items: FindingItem[] = [];
      for (const [, list] of duplicates(indexablePages(ctx), (p) => p.metaDescription)) {
        for (const p of list) items.push({ url: p.finalUrl, current: p.metaDescription!, suggested: descriptionFromContent(p) });
      }
      return items;
    },
    summarize: (items) => `${plural(items.length, "page")} reuse the same meta description.`,
    fix: (_, ctx) => ({ kind: "metaDescription", summary: "Write a unique description for each page.", platformSteps: platformSteps("metaDescription", ctx.platform) }),
  },
  {
    id: "h1-missing",
    category: "onpage",
    severity: "warning",
    title: "Missing H1 heading",
    why: "The H1 is the main headline on the page. It tells visitors and Google and AI systems parsing your HTML what the page is about.",
    learnSlug: LEARN,
    run: (ctx) => indexablePages(ctx).filter((p) => p.h1s.length === 0).map((p) => ({ url: p.finalUrl, suggested: p.title ?? undefined })),
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "has" : "have"} no H1 heading.`,
    fix: () => ({
      kind: "headings",
      summary: "Add one H1 at the top of each page's main content that states the page's topic.",
      snippets: [{ language: "html", code: "<h1>Your clear, specific page headline</h1>" }],
      steps: ["In most page builders, set the page's main headline to \"Heading 1\" (H1).", "Use H2s for the sections below it, and H3s inside those."],
    }),
  },
  {
    id: "h1-multiple",
    category: "onpage",
    severity: "notice",
    title: "Multiple H1 headings",
    why: "Several H1s blur what the page's main topic is. One clear H1 followed by H2 sections is easiest for people and AI to parse.",
    learnSlug: LEARN,
    run: (ctx) => indexablePages(ctx).filter((p) => p.h1s.length > 1).map((p) => ({ url: p.finalUrl, detail: p.h1s.slice(0, 4).map((h) => `“${truncateAtWord(h, 50)}”`).join(", ") })),
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "has" : "have"} more than one H1.`,
    fix: () => ({ kind: "headings", summary: "Keep one H1 for the page title and change the others to H2 or H3." }),
  },
  {
    id: "heading-hierarchy",
    category: "onpage",
    severity: "notice",
    title: "Headings skip levels",
    why: "AI systems split pages into chunks at heading boundaries. A clean H1 → H2 → H3 structure keeps each chunk meaningful and helps screen readers too.",
    learnSlug: "how-to-rank-in-chatgpt",
    run: (ctx) =>
      indexablePages(ctx).flatMap((p) => {
        for (let i = 1; i < p.headings.length; i++) {
          if (p.headings[i].level > p.headings[i - 1].level + 1) {
            return [{ url: p.finalUrl, detail: `H${p.headings[i - 1].level} → H${p.headings[i].level} at “${truncateAtWord(p.headings[i].text, 50)}”` }];
          }
        }
        return [];
      }),
    summarize: (items) => `${plural(items.length, "page")} skip heading levels.`,
    fix: () => ({ kind: "headings", summary: "Use headings in order: one H1, then H2 for sections, H3 for sub-sections. Don't jump from H2 to H4." }),
  },
  {
    id: "img-alt-missing",
    category: "onpage",
    severity: "warning",
    title: "Images without alt text",
    why: "Alt text describes an image for screen readers and for search engines. It's how your images can rank in Google Images, and Google explicitly recommends it.",
    learnSlug: LEARN,
    run: (ctx) => {
      const seen = new Set<string>();
      const items: FindingItem[] = [];
      for (const p of indexablePages(ctx)) {
        for (const img of p.images) {
          if (img.alt === null && !seen.has(img.src)) {
            seen.add(img.src);
            items.push({ url: img.src, detail: `On ${path(p.finalUrl)}` });
          }
        }
      }
      return items;
    },
    summarize: (items) => `${plural(items.length, "image")} ${items.length === 1 ? "has" : "have"} no alt text.`,
    fix: (_, ctx) => ({
      kind: "altText",
      summary: "Add a short, specific description of what each image shows. Don't stuff keywords.",
      snippets: [{ language: "html", code: '<img src="puppy.webp" alt="Golden retriever puppy sitting on a grey couch">' }],
      platformSteps: platformSteps("altText", ctx.platform),
    }),
  },
  {
    id: "img-filenames",
    category: "onpage",
    severity: "notice",
    title: "Images with camera-style file names",
    why: "Google uses image file names as a clue to what the image shows. IMG_4821.jpg says nothing; red-running-shoes.jpg does.",
    learnSlug: LEARN,
    run: (ctx) => {
      const seen = new Set<string>();
      return indexablePages(ctx)
        .flatMap((p) => p.images)
        .filter((img) => {
          const name = decodeURIComponent(new URL(img.src).pathname.split("/").pop() ?? "");
          const bad = /^(img|dsc|dscn|pxl|screenshot|screen shot|image|photo|untitled|whatsapp image)[\s_-]*[\d(]/i.test(name) || /^[\da-f-]{20,}\.\w+$/i.test(name);
          if (!bad || seen.has(img.src)) return false;
          seen.add(img.src);
          return true;
        })
        .map((img) => ({ url: img.src }));
    },
    summarize: (items) => `${plural(items.length, "image")} ${items.length === 1 ? "has" : "have"} a meaningless file name.`,
    fix: (_, ctx) => ({ kind: "images", summary: "Rename image files to describe what they show, using hyphens (e.g. blue-ceramic-coffee-mug.webp), then re-upload.", platformSteps: platformSteps("images", ctx.platform) }),
  },
  {
    id: "img-large",
    category: "onpage",
    severity: "warning",
    title: "Large image files",
    why: "Heavy images are the most common cause of slow pages. Page speed is a Google ranking factor, and slow pages can be dropped by AI systems fetching them in real time.",
    learnSlug: "core-web-vitals",
    run: (ctx) =>
      [...ctx.imageBytes]
        .filter(([, bytes]) => bytes !== null && bytes > 200 * 1024)
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
        .map(([src, bytes]) => ({ url: src, detail: `${Math.round((bytes ?? 0) / 1024)} KB` })),
    summarize: (items) => `${plural(items.length, "image")} ${items.length === 1 ? "is" : "are"} larger than 200 KB.`,
    fix: (_, ctx) => ({
      kind: "images",
      summary: "Compress each image and serve it as WebP or AVIF at the size it's actually displayed. Aim for under 150 KB.",
      steps: ["Free tools: squoosh.app (one at a time) or ShortPixel/TinyPNG (bulk)."],
      platformSteps: platformSteps("images", ctx.platform),
    }),
  },
  {
    id: "img-format",
    category: "onpage",
    severity: "notice",
    title: "Images not in a modern format",
    why: "WebP and AVIF images are typically 25–50% smaller than JPEG or PNG at the same quality, which makes pages load faster.",
    learnSlug: "core-web-vitals",
    run: (ctx) => {
      const legacy = [...new Set(indexablePages(ctx).flatMap((p) => p.images.map((i) => i.src)))].filter((src) => /\.(jpe?g|png|bmp|tiff?)$/i.test(new URL(src).pathname));
      return legacy.length >= 3 ? legacy.map((url) => ({ url })) : [];
    },
    summarize: (items) => `${plural(items.length, "image")} use JPEG/PNG instead of WebP or AVIF.`,
    fix: (_, ctx) => ({ kind: "images", summary: "Convert images to WebP or AVIF (most CMS image plugins do this automatically).", platformSteps: platformSteps("images", ctx.platform) }),
  },
  {
    id: "url-structure",
    category: "onpage",
    severity: "notice",
    title: "Unfriendly URLs",
    why: "Short, descriptive URLs with hyphens help people (and Google) understand a page before they click. Underscores, capitals and long parameter strings don't.",
    learnSlug: LEARN,
    run: (ctx) =>
      indexablePages(ctx)
        .map((p) => {
          const u = new URL(p.finalUrl);
          const problems: string[] = [];
          if (/_/.test(u.pathname)) problems.push("uses underscores");
          if (/[A-Z]/.test(u.pathname)) problems.push("has capital letters");
          if (p.finalUrl.length > 115) problems.push(`${p.finalUrl.length} characters long`);
          if ([...u.searchParams.keys()].length > 2) problems.push("has many parameters");
          return problems.length ? { url: p.finalUrl, detail: problems.join(", ") } : null;
        })
        .filter((x) => x !== null) as FindingItem[],
    summarize: (items) => `${plural(items.length, "URL")} could be cleaner.`,
    fix: (_, ctx) => ({
      kind: "redirects",
      summary: "For new pages, use short lowercase slugs with hyphens (e.g. /best-golf-balls). Only change existing URLs if you also add a 301 redirect from the old one.",
      platformSteps: platformSteps("redirects", ctx.platform),
    }),
  },
  {
    id: "social-tags-missing",
    category: "onpage",
    severity: "notice",
    title: "Missing social sharing tags",
    why: "Open Graph and Twitter tags control the title, description and image shown when someone shares your page on social media, Slack or iMessage. Good previews get more clicks.",
    learnSlug: LEARN,
    run: (ctx) =>
      indexablePages(ctx)
        .map((p) => {
          const missing = ["og:title", "og:description", "og:image"].filter((k) => !p.og[k]);
          return missing.length ? { url: p.finalUrl, detail: `Missing ${missing.join(", ")}` } : null;
        })
        .filter((x) => x !== null) as FindingItem[],
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "is" : "are"} missing Open Graph tags.`,
    fix: (_, ctx) => {
      const p = ctx.homepage;
      const code = [
        `<meta property="og:type" content="website">`,
        `<meta property="og:title" content="${p.title ?? "Page title"}">`,
        `<meta property="og:description" content="${p.metaDescription ?? "Short description of the page"}">`,
        `<meta property="og:image" content="${p.og["og:image"] ?? `${ctx.origin}/social-image.jpg`}">`,
        `<meta property="og:url" content="${p.finalUrl}">`,
        `<meta name="twitter:card" content="summary_large_image">`,
      ].join("\n");
      return {
        kind: "socialTags",
        summary: "Add Open Graph tags to each page (example for your homepage below). Use a 1200×630 image.",
        snippets: [{ language: "html", code }],
        platformSteps: platformSteps("socialTags", ctx.platform),
      };
    },
  },
  {
    id: "weak-internal-linking",
    category: "onpage",
    severity: "notice",
    title: "Pages with only one internal link pointing to them",
    why: "Internal links pass authority between your pages and show Google how topics relate. Important pages deserve links from several related pages.",
    learnSlug: LEARN,
    run: (ctx) =>
      indexablePages(ctx)
        .filter((p) => p.finalUrl !== ctx.homepage.finalUrl && p.foundVia === "link" && (ctx.inlinks.get(p.finalUrl) ?? ctx.inlinks.get(p.url) ?? 0) === 1)
        .map((p) => ({ url: p.finalUrl, detail: "1 internal link" })),
    summarize: (items) => `${plural(items.length, "page")} ${items.length === 1 ? "is" : "are"} linked from only one other page.`,
    fix: () => ({
      kind: "links",
      summary: "Add links to these pages from related articles and hub pages, using descriptive anchor text.",
      steps: ["Find related pages with a Google search: site:yourdomain.com <topic>.", "Add a natural sentence linking to the page (e.g. \"see our guide to writing a cover letter\")."],
    }),
  },
  {
    id: "anchor-text-generic",
    category: "onpage",
    severity: "notice",
    title: "Generic link text",
    why: "Google uses the clickable text of a link to understand the page it points to. \"Click here\" and \"read more\" waste that signal and are unclear for screen-reader users.",
    learnSlug: LEARN,
    run: (ctx) => {
      const generic = /^(click here|here|read more|learn more|more|this|link|this link|continue|go|details)$/i;
      const items: FindingItem[] = [];
      for (const p of indexablePages(ctx)) {
        const bad = p.links.filter((l) => l.internal && generic.test(l.text));
        if (bad.length) items.push({ url: p.finalUrl, detail: `${bad.length}× ${[...new Set(bad.map((b) => `“${b.text}”`))].slice(0, 3).join(", ")}` });
      }
      return items;
    },
    summarize: (items) => `${plural(items.length, "page")} use vague link text like “click here”.`,
    fix: () => ({ kind: "links", summary: "Rewrite link text to describe the destination, e.g. “see our pricing plans” instead of “click here”." }),
  },
  {
    id: "nofollow-internal",
    category: "onpage",
    severity: "notice",
    title: "Internal links marked nofollow",
    why: "nofollow on your own links tells Google not to pass authority to your own pages, almost never what you want.",
    learnSlug: LEARN,
    run: (ctx) =>
      indexablePages(ctx)
        .map((p) => {
          // Ignore action links (share, reply, login) where nofollow is expected.
          const count = p.links.filter((l) => l.internal && l.href !== p.finalUrl && l.rel.includes("nofollow") && !new URL(l.href).search && !/\/(wp-login|login|signin|account|cart)/i.test(l.href)).length;
          return count ? { url: p.finalUrl, detail: `${count} nofollow internal ${count === 1 ? "link" : "links"}` } : null;
        })
        .filter((x) => x !== null) as FindingItem[],
    summarize: (items) => `${plural(items.length, "page")} add nofollow to links to your own pages.`,
    fix: () => ({ kind: "links", summary: "Remove rel=\"nofollow\" from links to your own pages (keep it for login, cart or untrusted user links)." }),
  },
];
