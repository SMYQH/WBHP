/* Hallmark · component: tavily-sidebar · genre: modern-minimal · tone: austere
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Globe, X, Key, AlertCircle, Sparkles, Image as ImageIcon } from "lucide-react";
import { getTranslations, type LanguageMode } from "../i18n";

interface TavilyImage {
  url: string;
  description?: string;
}

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  raw_content?: string | null;
}

interface TavilyResponse {
  query: string;
  answer?: string;
  images?: (TavilyImage | string)[];
  results: TavilySearchResult[];
  response_time?: number;
}

function TavilyImageCard({ img }: { img: TavilyImage | string }) {
  const [hasError, setHasError] = useState(false);
  const url = typeof img === "string" ? img : img?.url || "";
  const alt = typeof img === "string" ? "Tavily reference image" : img?.description || "Tavily reference image";

  if (!url || hasError) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-slate-900 hover:border-emerald-400 transition-all"
    >
      <img
        src={url}
        alt={alt}
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={() => setHasError(true)}
      />
    </a>
  );
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
  const [tavilyData, setTavilyData] = useState<TavilyResponse | null>(null);
  const [searchDepth, setSearchDepth] = useState<"basic" | "advanced">("basic");
  const [topic, setTopic] = useState<"general" | "news">("general");

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
    const trimmed = key.trim();
    setApiKey(trimmed);
    localStorage.setItem("wbhp_tavily_key", trimmed);
    setShowKeyInput(false);
  };

  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      const q = (searchQuery ?? query).trim();
      if (!q) return;

      setIsLoading(true);
      setError(null);
      setTavilyData(null);

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
              topic: topic,
              include_answer: true,
              include_images: true,
              max_results: 6,
            }),
          });

          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.detail || `Tavily API ${res.status}: ${res.statusText}`);
          }

          const data: TavilyResponse = await res.json();
          setTavilyData(data);
        } else {
          // No API key: show in-panel prompt with direct web search action button
          setTavilyData({
            query: q,
            answer: t.tavilyPromptAnswer,
            results: [
              {
                title: `Tavily AI Search: "${q}"`,
                url: `https://tavily.com/?q=${encodeURIComponent(q)}`,
                content: t.tavilyPromptContent,
                score: 1.0,
              },
            ],
          });
        }
      } catch (err: any) {
        setError(err.message || "Search request failed");
      } finally {
        setIsLoading(false);
      }
    },
    [query, apiKey, searchDepth, topic, language],
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
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-slate-950 text-slate-100 border-l border-emerald-500/30 shadow-2xl flex flex-col font-mono">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/90">
            <div className="flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-emerald-400 shrink-0" />
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
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Controls & Configuration */}
          <div className="p-4 border-b border-white/10 bg-slate-900/50 space-y-3">
            <form onSubmit={onSubmit} className="space-y-2.5">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.tavilyQueryPlaceholder}
                  className="w-full rounded-lg border border-emerald-500/40 bg-slate-900 px-3.5 py-2.5 text-xs font-sans text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 shadow-inner"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                {/* Search Depth & Topic filters */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded border border-white/10">
                    <button
                      type="button"
                      onClick={() => setSearchDepth("basic")}
                      className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold transition-colors ${
                        searchDepth === "basic"
                          ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {t.tavilyBasic}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchDepth("advanced")}
                      className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold transition-colors ${
                        searchDepth === "advanced"
                          ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {t.tavilyAdvanced}
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded border border-white/10">
                    <button
                      type="button"
                      onClick={() => setTopic("general")}
                      className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold transition-colors ${
                        topic === "general"
                          ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {t.tavilyGeneral}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTopic("news")}
                      className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold transition-colors ${
                        topic === "news"
                          ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {t.tavilyNews}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-md text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40"
                >
                  {isLoading ? t.tavilySearching : t.tavilySearchBtn}
                </button>
              </div>
            </form>

            {/* API Key Toggle/Input */}
            <div className="text-[11px] pt-1">
              {showKeyInput ? (
                <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-lg border border-emerald-500/30">
                  <input
                    type="password"
                    defaultValue={apiKey}
                    placeholder="tvly-..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveApiKey((e.target as HTMLInputElement).value);
                    }}
                    onBlur={(e) => saveApiKey(e.target.value)}
                    className="flex-1 rounded border border-white/20 bg-slate-950 px-2 py-1 text-[11px] font-mono text-emerald-300 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => saveApiKey(apiKey)}
                    className="text-emerald-400 hover:text-emerald-300 px-2 text-xs font-bold"
                  >
                    {t.tavilySaveKey}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 opacity-70" />
                    <span className={apiKey ? "text-emerald-400" : "text-amber-400"}>
                      {apiKey ? t.tavilyKeySet : t.tavilyNoKeySet}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(true)}
                    className="text-emerald-400 hover:underline font-mono"
                  >
                    {apiKey ? t.tavilyEditKey : "Set API Key (tvly-...)"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Results Stream Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-xs text-emerald-300">{t.tavilySearching}</span>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3.5 text-red-300 text-xs font-mono space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Error:</span>
                </div>
                <div className="text-[11px] opacity-90">{error}</div>
              </div>
            )}

            {!isLoading && tavilyData && (
              <div className="space-y-4">
                {/* Response Metadata Header */}
                {tavilyData.response_time !== undefined && (
                  <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between border-b border-white/5 pb-1">
                    <span>QUERY: {tavilyData.query}</span>
                    <span>{t.tavilyLatency}: {tavilyData.response_time.toFixed(2)}s</span>
                  </div>
                )}

                {/* AI Synthesized Answer Section */}
                {tavilyData.answer && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>{t.tavilyAiOverview}</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {tavilyData.answer}
                    </p>
                  </div>
                )}

                {/* Image Gallery */}
                {tavilyData.images && tavilyData.images.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-mono text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{t.tavilyImageReferences} ({tavilyData.images.length})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {tavilyData.images.slice(0, 6).map((img, i) => (
                        <TavilyImageCard key={i} img={img} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Web Citations & Source Cards */}
                {tavilyData.results && tavilyData.results.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="font-mono text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                      <span>{t.tavilySources}</span>
                      <span className="text-slate-500">{t.tavilyCount}: {tavilyData.results.length}</span>
                    </div>

                    {tavilyData.results.map((res, idx) => (
                      <a
                        key={idx}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl border border-white/10 bg-slate-900/80 p-3.5 hover:border-emerald-500/60 hover:bg-slate-900 transition-all group shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-semibold text-xs text-emerald-300 group-hover:text-emerald-200 group-hover:underline line-clamp-2">
                            {res.title}
                          </h4>
                          {res.score !== undefined && (
                            <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
                              {(res.score * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed mb-2 font-sans opacity-90">
                          {res.content}
                        </p>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-white/5">
                          <span className="truncate max-w-[240px] text-slate-400 group-hover:text-emerald-400">
                            {new URL(res.url).hostname}
                          </span>
                          <span className="text-emerald-400/80 group-hover:translate-x-0.5 transition-transform">
                            {t.tavilyOpenLink}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isLoading && !tavilyData && !error && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-center space-y-3 font-mono text-xs">
                <div className="p-3 rounded-full bg-slate-900 border border-white/10 text-emerald-400">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-emerald-400 font-bold">TAVILY_RESEARCH_SHELL</span>
                <span className="text-[11px] font-sans text-slate-400 max-w-xs leading-relaxed">
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
