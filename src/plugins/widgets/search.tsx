/* Hallmark · component: search-console · genre: modern-minimal · tone: technical
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

import { useState, useCallback, useSyncExternalStore, useMemo, type FormEvent, type KeyboardEvent } from "react";
import {
  Search,
  Bot,
  Brain,
  Sparkles,
  Code,
  Compass,
  ShieldCheck,
  Globe,
  X,
} from "lucide-react";
import type { PluginConfig, PluginAPI } from "../types";
import { getTranslations } from "../../i18n";

export interface SearchEngine {
  id: string;
  name: string;
  url: string;
  category: "web" | "ai" | "dev";
  isAi?: boolean;
  shortcutKey?: string;
}

export const ENGINES: SearchEngine[] = [
  { id: "google", name: "Google", url: "https://www.google.com/search?q=", category: "web", shortcutKey: "1" },
  { id: "bing", name: "Bing", url: "https://www.bing.com/search?q=", category: "web", shortcutKey: "2" },
  { id: "baidu", name: "Baidu", url: "https://www.baidu.com/s?wd=", category: "web", shortcutKey: "3" },
  { id: "duckduckgo", name: "DuckDuckGo", url: "https://duckduckgo.com/?q=", category: "web", shortcutKey: "4" },
  { id: "tavily", name: "Tavily AI", url: "https://tavily.com/?q=", isAi: true, category: "ai", shortcutKey: "5" },
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com/?q=", isAi: true, category: "ai", shortcutKey: "6" },
  { id: "claude", name: "Claude", url: "https://claude.ai/new?q=", isAi: true, category: "ai", shortcutKey: "7" },
  { id: "gemini", name: "Gemini", url: "https://gemini.google.com/app?q=", isAi: true, category: "ai", shortcutKey: "8" },
  { id: "github", name: "GitHub", url: "https://github.com/search?q=", category: "dev", shortcutKey: "g" },
];

function EngineIcon({ id, className = "w-4 h-4" }: { id: string; className?: string }) {
  switch (id) {
    case "google":
      return <Search className={className} />;
    case "bing":
      return <Search className={className} />;
    case "baidu":
      return <Compass className={className} />;
    case "duckduckgo":
      return <ShieldCheck className={className} />;
    case "tavily":
      return <Globe className={className} />;
    case "chatgpt":
      return <Bot className={className} />;
    case "claude":
      return <Brain className={className} />;
    case "gemini":
      return <Sparkles className={className} />;
    case "github":
      return <Code className={className} />;
    default:
      return <Search className={className} />;
  }
}

interface SearchData {
  defaultEngine: string;
}

function SearchWidget({ api }: { api: PluginAPI<SearchData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const { defaultEngine } = data;
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = getTranslations(api.settings.language).widgets.search;

  const currentEngine = useMemo(() => {
    return ENGINES.find((e) => e.id === defaultEngine) ?? ENGINES[0];
  }, [defaultEngine]);

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

  return (
    <div className="mx-auto w-full max-w-2xl px-2">
      {/* Main Terminal Input Console */}
      <form onSubmit={search} className="group relative flex items-center" role="search">
        <label className="sr-only" htmlFor="wbhp-search-input">
          {t.placeholder}
        </label>

        {/* Console Box Container */}
        <div className="relative flex w-full items-center rounded-xl border border-white/20 bg-slate-950/40 backdrop-blur-xl transition-all duration-200 focus-within:border-cyan-400/70 focus-within:ring-2 focus-within:ring-cyan-500/30 dark:bg-slate-900/60 dark:border-white/15">
          {/* Active Engine Badge */}
          <div className="flex items-center gap-2 pl-3.5 pr-2 py-3 border-r border-white/10 select-none">
            <EngineIcon id={currentEngine.id} className="w-4 h-4 text-cyan-300 shrink-0" />
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
              title={t.clearTooltip}
              aria-label={t.clearTooltip}
            >
              <X className="w-3.5 h-3.5" />
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
            <span>{isSubmitting ? t.executing : t.button}</span>
            <span className="hidden sm:inline-block opacity-70">↵</span>
          </button>
        </div>
      </form>

      {/* Engine Selection Badges Grid */}
      <div
        className="mt-3 flex flex-wrap items-center justify-center gap-1.5"
        role="group"
        aria-label={t.enginesAria}
      >
        {ENGINES.map((e) => {
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
              <EngineIcon id={e.id} className="w-3.5 h-3.5 shrink-0" />
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
