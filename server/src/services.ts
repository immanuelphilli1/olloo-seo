import crypto from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { config } from "./config.ts";
import { db, today } from "./db/client.ts";
import { aiUsage, autocompleteUsage, keywordCache, rateLimits } from "./db/schema.ts";
import { fetchSuggestions } from "./engine/keywords/autocomplete.ts";
import type { AiBudget } from "./engine/fixes/ai.ts";

export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(`${config.ipHashSalt}:${ip}`).digest("hex").slice(0, 32);
}

/** Daily AI spend cap shared by all audits. */
export const aiBudget: AiBudget = {
  canSpend() {
    const row = db.select().from(aiUsage).where(eq(aiUsage.day, today())).get();
    return (row?.costUsd ?? 0) < config.aiDailyBudgetUsd;
  },
  record(costUsd) {
    db.insert(aiUsage)
      .values({ day: today(), costUsd, requests: 1 })
      .onConflictDoUpdate({
        target: aiUsage.day,
        set: { costUsd: sql`${aiUsage.costUsd} + ${costUsd}`, requests: sql`${aiUsage.requests} + 1` },
      })
      .run();
  },
};

/** Returns remaining allowance after counting this request, or -1 if over the limit. */
export function consumeRateLimit(key: string, limit: number): number {
  const day = today();
  const row = db.select().from(rateLimits).where(and(eq(rateLimits.ipHash, key), eq(rateLimits.day, day))).get();
  const used = row?.count ?? 0;
  if (used >= limit) return -1;
  db.insert(rateLimits)
    .values({ ipHash: key, day, count: 1 })
    .onConflictDoUpdate({ target: [rateLimits.ipHash, rateLimits.day], set: { count: sql`${rateLimits.count} + 1` } })
    .run();
  return limit - used - 1;
}

const WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Google autocomplete with a 7-day cache and a global daily cap. Returns null
 * (with a reason) when suggestions can't be fetched, so callers can fall back.
 */
export async function cachedSuggestions(seed: string, country: string): Promise<{ suggestions: string[] | null; note: string | null }> {
  const key = `${country}:${seed.toLowerCase().trim()}`;
  const cached = db.select().from(keywordCache).where(eq(keywordCache.seed, key)).get();
  if (cached && Date.now() - cached.createdAt < WEEK) return { suggestions: cached.suggestions, note: null };

  const used = db.select().from(autocompleteUsage).where(eq(autocompleteUsage.day, today())).get()?.requests ?? 0;
  if (used >= config.autocompleteDailyLimit) {
    return { suggestions: null, note: "Live Google suggestions are paused for today. Showing built-in ideas only." };
  }
  try {
    const { suggestions, requests } = await fetchSuggestions(seed, country);
    db.insert(autocompleteUsage)
      .values({ day: today(), requests })
      .onConflictDoUpdate({ target: autocompleteUsage.day, set: { requests: sql`${autocompleteUsage.requests} + ${requests}` } })
      .run();
    db.insert(keywordCache)
      .values({ seed: key, suggestions, createdAt: Date.now() })
      .onConflictDoUpdate({ target: keywordCache.seed, set: { suggestions, createdAt: Date.now() } })
      .run();
    return { suggestions, note: null };
  } catch {
    return { suggestions: null, note: "Google suggestions are unavailable right now. Showing built-in ideas only." };
  }
}

/** Verifies a Cloudflare Turnstile token. Always passes when Turnstile isn't configured. */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  if (!config.turnstileSecretKey) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: config.turnstileSecretKey, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
