import robotsParserCjs from "robots-parser";
import { fetchUrl } from "./fetch.ts";
import type { RobotsInfo } from "../types.ts";

// robots-parser is CommonJS: at runtime the default import *is* the function,
// but its typings describe an ES default export, so re-type it here.
const robotsParser = robotsParserCjs as unknown as typeof import("robots-parser").default;
export type Robots = ReturnType<typeof robotsParser>;

export async function fetchRobots(origin: string): Promise<RobotsInfo> {
  const url = `${origin}/robots.txt`;
  const res = await fetchUrl(url, { accept: "text/plain,*/*", maxBytes: 512 * 1024 });
  const isText = res.status === 200 && !/text\/html/i.test(res.headers["content-type"] ?? "");
  return {
    url,
    status: res.status,
    body: isText ? (res.body ?? "") : null,
    error: res.error,
  };
}

export function parseRobots(info: RobotsInfo): Robots {
  return robotsParser(info.url, info.body ?? "");
}

/** The crawlers that matter for search and AI visibility, with what each one powers. */
export const AI_BOTS: { token: string; owner: string; purpose: string; important: boolean }[] = [
  { token: "Googlebot", owner: "Google", purpose: "Google Search and AI Overviews", important: true },
  { token: "Bingbot", owner: "Microsoft", purpose: "Bing and Copilot, and ChatGPT search leans on Bing's index", important: true },
  { token: "OAI-SearchBot", owner: "OpenAI", purpose: "ChatGPT search results and citations", important: true },
  { token: "ChatGPT-User", owner: "OpenAI", purpose: "pages ChatGPT opens when a user asks about them", important: true },
  { token: "GPTBot", owner: "OpenAI", purpose: "training future ChatGPT models", important: false },
  { token: "PerplexityBot", owner: "Perplexity", purpose: "Perplexity answers and citations", important: true },
  { token: "Claude-SearchBot", owner: "Anthropic", purpose: "Claude search results and citations", important: true },
  { token: "ClaudeBot", owner: "Anthropic", purpose: "training future Claude models", important: false },
  { token: "Google-Extended", owner: "Google", purpose: "Gemini training and grounding", important: false },
  { token: "Applebot-Extended", owner: "Apple", purpose: "Apple Intelligence training", important: false },
];

/** Cloudflare's managed robots.txt marks AI blocking with these comments/signals. */
export function looksLikeCloudflareManaged(body: string | null): boolean {
  if (!body) return false;
  return /Content-Signal|BEGIN Cloudflare Managed|cloudflare/i.test(body);
}
