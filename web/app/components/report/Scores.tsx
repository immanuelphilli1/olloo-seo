import { CATEGORY_INFO } from "~/lib/categories";
import { CATEGORY_LABELS, type Category, type Scores } from "~/lib/types";

export function scoreTone(score: number): { color: string; label: string; text: string; textDark: string } {
  if (score >= 90) return { color: "#10b981", label: "Excellent", text: "text-emerald-700", textDark: "text-emerald-400" };
  if (score >= 70) return { color: "#22c55e", label: "Good", text: "text-green-700", textDark: "text-green-400" };
  if (score >= 50) return { color: "#f59e0b", label: "Needs work", text: "text-amber-700", textDark: "text-amber-400" };
  return { color: "#ef4444", label: "Poor", text: "text-red-700", textDark: "text-red-400" };
}

export function ScoreRing({ score, label, sublabel, dark = false }: { score: number; label: string; sublabel: string; dark?: boolean }) {
  const tone = scoreTone(score);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="flex items-center gap-5">
      <svg width="128" height="128" viewBox="0 0 128 128" role="img" aria-label={`${label}: ${score} out of 100 (${tone.label})`} className="shrink-0">
        <circle cx="64" cy="64" r={radius} fill="none" stroke={dark ? "rgba(255,255,255,0.08)" : "#e5e5e5"} strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={tone.color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          transform="rotate(-90 64 64)"
          className="animate-ring"
          style={{ "--ring-length": `${circumference}px` } as React.CSSProperties}
        />
        <text x="64" y="73" textAnchor="middle" className={`${dark ? "fill-white" : "fill-ink"} text-[34px] font-semibold`}>
          {score}
        </text>
      </svg>
      <div>
        <p className={`font-semibold ${dark ? "text-white" : "text-ink"}`}>{label}</p>
        <p className={`text-sm font-semibold ${dark ? tone.textDark : tone.text}`}>{tone.label}</p>
        <p className={`mt-1 max-w-xs text-sm ${dark ? "text-neutral-400" : "text-neutral-600"}`}>{sublabel}</p>
      </div>
    </div>
  );
}

export function CategoryBars({ scores, dark = false }: { scores: Scores; dark?: boolean }) {
  return (
    <ul className="space-y-3">
      {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => {
        const value = scores.categories[category];
        const tone = value === null ? null : scoreTone(value);
        return (
          <li key={category}>
            <div className="flex items-start justify-between gap-3 text-sm">
              <span className={`font-medium ${dark ? "text-neutral-300" : "text-neutral-700"}`} title={CATEGORY_INFO[category].plain}>
                {CATEGORY_LABELS[category]}
                <span className={`block text-xs font-normal ${dark ? "text-neutral-500" : "text-neutral-500"}`}>{CATEGORY_INFO[category].question}</span>
              </span>
              <span className={`font-semibold ${(dark ? tone?.textDark : tone?.text) ?? (dark ? "text-neutral-400" : "text-neutral-500")}`}>{value === null ? "Not measured" : `${value}/100`}</span>
            </div>
            <div className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-neutral-100"}`}>
              {value !== null && <div className="h-full rounded-full" style={{ width: `${Math.max(value, 3)}%`, backgroundColor: tone!.color }} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
