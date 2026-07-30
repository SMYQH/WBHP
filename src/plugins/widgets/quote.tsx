import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import {
  RotateCw,
  Copy,
  Check,
  Heart,
  Settings,
  Plus,
  Trash2,
  Sparkles,
  Bookmark,
  X,
  Sliders,
} from "lucide-react";
import type { PluginConfig, PluginAPI } from "../types";
import { getTranslations, type Translations } from "../../i18n";

type QuoteTranslations = Translations["widgets"]["quote"];
type CatKey = Extract<keyof QuoteTranslations, `cat${string}`>;

export interface QuoteItem {
  id?: number | string;
  text: string;
  author?: string;
  source?: string;
  category?: string;
}

export type QuoteMode = "hitokoto" | "preset" | "favorites";

export interface QuoteData {
  mode: QuoteMode;
  categories: string[];
  currentQuote: QuoteItem | null;
  favorites: QuoteItem[];
  customQuotes: QuoteItem[];
  autoRefreshInterval: number; // seconds, 0 = off
  lastUpdated?: number;
}

const PRESET_QUOTES: QuoteItem[] = [
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker", category: "k" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman", category: "k" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck", category: "k" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs", category: "k" },
  { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson", category: "d" },
  { text: "技术使不可能成为可能，而设计让可能变得优雅。", author: "匿名", category: "e" },
  { text: "日拱一卒无有尽，功不唐捐终有成。", author: "古训", category: "i" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon", category: "k" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson", category: "k" },
  { text: "海内存知己，天涯若比邻。", author: "王勃", source: "送杜少府之任蜀州", category: "i" },
  { text: "长风破浪会有时，直挂云帆济沧海。", author: "李白", source: "行路难", category: "i" },
  { text: "人生如逆旅，我亦是行人。", author: "苏轼", source: "临江仙", category: "i" },
];

const CATEGORY_MAP: Record<string, { catKey: CatKey; color: string }> = {
  a: { catKey: "catAnime", color: "from-pink-500/20 to-rose-500/20 text-rose-300" },
  b: { catKey: "catComic", color: "from-purple-500/20 to-indigo-500/20 text-purple-300" },
  c: { catKey: "catGame", color: "from-emerald-500/20 to-teal-500/20 text-emerald-300" },
  d: { catKey: "catLiterature", color: "from-amber-500/20 to-yellow-500/20 text-amber-300" },
  e: { catKey: "catOriginal", color: "from-cyan-500/20 to-blue-500/20 text-cyan-300" },
  f: { catKey: "catNetwork", color: "from-blue-500/20 to-indigo-500/20 text-blue-300" },
  g: { catKey: "catOther", color: "from-slate-500/20 to-zinc-500/20 text-slate-300" },
  h: { catKey: "catTv", color: "from-violet-500/20 to-purple-500/20 text-violet-300" },
  i: { catKey: "catPoetry", color: "from-red-500/20 to-orange-500/20 text-orange-300" },
  j: { catKey: "catMusic", color: "from-red-600/20 to-rose-600/20 text-red-300" },
  k: { catKey: "catPhilosophy", color: "from-teal-500/20 to-emerald-500/20 text-teal-300" },
  l: { catKey: "catJoke", color: "from-yellow-500/20 to-amber-500/20 text-yellow-300" },
};

async function fetchHitokotoQuote(selectedCategories: string[]): Promise<QuoteItem> {
  const params = new URLSearchParams();
  if (selectedCategories.length > 0) {
    selectedCategories.forEach((cat) => params.append("c", cat));
  }
  const response = await fetch(`https://v1.hitokoto.cn/?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Hitokoto API Error: ${response.status}`);
  }
  const json = await response.json();
  return {
    id: json.id || json.uuid,
    text: json.hitokoto,
    author: json.from_who || undefined,
    source: json.from || undefined,
    category: json.type,
  };
}

function QuoteWidget({ api }: { api: PluginAPI<QuoteData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const t = getTranslations(api.settings.language).widgets.quote;

  const mode = data.mode ?? "hitokoto";
  const categories = data.categories ?? [];
  const favorites = data.favorites ?? [];
  const customQuotes = data.customQuotes ?? [];
  const autoRefreshInterval = data.autoRefreshInterval ?? 0;
  const currentQuote = data.currentQuote || PRESET_QUOTES[0];

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "favorites" | "custom">("settings");

  // New custom quote form state
  const [newText, setNewText] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newSource, setNewSource] = useState("");

  const getRandomPreset = useCallback(() => {
    const allPresets = [...PRESET_QUOTES, ...customQuotes];
    const randomIndex = Math.floor(Math.random() * allPresets.length);
    return allPresets[randomIndex];
  }, [customQuotes]);

  const loadNextQuote = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === "favorites") {
        if (favorites.length > 0) {
          const randomIndex = Math.floor(Math.random() * favorites.length);
          const nextFav = favorites[randomIndex];
          api.data.set((prev) => ({ ...prev, currentQuote: nextFav, lastUpdated: Date.now() }));
        } else {
          const preset = getRandomPreset();
          api.data.set((prev) => ({ ...prev, currentQuote: preset, lastUpdated: Date.now() }));
        }
      } else if (mode === "preset") {
        const preset = getRandomPreset();
        api.data.set((prev) => ({ ...prev, currentQuote: preset, lastUpdated: Date.now() }));
      } else {
        // Hitokoto API mode
        try {
          const hitokotoItem = await fetchHitokotoQuote(categories);
          api.data.set((prev) => ({ ...prev, currentQuote: hitokotoItem, lastUpdated: Date.now() }));
        } catch (err) {
          console.warn("Failed to fetch from Hitokoto API, falling back to preset:", err);
          const preset = getRandomPreset();
          api.data.set((prev) => ({ ...prev, currentQuote: preset, lastUpdated: Date.now() }));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [mode, categories, favorites, getRandomPreset, api.data]);

  // Initial load if no quote is set
  useEffect(() => {
    if (!data.currentQuote) {
      loadNextQuote();
    }
  }, []);

  // Auto refresh timer if configured
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      loadNextQuote();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, loadNextQuote]);

  // Check if current quote is favorited
  const isFavorited = currentQuote
    ? favorites.some((f) => f.text === currentQuote.text)
    : false;

  const toggleFavorite = () => {
    if (!currentQuote) return;
    if (isFavorited) {
      api.data.set((prev) => ({
        ...prev,
        favorites: (prev.favorites || []).filter((f) => f.text !== currentQuote.text),
      }));
    } else {
      api.data.set((prev) => ({
        ...prev,
        favorites: [...(prev.favorites || []), currentQuote],
      }));
    }
  };

  const handleCopy = () => {
    if (!currentQuote) return;
    let formatted = `“${currentQuote.text}”`;
    if (currentQuote.author) {
      formatted += ` —— ${currentQuote.author}`;
    }
    if (currentQuote.source) {
      formatted += ` 《${currentQuote.source}》`;
    }

    navigator.clipboard.writeText(formatted).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCategoryToggle = (catKey: string) => {
    api.data.set((prev) => {
      const currentCats = prev.categories || [];
      const newCats = currentCats.includes(catKey)
        ? currentCats.filter((c) => c !== catKey)
        : [...currentCats, catKey];
      return { ...prev, categories: newCats };
    });
  };

  const handleModeChange = (newMode: QuoteMode) => {
    api.data.set((prev) => ({ ...prev, mode: newMode }));
  };

  const handleAutoRefreshChange = (interval: number) => {
    api.data.set((prev) => ({ ...prev, autoRefreshInterval: interval }));
  };

  const handleAddCustomQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const newItem: QuoteItem = {
      text: newText.trim(),
      author: newAuthor.trim() || undefined,
      source: newSource.trim() || undefined,
      category: "e",
    };
    api.data.set((prev) => ({
      ...prev,
      customQuotes: [...(prev.customQuotes || []), newItem],
      currentQuote: newItem,
    }));
    setNewText("");
    setNewAuthor("");
    setNewSource("");
  };

  const handleRemoveFavorite = (text: string) => {
    api.data.set((prev) => ({
      ...prev,
      favorites: (prev.favorites || []).filter((f) => f.text !== text),
    }));
  };

  const catInfo = currentQuote?.category ? CATEGORY_MAP[currentQuote.category] : null;

  return (
    <div className="relative group w-full rounded-2xl border border-white/20 bg-white/30 p-6 shadow-lg backdrop-blur-md transition-all hover:bg-white/40 dark:border-white/10 dark:bg-gray-900/30 dark:hover:bg-gray-900/40 flex flex-col justify-between min-h-[140px]">
      {/* Category Badge & Top Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {catInfo ? (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gradient-to-r ${catInfo.color} border border-white/10 backdrop-blur-sm`}
            >
              <Sparkles className="w-3 h-3 shrink-0" />
              {t[catInfo.catKey]}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300 border border-white/10">
              <Sparkles className="w-3 h-3 shrink-0" />
              {mode === "hitokoto" ? t.modes.hitokoto : mode === "preset" ? t.modes.preset : t.modes.favorites}
            </span>
          )}
        </div>

        {/* Quick Toolbar Action Buttons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="rounded-full p-1.5 text-gray-700 dark:text-gray-200 hover:bg-white/40 dark:hover:bg-gray-800/60 transition-all"
            title={copied ? t.copied : t.copyBtn}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={toggleFavorite}
            className={`rounded-full p-1.5 transition-all ${
              isFavorited
                ? "text-rose-500 hover:bg-rose-500/10"
                : "text-gray-700 dark:text-gray-200 hover:bg-white/40 dark:hover:bg-gray-800/60"
            }`}
            title={isFavorited ? t.unfavBtn : t.favBtn}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? "fill-rose-500" : ""}`} />
          </button>
          <button
            onClick={loadNextQuote}
            disabled={loading}
            className="rounded-full p-1.5 text-gray-700 dark:text-gray-200 hover:bg-white/40 dark:hover:bg-gray-800/60 transition-all disabled:opacity-50"
            title={t.refreshBtn}
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`rounded-full p-1.5 transition-all ${
              showSettings
                ? "bg-white/50 dark:bg-gray-800/80 text-blue-500"
                : "text-gray-700 dark:text-gray-200 hover:bg-white/40 dark:hover:bg-gray-800/60"
            }`}
            title={t.settingsTitle}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quote Main Display */}
      <blockquote className="space-y-3 my-auto text-center px-2">
        <p className="text-lg md:text-xl font-serif font-light leading-relaxed text-gray-900 dark:text-gray-100 drop-shadow-sm">
          “{currentQuote?.text}”
        </p>
        {(currentQuote?.author || currentQuote?.source) && (
          <footer className="text-xs md:text-sm font-medium opacity-75 text-gray-800 dark:text-gray-300 flex items-center justify-center gap-1.5">
            <span>—</span>
            {currentQuote.author && <span>{currentQuote.author}</span>}
            {currentQuote.source && <span className="italic opacity-80">《{currentQuote.source}》</span>}
          </footer>
        )}
      </blockquote>

      {/* Settings / Favorites Slide-over Drawer Modal */}
      {showSettings && (
        <div className="mt-4 border-t border-white/20 dark:border-gray-800/60 pt-4 space-y-4 animate-fadeIn">
          {/* Drawer Header Tabs */}
          <div className="flex items-center justify-between border-b border-white/10 dark:border-gray-800/40 pb-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === "settings"
                    ? "bg-blue-500/20 text-blue-400 font-semibold"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Sliders className="w-3 h-3" />
                {t.tabSettings}
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === "favorites"
                    ? "bg-rose-500/20 text-rose-400 font-semibold"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Bookmark className="w-3 h-3" />
                {t.tabFavorites} ({favorites.length})
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === "custom"
                    ? "bg-emerald-500/20 text-emerald-400 font-semibold"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Plus className="w-3 h-3" />
                {t.addCustom}
              </button>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="p-1 text-xs opacity-60 hover:opacity-100 rounded-full hover:bg-white/20 dark:hover:bg-gray-800/50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Settings Tab Panel */}
          {activeTab === "settings" && (
            <div className="space-y-4 text-xs">
              {/* Mode Selection */}
              <div>
                <label className="block font-medium opacity-80 mb-1.5">{t.sourceMode}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleModeChange("hitokoto")}
                    className={`py-1.5 px-2 rounded-lg text-center font-medium border transition-all ${
                      mode === "hitokoto"
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-white/10 bg-white/10 hover:bg-white/20 dark:bg-gray-800/30"
                    }`}
                  >
                    {t.modeHitokoto}
                  </button>
                  <button
                    onClick={() => handleModeChange("preset")}
                    className={`py-1.5 px-2 rounded-lg text-center font-medium border transition-all ${
                      mode === "preset"
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-white/10 bg-white/10 hover:bg-white/20 dark:bg-gray-800/30"
                    }`}
                  >
                    {t.modePreset}
                  </button>
                  <button
                    onClick={() => handleModeChange("favorites")}
                    className={`py-1.5 px-2 rounded-lg text-center font-medium border transition-all ${
                      mode === "favorites"
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-white/10 bg-white/10 hover:bg-white/20 dark:bg-gray-800/30"
                    }`}
                  >
                    {t.modeFavorites}
                  </button>
                </div>
              </div>

              {/* Hitokoto Category Filters */}
              {mode === "hitokoto" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-medium opacity-80">{t.categories}</label>
                    <span className="text-[10px] opacity-60">
                      {categories.length === 0 ? t.catAll : `${categories.length} selected`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
                      const isSelected = categories.includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() => handleCategoryToggle(key)}
                          className={`px-2 py-1 rounded text-left flex items-center justify-between border transition-all ${
                            isSelected
                              ? "border-amber-500/60 bg-amber-500/20 text-amber-200 font-semibold"
                              : "border-white/5 bg-white/5 opacity-70 hover:opacity-100 dark:bg-gray-800/20"
                          }`}
                        >
                          <span>{t[cat.catKey]}</span>
                          <span className="text-[9px] opacity-50 uppercase">{key}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Auto Refresh */}
              <div>
                <label className="block font-medium opacity-80 mb-1.5">{t.autoRefresh}</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { sec: 0, label: t.autoRefreshOff },
                    { sec: 300, label: t.autoRefresh5m },
                    { sec: 1800, label: t.autoRefresh30m },
                    { sec: 3600, label: t.autoRefresh1h },
                  ].map((item) => (
                    <button
                      key={item.sec}
                      onClick={() => handleAutoRefreshChange(item.sec)}
                      className={`py-1 px-1.5 text-[11px] rounded text-center border transition-all ${
                        autoRefreshInterval === item.sec
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-semibold"
                          : "border-white/10 bg-white/10 hover:bg-white/20 dark:bg-gray-800/30 opacity-70"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Favorites Tab Panel */}
          {activeTab === "favorites" && (
            <div className="space-y-2 text-xs">
              {favorites.length === 0 ? (
                <div className="text-center py-6 opacity-60 italic">{t.noFavorites}</div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {favorites.map((fav, index) => (
                    <div
                      key={index}
                      className="p-2.5 rounded-xl border border-white/10 bg-white/10 dark:bg-gray-800/30 flex items-start justify-between gap-2 group/fav hover:bg-white/20 dark:hover:bg-gray-800/50 transition-all"
                    >
                      <div className="space-y-1">
                        <p className="font-serif italic text-gray-900 dark:text-gray-100">“{fav.text}”</p>
                        {(fav.author || fav.source) && (
                          <div className="text-[10px] opacity-70">
                            — {fav.author} {fav.source ? `《${fav.source}》` : ""}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveFavorite(fav.text)}
                        className="p-1 text-gray-400 hover:text-rose-400 opacity-60 hover:opacity-100 transition-opacity"
                        title={t.deleteFav}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Custom Tab Panel */}
          {activeTab === "custom" && (
            <form onSubmit={handleAddCustomQuote} className="space-y-2.5 text-xs">
              <div>
                <input
                  type="text"
                  required
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder={t.customTextPlaceholder}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/20 bg-white/20 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder={t.customAuthorPlaceholder}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/20 bg-white/20 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder={t.customSourcePlaceholder}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/20 bg-white/20 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-gray-100"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow transition-all flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.addBtn}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

const config: PluginConfig<QuoteData> = {
  id: "quote",
  name: "Hitokoto Quote",
  description: "Inspirational Hitokoto API & daily motivation quotes with category filters.",
  type: "widget",
  defaultData: {
    mode: "hitokoto",
    categories: [],
    currentQuote: null,
    favorites: [],
    customQuotes: [],
    autoRefreshInterval: 0,
  },
  defaultSize: { width: 4, height: 2 },
  component: QuoteWidget,
};

export default config;
