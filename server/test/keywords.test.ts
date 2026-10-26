import type http from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { emptyParsed, parseHtml } from "../src/engine/crawler/parse.ts";
import { parseSuggestions, expansionQueries } from "../src/engine/keywords/autocomplete.ts";
import { classifyIntent, modifierIdeas } from "../src/engine/keywords/intent.ts";
import { analyzeKeywords, containsKeyword, normalizeKeywords, placementsFor, stem } from "../src/engine/keywords/match.ts";
import { runAudit, type AuditResult } from "../src/engine/runAudit.ts";
import type { PageData } from "../src/engine/types.ts";
import { goodSite, startSite } from "./fixtures/sites.ts";

function page(url: string, html: string): PageData {
  return {
    url,
    finalUrl: url,
    status: 200,
    redirectChain: [],
    depth: 1,
    foundVia: "link",
    contentType: "text/html",
    headers: {},
    ttfbMs: 100,
    htmlBytes: html.length,
    isHtml: true,
    error: null,
    ...emptyParsed(),
    ...parseHtml(html, url),
  };
}

describe("keyword matching", () => {
  it("stems common word forms", () => {
    expect(stem("plumbers")).toBe("plumber");
    expect(stem("repairs")).toBe("repair");
    expect(stem("boxes")).toBe("box");
    expect(stem("companies")).toBe("company");
    expect(stem("class")).toBe("class");
  });

  it("matches keywords in any order and form, ignoring filler words", () => {
    expect(containsKeyword("Emergency Plumbers in Leeds | Acme", "emergency plumber leeds")).toBe(true);
    expect(containsKeyword("Leeds' best emergency plumbing", "emergency plumber leeds")).toBe(false);
    expect(containsKeyword("Pour-Over Coffee Brewing Guide", "pour over coffee")).toBe(true);
  });

  it("finds the best page, placements and competing pages", () => {
    const pages = [
      page("https://ex.com/", "<title>Acme Plumbing</title><body><h1>Plumbers you can trust</h1><p>We fix leaks.</p></body>"),
      page("https://ex.com/boiler-repair", '<title>Boiler Repair in Leeds | Acme</title><meta name="description" content="Fast boiler repair."><body><h1>Boiler repair</h1><p>Boiler repair from Gas Safe engineers.</p></body>'),
      page("https://ex.com/boiler-repairs-old", "<title>Boiler Repairs</title><body><h1>Our boiler repairs</h1><p>Old page.</p></body>"),
    ];
    const ctx = { pages, inlinks: new Map<string, number>(), homepage: pages[0] };
    const [result, missing] = analyzeKeywords(ctx, ["boiler repair", "bathroom fitting"]);
    expect(result.bestPage).toBe("https://ex.com/boiler-repair");
    expect(result.placements).toEqual({ title: true, h1: true, url: true, meta: true, intro: true });
    expect(result.competing).toEqual(["https://ex.com/boiler-repairs-old"]);
    expect(missing.bestPage).toBeNull();
  });

  it("falls back to the closest page on the core topic when modifiers are missing", () => {
    const pages = [
      page("https://ex.com/", "<title>Acme Coffee</title><body><h1>Coffee for everyone</h1><p>Welcome.</p></body>"),
      page("https://ex.com/beans", "<title>Single-Origin Coffee Beans</title><body><h1>Coffee beans</h1><p>Our coffee beans are roasted weekly.</p></body>"),
    ];
    const [r] = analyzeKeywords({ pages, inlinks: new Map(), homepage: pages[0] }, ["best coffee beans"]);
    expect(r.bestPage).toBe("https://ex.com/beans");
    expect(r.partial).toBe(true);
    expect(r.missingWords).toEqual(["best"]);
    expect(r.placements?.title).toBe(false);
  });

  it("doesn't count a homepage's URL against it, but doesn't let it win on URL either", () => {
    const home = page("https://ex.com/", "<title>Free SEO audit</title><body><h1>Free SEO audit</h1></body>");
    expect(placementsFor(home, "free seo audit").url).toBe(true);
    const [r] = analyzeKeywords({ pages: [home], inlinks: new Map(), homepage: home }, ["boiler repair"]);
    expect(r.bestPage).toBeNull();
  });

  it("normalizes user input to at most 5 unique keywords", () => {
    expect(normalizeKeywords([" Boiler  Repair ", "boiler repair", "", 3, "a", "b", "c", "d", "e"])).toEqual(["Boiler Repair", "a", "b", "c", "d"]);
    expect(normalizeKeywords("nope")).toEqual([]);
  });
});

describe("search intent", () => {
  it.each([
    ["best running shoes", "commercial", "medium"],
    ["how to fix a leaky tap", "informational", "high"],
    ["mortgage calculator", "transactional", "low"],
    ["plumber near me", "local", "low"],
    ["buy running shoes", "transactional", "low"],
    ["espresso machine repair", "transactional", "low"],
    ["how to repair an espresso machine", "informational", "high"],
  ] as const)("%s → %s", (keyword, intent, aiRisk) => {
    const info = classifyIntent(keyword);
    expect(info.intent).toBe(intent);
    expect(info.aiRisk).toBe(aiRisk);
  });

  it("builds seed + modifier ideas grouped by intent", () => {
    const ideas = modifierIdeas("Coffee Beans");
    expect(ideas.map((i) => i.keyword)).toContain("best coffee beans");
    expect(ideas.map((i) => i.keyword)).toContain("coffee beans calculator");
    expect(ideas.find((i) => i.keyword === "how to coffee beans")?.group).toBe("Questions");
    expect(new Set(ideas.map((i) => i.keyword)).size).toBe(ideas.length);
  });
});

describe("autocomplete parsing", () => {
  it("reads Google's firefox-client response", () => {
    expect(parseSuggestions(["coffee", ["Coffee Beans", "coffee near me", 5]])).toEqual(["coffee beans", "coffee near me"]);
    expect(parseSuggestions({})).toEqual([]);
  });

  it("expands a seed into question and buying prompts", () => {
    expect(expansionQueries("Coffee")).toContain("how to coffee");
    expect(expansionQueries("Coffee")).toContain("best coffee");
  });
});

describe("audit with target keywords", () => {
  let server: http.Server;
  let withKeywords: AuditResult;
  let without: AuditResult;
  const budget = { canSpend: () => false, record: () => {} };

  beforeAll(async () => {
    server = await startSite(goodSite, 4103, true);
    [withKeywords, without] = await Promise.all([
      runAudit("http://localhost:4103/", { onProgress: () => {}, budget, fast: true, keywords: ["pour over coffee", "espresso machine repair"] }),
      runAudit("http://localhost:4103/", { onProgress: () => {}, budget, fast: true }),
    ]);
  });
  afterAll(() => server.close());

  it("maps each keyword to its best page", () => {
    const pourOver = withKeywords.keywordReport.find((r) => r.keyword === "pour over coffee")!;
    expect(pourOver.bestPage).toBe("http://localhost:4103/brewing-guide");
    expect(pourOver.placements?.title).toBe(true);
    expect(pourOver.placements?.url).toBe(false);
  });

  it("reports keywords with no page and weak placements", () => {
    const ids = withKeywords.findings.map((f) => f.checkId);
    expect(ids).toContain("keyword-no-page");
    expect(ids).toContain("keyword-supporting");
    expect(ids).not.toContain("keyword-title-h1");
  });

  it("skips keyword checks when no keywords are given", () => {
    const outcome = without.outcomes.find((o) => o.checkId === "keyword-no-page");
    expect(outcome?.status).toBe("skipped");
    expect(without.keywordReport).toEqual([]);
  });

  it("names the keywords in the action plan", () => {
    const week1 = withKeywords.actionPlan.weeks[0].tasks.join(" ");
    expect(week1).toContain("pour over coffee");
    expect(week1).toContain("Create a page for “espresso machine repair”");
  });
});
