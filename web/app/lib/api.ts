// Thin client for the API server. In development Vite proxies /api to it;
// in production the API server also serves this site, so paths are relative.

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T>(path: string, init?: { method?: "GET" | "POST"; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init?.method ?? (init?.body ? "POST" : "GET"),
      headers: init?.body ? { "content-type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError("Couldn't reach the server. Check your connection and try again.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? `Something went wrong (${res.status}).`, res.status);
  return data as T;
}

export interface AppConfig {
  siteName: string;
  aiEnabled: boolean;
  turnstileSiteKey: string | null;
  auditsPerDay: number;
}
