import { sqliteTable, text, integer, real, primaryKey, index } from "drizzle-orm/sqlite-core";
import type {
  ActionPlan,
  CheckOutcome,
  Finding,
  KeywordResult,
  Platform,
  RedirectHop,
  Scores,
} from "../engine/types.ts";

export type AuditStatus = "queued" | "crawling" | "analyzing" | "fixing" | "done" | "failed";

export const audits = sqliteTable(
  "audits",
  {
    id: text("id").primaryKey(),
    url: text("url").notNull(),
    host: text("host").notNull(),
    status: text("status").$type<AuditStatus>().notNull(),
    step: text("step").notNull().default("Waiting in queue"),
    progress: integer("progress").notNull().default(0),
    pagesCrawled: integer("pages_crawled").notNull().default(0),
    platform: text("platform").$type<Platform>(),
    scores: text("scores", { mode: "json" }).$type<Scores>(),
    outcomes: text("outcomes", { mode: "json" }).$type<CheckOutcome[]>(),
    actionPlan: text("action_plan", { mode: "json" }).$type<ActionPlan>(),
    aiUsed: integer("ai_used", { mode: "boolean" }).notNull().default(false),
    keywords: text("keywords", { mode: "json" }).$type<string[]>(),
    keywordReport: text("keyword_report", { mode: "json" }).$type<KeywordResult[]>(),
    ipHash: text("ip_hash").notNull(),
    error: text("error"),
    createdAt: integer("created_at").notNull(),
    completedAt: integer("completed_at"),
    expiresAt: integer("expires_at").notNull(),
  },
  (t) => [index("audits_host_idx").on(t.host, t.createdAt)],
);

export const pages = sqliteTable(
  "pages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    auditId: text("audit_id").notNull(),
    url: text("url").notNull(),
    status: integer("status").notNull(),
    depth: integer("depth").notNull(),
    redirectChain: text("redirect_chain", { mode: "json" }).$type<RedirectHop[]>(),
    title: text("title"),
    metaDescription: text("meta_description"),
    h1: text("h1"),
    wordCount: integer("word_count").notNull().default(0),
    canonical: text("canonical"),
    robotsMeta: text("robots_meta"),
    schemaTypes: text("schema_types", { mode: "json" }).$type<string[]>(),
    inlinks: integer("inlinks").notNull().default(0),
    outlinks: integer("outlinks").notNull().default(0),
    ttfbMs: integer("ttfb_ms").notNull().default(0),
    htmlBytes: integer("html_bytes").notNull().default(0),
    issueCount: integer("issue_count").notNull().default(0),
  },
  (t) => [index("pages_audit_idx").on(t.auditId)],
);

export const findings = sqliteTable(
  "findings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    auditId: text("audit_id").notNull(),
    checkId: text("check_id").notNull(),
    category: text("category").notNull(),
    severity: text("severity").notNull(),
    itemCount: integer("item_count").notNull(),
    data: text("data", { mode: "json" }).$type<Finding>().notNull(),
  },
  (t) => [index("findings_audit_idx").on(t.auditId)],
);

/** Anonymous aggregates: how often each problem shows up across audited sites. */
export const checkStats = sqliteTable(
  "check_stats",
  {
    day: text("day").notNull(),
    checkId: text("check_id").notNull(),
    sitesAffected: integer("sites_affected").notNull().default(0),
    sitesAudited: integer("sites_audited").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.checkId] })],
);

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    ipHash: text("ip_hash").notNull(),
    day: text("day").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.ipHash, t.day] })],
);

/** Cached keyword suggestions so repeat lookups don't hit Google again. */
export const keywordCache = sqliteTable("keyword_cache", {
  seed: text("seed").primaryKey(),
  suggestions: text("suggestions", { mode: "json" }).$type<string[]>().notNull(),
  createdAt: integer("created_at").notNull(),
});

/** Daily count of autocomplete requests, to stay well within polite limits. */
export const autocompleteUsage = sqliteTable("autocomplete_usage", {
  day: text("day").primaryKey(),
  requests: integer("requests").notNull().default(0),
});

export const aiUsage = sqliteTable("ai_usage", {
  day: text("day").primaryKey(),
  costUsd: real("cost_usd").notNull().default(0),
  requests: integer("requests").notNull().default(0),
});
