// Runs after the build to make prerendered pages paint sooner:
//  1. Inlines the CSS each page uses (Beasties) and loads the full stylesheet
//     without blocking the first paint.
//  2. Starts downloading React only after the page has loaded. The page
//     is complete HTML, so visitors (and crawlers) see everything immediately;
//     it becomes interactive a moment later.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Beasties from "beasties";

const root = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), "build/client");

function htmlFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "assets" ? [] : htmlFiles(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

const beasties = new Beasties({
  path: root,
  publicPath: "/",
  // Swap the stylesheet in after load (media="print" → "all"), with a <noscript> fallback.
  preload: "media",
  noscriptFallback: true,
  // Keep the full stylesheet file intact: client-side navigation still needs it.
  pruneSource: false,
  // Inline the @font-face rules the page uses so text never re-renders when the
  // full stylesheet arrives (that caused layout shift).
  inlineFonts: true,
  preloadFonts: false,
  keyframes: "critical",
  // Leave existing inline <style> tags alone: the Geist @font-face rules in
  // root.tsx look unused to Beasties (fonts are set via a CSS variable).
  reduceInlineStyles: false,
  compress: true,
  logLevel: "warn",
});

/**
 * React Router emits modulepreload links plus one module script whose static
 * imports start every download immediately. Rewrite it to dynamic imports that
 * run after the first paint. Returns null if the script isn't in the expected
 * shape, so a future React Router change can't break the page.
 */
function deferHydration(html: string): string | null {
  const match = html.match(/<script type="module" async>([\s\S]*?)<\/script>/);
  if (!match || !match[1].includes("__reactRouterRouteModules")) return null;
  // Start every route module download at once, then wait for all of them.
  const fetches: string[] = [];
  const awaits: string[] = [];
  let body = match[1]
    .replace(/^\s*import\s+"([^"]+)";\s*$/gm, (_, src) => {
      fetches.push(`import("${src}")`);
      return "";
    })
    .replace(/^\s*import \* as (\w+) from "([^"]+)";\s*$/gm, (_, name, src) => {
      fetches.push(`import("${src}")`);
      awaits.push(name);
      return "";
    });
  if (/^\s*import\s/m.test(body) || !fetches.length) return null;
  body = `const [${["_m", ...awaits].join(",")}]=await Promise.all([${fetches.join(",")}]);${body.trim()}`;
  const loader =
    '<script type="module">' +
    `const hydrate=async()=>{${body}};` +
    // Once the page (HTML, CSS, fonts) has loaded, start loading React.
    'if(document.readyState==="complete")setTimeout(hydrate,0);else addEventListener("load",()=>setTimeout(hydrate,0),{once:true});' +
    "</script>";
  return html.replace(match[0], loader).replace(/<link rel="modulepreload"[^>]*>/g, "");
}

// The report shell is rendered in the browser, so it keeps the normal loading.
const pages = htmlFiles(root).filter((file) => !file.endsWith("__spa-fallback.html"));
let deferred = 0;
for (const file of pages) {
  let html = await beasties.process(fs.readFileSync(file, "utf8"));
  const withDeferred = deferHydration(html);
  if (withDeferred) {
    html = withDeferred;
    deferred++;
  } else {
    console.warn(`  ! hydration loader not recognized in ${path.relative(root, file)}; left unchanged`);
  }
  fs.writeFileSync(file, html);
}
console.log(`Optimized ${pages.length} pages: critical CSS inlined, React loading deferred on ${deferred}`);
