import { useSyncExternalStore } from "react";
import type { PluginConfig, PluginAPI } from "../types";

export type PresetStyle = "aurora" | "cosmic" | "mesh" | "emerald" | "sunset";

export interface PresetBackgroundData {
  style: PresetStyle;
}

const STYLES: Record<PresetStyle, { name: string; css: string }> = {
  aurora: {
    name: "Aurora Glow",
    css: "radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,25%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%), radial-gradient(at 0% 100%, hsla(197,37%,24%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(269,45%,28%,1) 0, transparent 50%)",
  },
  cosmic: {
    name: "Cosmic Deep Space",
    css: "radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0f172a 60%, #020617 100%)",
  },
  mesh: {
    name: "Cyber Mesh",
    css: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)",
  },
  emerald: {
    name: "Forest Emerald",
    css: "radial-gradient(at 20% 20%, #064e3b 0%, #022c22 50%, #0f172a 100%)",
  },
  sunset: {
    name: "Neon Sunset",
    css: "radial-gradient(at 80% 20%, #4c1d95 0%, #831843 50%, #0f172a 100%)",
  },
};

function PresetBackground({ api }: { api: PluginAPI<PresetBackgroundData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const { style } = data;
  const current = STYLES[style] ?? STYLES.aurora;

  return (
    <div
      className="fixed inset-0 -z-10 bg-slate-100 dark:bg-slate-950 transition-all duration-700"
      style={{
        backgroundImage: current.css,
      }}
      aria-hidden
    />
  );
}

const config: PluginConfig<PresetBackgroundData> = {
  id: "preset",
  name: "Offline Vector Patterns",
  description: "Beautiful offline geometric and mesh gradient backdrops (zero network needed).",
  type: "background",
  defaultData: {
    style: "aurora",
  },
  component: PresetBackground,
};

export default config;
