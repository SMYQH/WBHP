import { useSyncExternalStore } from "react";
import type { PluginConfig, PluginAPI } from "../types";

export interface CustomBackgroundData {
  imageUrl: string;
  blur: number; // 0 to 20 px
  overlayOpacity: number; // 0 to 80 %
}

function CustomBackground({ api }: { api: PluginAPI<CustomBackgroundData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const { imageUrl, blur, overlayOpacity } = data;

  return (
    <>
      {imageUrl ? (
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center transition-all duration-500"
          style={{
            backgroundImage: `url(${imageUrl})`,
            filter: blur > 0 ? `blur(${blur}px)` : "none",
            transform: blur > 0 ? "scale(1.05)" : "none", // Prevent blurred edge artifacts
          }}
          aria-hidden
        />
      ) : (
        <div
          className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
          aria-hidden
        />
      )}
      <div
        className="fixed inset-0 -z-10 transition-opacity duration-300"
        style={{
          backgroundColor: "#000000",
          opacity: (overlayOpacity ?? 30) / 100,
        }}
        aria-hidden
      />
    </>
  );
}

const config: PluginConfig<CustomBackgroundData> = {
  id: "custom",
  name: "Custom Wallpaper",
  description: "Upload local photo or enter custom image URL with blur & overlay controls.",
  type: "background",
  defaultData: {
    imageUrl: "",
    blur: 0,
    overlayOpacity: 30,
  },
  component: CustomBackground,
};

export default config;
