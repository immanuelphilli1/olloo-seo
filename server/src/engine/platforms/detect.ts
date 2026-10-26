import type { PageData, Platform } from "../types.ts";

/** Guesses the CMS from the homepage so fixes can include platform-specific steps. */
export function detectPlatform(homepage: PageData, rawHtmlHint = ""): Platform {
  const generator = (homepage.generator ?? "").toLowerCase();
  const headers = homepage.headers;
  const assets = [...homepage.images.map((i) => i.src), ...homepage.links.map((l) => l.href)].join(" ") + " " + rawHtmlHint;

  if (generator.includes("wordpress") || /\/wp-content\/|\/wp-includes\//.test(assets) || headers["x-powered-by"]?.includes("WordPress") || headers.link?.includes("wp-json")) {
    return "wordpress";
  }
  if (headers["x-shopid"] || headers["x-shopify-stage"] || /cdn\.shopify\.com|myshopify\.com/.test(assets) || generator.includes("shopify")) {
    return "shopify";
  }
  if (generator.includes("wix") || headers["x-wix-request-id"] || /static\.wixstatic\.com|wix\.com/.test(assets)) {
    return "wix";
  }
  if (generator.includes("squarespace") || /squarespace(-cdn)?\.com/.test(assets)) {
    return "squarespace";
  }
  if (generator.includes("webflow") || /assets\.website-files\.com|webflow\.(com|io)/.test(assets)) {
    return "webflow";
  }
  return "custom";
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  wordpress: "WordPress",
  shopify: "Shopify",
  wix: "Wix",
  squarespace: "Squarespace",
  webflow: "Webflow",
  custom: "Custom / other",
};
