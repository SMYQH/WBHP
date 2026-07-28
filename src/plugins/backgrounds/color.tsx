import { useSyncExternalStore } from "react";
import type { PluginConfig, PluginAPI } from "../types";

interface ColorData {
  color: string;
}

function ColorBackground({ api }: { api: PluginAPI<ColorData> }) {
  const { color } = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  return (
    <div
      className="fixed inset-0 -z-10"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

const config: PluginConfig<ColorData> = {
  id: "color",
  name: "Solid Color",
  description: "A simple solid color background.",
  type: "background",
  defaultData: { color: "#1e293b" },
  component: ColorBackground,
};

export default config;
