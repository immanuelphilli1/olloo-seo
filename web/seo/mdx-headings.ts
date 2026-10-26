import GithubSlugger from "github-slugger";
import type { Plugin } from "vite";

/** Plain text of a markdown heading, matching what rehype-slug sees. */
function headingText(markdown: string): string {
  return markdown
    .replace(/\s+#+\s*$/, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__|\*|_)(.+?)\1/g, "$2")
    .trim();
}

/**
 * Adds `export const handle = { headings }` to every MDX article, listing its
 * H2s with the same ids rehype-slug gives them. The article layout reads it via
 * useMatches(), so the "On this page" menu is in the prerendered HTML.
 */
export function mdxHeadings(): Plugin {
  return {
    name: "mdx-headings",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith(".mdx")) return null;
      const slugger = new GithubSlugger();
      const headings: { id: string; text: string }[] = [];
      let inFence = false;
      for (const line of code.split("\n")) {
        if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
        if (inFence) continue;
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (!match) continue;
        const text = headingText(match[2]);
        const slug = slugger.slug(text); // every level counts toward duplicate numbering, like rehype-slug
        if (match[1].length === 2) headings.push({ id: slug, text });
      }
      return { code: `${code}\n\nexport const handle = { headings: ${JSON.stringify(headings)} };\n`, map: null };
    },
  };
}
