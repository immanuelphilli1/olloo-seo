import { Hono, type Context } from "hono";
import { z } from "zod";
import { botToken } from "../config.ts";
import { normalizeInputUrl } from "../engine/crawler/crawl.ts";
import { checkStatus, fetchUrl, fetchWithHttpFallback } from "../engine/crawler/fetch.ts";
import { emptyParsed, parseHtml } from "../engine/crawler/parse.ts";
import { AI_BOTS, fetchRobots, looksLikeCloudflareManaged, parseRobots } from "../engine/crawler/robots.ts";
import { collectSitemaps } from "../engine/crawler/sitemap.ts";
import { assertAllowedUrl, assertPublicHost } from "../engine/crawler/ssrf.ts";
import { buildLlmsTxt } from "../engine/fixes/files.ts";
import { COUNTRIES } from "../engine/keywords/autocomplete.ts";
import { classifyIntent, modifierIdeas, TOOL_WORDS } from "../engine/keywords/intent.ts";
import type { PageData, SiteContext } from "../engine/types.ts";
import { cachedSuggestions, consumeRateLimit, hashIp } from "../services.ts";
import { clientIp } from "./ip.ts";

const TOOL_LIMIT_PER_DAY = 100;
const urlBody = z.object({ url: z.string().min(3).max(2048) });

export const toolRoutes = new Hono();

/** Shared guard: validates input, applies SSRF checks and a per-IP daily limit. */
async function prepare(c: Context): Promise<{ url: string } | Response> {
  const parsed = urlBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Please enter a website address." }, 400);
  let url: string;
  try {
    url = normalizeInputUrl(parsed.data.url);
    await assertPublicHost(assertAllowedUrl(url).hostname);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }
  if (consumeRateLimit(`tool:${hashIp(clientIp(c))}`, TOOL_LIMIT_PER_DAY) < 0) {
    return c.json({ error: "Daily limit reached for free tools. Please try again tomorrow." }, 429);
  }
  return { url };
}

function botReport(robotsBody: string | null, robotsUrl: string, pageUrl: string) {
  const robots = parseRobots({ url: robotsUrl, status: 200, body: robotsBody, error: null });
  return AI_BOTS.map((bot) => ({
    bot: bot.token,
    owner: bot.owner,
    purpose: bot.purpose,
    kind: bot.important ? "search" : "training",
    allowed: robotsBody ? robots.isAllowed(pageUrl, bot.token) !== false : true,
  }));
}

toolRoutes.post("/ai-crawler-check", async (c) => {
  const prep = await prepare(c);
  if (prep instanceof Response) return prep;
  const page = await fetchWithHttpFallback(prep.url, { maxBytes: 1024 * 1024 });
  if (page.status === 0) return c.json({ error: `We couldn't reach that site: ${page.error}` }, 422);
  const origin = new URL(page.finalUrl).origin;
  const robots = await fetchRobots(origin);
  const parsed = page.body && /html/i.test(page.headers["content-type"] ?? "") ? parseHtml(page.body, page.finalUrl) : emptyParsed();
  return c.json({
    url: page.finalUrl,
    status: page.status,
    robotsFound: robots.body !== null,
    cloudflareManaged: looksLikeCloudflareManaged(robots.body),
    metaNoindex: Boolean(parsed.metaRobots?.includes("noindex")),
    headerNoindex: Boolean(page.headers["x-robots-tag"]?.toLowerCase().includes("noindex")),
    bots: botReport(robots.body, robots.url, page.finalUrl),
  });
});

toolRoutes.post("/robots-check", async (c) => {
  const prep = await prepare(c);
  if (prep instanceof Response) return prep;
  const origin = new URL(prep.url).origin;
  const robots = await fetchRobots(origin);
  const parsed = parseRobots(robots);
  const issues: string[] = [];
  if (robots.status === 404) issues.push("No robots.txt found. Crawlers will assume everything is allowed, but you can't point them to your sitemap.");
  if (robots.body && parsed.isDisallowed(`${origin}/`, "Googlebot")) issues.push("Googlebot is blocked from your homepage, your site can't rank in Google.");
  if (robots.body && !/^\s*sitemap\s*:/im.test(robots.body)) issues.push("robots.txt doesn't list your sitemap. Add a line like: Sitemap: " + origin + "/sitemap.xml");
  if (robots.body && robots.body.length > 500 * 1024) issues.push("robots.txt is larger than 500 KB, Google ignores everything after that.");
  return c.json({
    url: robots.url,
    status: robots.status,
    content: robots.body,
    sitemaps: robots.body ? parsed.getSitemaps() : [],
    testedUrl: prep.url,
    allowedForUs: robots.body ? parsed.isAllowed(prep.url, botToken) !== false : true,
    bots: botReport(robots.body, robots.url, prep.url),
    issues,
  });
});

toolRoutes.post("/meta-tags", async (c) => {
  const prep = await prepare(c);
  if (prep instanceof Response) return prep;
  const page = await fetchWithHttpFallback(prep.url);
  if (page.status === 0) return c.json({ error: `We couldn't reach that page: ${page.error}` }, 422);
  if (!page.body || !/html/i.test(page.headers["content-type"] ?? "")) return c.json({ error: "That URL didn't return an HTML page." }, 422);
  const p = parseHtml(page.body, page.finalUrl);
  const issues: { level: "error" | "warning" | "ok"; message: string }[] = [];
  if (!p.title) issues.push({ level: "error", message: "Missing <title> tag." });
  else if (p.title.length > 60) issues.push({ level: "warning", message: `Title is ${p.title.length} characters, Google cuts it off around 60.` });
  else if (p.title.length < 20) issues.push({ level: "warning", message: `Title is only ${p.title.length} characters, describe the page more.` });
  else issues.push({ level: "ok", message: `Title length is good (${p.title.length} characters).` });
  if (!p.metaDescription) issues.push({ level: "warning", message: "Missing meta description, Google will pick text from the page instead." });
  else if (p.metaDescription.length > 160) issues.push({ level: "warning", message: `Description is ${p.metaDescription.length} characters, it will be cut off after about 155.` });
  else if (p.metaDescription.length < 70) issues.push({ level: "warning", message: `Description is only ${p.metaDescription.length} characters.` });
  else issues.push({ level: "ok", message: `Description length is good (${p.metaDescription.length} characters).` });
  if (p.metaRobots?.includes("noindex")) issues.push({ level: "error", message: "This page has noindex, it won't appear in search results." });
  if (!p.canonical) issues.push({ level: "warning", message: "No canonical tag." });
  if (p.h1s.length === 0) issues.push({ level: "warning", message: "No H1 heading on the page." });
  if (p.h1s.length > 1) issues.push({ level: "warning", message: `${p.h1s.length} H1 headings use one.` });
  if (!p.og["og:image"]) issues.push({ level: "warning", message: "No og:image, social shares will have no preview image." });
  if (!p.viewport) issues.push({ level: "error", message: "No viewport tag, the page isn't mobile-friendly." });
  return c.json({
    url: page.finalUrl,
    status: page.status,
    title: p.title,
    metaDescription: p.metaDescription,
    canonical: p.canonical,
    robots: p.metaRobots,
    h1s: p.h1s,
    lang: p.lang,
    viewport: p.viewport,
    og: p.og,
    twitter: p.twitter,
    schemaTypes: [...new Set(p.jsonLd.flatMap((b) => b.types))],
    issues,
  });
});

toolRoutes.post("/redirects", async (c) => {
  const prep = await prepare(c);
  if (prep instanceof Response) return prep;
  const res = await fetchWithHttpFallback(prep.url, { maxBytes: 256 * 1024 });
  const hops = [...res.redirectChain, { url: res.finalUrl, status: res.status }];
  const issues: string[] = [];
  if (res.redirectChain.length >= 2) issues.push(`This URL goes through ${res.redirectChain.length} redirects. Point links straight at ${res.finalUrl}.`);
  if (res.redirectChain.some((h) => h.status === 302 || h.status === 307)) issues.push("Temporary (302/307) redirects found, use 301 for permanent moves so ranking signals transfer.");
  if (res.error) issues.push(res.error);
  if (res.finalUrl.startsWith("http:")) issues.push("The final URL isn't HTTPS.");
  return c.json({ url: prep.url, finalUrl: res.finalUrl, status: res.status, timeMs: res.ttfbMs, hops, issues });
});

toolRoutes.post("/sitemap-check", async (c) => {
  const prep = await prepare(c);
  if (prep instanceof Response) return prep;
  const origin = new URL(prep.url).origin;
  const isSitemapUrl = /\.xml(\.gz)?$/i.test(new URL(prep.url).pathname);
  const robots = await fetchRobots(origin);
  const declared = isSitemapUrl ? [prep.url] : robots.body ? parseRobots(robots).getSitemaps() : [];
  const { sitemaps, urls } = await collectSitemaps(origin, declared);
  const sample = urls.slice(0, 20);
  const statuses = await Promise.all(sample.map(async (u) => ({ url: u, status: (await checkStatus(u)).status })));
  const issues: string[] = [];
  if (!sitemaps.some((s) => s.status === 200 && !s.error)) issues.push("No valid sitemap found.");
  if (robots.body && declared.length === 0 && !isSitemapUrl) issues.push("robots.txt doesn't reference a sitemap.");
  const bad = statuses.filter((s) => s.status !== 200);
  if (bad.length) issues.push(`${bad.length} of the ${sample.length} URLs we tested don't return 200 OK.`);
  if (urls.length >= 5000) issues.push("We stopped reading at 5,000 URLs.");
  return c.json({ sitemaps, urlCount: urls.length, sample: statuses, issues, declaredInRobots: !isSitemapUrl && declared.length > 0 });
});

toolRoutes.post("/llms-txt", async (c) => {
  const prep = await prepare(c);
  if (prep instanceof Response) return prep;
  const home = await fetchWithHttpFallback(prep.url);
  if (!home.body || home.status !== 200) return c.json({ error: `We couldn't load that page (${home.error ?? `HTTP ${home.status}`}).` }, 422);
  const toPage = (res: Awaited<ReturnType<typeof fetchUrl>>): PageData => ({
    url: res.url,
    finalUrl: res.finalUrl,
    status: res.status,
    redirectChain: res.redirectChain,
    depth: 1,
    foundVia: "link",
    contentType: res.headers["content-type"] ?? "",
    headers: res.headers,
    ttfbMs: res.ttfbMs,
    htmlBytes: res.bytes,
    isHtml: Boolean(res.body) && /html/i.test(res.headers["content-type"] ?? ""),
    error: res.error,
    ...(res.body && /html/i.test(res.headers["content-type"] ?? "") ? parseHtml(res.body, res.finalUrl) : emptyParsed()),
  });
  const homepage = { ...toPage(home), depth: 0 };
  const links = [...new Set(homepage.links.filter((l) => l.internal).map((l) => l.href))].filter((u) => u !== homepage.finalUrl).slice(0, 20);
  const pages = (await Promise.all(links.map((u) => fetchUrl(u)))).map(toPage);
  const inlinks = new Map<string, number>();
  for (const p of [homepage, ...pages]) for (const l of p.links) inlinks.set(l.href, (inlinks.get(l.href) ?? 0) + 1);
  const ctx = { homepage, pages: [homepage, ...pages], inlinks, host: new URL(homepage.finalUrl).hostname } as unknown as SiteContext;
  return c.json({ content: buildLlmsTxt(ctx) });
});

const ideasBody = z.object({
  seed: z.string().min(2).max(80),
  country: z.string().length(2).optional(),
});

/** Groups a real suggestion the same way as the built-in ideas. */
function groupFor(keyword: string): string {
  const { intent } = classifyIntent(keyword);
  if (TOOL_WORDS.some((w) => new RegExp(`(^|\\s)${w}(\\s|$)`).test(keyword))) return "Tools (AI can't replace these)";
  if (/^(how|what|why|when|where|who|which|can|does|do|is|are|should)\b/.test(keyword)) return "Questions";
  if (intent === "commercial") return "Comparisons";
  if (intent === "transactional" || intent === "local") return "Buying";
  return "Other searches";
}

toolRoutes.post("/keyword-ideas", async (c) => {
  const parsed = ideasBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Enter a keyword of at least 2 characters." }, 400);
  if (consumeRateLimit(`tool:${hashIp(clientIp(c))}`, TOOL_LIMIT_PER_DAY) < 0) {
    return c.json({ error: "Daily limit reached for free tools. Please try again tomorrow." }, 429);
  }
  const seed = parsed.data.seed.replace(/\s+/g, " ").trim().toLowerCase();
  const country = parsed.data.country && COUNTRIES[parsed.data.country.toLowerCase()] ? parsed.data.country.toLowerCase() : "us";

  const { suggestions, note } = await cachedSuggestions(seed, country);
  const real = (suggestions ?? [])
    .filter((k) => k !== seed)
    .slice(0, 80)
    .map((keyword) => ({ keyword, ...classifyIntent(keyword), group: groupFor(keyword) }));
  const realSet = new Set(real.map((r) => r.keyword));
  const ideas = modifierIdeas(seed).filter((i) => !realSet.has(i.keyword));

  return c.json({ seed, country, countryName: COUNTRIES[country], seedIntent: classifyIntent(seed), real, ideas, liveSource: suggestions !== null, note });
});
