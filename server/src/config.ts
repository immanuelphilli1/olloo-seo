// Central runtime configuration. Every value has a safe local default so the
// app runs with no .env file at all.

function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value !== "" && value !== undefined ? parsed : fallback;
}

export const config = {
  port: num(process.env.PORT, 8787),
  isProduction: process.env.NODE_ENV === "production",
  siteUrl: (process.env.SITE_URL || "http://localhost:5180").replace(/\/$/, ""),
  siteName: process.env.SITE_NAME || "olloo SEO",
  // Crawler user-agent token: no spaces allowed.
  botName: process.env.BOT_NAME || "ollooSEOBot",

  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  aiModel: process.env.AI_MODEL || "claude-haiku-5-5",
  aiDailyBudgetUsd: num(process.env.AI_DAILY_BUDGET_USD, 2),

  pagespeedApiKey: process.env.PAGESPEED_API_KEY || "",

  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || "",
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || "",

  auditsPerIpPerDay: num(process.env.AUDITS_PER_IP_PER_DAY, 5),
  // Max Google autocomplete requests per day across all users (each lookup uses ~12).
  autocompleteDailyLimit: num(process.env.AUTOCOMPLETE_DAILY_LIMIT, 2000),
  ipHashSalt: process.env.IP_HASH_SALT || "change-me",
  allowPrivateTargets: bool(process.env.ALLOW_PRIVATE_TARGETS),

  dbPath: process.env.DB_PATH || new URL("../data.sqlite", import.meta.url).pathname,

  crawl: {
    maxPages: num(process.env.CRAWL_MAX_PAGES, 50),
    concurrency: 3,
    timeoutMs: 15_000,
    maxHtmlBytes: 5 * 1024 * 1024,
    maxRedirects: 10,
  },
  reportTtlDays: 30,
  cacheHours: 24,
};

export const userAgent = `${config.botName}/1.0 (+${config.siteUrl}/bot)`;
export const botToken = config.botName;
