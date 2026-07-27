import { useState, useCallback, type FormEvent } from "react";
import type { PluginConfig, PluginAPI } from "../types";
import { usePluginData } from "../../hooks/usePluginData";

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

const config: PluginConfig<SearchData> = {
  id: "search",
  name: "Search",
  description: "Search the web from your new tab.",
  type: "widget",
  defaultData: { defaultEngine: "google" },
  defaultSize: { width: 4, height: 1 },
  component: SearchWidget,
};

function SearchWidget(_props: { api: PluginAPI<SearchData> }) {
  const { data } = usePluginData("search", config.defaultData, {});
  const { defaultEngine } = data.get();
  const [query, setQuery] = useState("");

  const engine = ENGINES.find((e) => e.id === defaultEngine) ?? ENGINES[0];

  const search = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      if (!query.trim()) return;
      window.location.href = engine.url + encodeURIComponent(query.trim());
    },
    [query, engine],
  );

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={search} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search with ${engine.name}...`}
          className="flex-1 px-4 py-3 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
          autoFocus
        />
        <button
          type="submit"
          className="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
        >
          Search
        </button>
      </form>
      <div className="flex justify-center gap-2 mt-3 flex-wrap">
        {ENGINES.map((e) => (
          <button
            key={e.id}
            onClick={() => data.set({ defaultEngine: e.id })}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              e.id === defaultEngine
                ? "bg-white/30 dark:bg-white/20 font-medium"
                : "bg-white/10 dark:bg-white/5 hover:bg-white/20"
            }`}
            title={e.name}
          >
            {e.icon} {e.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default config;
