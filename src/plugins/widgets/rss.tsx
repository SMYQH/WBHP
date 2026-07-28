import { useSyncExternalStore } from "react";
import type { PluginConfig, PluginAPI } from "../types";
import { getTranslations } from "../../i18n";

export interface FeedItem {
  id: string;
  title: string;
  url: string;
  source: string;
  starsOrComments?: string;
}

export interface RssData {
  activeTab: "github" | "hackernews" | "devto";
}

const PRESET_FEEDS: Record<"github" | "hackernews" | "devto", FeedItem[]> = {
  github: [
    { id: "1", title: "facebook/react: The library for web and native user interfaces", url: "https://github.com/facebook/react", source: "GitHub", starsOrComments: "★ 231k" },
    { id: "2", title: "vitejs/vite: Next Generation Frontend Tooling", url: "https://github.com/vitejs/vite", source: "GitHub", starsOrComments: "★ 72k" },
    { id: "3", title: "tailwindlabs/tailwindcss: A utility-first CSS framework", url: "https://github.com/tailwindlabs/tailwindcss", source: "GitHub", starsOrComments: "★ 85k" },
    { id: "4", title: "vercel/next.js: The React Framework", url: "https://github.com/vercel/next.js", source: "GitHub", starsOrComments: "★ 125k" },
  ],
  hackernews: [
    { id: "h1", title: "Show HN: WBHP – Plug-and-play modern browser start page", url: "https://news.ycombinator.com", source: "HackerNews", starsOrComments: "142 points" },
    { id: "h2", title: "Why SQLite is full of surprises", url: "https://news.ycombinator.com", source: "HackerNews", starsOrComments: "389 points" },
    { id: "h3", title: "The Architecture of Open Source Applications", url: "https://news.ycombinator.com", source: "HackerNews", starsOrComments: "215 points" },
  ],
  devto: [
    { id: "d1", title: "10 React 19 Features You Need to Know", url: "https://dev.to", source: "Dev.to", starsOrComments: "🔥 450" },
    { id: "d2", title: "Building Manifest V3 Extensions with Vite 8 & Tailwind 4", url: "https://dev.to", source: "Dev.to", starsOrComments: "🔥 320" },
    { id: "d3", title: "Mastering TypeScript 5.5 Type Predicates", url: "https://dev.to", source: "Dev.to", starsOrComments: "🔥 180" },
  ],
};

function RssWidget({ api }: { api: PluginAPI<RssData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const t = getTranslations(api.settings.language).widgets.rss;

  const activeTab = data.activeTab || "github";

  const setTab = (tab: RssData["activeTab"]) => {
    api.data.set({ activeTab: tab });
  };

  const currentItems = PRESET_FEEDS[activeTab] || PRESET_FEEDS.github;

  return (
    <div className="w-full rounded-2xl border border-white/20 bg-white/40 p-5 shadow-lg backdrop-blur-md transition-all dark:border-white/10 dark:bg-gray-900/40">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/40 pb-3 dark:border-gray-700/40">
        <h3 className="text-base font-semibold tracking-wide flex items-center gap-2">
          <span>📰</span> {t.name}
        </h3>
        <div className="flex gap-1 rounded-lg bg-gray-200/50 p-1 text-xs dark:bg-gray-800/50">
          {(["github", "hackernews", "devto"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {tab === "github" ? "GitHub" : tab === "hackernews" ? "HackerNews" : "Dev.to"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {currentItems.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-xl bg-white/40 p-3 backdrop-blur transition-all hover:bg-white/70 hover:shadow-sm dark:bg-gray-800/40 dark:hover:bg-gray-800/70"
          >
            <span className="text-sm font-medium text-gray-800 group-hover:text-blue-600 dark:text-gray-200 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
              {item.title}
            </span>
            {item.starsOrComments && (
              <span className="ml-3 shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                {item.starsOrComments}
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

const config: PluginConfig<RssData> = {
  id: "rss",
  name: "Dev & Tech Feed",
  description: "GitHub Trending and developer tech news feeds.",
  type: "widget",
  defaultData: { activeTab: "github" },
  defaultSize: { width: 4, height: 3 },
  component: RssWidget,
};

export default config;
