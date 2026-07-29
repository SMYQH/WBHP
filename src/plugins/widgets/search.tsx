/* Hallmark · component: search-console · genre: modern-minimal · tone: technical
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

import { useState, useCallback, useSyncExternalStore, useMemo, type FormEvent, type KeyboardEvent } from "react";
import type { PluginConfig, PluginAPI } from "../types";
import { getTranslations } from "../../i18n";

export interface SearchEngine {
  id: string;
  name: string;
  url: string;
  icon: string;
  category: "web" | "ai" | "dev";
  isAi?: boolean;
  shortcutKey?: string;
}

export const ENGINES: SearchEngine[] = [
  { id: "google", name: "Google", url: "https://www.google.com/search?q=", icon: "🔍", category: "web", shortcutKey: "1" },
  { id: "bing", name: "Bing", url: "https://www.bing.com/search?q=", icon: "🔎", category: "web", shortcutKey: "2" },
  { id: "baidu", name: "Baidu", url: "https://www.baidu.com/s?wd=", icon: "🐾", category: "web", shortcutKey: "3" },
  { id: "duckduckgo", name: "DuckDuckGo", url: "https://duckduckgo.com/?q=", icon: "🦆", category: "web", shortcutKey: "4" },
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com/?q=", icon: "🤖", isAi: true, category: "ai", shortcutKey: "5" },
  { id: "claude", name: "Claude", url: "https://claude.ai/new?q=", icon: "🧠", isAi: true, category: "ai", shortcutKey: "6" },
  { id: "gemini", name: "Gemini", url: "https://gemini.google.com/app?q=", icon: "✨", isAi: true, category: "ai", shortcutKey: "7" },
  { id: "perplexity", name: "Perplexity", url: "https://www.perplexity.ai/search?q=", icon: "🔮", isAi: true, category: "ai", shortcutKey: "8" },
  { id: "tavily", name: "Tavily AI", url: "tavily:sidebar", icon: "🌐", isAi: true, category: "ai", shortcutKey: "t" },
  { id: "github", name: "GitHub", url: "https://github.com/search?q=", icon: "🐙", category: "dev", shortcutKey: "g" },
  { id: "stackoverflow", name: "StackOverflow", url: "https://stackoverflow.com/search?q=", icon: "⚡", category: "dev", shortcutKey: "s" },
  { id: "mdn", name: "MDN Web", url: "https://developer.mozilla.org/search?q=", icon: "📚", category: "dev", shortcutKey: "m" },
];

interface SearchData {
  defaultEngine: string;
}

export type CategoryFilter = "all" | "web" | "ai" | "dev";

function SearchWidget({ api }: { api: PluginAPI<SearchData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const { defaultEngine } = data;
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = getTranslations(api.settings.language).widgets.search;

  const currentEngine = useMemo(() => {
    return ENGINES.find((e) => e.id === defaultEngine) ?? ENGINES[0];
  }, [defaultEngine]);

  const filteredEngines = useMemo(() => {
    if (activeCategory === "all") return ENGINES;
    return ENGINES.filter((e) => e.category === activeCategory);
  }, [activeCategory]);

  const search = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const q = query.trim();

      if (currentEngine.id === "tavily") {
        window.dispatchEvent(new CustomEvent("wbhp:open-tavily", { detail: { query: q } }));
        return;
      }

      if (!q) return;
      setIsSubmitting(true);
      setTimeout(() => {
        window.location.assign(currentEngine.url + encodeURIComponent(q));
      }, 100);
    },
    [query, currentEngine],
  );

  const cycleEngine = useCallback(
    (direction: 1 | -1) => {
      const currentIndex = ENGINES.findIndex((e) => e.id === currentEngine.id);
      const nextIndex = (currentIndex + direction + ENGINES.length) % ENGINES.length;
      api.data.set({ defaultEngine: ENGINES[nextIndex].id });
    },
    [currentEngine.id, api.data],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && query) {
      e.preventDefault();
      setQuery("");
    } else if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey) {
      // Cycle engine forward on Tab when input is empty or modifier pressed
      if (!query) {
        e.preventDefault();
        cycleEngine(1);
      }
    }
  };

  const getModeLabel = () => {
    if (currentEngine.isAi) return "AI_AGENT";
    if (currentEngine.category === "dev") return "DEV_LOOKUP";
    return "WEB_SEARCH";
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-2">
      {/* Category Tabs Header */}
      <div className="mb-2 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 rounded-lg bg-black/20 p-1 backdrop-blur dark:bg-white/5 border border-white/10">
          {(["all", "web", "ai", "dev"] as CategoryFilter[]).map((cat) => {
            const labelMap = {
              all: t.catAll,
              web: t.catWeb,
              ai: t.catAi,
              dev: t.catDev,
            };
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-md px-2.5 py-1 transition-all duration-150 flex items-center gap-1 font-mono uppercase tracking-wider ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm border border-cyan-500/40"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <span>{cat === "all" ? "🌐" : cat === "web" ? "🔎" : cat === "ai" ? "⚡" : "💻"}</span>
                <span>{labelMap[cat]}</span>
              </button>
            );
          })}
        </div>

        {/* Engine status indicator */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-cyan-400/80 bg-black/30 dark:bg-white/5 px-2.5 py-1 rounded-md border border-cyan-500/20">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>{getModeLabel()}</span>
        </div>
      </div>

      {/* Main Terminal Input Console */}
      <form onSubmit={search} className="group relative flex items-center" role="search">
        <label className="sr-only" htmlFor="wbhp-search-input">
          {t.placeholder}
        </label>

        {/* Console Box Container */}
        <div className="relative flex w-full items-center rounded-xl border border-white/20 bg-slate-950/40 backdrop-blur-xl transition-all duration-200 focus-within:border-cyan-400/70 focus-within:ring-2 focus-within:ring-cyan-500/30 dark:bg-slate-900/60 dark:border-white/15">
          {/* Active Engine Badge */}
          <div className="flex items-center gap-2 pl-3.5 pr-2 py-3 border-r border-white/10 select-none">
            <span className="text-xl" role="img" aria-label={currentEngine.name}>
              {currentEngine.icon}
            </span>
            <span className="hidden md:inline-block font-mono text-xs font-semibold text-cyan-300 uppercase tracking-wide">
              {currentEngine.name}
            </span>
          </div>

          {/* Text Input */}
          <input
            id="wbhp-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentEngine.isAi
                ? t.aiPlaceholder
                : `${t.placeholder} (${currentEngine.name})`
            }
            className="flex-1 bg-transparent px-4 py-3.5 text-base font-sans text-white placeholder-white/40 focus:outline-none dark:text-slate-100"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            disabled={isSubmitting}
          />

          {/* Quick Clear Button */}
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mr-2 rounded-md p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors font-mono text-xs"
              title="Clear query (Esc)"
            >
              ✕
            </button>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={!query.trim() || isSubmitting}
            className={`mr-2 flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-xs font-bold transition-all duration-150 ${
              query.trim() && !isSubmitting
                ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95 shadow-md shadow-cyan-500/20"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            }`}
          >
            <span>{isSubmitting ? "EXEC..." : t.button}</span>
            <span className="hidden sm:inline-block opacity-70">↵</span>
          </button>
        </div>
      </form>

      {/* Engine Selection Badges Grid */}
      <div
        className="mt-3 flex flex-wrap items-center justify-center gap-1.5"
        role="group"
        aria-label="Search engines"
      >
        {filteredEngines.map((e) => {
          const isSelected = e.id === defaultEngine;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => api.data.set({ defaultEngine: e.id })}
              className={`group/btn relative rounded-lg px-3 py-1.5 text-xs font-mono transition-all duration-150 flex items-center gap-1.5 border ${
                isSelected
                  ? "bg-cyan-500/25 border-cyan-400/60 text-cyan-200 font-semibold shadow-sm scale-105"
                  : "bg-black/20 border-white/10 text-white/70 hover:text-white hover:bg-white/15 hover:border-white/20 dark:bg-white/5"
              }`}
              title={`${e.name} (${e.category.toUpperCase()})`}
              aria-pressed={isSelected}
            >
              <span className="text-sm">{e.icon}</span>
              <span>{e.name}</span>
              {e.isAi && (
                <span className="ml-0.5 rounded bg-cyan-400/20 px-1 py-0.2 text-[9px] font-bold text-cyan-300 border border-cyan-400/30">
                  AI
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Technical Footer Telemetry Bar */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-white/50 px-1">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block">LEN: {query.length}</span>
          <span className="hidden sm:inline-block text-white/20">|</span>
          <span className="text-cyan-400/70">{t.shortcutTip}</span>
        </div>
        <div className="text-right text-white/40">
          <span>SYS.SEARCH_V2.0</span>
        </div>
      </div>
    </div>
  );
}

const config: PluginConfig<SearchData> = {
  id: "search",
  name: "Search Console",
  description: "Technical multi-engine search terminal with AI & developer engine switching.",
  type: "widget",
  defaultData: { defaultEngine: "google" },
  defaultSize: { width: 4, height: 1 },
  component: SearchWidget,
};

export default config;
