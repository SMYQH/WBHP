import { useSyncExternalStore } from "react";
import type { PluginConfig, PluginAPI } from "../types";
import { getTranslations } from "../../i18n";

export interface NotesData {
  content: string;
}

const defaultData: NotesData = {
  content: "",
};

function NotesWidget({ api }: { api: PluginAPI<NotesData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const t = getTranslations(api.settings.language).widgets.notes;

  const content = data.content || "";

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    api.data.set({ content: e.target.value });
  };

  const handleClear = () => {
    api.data.set({ content: "" });
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="w-full rounded-2xl border border-white/20 bg-white/40 p-5 shadow-lg backdrop-blur-md transition-all dark:border-white/10 dark:bg-gray-900/40">
      <div className="mb-3 flex items-center justify-between border-b border-gray-200/40 pb-2.5 dark:border-gray-700/40">
        <h3 className="text-base font-semibold tracking-wide flex items-center gap-2">
          <span>📝</span> {t.name}
        </h3>
        {content && (
          <button
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-rose-500 transition-colors"
          >
            {t.clearBtn}
          </button>
        )}
      </div>

      <textarea
        value={content}
        onChange={handleChange}
        placeholder={t.placeholder}
        rows={4}
        className="w-full resize-none rounded-xl border border-gray-200/50 bg-white/50 p-3 text-sm text-gray-800 backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-gray-200"
      />

      <div className="mt-2 text-right text-xs opacity-60">
        {wordCount} {t.words} · {charCount} {t.chars}
      </div>
    </div>
  );
}

const config: PluginConfig<NotesData> = {
  id: "notes",
  name: "Quick Notes",
  description: "Instant notepad widget for fast ideas and thoughts.",
  type: "widget",
  defaultData,
  defaultSize: { width: 4, height: 2 },
  component: NotesWidget,
};

export default config;
