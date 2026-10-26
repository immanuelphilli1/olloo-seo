// Shapes returned by GET /api/audits/:id (mirrors server/src/engine/types.ts).

export type Category = "technical" | "onpage" | "content" | "aeo" | "performance";
export type Severity = "critical" | "warning" | "notice";
export type Platform = "wordpress" | "shopify" | "wix" | "squarespace" | "webflow" | "custom";
export type AuditStatus = "queued" | "crawling" | "analyzing" | "fixing" | "done" | "failed";

export interface FindingItem {
  url?: string;
  detail?: string;
  current?: string;
  suggested?: string;
}

export interface Fix {
  kind: string;
  summary: string;
  steps?: string[];
  snippets?: { language: string; code: string; filename?: string }[];
  files?: { filename: string; content: string; mime: string }[];
  platformSteps?: string[];
  aiGenerated?: boolean;
}

export interface Finding {
  checkId: string;
  category: Category;
  severity: Severity;
  title: string;
  why: string;
  learnSlug?: string;
  summary: string;
  items: FindingItem[];
  fix: Fix | null;
}

export interface CheckOutcome {
  checkId: string;
  title: string;
  category: Category;
  status: "passed" | "failed" | "skipped";
  reason?: string;
}

export interface Scores {
  overall: number;
  aiVisibility: number;
  categories: Record<Category, number | null>;
}

export interface ActionPlan {
  niche: string | null;
  weeks: { title: string; tasks: string[] }[];
  offSite: { bucket: "fix" | "build" | "influence"; task: string }[];
  prompts: string[];
  faqSchema: string | null;
  aiGenerated: boolean;
}

export type SearchIntent = "informational" | "commercial" | "transactional" | "local" | "navigational";

export interface KeywordResult {
  keyword: string;
  intent: SearchIntent;
  expectedPage: string;
  bestPage: string | null;
  bestPageTitle: string | null;
  partial: boolean;
  missingWords: string[];
  placements: { title: boolean; h1: boolean; url: boolean; meta: boolean; intro: boolean } | null;
  density: number;
  competing: string[];
}

export const INTENT_LABELS: Record<SearchIntent, string> = {
  informational: "Informational",
  commercial: "Commercial",
  transactional: "Transactional",
  local: "Local",
  navigational: "Navigational",
};

export interface Audit {
  id: string;
  url: string;
  host: string;
  status: AuditStatus;
  step: string;
  progress: number;
  pagesCrawled: number;
  platform: Platform | null;
  scores: Scores | null;
  outcomes: CheckOutcome[] | null;
  actionPlan: ActionPlan | null;
  aiUsed: boolean;
  keywords: string[] | null;
  keywordReport: KeywordResult[] | null;
  error: string | null;
  createdAt: number;
  completedAt: number | null;
  expiresAt: number;
}

export interface PageRow {
  url: string;
  status: number;
  depth: number;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  wordCount: number;
  canonical: string | null;
  schemaTypes: string[] | null;
  inlinks: number;
  outlinks: number;
  ttfbMs: number;
  issueCount: number;
}

export interface AuditResponse {
  audit: Audit;
  findings: Finding[];
  pages: PageRow[];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  technical: "Technical SEO",
  onpage: "On-page SEO",
  content: "Content",
  aeo: "AI visibility",
  performance: "Performance",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  wordpress: "WordPress",
  shopify: "Shopify",
  wix: "Wix",
  squarespace: "Squarespace",
  webflow: "Webflow",
  custom: "Custom site",
};
