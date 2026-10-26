import { useState } from "react";
import { X } from "lucide-react";

export const MAX_KEYWORDS = 5;

/** Chip input for up to 5 target keywords. Enter or comma adds a keyword. */
export function KeywordInput({
  id,
  keywords,
  onChange,
  dark = false,
  autoFocus = false,
}: {
  id: string;
  keywords: string[];
  onChange: (next: string[]) => void;
  dark?: boolean;
  autoFocus?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const full = keywords.length >= MAX_KEYWORDS;

  const add = (raw: string) => {
    const k = raw.replace(/\s+/g, " ").trim().slice(0, 80);
    if (!k || full || keywords.some((x) => x.toLowerCase() === k.toLowerCase())) return setDraft("");
    onChange([...keywords, k]);
    setDraft("");
  };

  return (
    <div>
      <div
        className={`flex flex-wrap items-center gap-1.5 rounded-xl px-2.5 py-2 ring-1 focus-within:ring-2 focus-within:ring-brand-500 ${
          dark ? "bg-white/[0.06] ring-white/15" : "bg-white ring-neutral-300"
        }`}
      >
        {keywords.map((k) => (
          <span
            key={k}
            className={`inline-flex items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 text-sm ${dark ? "bg-white/10 text-white" : "bg-brand-50 text-brand-800 ring-1 ring-brand-100"}`}
          >
            {k}
            <button
              type="button"
              aria-label={`Remove ${k}`}
              onClick={() => onChange(keywords.filter((x) => x !== k))}
              className={`rounded p-0.5 ${dark ? "text-neutral-400 hover:text-white" : "text-brand-600 hover:text-brand-800"}`}
            >
              <X size={13} aria-hidden />
            </button>
          </span>
        ))}
        {!full && (
          <input
            id={id}
            type="text"
            value={draft}
            autoFocus={autoFocus}
            maxLength={80}
            onChange={(e) => {
              const v = e.target.value;
              if (v.endsWith(",")) add(v.slice(0, -1));
              else setDraft(v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(draft);
              } else if (e.key === "Backspace" && !draft && keywords.length) {
                onChange(keywords.slice(0, -1));
              }
            }}
            onBlur={() => draft && add(draft)}
            placeholder={keywords.length ? "Add another…" : "e.g. emergency plumber leeds"}
            className={`min-w-[10rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none ${dark ? "text-white placeholder:text-neutral-500" : "text-ink placeholder:text-neutral-400"}`}
          />
        )}
      </div>
      <p className={`mt-1.5 text-xs ${dark ? "text-neutral-500" : "text-neutral-500"}`}>
        {full ? "Maximum of 5 keywords." : `Press Enter after each keyword · ${MAX_KEYWORDS - keywords.length} left`}
      </p>
    </div>
  );
}
