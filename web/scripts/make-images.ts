// Renders the brand images (Open Graph card, logo, icons) with a headless
// browser. Re-run after changing the brand name or colors:
//   npx tsx scripts/make-images.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pub = path.join(root, "public");
const name = fs.readFileSync(path.join(root, "app/config/site.ts"), "utf8").match(/\bname:\s*"([^"]+)"/)?.[1] ?? "olloo SEO";
const geist = path.join(root, "../node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2");
const geistMono = path.join(root, "../node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2");
const serif = path.join(root, "../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2");

// The "oo" eyes: two rings with orange pupils looking up and to the right,
// on an ink tile so it reads at 16px in light and dark browser tabs.
const mark = (size: number) => `
<svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="#0a0a0a"/>
  <circle cx="10.5" cy="16" r="5.6" fill="none" stroke="#ffffff" stroke-width="2.4"/>
  <circle cx="21.5" cy="16" r="5.6" fill="none" stroke="#ffffff" stroke-width="2.4"/>
  <circle cx="12.2" cy="14.3" r="2.5" fill="#ff5a1f"/>
  <circle cx="23.2" cy="14.3" r="2.5" fill="#ff5a1f"/>
</svg>`;

// The bare eyes (no tile), as used in the site header.
const eyes = (height: number) => `
<svg width="${(height * 44) / 26}" height="${height}" viewBox="0 0 44 26" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="13" r="9.5" fill="none" stroke="#0a0a0a" stroke-width="3"/>
  <circle cx="32" cy="13" r="9.5" fill="none" stroke="#0a0a0a" stroke-width="3"/>
  <circle cx="14.8" cy="10.2" r="4" fill="#ff5a1f"/>
  <circle cx="34.8" cy="10.2" r="4" fill="#ff5a1f"/>
</svg>`;

fs.writeFileSync(path.join(pub, "favicon.svg"), mark(32).trim() + "\n");

const fonts = `<style>
@font-face { font-family: Geist; src: url(data:font/woff2;base64,${fs.readFileSync(geist).toString("base64")}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: GeistMono; src: url(data:font/woff2;base64,${fs.readFileSync(geistMono).toString("base64")}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: Serif; font-style: italic; src: url(data:font/woff2;base64,${fs.readFileSync(serif).toString("base64")}) format("woff2"); }
</style>`;

const [brand, ...rest] = name.split(" ");
const og = `<html><head>${fonts}</head><body style="margin:0;width:1200px;height:630px;font-family:Geist,sans-serif;background:#fafaf7;color:#0a0a0a;overflow:hidden">
  <div style="padding:76px 90px;display:flex;flex-direction:column;height:100%;box-sizing:border-box">
    <div style="display:flex;align-items:center;gap:16px">${eyes(40)}<span style="font-size:38px;font-weight:600;letter-spacing:-0.03em">${brand}<span style="color:#737373;font-weight:500"> ${rest.join(" ")}</span></span></div>
    <div style="font-size:88px;font-weight:600;line-height:1.0;letter-spacing:-0.045em;margin-top:58px;max-width:1000px">Free SEO audit for Google and <span style="font-family:Serif,serif;font-style:italic;font-weight:400;letter-spacing:-0.01em;color:#c2410c">AI search</span></div>
    <div style="margin-top:auto;padding-top:28px;border-top:1px solid #e5e5e5;display:flex;gap:26px;align-items:center;font-size:26px;color:#525252">
      <span>50+ checks</span><span style="width:8px;height:8px;border-radius:50%;background:#ff5a1f"></span><span>Fixes written for you</span><span style="width:8px;height:8px;border-radius:50%;background:#ff5a1f"></span><span>No signup</span>
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(og, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(pub, "og-image.png") });

const pngs: Record<number, Buffer> = {};
for (const [file, size] of [["logo.png", 512], ["apple-touch-icon.png", 180], [null, 48], [null, 32]] as const) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${mark(size)}</body></html>`);
  const buf = await page.screenshot({ omitBackground: true });
  if (file) fs.writeFileSync(path.join(pub, file), buf);
  pngs[size] = buf;
}
await browser.close();

// favicon.ico with embedded PNGs (supported by every modern browser and by Google).
const sizes = [32, 48];
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = sizes.map((size) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(size, 0);
  e.writeUInt8(size, 1);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(pngs[size].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[size].length;
  return e;
});
fs.writeFileSync(path.join(pub, "favicon.ico"), Buffer.concat([header, ...entries, ...sizes.map((s) => pngs[s])]));

console.log("Wrote public/og-image.png, logo.png, apple-touch-icon.png, favicon.ico, favicon.svg");
