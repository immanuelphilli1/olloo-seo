// Google autocomplete suggestions: real searches people type. This is an
// unofficial public endpoint (used by most free keyword tools), so callers must
// cache results, cap daily volume, and fall back gracefully when it fails.

const ENDPOINT = "https://suggestqueries.google.com/complete/search";

export const COUNTRIES: Record<string, string> = {
  us: "United States",
  gb: "United Kingdom",
  ca: "Canada",
  au: "Australia",
  ie: "Ireland",
  in: "India",
  ng: "Nigeria",
  za: "South Africa",
  nz: "New Zealand",
};

/** The prompts we expand a seed with — the same modifier families the courses use. */
export function expansionQueries(seed: string): string[] {
  const s = seed.toLowerCase().trim();
  return [s, `how to ${s}`, `what is ${s}`, `best ${s}`, `${s} vs`, `${s} for`, `${s} near me`, `${s} cost`, `${s} tool`, `why ${s}`, `is ${s}`, `${s} ideas`];
}

/** Parses Google's autocomplete response: ["query", ["suggestion", …], …]. */
export function parseSuggestions(body: unknown): string[] {
  if (!Array.isArray(body) || !Array.isArray(body[1])) return [];
  return (body[1] as unknown[]).filter((s): s is string => typeof s === "string").map((s) => s.trim().toLowerCase());
}

async function fetchOne(query: string, country: string): Promise<string[]> {
  // client=chrome localizes by `gl` more reliably than client=firefox (e.g. for the UK).
  const params = new URLSearchParams({ client: "chrome", hl: "en", gl: country, q: query });
  const res = await fetch(`${ENDPOINT}?${params}`, {
    signal: AbortSignal.timeout(4000),
    headers: { "user-agent": "Mozilla/5.0 (compatible; keyword-ideas)", accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Autocomplete returned ${res.status}`);
  const text = new TextDecoder("utf-8").decode(await res.arrayBuffer());
  return parseSuggestions(JSON.parse(text));
}

/**
 * Fetches suggestions for the seed and its expansions. Resolves with whatever
 * succeeded; throws only if every request failed.
 */
export async function fetchSuggestions(seed: string, country = "us"): Promise<{ suggestions: string[]; requests: number }> {
  const queries = expansionQueries(seed);
  const results: string[][] = [];
  let failures = 0;
  let index = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (index < queries.length) {
        const q = queries[index++];
        try {
          results.push(await fetchOne(q, country));
        } catch {
          failures++;
        }
      }
    }),
  );
  if (failures === queries.length) throw new Error("Google suggestions are unavailable right now.");
  const seen = new Set<string>();
  const suggestions: string[] = [];
  for (const s of results.flat()) {
    if (!seen.has(s)) {
      seen.add(s);
      suggestions.push(s);
    }
  }
  return { suggestions, requests: queries.length };
}
