import { useSyncExternalStore } from "react";
import { RotateCw } from "lucide-react";
import type { PluginConfig, PluginAPI } from "../types";
import { getTranslations } from "../../i18n";

export interface Quote {
  text: string;
  author: string;
}

const PRESET_QUOTES: Quote[] = [
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "技术使不可能成为可能，而设计让可能变得优雅。", author: "匿名" },
  { text: "日拱一卒无有尽，功不唐捐终有成。", author: "古训" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
];

export interface QuoteData {
  currentIndex: number;
}

function QuoteWidget({ api }: { api: PluginAPI<QuoteData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const t = getTranslations(api.settings.language).widgets.quote;

  const index = data.currentIndex ?? 0;
  const currentQuote = PRESET_QUOTES[index % PRESET_QUOTES.length];

  const handleNext = () => {
    const nextIdx = (index + 1) % PRESET_QUOTES.length;
    api.data.set({ currentIndex: nextIdx });
  };

  return (
    <div className="relative group w-full rounded-2xl border border-white/20 bg-white/30 p-6 text-center shadow-lg backdrop-blur-md transition-all hover:bg-white/40 dark:border-white/10 dark:bg-gray-900/30 dark:hover:bg-gray-900/40 flex flex-col justify-center">
      <blockquote className="space-y-3">
        <p className="text-lg font-light leading-relaxed text-gray-900 dark:text-gray-100 font-serif">
          “{currentQuote.text}”
        </p>
        <footer className="text-xs font-medium opacity-70">
          — {currentQuote.author}
        </footer>
      </blockquote>

      <button
        onClick={handleNext}
        className="absolute bottom-3 right-3 rounded-full bg-white/40 p-2 text-xs backdrop-blur opacity-0 group-hover:opacity-100 hover:bg-white/60 dark:bg-gray-800/40 dark:hover:bg-gray-800/60 transition-all"
        title={t.refreshBtn}
      >
        <RotateCw className="w-3.5 h-3.5 text-gray-700 dark:text-gray-200 transition-transform duration-300 group-hover:rotate-180" />
      </button>
    </div>
  );
}

const config: PluginConfig<QuoteData> = {
  id: "quote",
  name: "Daily Quote",
  description: "Inspirational quotes for daily motivation.",
  type: "widget",
  defaultData: { currentIndex: 0 },
  defaultSize: { width: 4, height: 2 },
  component: QuoteWidget,
};

export default config;
