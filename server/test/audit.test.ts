import type http from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runAudit, type AuditResult } from "../src/engine/runAudit.ts";
import { brokenSite, goodSite, startSite } from "./fixtures/sites.ts";

const noBudget = { canSpend: () => false, record: () => {} };
const servers: http.Server[] = [];
let broken: AuditResult;
let good: AuditResult;

beforeAll(async () => {
  servers.push(await startSite(brokenSite, 4101), await startSite(goodSite, 4102, true));
  [broken, good] = await Promise.all([
    runAudit("http://localhost:4101/", { onProgress: () => {}, budget: noBudget, fast: true }),
    runAudit("http://localhost:4102/", { onProgress: () => {}, budget: noBudget, fast: true }),
  ]);
});

afterAll(() => servers.forEach((s) => s.close()));

const failedIds = (r: AuditResult) => new Set(r.findings.map((f) => f.checkId));

describe("broken fixture site", () => {
  const planted = [
    "ai-search-blocked",
    "ai-training-blocked",
    "sitemap-not-in-robots",
    "sitemap-bad-urls",
    "robots-blocks-pages",
    "http-status-errors",
    "redirect-chains",
    "noindex",
    "orphan-pages",
    "title-length",
    "title-duplicate",
    "meta-description-missing",
    "meta-description-length",
    "h1-missing",
    "h1-multiple",
    "heading-hierarchy",
    "img-alt-missing",
    "img-filenames",
    "img-large",
    "viewport-missing",
    "lang-missing",
    "schema-missing",
    "schema-invalid",
    "soft-404",
    "thin-content",
    "wall-of-text",
    "anchor-text-generic",
    "author-missing",
    "trust-pages",
    "llms-txt-missing",
  ];

  it.each(planted)("reports %s", (checkId) => {
    expect(failedIds(broken)).toContain(checkId);
  });

  it("gives every finding a fix or explanation", () => {
    for (const finding of broken.findings) {
      expect(finding.why.length).toBeGreaterThan(20);
      expect(finding.summary.length).toBeGreaterThan(5);
    }
    expect(broken.findings.filter((f) => f.fix).length).toBeGreaterThan(planted.length * 0.8);
  });

  it("generates a robots.txt that unblocks AI search but keeps other rules", () => {
    const fix = broken.findings.find((f) => f.checkId === "ai-search-blocked")!.fix!;
    const robots = fix.files![0].content;
    expect(robots).toContain("Disallow: /private/");
    expect(robots).toMatch(/User-agent: OAI-SearchBot[\s\S]*Allow: \//);
    expect(robots).toContain("# Disallow: /");
  });

  it("flags the redirect chain with the full path", () => {
    const item = broken.findings.find((f) => f.checkId === "redirect-chains")!.items[0];
    expect(item.detail).toContain("/old-page");
    expect(item.detail).toContain("/services");
  });

  it("scores poorly", () => {
    expect(broken.scores.overall).toBeLessThan(50);
    expect(broken.scores.aiVisibility).toBeLessThan(60);
  });
});

describe("JavaScript rendering check (needs Playwright's Chromium)", () => {
  it("detects content that only appears with JavaScript", async () => {
    const full = await runAudit("http://localhost:4101/", { onProgress: () => {}, budget: noBudget });
    if (full.ctx.render.skipped) {
      console.warn(`Skipped: ${full.ctx.render.skipped}`);
      return;
    }
    const finding = full.findings.find((f) => f.checkId === "js-dependent-content");
    expect(finding?.items.map((i) => i.url)).toContain("http://localhost:4101/js-page");
  });
});

describe("crawler hygiene", () => {
  it("doesn't crawl share/reply action links or count off-site redirects as pages", () => {
    const urls = broken.ctx.pages.map((p) => p.url);
    expect(urls.some((u) => u.includes("share=") || u.includes("replytocom="))).toBe(false);
    expect(broken.ctx.pages.every((p) => new URL(p.finalUrl).hostname === "localhost")).toBe(true);
  });
});

describe("good fixture site", () => {
  it("has no critical or warning findings", () => {
    const serious = good.findings.filter((f) => f.severity !== "notice");
    expect(serious.map((f) => `${f.checkId}: ${f.summary}`)).toEqual([]);
  });

  it("scores close to 100", () => {
    expect(good.scores.overall).toBeGreaterThanOrEqual(90);
  });

  it("detects compression and finds all pages", () => {
    expect(failedIds(good)).not.toContain("compression-missing");
    expect(good.ctx.pages.length).toBe(5);
  });
});
