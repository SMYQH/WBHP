import { useState, useCallback, useSyncExternalStore, type FormEvent } from "react";
import type { PluginConfig, PluginAPI } from "../types";

interface SearchEngine {
  id: string;
  name: string;
  url: string;
  icon: string;
}

const ENGINES: SearchEngine[] = [
  { id: "google", name: "Google", url: "https://www.google.com/search?q=", icon: "🔍" },
  { id: "bing", name: "Bing", url: "https://www.bing.com/search?q=", icon: "🔎" },
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
          Search the web
        </label>
        <input
          id="wbhp-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search with ${engine.name}...`}
          className="flex-1 rounded-xl border border-white/30 bg-white/20 px-4 py-3 text-lg backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-white/10"
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="rounded-xl bg-blue-500 px-5 py-3 font-medium text-white transition-colors hover:bg-blue-600"
        >
          Search
        </button>
      </form>
      <div className="mt-3 flex flex-wrap justify-center gap-2" role="group" aria-label="Search engines">
        {ENGINES.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => api.data.set({ defaultEngine: e.id })}
            className={`rounded-lg px-3 py-1 text-sm transition-colors ${
              e.id === defaultEngine
                ? "bg-white/30 font-medium dark:bg-white/20"
                : "bg-white/10 hover:bg-white/20 dark:bg-white/5"
            }`}
            title={e.name}
            aria-pressed={e.id === defaultEngine}
          >
            {e.icon} {e.name}
          </button>
        ))}
      </div>
    </div>
  );
}

const config: PluginConfig<SearchData> = {
  id: "search",
  name: "Search",
  description: "Search the web from your new tab.",
  type: "widget",
  defaultData: { defaultEngine: "google" },
  defaultSize: { width: 4, height: 1 },
  component: SearchWidget,
};

export default config;
