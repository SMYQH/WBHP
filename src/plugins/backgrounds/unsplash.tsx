import { useState, useEffect } from "react";
import type { PluginConfig, PluginAPI } from "../types";
import { usePluginData } from "../../hooks/usePluginData";

interface UnsplashData {
  query: string;
  refreshInterval: number; // minutes, 0 = static
}

interface UnsplashCache {
  imageUrl: string;
  author: string;
  authorUrl: string;
}

const config: PluginConfig<UnsplashData, UnsplashCache> = {
  id: "unsplash",
  name: "Unsplash Photos",
  description: "Beautiful photos from picsum.photos (no API key).",
  type: "background",
  defaultData: { query: "nature", refreshInterval: 0 },
  defaultCache: {
    imageUrl: "https://picsum.photos/1920/1080?random=1",
    author: "",
    authorUrl: "",
  },
  component: UnsplashBackground,
};

function UnsplashBackground(_props: { api: PluginAPI<UnsplashData, UnsplashCache> }) {
  const { data, cache } = usePluginData("unsplash", config.defaultData, config.defaultCache!);
  const { refreshInterval } = data.get();
  const { imageUrl, author } = cache.get();

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Pre-load next image
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (refreshInterval <= 0) return;
    const id = setInterval(() => {
      const seed = Math.floor(Math.random() * 1000);
      fetch(`https://picsum.photos/id/${seed}/info`)
        .then((r) => r.json())
        .then((info) => {
          cache.set({
            imageUrl: `https://picsum.photos/1920/1080?random=${seed}`,
            author: info.author,
            authorUrl: info.url,
          });
        })
        .catch(() => {});
    }, refreshInterval * 60_000);
    return () => clearInterval(id);
  }, [refreshInterval, cache]);

  return (
    <>
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center transition-opacity duration-1000"
        style={{
          backgroundImage: `url(${imageUrl})`,
          opacity: loaded ? 1 : 0,
        }}
      />
      {/* Overlay for text readability */}
      <div className="fixed inset-0 -z-10 bg-black/30" />
      {author && (
        <div className="fixed bottom-4 left-4 z-10 text-xs text-white/50">
          Photo by{" "}
          <a
            href={cache.get().authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/80"
          >
            {author}
          </a>
        </div>
      )}
    </>
  );
}

export default config;
