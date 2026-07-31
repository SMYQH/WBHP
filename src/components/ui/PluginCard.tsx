import type { PluginConfig, LanguageMode } from "../../plugins/types";
import { getTranslations } from "../../i18n";
import { Check } from "lucide-react";

interface PluginCardProps {
  plugin: PluginConfig;
  isActive: boolean;
  onToggle: () => void;
  language?: LanguageMode;
}

export default function PluginCard({
  plugin,
  isActive,
  onToggle,
  language = "auto",
}: PluginCardProps) {
  const t = getTranslations(language);
  const widgetTrans = (t.widgets as Record<string, { name: string; desc: string }>)[plugin.id];
  const bgTrans = (t.backgrounds as Record<string, { name: string; desc: string }>)[plugin.id];

  const displayName = widgetTrans?.name ?? bgTrans?.name ?? plugin.name;
  const displayDesc = widgetTrans?.desc ?? bgTrans?.desc ?? plugin.description;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`${displayName}: ${displayDesc}`}
      className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
        isActive
          ? "border-cyan-400/70 bg-cyan-500/15 text-slate-100 shadow-[0_0_15px_rgba(6,182,212,0.15)] dark:border-cyan-400/80 dark:bg-cyan-500/20"
          : "border-white/10 bg-slate-900/40 text-slate-300 hover:bg-slate-800/50 hover:border-white/20 dark:bg-slate-900/60 dark:hover:bg-slate-800/80"
      }`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold text-sm transition-colors ${isActive ? "text-cyan-300" : "text-slate-200"}`}>
            {displayName}
          </h3>
          <p className="text-xs text-slate-400 truncate mt-0.5">{displayDesc}</p>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
            isActive
              ? "border-cyan-400 bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              : "border-slate-600 bg-slate-800/50"
          }`}
          aria-hidden
        >
          {isActive && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </div>
    </div>
  );
}

