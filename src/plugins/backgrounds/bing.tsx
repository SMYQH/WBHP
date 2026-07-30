import { useState, useEffect } from "react";
import { Camera } from "lucide-react";
import type { PluginConfig, PluginAPI } from "../types";
import { getTranslations } from "../../i18n";

export interface BingBackgroundData {
  blur?: number;
  overlayOpacity?: number;
}

const DEFAULT_BING_IMAGE = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop";

interface CachedBingWallpaper {
  url: string;
  copyright: string;
  date: string;
  timestamp: number;
}

const BING_CACHE_KEY = "wbhp_bing_wallpaper_cache";

function BingBackground({ api }: { api: PluginAPI<BingBackgroundData> }) {
  const data = api.data.get();
  const blur = data?.blur ?? 0;
  const overlayOpacity = data?.overlayOpacity ?? 20;
  const t = getTranslations(api.settings.language).backgrounds.bing;

  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_BING_IMAGE);
  const [copyright, setCopyright] = useState<string>("");
  const [isCached, setIsCached] = useState<boolean>(false);

  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Check local storage cache first
    try {
      const rawCache = localStorage.getItem(BING_CACHE_KEY);
      if (rawCache) {
        const parsed: CachedBingWallpaper = JSON.parse(rawCache);
        if (parsed && parsed.url && parsed.date === todayStr) {
          // Valid cache from today -> instant render from local cache
          setImageUrl(parsed.url);
          if (parsed.copyright) setCopyright(parsed.copyright);
          setIsCached(true);
          return;
        }
      }
    } catch {
      // Ignore cache parse error & fallback to network fetch
    }

    // Cache expired or missing -> fetch new daily wallpaper from Bing API
    fetch("https://bing.biturl.top/?resolution=1920&format=json&index=0&mkt=zh-CN")
      .then((res) => res.json())
      .then((resData) => {
        if (resData && resData.url) {
          const newUrl = resData.url;
          const newCopyright = resData.copyright || "";

          setImageUrl(newUrl);
          setCopyright(newCopyright);

          // Save to local storage cache with today's date
          const cacheData: CachedBingWallpaper = {
            url: newUrl,
            copyright: newCopyright,
            date: todayStr,
            timestamp: Date.now(),
          };
          localStorage.setItem(BING_CACHE_KEY, JSON.stringify(cacheData));
          setIsCached(true);
        }
      })
      .catch(() => {
        // Fallback to static mirror if network offline
        setImageUrl("https://picsum.photos/1920/1080?nature");
      });
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url(${imageUrl})`,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          transform: blur > 0 ? "scale(1.05)" : "scale(1)",
        }}
      />
      {overlayOpacity > 0 && (
        <div
          className="absolute inset-0 bg-black transition-opacity duration-300"
          style={{ opacity: overlayOpacity / 100 }}
        />
      )}
      <div className="pointer-events-auto absolute bottom-4 left-4 rounded-lg bg-black/40 px-3 py-1.5 text-xs text-white/80 backdrop-blur opacity-0 hover:opacity-100 transition-opacity flex items-center gap-1.5">
        <Camera className="w-3.5 h-3.5 opacity-80 shrink-0" />
        <span>{copyright || t.copyrightDefault}</span>
        {isCached && <span className="opacity-60 text-[10px] ml-1">{t.cached}</span>}
      </div>
    </div>
  );
}

const config: PluginConfig<BingBackgroundData> = {
  id: "bing",
  name: "Bing Daily Wallpaper",
  description: "Official Bing photography wallpaper updated daily.",
  type: "background",
  defaultData: { blur: 0, overlayOpacity: 20 },
  component: BingBackground,
};

export default config;
