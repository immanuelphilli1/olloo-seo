import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { config } from "../config.ts";
import * as schema from "./schema.ts";

// Tables are created on startup so local setup needs no migration step.
// Keep this in sync with schema.ts.
const DDL = `
CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  host TEXT NOT NULL,
  status TEXT NOT NULL,
  step TEXT NOT NULL DEFAULT 'Waiting in queue',
  progress INTEGER NOT NULL DEFAULT 0,
  pages_crawled INTEGER NOT NULL DEFAULT 0,
  platform TEXT,
  scores TEXT,
  outcomes TEXT,
  action_plan TEXT,
  ai_used INTEGER NOT NULL DEFAULT 0,
  keywords TEXT,
  keyword_report TEXT,
  ip_hash TEXT NOT NULL,
  error TEXT,
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS audits_host_idx ON audits (host, created_at);

CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id TEXT NOT NULL,
  url TEXT NOT NULL,
  status INTEGER NOT NULL,
  depth INTEGER NOT NULL,
  redirect_chain TEXT,
  title TEXT,
  meta_description TEXT,
  h1 TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  canonical TEXT,
  robots_meta TEXT,
  schema_types TEXT,
  inlinks INTEGER NOT NULL DEFAULT 0,
  outlinks INTEGER NOT NULL DEFAULT 0,
  ttfb_ms INTEGER NOT NULL DEFAULT 0,
  html_bytes INTEGER NOT NULL DEFAULT 0,
  issue_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS pages_audit_idx ON pages (audit_id);

CREATE TABLE IF NOT EXISTS findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id TEXT NOT NULL,
  check_id TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  item_count INTEGER NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS findings_audit_idx ON findings (audit_id);

CREATE TABLE IF NOT EXISTS check_stats (
  day TEXT NOT NULL,
  check_id TEXT NOT NULL,
  sites_affected INTEGER NOT NULL DEFAULT 0,
  sites_audited INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, check_id)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip_hash TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, day)
);

CREATE TABLE IF NOT EXISTS keyword_cache (
  seed TEXT PRIMARY KEY,
  suggestions TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS autocomplete_usage (
  day TEXT PRIMARY KEY,
  requests INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ai_usage (
  day TEXT PRIMARY KEY,
  cost_usd REAL NOT NULL DEFAULT 0,
  requests INTEGER NOT NULL DEFAULT 0
);
`;

export function openDatabase(path = config.dbPath) {
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(DDL);
  // Columns added after the first release: add them to existing databases.
  const columns = new Set((sqlite.prepare("PRAGMA table_info(audits)").all() as { name: string }[]).map((c) => c.name));
  if (!columns.has("keywords")) sqlite.exec("ALTER TABLE audits ADD COLUMN keywords TEXT");
  if (!columns.has("keyword_report")) sqlite.exec("ALTER TABLE audits ADD COLUMN keyword_report TEXT");
  return drizzle(sqlite, { schema });
}

export type Db = ReturnType<typeof openDatabase>;

export const db = openDatabase();

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
