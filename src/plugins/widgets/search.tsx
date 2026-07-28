import { useState, useCallback, useSyncExternalStore, type FormEvent } from "react";
import type { PluginConfig, PluginAPI } from "../types";
import { getTranslations } from "../../i18n";

interface SearchEngine {
  id: string;
  name: string;
  url: string;
  icon: string;
  isAi?: boolean;
}

const ENGINES: SearchEngine[] = [
  { id: "google", name: "Google", url: "https://www.google.com/search?q=", icon: "🔍" },
  { id: "bing", name: "Bing", url: "https://www.bing.com/search?q=", icon: "🔎" },
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com/?q=", icon: "🤖", isAi: true },
  { id: "gemini", name: "Gemini", url: "https://gemini.google.com/app?q=", icon: "✨", isAi: true },
  { id: "perplexity", name: "Perplexity", url: "https://www.perplexity.ai/search?q=", icon: "🧠", isAi: true },
  { id: "duckduckgo", name: "DuckDuckGo", url: "https://duckduckgo.com/?q=", icon: "🦆" },
  { id: "baidu", name: "Baidu", url: "https://www.baidu.com/s?wd=", icon: "🐾" },
  { id: "github", name: "GitHub", url: "https://github.com/search?q=", icon: "🐙" },
];

interface SearchData {
  defaultEngine: string;
}

function SearchWidget({ api }: { api: PluginAPI<SearchData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const { defaultEngine } = data;
  const [query, setQuery] = useState("");
  const t = getTranslations(api.settings.language).widgets.search;

  const engine = ENGINES.find((e) => e.id === defaultEngine) ?? ENGINES[0];

  const search = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const q = query.trim();
      if (!q) return;
      window.location.assign(engine.url + encodeURIComponent(q));
    },
    [query, engine],
  );

  return (
    <div className="mx-auto w-full max-w-xl">
      <form onSubmit={search} className="flex gap-2" role="search">
        <label className="sr-only" htmlFor="wbhp-search-input">
          {t.placeholder}
        </label>
        <input
          id="wbhp-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={engine.isAi ? `${t.aiPlaceholder}` : `${t.placeholder} (${engine.name})`}
          className="flex-1 rounded-xl border border-white/30 bg-white/20 px-4 py-3 text-lg backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-white/10"
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="rounded-xl bg-blue-500/90 px-5 py-3 font-medium text-white backdrop-blur transition-all hover:bg-blue-600 active:scale-95 flex items-center gap-1.5"
        >
          <span>{engine.icon}</span>
          <span>{t.button}</span>
        </button>
      </form>
      <div className="mt-3 flex flex-wrap justify-center gap-2" role="group" aria-label="Search engines">
        {ENGINES.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => api.data.set({ defaultEngine: e.id })}
            className={`rounded-lg px-3 py-1 text-sm transition-all flex items-center gap-1 ${
              e.id === defaultEngine
                ? "bg-white/30 font-medium dark:bg-white/20 scale-105 shadow-sm ring-1 ring-white/40"
                : "bg-white/10 hover:bg-white/20 dark:bg-white/5 opacity-80 hover:opacity-100"
            }`}
            title={e.name}
            aria-pressed={e.id === defaultEngine}
          >
            <span>{e.icon}</span>
            <span>{e.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const config: PluginConfig<SearchData> = {
  id: "search",
  name: "Search",
  description: "Search the web or ask AI from your new tab.",
  type: "widget",
  defaultData: { defaultEngine: "google" },
  defaultSize: { width: 4, height: 1 },
  component: SearchWidget,
};

export default config;
