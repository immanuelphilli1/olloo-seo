import { describe, expect, it } from "vitest";
import { parseHtml, normalizeUrl } from "../src/engine/crawler/parse.ts";
import { computeScores } from "../src/engine/checks/registry.ts";
import { readingGrade, truncateAtWord } from "../src/engine/checks/util.ts";

describe("parseHtml", () => {
  const html = `<!doctype html><html lang="en"><head>
    <title> My   Page </title>
    <meta name="description" content="A page">
    <meta name="robots" content="noindex, follow">
    <link rel="canonical" href="/page">
    <meta property="og:title" content="OG">
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization"},{"@type":"WebSite"}]}</script>
    <script type="application/ld+json">{ broken </script>
    </head><body>
    <svg><title>icon</title></svg>
    <nav><a href="/nav">Nav</a></nav>
    <main><h1>Hello</h1><h2>Section</h2><p>Some words here for the count.</p>
    <img src="/a.jpg"><img src="/b.jpg" alt="B"><img src="/c.jpg" alt="">
    <a href="https://other.com/x">External</a><a href="mailto:x@y.z">Mail</a><a href="#top">Top</a>
    </main></body></html>`;
  const p = parseHtml(html, "https://example.com/page?x=1");

  it("extracts head tags", () => {
    expect(p.title).toBe("My Page");
    expect(p.titleCount).toBe(1);
    expect(p.metaDescription).toBe("A page");
    expect(p.metaRobots).toContain("noindex");
    expect(p.canonical).toBe("https://example.com/page");
    expect(p.lang).toBe("en");
    expect(p.og["og:title"]).toBe("OG");
  });

  it("parses JSON-LD including @graph and reports errors", () => {
    expect(p.jsonLd[0].types).toEqual(["Organization", "WebSite"]);
    expect(p.jsonLd[1].error).toBeTruthy();
  });

  it("extracts headings, images and links", () => {
    expect(p.h1s).toEqual(["Hello"]);
    expect(p.headings.map((h) => h.level)).toEqual([1, 2]);
    expect(p.images.map((i) => i.alt)).toEqual([null, "B", ""]);
    expect(p.links.map((l) => [l.href, l.internal])).toEqual([
      ["https://example.com/nav", true],
      ["https://other.com/x", false],
    ]);
  });

  it("counts only main content words", () => {
    expect(p.wordCount).toBeGreaterThan(5);
    expect(p.text).not.toContain("Nav");
  });
});

describe("helpers", () => {
  it("normalizes URLs", () => {
    expect(normalizeUrl("HTTPS://Example.COM:443/a#b")).toBe("https://example.com/a");
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
  });

  it("truncates at word boundaries", () => {
    expect(truncateAtWord("The quick brown fox jumps over the lazy dog", 20)).toBe("The quick brown fox…");
  });

  it("estimates reading grade", () => {
    const simple = "The cat sat on the mat. It was a sunny day. The dog ran in the park. ".repeat(10);
    expect(readingGrade(simple)).toBeLessThan(5);
  });

  it("scores a clean site 100 and skips categories with no data", () => {
    const scores = computeScores([], [{ checkId: "x", title: "x", category: "technical", status: "passed" }], 5);
    expect(scores.overall).toBe(100);
    expect(scores.categories.performance).toBeNull();
  });
});
