// Shared types for the audit engine: what the crawler collects, what checks
// report, and the fixes we generate for them.

export type Category = "technical" | "onpage" | "content" | "aeo" | "performance";
export type Severity = "critical" | "warning" | "notice";
export type Platform = "wordpress" | "shopify" | "wix" | "squarespace" | "webflow" | "custom";

export interface RedirectHop {
  url: string;
  status: number;
}

export interface ImageRef {
  src: string;
  alt: string | null;
}

export interface LinkRef {
  href: string;
  text: string;
  internal: boolean;
  rel: string;
}

export interface JsonLdBlock {
  raw: string;
  error: string | null;
  types: string[];
  data: unknown;
}

export interface Heading {
  level: number;
  text: string;
}

/** Everything we know about one crawled URL. */
export interface PageData {
  url: string;
  finalUrl: string;
  status: number;
  redirectChain: RedirectHop[];
  depth: number;
  foundVia: "link" | "sitemap" | "start";
  contentType: string;
  headers: Record<string, string>;
  ttfbMs: number;
  htmlBytes: number;
  isHtml: boolean;
  error: string | null;

  title: string | null;
  titleCount: number;
  metaDescription: string | null;
  metaDescriptionCount: number;
  metaRobots: string | null;
  canonical: string | null;
  lang: string | null;
  viewport: string | null;
  generator: string | null;
  h1s: string[];
  headings: Heading[];
  wordCount: number;
  text: string;
  paragraphs: string[];
  images: ImageRef[];
  links: LinkRef[];
  og: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd: JsonLdBlock[];
  hreflang: { lang: string; href: string }[];
  mixedContent: string[];
  renderBlocking: number;
  dateModified: string | null;
  hasAuthor: boolean;
  contentHash: string;
}

export interface RobotsInfo {
  url: string;
  status: number;
  body: string | null;
  error: string | null;
}

export interface SitemapInfo {
  url: string;
  status: number;
  urlCount: number;
  error: string | null;
}

export interface RenderResult {
  url: string;
  rawWords: number;
  renderedWords: number;
}

export interface PageSpeedResult {
  url: string;
  performanceScore: number | null;
  lcpMs: number | null;
  cls: number | null;
  tbtMs: number | null;
  inpMs: number | null;
  error: string | null;
}

export interface VariantCheck {
  url: string;
  status: number;
  redirectsTo: string | null;
  error: string | null;
}

/** The full context checks run against. */
export interface SiteContext {
  startUrl: string;
  origin: string;
  host: string;
  homepage: PageData;
  pages: PageData[];
  /** Every URL we fetched (including non-HTML and error responses), keyed by URL. */
  fetched: Map<string, PageData>;
  /** Status of internal link targets that were HEAD-checked but not crawled. */
  linkStatus: Map<string, number>;
  externalStatus: Map<string, number>;
  imageBytes: Map<string, number | null>;
  inlinks: Map<string, number>;
  robots: RobotsInfo;
  sitemaps: SitemapInfo[];
  sitemapUrls: string[];
  crawlTruncated: boolean;
  soft404: { url: string; status: number } | null;
  httpVariant: VariantCheck | null;
  wwwVariant: VariantCheck | null;
  llmsTxt: { status: number; isText: boolean } | null;
  render: { results: RenderResult[]; skipped: string | null };
  pagespeed: { results: PageSpeedResult[]; skipped: string | null };
  platform: Platform;
  /** Target keywords the user entered (0–5), and how the site covers each. */
  keywords: string[];
  keywordResults: KeywordResult[];
}

export type SearchIntent = "informational" | "commercial" | "transactional" | "local" | "navigational";

export interface KeywordPlacement {
  title: boolean;
  h1: boolean;
  url: boolean;
  meta: boolean;
  intro: boolean;
}

/** How well the site targets one keyword. */
export interface KeywordResult {
  keyword: string;
  intent: SearchIntent;
  /** What kind of page usually ranks for this intent. */
  expectedPage: string;
  bestPage: string | null;
  bestPageTitle: string | null;
  /**
   * True when no page uses every word of the keyword, and bestPage is the
   * closest page on the core topic (modifiers like "best" or "how to" removed).
   */
  partial: boolean;
  /** Words of the keyword the best page doesn't use anywhere. */
  missingWords: string[];
  placements: KeywordPlacement | null;
  /** Exact-phrase uses per 100 words on the best page. */
  density: number;
  /** Other pages that also target this keyword in their title and H1. */
  competing: string[];
}

/** One affected item of a finding (usually a page). */
export interface FindingItem {
  url?: string;
  detail?: string;
  current?: string;
  suggested?: string;
}

export interface CodeSnippet {
  language: "html" | "json" | "text" | "xml" | "apache" | "nginx" | "javascript";
  code: string;
  filename?: string;
}

export interface FixFile {
  filename: string;
  content: string;
  mime: string;
}

export type FixKind =
  | "title"
  | "metaDescription"
  | "robotsTxt"
  | "sitemap"
  | "canonical"
  | "noindex"
  | "altText"
  | "schema"
  | "redirects"
  | "https"
  | "socialTags"
  | "llmsTxt"
  | "headings"
  | "compression"
  | "caching"
  | "images"
  | "viewport"
  | "lang"
  | "notFound"
  | "content"
  | "links"
  | "performance"
  | "generic";

export interface Fix {
  kind: FixKind;
  summary: string;
  steps?: string[];
  snippets?: CodeSnippet[];
  files?: FixFile[];
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

export type CheckRun = FindingItem[] | { skipped: string };

export interface CheckDefinition {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  /** Why this matters, in plain language (shown in the report). */
  why: string;
  learnSlug?: string;
  /** Returns affected items (empty array = passed) or a skip reason. */
  run(ctx: SiteContext): CheckRun;
  /** One-line summary for the report, given the affected items. */
  summarize(items: FindingItem[], ctx: SiteContext): string;
  fix?(items: FindingItem[], ctx: SiteContext): Fix | null;
}

export interface Scores {
  overall: number;
  aiVisibility: number;
  /** null when every check in the category was skipped (e.g. PageSpeed unavailable). */
  categories: Record<Category, number | null>;
}

export interface ActionPlan {
  niche: string | null;
  weeks: { title: string; tasks: string[] }[];
  offSite: { bucket: "fix" | "build" | "influence"; task: string }[];
  prompts: string[];
  /** Ready-to-paste FAQPage JSON-LD for the homepage (AI-generated only). */
  faqSchema: string | null;
  aiGenerated: boolean;
}
