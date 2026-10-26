import type { Context } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";

/**
 * The visitor's IP. Proxy headers are only trusted when TRUST_PROXY=true
 * (set this when running behind Cloudflare, Caddy or nginx).
 */
export function clientIp(c: Context): string {
  if (process.env.TRUST_PROXY === "true") {
    const forwarded = c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
  }
  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    return "unknown";
  }
}
