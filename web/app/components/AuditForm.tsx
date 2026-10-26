import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Globe, Loader2, Plus } from "lucide-react";
import { KeywordInput } from "./KeywordInput";
import { api, type AppConfig } from "~/lib/api";

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => string; reset: (id?: string) => void };
  }
}

interface AuditFormProps {
  id?: string;
  /** "dark" for ink backgrounds (hero, CTAs), "light" for white pages. */
  tone?: "dark" | "light";
  size?: "lg" | "md";
  stacked?: boolean;
  autoFocus?: boolean;
}

/** The main "enter your URL" form. Starts an audit and opens the live report. */
export function AuditForm({ id = "audit", tone = "dark", size = "lg", stacked = false, autoFocus = false }: AuditFormProps) {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [token, setToken] = useState<string | undefined>();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [showKeywords, setShowKeywords] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // The Keyword Generator links here with ?kw=a,b — prefill the hero form.
  useEffect(() => {
    if (id !== "hero") return;
    const kw = new URLSearchParams(window.location.search).get("kw");
    if (!kw) return;
    const list = kw.split(",").map((k) => k.trim()).filter(Boolean).slice(0, 5);
    if (list.length) {
      setKeywords(list);
      setShowKeywords(true);
    }
  }, [id]);

  useEffect(() => {
    api<AppConfig>("/config")
      .then((c) => setSiteKey(c.turnstileSiteKey))
      .catch(() => {});
  }, []);

  // Cloudflare Turnstile is only loaded when the server has it configured.
  useEffect(() => {
    if (!siteKey || !widgetRef.current) return;
    const render = () => window.turnstile?.render(widgetRef.current!, { sitekey: siteKey, callback: setToken });
    if (window.turnstile) return void render();
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
  }, [siteKey]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      setError("Enter your website address, like example.com");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ id: string }>("/audits", { body: { url, turnstileToken: token, keywords } });
      navigate(`/audit/${res.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
      window.turnstile?.reset();
    }
  }

  const dark = tone === "dark";
  const big = size === "lg";
  const shell = stacked
    ? "flex flex-col gap-2.5"
    : `flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2 sm:rounded-2xl sm:p-2 ${
        dark ? "sm:bg-white/[0.06] sm:ring-1 sm:ring-white/15 sm:backdrop-blur" : "sm:bg-white sm:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] sm:ring-1 sm:ring-neutral-200"
      }`;
  const inputTone = dark
    ? `bg-white/[0.06] text-white ring-1 ring-white/15 placeholder:text-neutral-500 ${stacked ? "" : "sm:bg-transparent sm:ring-0"}`
    : `bg-white text-ink ring-1 ring-neutral-300 placeholder:text-neutral-400 ${stacked ? "" : "sm:ring-0"}`;

  return (
    <form onSubmit={submit} className="w-full" noValidate id={id}>
      <div className={shell}>
        <label htmlFor={`${id}-url`} className="sr-only">
          Your website address
        </label>
        <div className="relative flex-1">
          <Globe className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${dark ? "text-neutral-500" : "text-neutral-400"}`} size={18} aria-hidden />
          <input
            id={`${id}-url`}
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus={autoFocus}
            placeholder="yourwebsite.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={`w-full rounded-xl py-3.5 pl-11 pr-11 outline-none transition focus:ring-2 focus:ring-brand-500 ${big ? "text-lg" : "text-base"} ${inputTone}`}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {/* add target keyword small button here, onclick should toggle showKeywords */}
          <button
            type="button"
            onClick={() => setShowKeywords(!showKeywords)}
            aria-label={showKeywords ? "Hide target keywords" : "Add target keywords"}
            aria-expanded={showKeywords}
            title={showKeywords ? "Hide target keywords" : "Add target keywords"}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 ${showKeywords ? "rotate-45" : "rotate-0"} transition-transform duration-200`}
          >
            <Plus size={15} className="text-brand-500" aria-hidden /> 
          </button>
        </div>
        <div className="mt-1 md:hidden">
        {showKeywords ? (
          <div>
            <label htmlFor={`${id}-keywords-mobile`} className={`mb-1.5 block text-sm font-medium ${dark ? "text-neutral-300" : "text-neutral-700"}`}>
              Target keywords <span className={dark ? "text-neutral-500" : "text-neutral-500"}>(optional, up to 5)</span>
            </label>
            <KeywordInput id={`${id}-keywords-mobile`} keywords={keywords} onChange={setKeywords} dark={dark} autoFocus={!keywords.length} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowKeywords(true)}
            className={`inline-flex items-center gap-1.5 text-sm font-medium transition ${dark ? "text-neutral-400 hover:text-white" : "text-neutral-600 hover:text-ink"}`}
          >
            <Plus size={15} className="text-brand-500" aria-hidden /> Add target keywords <span className={`font-normal ${dark ? "text-neutral-400" : "text-neutral-500"}`}>(optional)</span>
          </button>
        )}
      </div>
        <button type="submit" className={`btn-primary shrink-0 ${big ? "px-6 py-3.5 text-base" : "py-3"}`} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} aria-hidden /> : null}
          {loading ? "Starting audit…" : "Audit my site free"}
          {!loading && <ArrowRight size={18} aria-hidden />}
        </button>
      </div>
      <div className="mt-3 hidden md:block">
        {showKeywords ? (
          <div>
            <label htmlFor={`${id}-keywords`} className={`mb-1.5 block text-sm font-medium ${dark ? "text-neutral-300" : "text-neutral-700"}`}>
              Target keywords <span className={dark ? "text-neutral-500" : "text-neutral-500"}>(optional, up to 5)</span>
            </label>
            <KeywordInput id={`${id}-keywords`} keywords={keywords} onChange={setKeywords} dark={dark} autoFocus={!keywords.length} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowKeywords(true)}
            className={`inline-flex items-center gap-1.5 text-sm font-medium transition ${dark ? "text-neutral-400 hover:text-white" : "text-neutral-600 hover:text-ink"}`}
          >
            <Plus size={15} className="text-brand-500" aria-hidden /> Add target keywords <span className={`font-normal ${dark ? "text-neutral-400" : "text-neutral-500"}`}>(optional)</span>
          </button>
        )}
      </div>
      {siteKey && <div ref={widgetRef} className="mt-3" />}
      {error && (
        <p id={`${id}-error`} role="alert" className={`mt-3 text-sm font-medium ${dark ? "text-red-400" : "text-bad"}`}>
          {error}
        </p>
      )}
    </form>
  );
}
