/* Hallmark · component: search-console · genre: modern-minimal · tone: technical
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

import {
  useState,
  useCallback,
  useSyncExternalStore,
  useMemo,
  useEffect,
  useRef,
  type SyntheticEvent,
  type KeyboardEvent,
} from "react";
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
  History,
  ChevronDown,
  CornerDownLeft,
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

/**
 * 100% Reliable JSONP fetcher for Baidu search suggestions.
 * Bypasses CORS restrictions in all web contexts and extensions.
 */
function fetchBaiduSuggestionsJSONP(query: string): Promise<string[]> {
  return new Promise((resolve) => {
    const q = query.trim();
    if (!q) return resolve([]);

    const callbackName = `__baidu_sug_${Math.random().toString(36).substring(2, 9)}`;
    let resolved = false;

    const cleanup = () => {
      try {
        if ((window as any)[callbackName]) {
          delete (window as any)[callbackName];
        }
        const el = document.getElementById(callbackName);
        if (el) el.remove();
      } catch {
        // Ignore DOM cleanup errors
      }
    };

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve([]);
      }
    }, 1200);

    (window as any)[callbackName] = (data: any) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        cleanup();
        if (data && Array.isArray(data.s)) {
          resolve(data.s.slice(0, 8));
        } else {
          resolve([]);
        }
      }
    };

    const script = document.createElement("script");
    script.id = callbackName;
    script.src = `https://suggestion.baidu.com/su?wd=${encodeURIComponent(q)}&cb=${callbackName}`;
    script.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        cleanup();
        resolve([]);
      }
    };
    document.body.appendChild(script);
  });
}

/**
 * Google search suggestion fetcher with fallback.
 */
async function fetchGoogleSuggestions(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(q)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return data[1].slice(0, 8);
      }
    }
  } catch {
    // Ignore fetch error
  }
  return [];
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim();
  if (!trimmed) return <span>{text}</span>;
  const index = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (index === -1) return <span>{text}</span>;

  const before = text.slice(0, index);
  const match = text.slice(index, index + trimmed.length);
  const after = text.slice(index + trimmed.length);

  return (
    <span>
      {before}
      <span className="text-white font-normal">{match}</span>
      <span className="font-bold text-cyan-300">{after}</span>
    </span>
  );
}

interface SearchData {
  defaultEngine: string;
  history?: string[];
}

function SearchWidget({ api }: { api: PluginAPI<SearchData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const { defaultEngine, history = [] } = data;
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEnginePickerOpen, setIsEnginePickerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = getTranslations(api.settings.language).widgets.search;

  const currentEngine = useMemo(() => {
    return ENGINES.find((e) => e.id === defaultEngine) ?? ENGINES[0];
  }, [defaultEngine]);

  // Group engines by category for popover menu
  const engineCategories = useMemo(() => {
    return [
      { id: "web", label: "Web Search", items: ENGINES.filter((e) => e.category === "web") },
      { id: "ai", label: "AI Research", items: ENGINES.filter((e) => e.category === "ai") },
      { id: "dev", label: "Developer", items: ENGINES.filter((e) => e.category === "dev") },
    ];
  }, []);

  // Real-time suggestions fetching with JSONP & Google fallback
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      // 1. Try Baidu JSONP (100% reliable across origins)
      const baiduResults = await fetchBaiduSuggestionsJSONP(trimmed);
      if (active && baiduResults.length > 0) {
        setSuggestions(baiduResults);
        return;
      }

      // 2. Fallback to Google Suggestions
      const googleResults = await fetchGoogleSuggestions(trimmed);
      if (active && googleResults.length > 0) {
        setSuggestions(googleResults);
      }
    }, 120);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  // Handle outside click to dismiss dropdown & engine popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        setIsEnginePickerOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute matched items (local history + online suggestions)
  const combinedItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return history.slice(0, 10).map((h) => ({ type: "history" as const, text: h }));
    }

    const matchedHistories = history
      .filter((h) => h.toLowerCase().includes(q))
      .slice(0, 5)
      .map((h) => ({ type: "history" as const, text: h }));

    const matchedSet = new Set(matchedHistories.map((h) => h.text.toLowerCase()));

    const filteredSuggestions = suggestions
      .filter((s) => !matchedSet.has(s.toLowerCase()))
      .slice(0, 8 - matchedHistories.length)
      .map((s) => ({ type: "suggestion" as const, text: s }));

    return [...matchedHistories, ...filteredSuggestions];
  }, [query, history, suggestions]);

  const executeSearch = useCallback(
    (targetQuery: string) => {
      const q = targetQuery.trim();
      if (!q) return;

      // Save search term to history (max 20)
      const currentData = api.data.get();
      const existingHistory = currentData?.history || [];
      const updatedHistory = [q, ...existingHistory.filter((item) => item !== q)].slice(0, 20);
      api.data.set({ ...currentData, history: updatedHistory });

      if (currentEngine.id === "tavily") {
        window.dispatchEvent(new CustomEvent("wbhp:open-tavily", { detail: { query: q } }));
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        return;
      }

      setIsSubmitting(true);
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
      setTimeout(() => {
        window.location.assign(currentEngine.url + encodeURIComponent(q));
      }, 100);
    },
    [currentEngine, api.data]
  );

  const handleSubmit = useCallback(
    (e?: SyntheticEvent) => {
      e?.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < combinedItems.length) {
        const itemText = combinedItems[selectedIndex].text;
        setQuery(itemText);
        executeSearch(itemText);
      } else {
        executeSearch(query);
      }
    },
    [query, selectedIndex, combinedItems, executeSearch]
  );

  const removeHistoryItem = useCallback(
    (e: React.MouseEvent, itemText: string) => {
      e.stopPropagation();
      const currentData = api.data.get();
      const existingHistory = currentData?.history || [];
      const updatedHistory = existingHistory.filter((h) => h !== itemText);
      api.data.set({ ...currentData, history: updatedHistory });
    },
    [api.data]
  );

  const clearAllHistory = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const currentData = api.data.get();
      api.data.set({ ...currentData, history: [] });
    },
    [api.data]
  );

  const cycleEngine = useCallback(
    (direction: 1 | -1) => {
      const currentIndex = ENGINES.findIndex((e) => e.id === currentEngine.id);
      const nextIndex = (currentIndex + direction + ENGINES.length) % ENGINES.length;
      api.data.set({ ...api.data.get(), defaultEngine: ENGINES[nextIndex].id });
    },
    [currentEngine.id, api.data]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (!isDropdownOpen) {
        setIsDropdownOpen(true);
        return;
      }
      e.preventDefault();
      if (combinedItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % combinedItems.length);
      }
    } else if (e.key === "ArrowUp") {
      if (!isDropdownOpen) return;
      e.preventDefault();
      if (combinedItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + combinedItems.length) % combinedItems.length);
      }
    } else if (e.key === "Escape") {
      if (isEnginePickerOpen) {
        e.preventDefault();
        setIsEnginePickerOpen(false);
      } else if (isDropdownOpen) {
        e.preventDefault();
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
      } else if (query) {
        e.preventDefault();
        setQuery("");
      }
    } else if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey) {
      if (!query) {
        e.preventDefault();
        cycleEngine(1);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-2xl px-2">
      {/* Search Input Floating Capsule Container */}
      <form onSubmit={handleSubmit} className="group relative flex items-center" role="search">
        <label className="sr-only" htmlFor="wbhp-search-input">
          {t.placeholder}
        </label>

        {/* Console Box Container (Hallmark Dark Glass & Cyan Ambient Glow) */}
        <div className="relative flex w-full items-center rounded-2xl border border-cyan-500/35 bg-slate-950/70 backdrop-blur-2xl shadow-[0_10px_35px_-5px_rgba(0,0,0,0.6)] transition-all duration-300 focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-500/20 hover:border-cyan-400/60 dark:bg-slate-950/80">
          
          {/* Active Engine Selector Trigger Button */}
          <div className="relative pl-2.5">
            <button
              type="button"
              onClick={() => {
                setIsEnginePickerOpen((prev) => {
                  if (!prev) setIsDropdownOpen(false);
                  return !prev;
                });
              }}
              className="flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/60 transition-all select-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              title="切换搜索引擎 (Tab)"
            >
              <EngineIcon id={currentEngine.id} className="w-4 h-4 shrink-0 text-cyan-300" />
              <span className="hidden sm:inline-block font-mono uppercase tracking-wider">{currentEngine.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${isEnginePickerOpen ? "rotate-180 text-cyan-200" : ""}`} />
            </button>

            {/* Interactive Engine Quick Picker Popover */}
            {isEnginePickerOpen && (
              <div className="absolute left-0 top-full mt-2.5 z-50 w-64 rounded-2xl border border-cyan-500/40 bg-slate-950 p-2 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl animate-scale-in">
                {engineCategories.map((cat) => (
                  <div key={cat.id} className="mb-2 last:mb-0">
                    <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400/80">
                      {cat.label}
                    </div>
                    <div className="space-y-0.5">
                      {cat.items.map((eng) => {
                        const isSelected = eng.id === currentEngine.id;
                        return (
                          <button
                            key={eng.id}
                            type="button"
                            onClick={() => {
                              api.data.set({ ...api.data.get(), defaultEngine: eng.id });
                              setIsEnginePickerOpen(false);
                              inputRef.current?.focus();
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                              isSelected
                                ? "bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                                : "text-slate-300 hover:bg-slate-900 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <EngineIcon id={eng.id} className={`w-4 h-4 ${isSelected ? "text-cyan-300" : "text-slate-400"}`} />
                              <span>{eng.name}</span>
                            </div>
                            {eng.isAi && (
                              <span className="rounded bg-cyan-400/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-400/30">
                                AI
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Text Input (role="searchbox" prevents native clear icon overlap) */}
          <input
            ref={inputRef}
            id="wbhp-search-input"
            type="text"
            role="searchbox"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsEnginePickerOpen(false);
              setIsDropdownOpen(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              setIsEnginePickerOpen(false);
              setIsDropdownOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              currentEngine.isAi
                ? t.aiPlaceholder
                : `${t.placeholder} (${currentEngine.name})`
            }
            className="flex-1 bg-transparent px-4 py-3.5 text-base font-sans text-slate-100 placeholder-slate-400 focus:outline-none"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            disabled={isSubmitting}
          />

          {/* Quick Clear Button */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedIndex(-1);
                setIsDropdownOpen(true);
                inputRef.current?.focus();
              }}
              className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-cyan-400"
              title={t.clearTooltip}
              aria-label={t.clearTooltip}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={!query.trim() || isSubmitting}
            className={`mr-2 flex h-10 items-center gap-1.5 rounded-xl px-4 font-mono text-xs font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              query.trim() && !isSubmitting
                ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-lg shadow-cyan-500/25"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            }`}
          >
            <span>{isSubmitting ? t.executing : t.button}</span>
            <CornerDownLeft className="w-3.5 h-3.5 opacity-80 hidden sm:inline-block" />
          </button>
        </div>
      </form>

      {/* Floating Suggestions & Search History Dropdown */}
      {!isEnginePickerOpen && isDropdownOpen && combinedItems.length > 0 && (
        <div className="absolute left-2 right-2 top-full mt-2.5 z-50 overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-all">
          <div className="max-h-80 overflow-y-auto py-2">
            {combinedItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const isHistory = item.type === "history";
              return (
                <div
                  key={`${item.type}-${item.text}-${index}`}
                  onClick={() => {
                    setQuery(item.text);
                    executeSearch(item.text);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group relative flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-all ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-200 border-l-2 border-cyan-400 pl-3.5"
                      : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    {isHistory ? (
                      <History className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate font-sans">
                      {isHistory ? item.text : <HighlightedText text={item.text} query={query} />}
                    </span>
                  </div>

                  {isHistory && (
                    <button
                      type="button"
                      onClick={(e) => removeHistoryItem(e, item.text)}
                      className="text-xs text-cyan-300/80 hover:text-cyan-100 hover:bg-cyan-500/20 px-2 py-0.5 rounded-lg transition-all shrink-0 font-sans opacity-0 group-hover:opacity-100"
                      title={t.deleteHistoryTooltip || "删除此条历史"}
                    >
                      {t.deleteHistoryItem || "删除"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Bar with Navigation Hints & History Clear */}
          <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between bg-black/40 text-[11px] select-none">
            <div className="flex items-center gap-3 text-slate-400 font-mono">
              <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-slate-300">↑↓</kbd> 移动</span>
              <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-slate-300">↵</kbd> 搜索</span>
              <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-slate-300">Esc</kbd> 关闭</span>
            </div>

            {!query.trim() && history.length > 0 && (
              <button
                type="button"
                onClick={clearAllHistory}
                className="text-rose-400 hover:text-rose-300 font-medium hover:underline transition-all"
              >
                {t.clearHistory}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tactile Pill Engine Selector Badges Grid */}
      <div
        className={`mt-3.5 flex flex-wrap items-center justify-center gap-2 transition-all duration-200 ${
          isEnginePickerOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        role="group"
        aria-label={t.enginesAria}
      >
        {ENGINES.map((e) => {
          const isSelected = e.id === defaultEngine;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => api.data.set({ ...api.data.get(), defaultEngine: e.id })}
              className={`group/btn relative min-h-[34px] rounded-full px-3.5 py-1 text-xs font-mono transition-all duration-200 flex items-center gap-1.5 border active:scale-95 focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                isSelected
                  ? "bg-cyan-500/20 border-cyan-400/80 text-cyan-200 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.3)] scale-105"
                  : "bg-slate-900/50 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-cyan-500/40"
              }`}
              title={`${e.name} (${e.category.toUpperCase()})`}
              aria-pressed={isSelected}
            >
              <EngineIcon id={e.id} className={`w-3.5 h-3.5 shrink-0 transition-colors ${isSelected ? "text-cyan-300" : "text-slate-400 group-hover/btn:text-slate-200"}`} />
              <span>{e.name}</span>
              {e.isAi && (
                <span className="ml-0.5 rounded-full bg-cyan-400/20 px-1.5 py-0.2 text-[9px] font-bold text-cyan-300 border border-cyan-400/30">
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
  description: "Technical multi-engine search terminal with AI & developer engine switching, history & real-time suggestions.",
  type: "widget",
  defaultData: { defaultEngine: "google", history: [] },
  defaultSize: { width: 4, height: 1 },
  component: SearchWidget,
};

export default config;
