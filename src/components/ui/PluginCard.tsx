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
      className={`p-4 rounded-xl border transition-colors cursor-pointer ${
        isActive
          ? "border-blue-500/80 bg-blue-500/10 dark:border-blue-400"
          : "border-gray-200 bg-gray-50/50 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:bg-gray-800"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{displayName}</h3>
          <p className="text-sm opacity-60">{displayDesc}</p>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            isActive ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
          }`}
        >
          {isActive && <Check className="w-3 h-3 text-white stroke-[3]" />}
        </div>
      </div>
    </div>
  );
}
