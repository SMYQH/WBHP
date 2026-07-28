import { useState, useEffect, useSyncExternalStore } from "react";
import type { PluginConfig, PluginAPI } from "../types";

interface UnsplashData {
  query: string;
  refreshInterval: number;
}

interface UnsplashCache {
  imageUrl: string;
  author: string;
  authorUrl: string;
}

function UnsplashBackground({ api }: { api: PluginAPI<UnsplashData, UnsplashCache> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const cached = useSyncExternalStore(api.cache.subscribe, api.cache.get, api.cache.get);
  const { refreshInterval } = data;
  const { imageUrl, author, authorUrl } = cached;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(true);
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (refreshInterval <= 0) return;

    const refresh = () => {
      const seed = Math.floor(Math.random() * 1000) + 1;
      fetch(`https://picsum.photos/id/${seed}/info`)
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        })
        .then((info) => {
          api.cache.set({
            imageUrl: `https://picsum.photos/id/${seed}/1920/1080`,
            author: info.author ?? "",
            authorUrl: info.url ?? "",
          });
        })
        .catch(() => {
          api.cache.set({
            imageUrl: `https://picsum.photos/1920/1080?random=${Date.now()}`,
            author: "",
            authorUrl: "",
          });
        });
    };

    const id = setInterval(refresh, refreshInterval * 60_000);
    return () => clearInterval(id);
  }, [refreshInterval, api.cache]);

  return (
    <>
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center transition-opacity duration-1000"
        style={{
          backgroundImage: `url(${imageUrl})`,
          opacity: loaded ? 1 : 0,
        }}
        aria-hidden
      />
      <div className="fixed inset-0 -z-10 bg-black/30" aria-hidden />
      {author && (
        <div className="fixed bottom-4 left-4 z-10 text-xs text-white/50">
          Photo by{" "}
          {authorUrl ? (
            <a
              href={authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/80"
            >
              {author}
            </a>
          ) : (
            <span>{author}</span>
          )}
        </div>
      )}
    </>
  );
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

export default config;
