/* Hallmark · component: tavily-sidebar · genre: modern-minimal · tone: austere
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { getTranslations, type LanguageMode } from "../i18n";

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

interface TavilySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageMode;
  initialQuery?: string;
}

export function TavilySidebar({ isOpen, onClose, language, initialQuery = "" }: TavilySidebarProps) {
  const t = getTranslations(language).widgets.search;
  const [query, setQuery] = useState(initialQuery);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("wbhp_tavily_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TavilySearchResult[]>([]);
  const [searchDepth, setSearchDepth] = useState<"basic" | "advanced">("basic");

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen && initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [isOpen, initialQuery]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("wbhp_tavily_key", key);
    setShowKeyInput(false);
  };

  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      const q = (searchQuery ?? query).trim();
      if (!q) return;

      setIsLoading(true);
      setError(null);
      setResults([]);

      try {
        if (apiKey.trim()) {
          const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              api_key: apiKey.trim(),
              query: q,
              search_depth: searchDepth,
              include_answer: true,
              max_results: 6,
            }),
          });

          if (!res.ok) {
            throw new Error(`Tavily API status ${res.status}: ${res.statusText}`);
          }

          const data = await res.json();
          if (data.results && Array.isArray(data.results)) {
            setResults(data.results);
          } else {
            setResults([]);
          }
        } else {
          // Direct web fallback integration: open Tavily or Google deep search result stream
          await new Promise((resolve) => setTimeout(resolve, 600));
          window.open(`https://tavily.com/?q=${encodeURIComponent(q)}`, "_blank");
          setResults([
            {
              title: `Tavily Search: ${q}`,
              url: `https://tavily.com/?q=${encodeURIComponent(q)}`,
              content: `Direct research opened on Tavily AI platform. Enter a personal API key above to load raw JSON citations in-place.`,
            },
          ]);
        }
      } catch (err: any) {
        setError(err.message || "Search request failed");
      } finally {
        setIsLoading(false);
      }
    },
    [query, apiKey, searchDepth],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-slate-950 text-slate-100 border-l border-emerald-500/30 shadow-2xl flex flex-col font-mono">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/80">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🌐</span>
              <div>
                <h3 className="font-bold text-sm text-emerald-400 tracking-wide uppercase">
                  {t.tavilySidebarTitle}
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">{t.tavilySidebarDesc}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Search Control & API Key Header */}
          <div className="p-4 border-b border-white/10 bg-slate-900/40 space-y-3">
            <form onSubmit={onSubmit} className="space-y-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.tavilyQueryPlaceholder}
                  className="w-full rounded-lg border border-emerald-500/40 bg-slate-900 px-3.5 py-2 text-xs font-sans text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                {/* Search Depth selector */}
                <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded border border-white/10">
                  <button
                    type="button"
                    onClick={() => setSearchDepth("basic")}
                    className={`px-2 py-0.5 text-[10px] rounded uppercase ${
                      searchDepth === "basic"
                        ? "bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Basic
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchDepth("advanced")}
                    className={`px-2 py-0.5 text-[10px] rounded uppercase ${
                      searchDepth === "advanced"
                        ? "bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Advanced
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs transition-colors disabled:opacity-40"
                >
                  {isLoading ? "EXEC..." : t.tavilySearchBtn}
                </button>
              </div>
            </form>

            {/* API Key Toggle/Input */}
            <div className="text-[11px] pt-1">
              {showKeyInput ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="password"
                    defaultValue={apiKey}
                    placeholder="tvly-..."
                    onBlur={(e) => saveApiKey(e.target.value)}
                    className="flex-1 rounded border border-white/20 bg-slate-900 px-2 py-1 text-[11px] font-mono text-emerald-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(false)}
                    className="text-slate-400 hover:text-white px-1.5"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>
                    🔑 {apiKey ? "API Key Configured" : "No API Key (Using Tavily Web Redirect)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(true)}
                    className="text-emerald-400 hover:underline"
                  >
                    {apiKey ? "Edit Key" : "Set API Key"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Results Stream Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-xs">{t.tavilySearching}</span>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300 text-xs font-mono">
                🚨 Error: {error}
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <div className="space-y-3">
                <div className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  {t.tavilySources} ({results.length})
                </div>
                {results.map((res, idx) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-white/10 bg-slate-900/60 p-3 hover:border-emerald-500/50 hover:bg-slate-900 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-emerald-300 group-hover:underline line-clamp-1">
                        {res.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed mb-1.5">
                      {res.content}
                    </p>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-emerald-400/80 truncate block">
                      {res.url}
                    </span>
                  </a>
                ))}
              </div>
            )}

            {!isLoading && results.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center space-y-2 font-mono text-xs">
                <span>🌐 TAVILY_RESEARCH_READY</span>
                <span className="text-[11px] font-sans text-slate-400 max-w-xs">
                  {t.tavilyApiKeyNotice}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
