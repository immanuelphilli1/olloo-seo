import zlib from "node:zlib";
import { Agent, request } from "undici";
import { config, userAgent } from "../../config.ts";
import { assertAllowedUrl, safeLookup } from "./ssrf.ts";
import type { RedirectHop } from "../types.ts";

const agent = new Agent({
  connect: { lookup: safeLookup, timeout: 10_000 },
  headersTimeout: config.crawl.timeoutMs,
  bodyTimeout: config.crawl.timeoutMs,
  connections: 16,
});

export interface FetchResult {
  url: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  body: string | null;
  bytes: number;
  ttfbMs: number;
  redirectChain: RedirectHop[];
  truncated: boolean;
  error: string | null;
}

export interface FetchOptions {
  method?: "GET" | "HEAD";
  followRedirects?: boolean;
  maxBytes?: number;
  timeoutMs?: number;
  accept?: string;
  readBody?: boolean;
}

function flattenHeaders(raw: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    out[key.toLowerCase()] = Array.isArray(value) ? value.join(", ") : value;
  }
  return out;
}

function decode(buffer: Buffer, encoding: string | undefined, contentType: string | undefined, maxBytes: number): string {
  let data = buffer;
  const opts = { maxOutputLength: maxBytes };
  try {
    if (encoding?.includes("br")) data = zlib.brotliDecompressSync(buffer, opts);
    else if (encoding?.includes("gzip")) data = zlib.gunzipSync(buffer, opts);
    else if (encoding?.includes("deflate")) data = zlib.inflateSync(buffer, opts);
  } catch {
    // Truncated or oversized compressed bodies: decode what we can.
    data = buffer;
  }
  const charset = contentType?.match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase() ?? "utf-8";
  try {
    return new TextDecoder(charset).decode(data);
  } catch {
    return new TextDecoder("utf-8").decode(data);
  }
}

function describeError(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "BlockedTargetError") return err.message;
    const code = (err as NodeJS.ErrnoException).code ?? (err.cause as NodeJS.ErrnoException | undefined)?.code;
    if (code === "ENOTFOUND") return "Domain not found";
    if (code === "ECONNREFUSED") return "Connection refused";
    if (code === "UND_ERR_HEADERS_TIMEOUT" || code === "UND_ERR_CONNECT_TIMEOUT" || err.name === "TimeoutError") return "Timed out";
    if (code === "UND_ERR_BODY_TIMEOUT") return "Timed out while downloading";
    if (code?.startsWith("ERR_TLS") || code?.includes("CERT")) return `TLS/certificate error (${code})`;
    return err.message || String(code ?? err);
  }
  return String(err);
}

/**
 * Fetches a URL through the SSRF-safe agent, following redirects manually so
 * every hop is validated and recorded.
 */
export async function fetchUrl(input: string, options: FetchOptions = {}): Promise<FetchResult> {
  const {
    method = "GET",
    followRedirects = true,
    maxBytes = config.crawl.maxHtmlBytes,
    timeoutMs = config.crawl.timeoutMs,
    accept = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    readBody = method === "GET",
  } = options;

  const chain: RedirectHop[] = [];
  let current = input;
  const started = performance.now();
  const signal = AbortSignal.timeout(timeoutMs);

  for (let hop = 0; hop <= config.crawl.maxRedirects; hop++) {
    let url: URL;
    try {
      url = assertAllowedUrl(current);
    } catch (err) {
      return failure(input, current, chain, describeError(err));
    }

    try {
      const hopStart = performance.now();
      const res = await request(url, {
        method,
        dispatcher: agent,
        signal,
        headers: {
          "user-agent": userAgent,
          accept,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
        },
      });
      const ttfbMs = Math.round(performance.now() - hopStart);
      const headers = flattenHeaders(res.headers);
      const location = headers.location;

      if (followRedirects && res.statusCode >= 300 && res.statusCode < 400 && location) {
        await res.body.dump();
        chain.push({ url: url.href, status: res.statusCode });
        current = new URL(location, url).href;
        continue;
      }

      let body: string | null = null;
      let bytes = 0;
      let truncated = false;
      if (readBody) {
        const chunks: Buffer[] = [];
        for await (const chunk of res.body) {
          const buf = chunk as Buffer;
          bytes += buf.length;
          if (bytes > maxBytes) {
            truncated = true;
            chunks.push(buf.subarray(0, buf.length - (bytes - maxBytes)));
            res.body.destroy();
            break;
          }
          chunks.push(buf);
        }
        body = decode(Buffer.concat(chunks), headers["content-encoding"], headers["content-type"], maxBytes);
      } else {
        await res.body.dump();
        bytes = Number(headers["content-length"] ?? 0);
      }

      return {
        url: input,
        finalUrl: url.href,
        status: res.statusCode,
        headers,
        body,
        bytes,
        ttfbMs: chain.length === 0 ? ttfbMs : Math.round(performance.now() - started),
        redirectChain: chain,
        truncated,
        error: null,
      };
    } catch (err) {
      return failure(input, current, chain, describeError(err));
    }
  }
  return failure(input, current, chain, "Too many redirects (possible redirect loop)");
}

function failure(url: string, finalUrl: string, chain: RedirectHop[], error: string): FetchResult {
  return {
    url,
    finalUrl,
    status: 0,
    headers: {},
    body: null,
    bytes: 0,
    ttfbMs: 0,
    redirectChain: chain,
    truncated: false,
    error,
  };
}

/**
 * Fetches a URL the user typed. Bare domains default to https://, so if that
 * can't connect at all, retry over plain http:// (some sites have no TLS).
 */
export async function fetchWithHttpFallback(url: string, options: FetchOptions = {}): Promise<FetchResult> {
  const res = await fetchUrl(url, options);
  if (res.status !== 0 || !url.startsWith("https://")) return res;
  const http = await fetchUrl(`http://${url.slice("https://".length)}`, options);
  return http.status !== 0 ? http : res;
}

/** HEAD with a GET fallback for servers that reject HEAD. */
export async function checkStatus(url: string): Promise<{ status: number; bytes: number | null; finalUrl: string }> {
  let res = await fetchUrl(url, { method: "HEAD", timeoutMs: 10_000 });
  if (res.status === 405 || res.status === 403 || res.status === 501 || res.status === 0) {
    const get = await fetchUrl(url, { method: "GET", timeoutMs: 10_000, maxBytes: 256 * 1024, accept: "*/*" });
    if (get.status !== 0 || res.status === 0) res = get;
  }
  const length = res.headers["content-length"];
  return {
    status: res.status,
    bytes: length ? Number(length) : res.body !== null ? res.bytes : null,
    finalUrl: res.finalUrl,
  };
}
