import { useState, useEffect } from "react";
import type { PluginConfig, PluginAPI } from "../types";

export interface BingBackgroundData {
  blur?: number;
  overlayOpacity?: number;
}

const DEFAULT_BING_IMAGE = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop";

function BingBackground({ api }: { api: PluginAPI<BingBackgroundData> }) {
  const data = api.data.get();
  const blur = data?.blur ?? 0;
  const overlayOpacity = data?.overlayOpacity ?? 20;

  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_BING_IMAGE);
  const [copyright, setCopyright] = useState<string>("Bing Wallpaper of the Day");

  useEffect(() => {
    // In browser extensions, CORS for Bing API can be fetched directly or fallback cleanly
    fetch("https://bing.biturl.top/?resolution=1920&format=json&index=0&mkt=zh-CN")
      .then((res) => res.json())
      .then((resData) => {
        if (resData && resData.url) {
          setImageUrl(resData.url);
          if (resData.copyright) setCopyright(resData.copyright);
        }
      })
      .catch(() => {
        // Fallback to Bing archive static mirror if direct API fails
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
      <div className="pointer-events-auto absolute bottom-4 left-4 rounded-lg bg-black/40 px-3 py-1.5 text-xs text-white/80 backdrop-blur opacity-0 hover:opacity-100 transition-opacity">
        🖼️ {copyright}
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
