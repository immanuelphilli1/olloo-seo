import { Bot, Code2, FileText, KeyRound, Map, Route as RouteIcon, Sparkles, Tag, Wand2 } from "lucide-react";
import type { ToolInfo } from "~/content/tools";

const icons = { bot: Bot, file: FileText, wand: Wand2, code: Code2, sparkles: Sparkles, tag: Tag, route: RouteIcon, map: Map, key: KeyRound };

export function ToolIcon({ icon, small = false }: { icon: ToolInfo["icon"]; small?: boolean }) {
  const Icon = icons[icon];
  if (small) return <Icon size={14} aria-hidden />;
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
      <Icon size={19} aria-hidden />
    </span>
  );
}
