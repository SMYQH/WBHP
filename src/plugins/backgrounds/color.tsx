import type { PluginConfig, PluginAPI } from "../types";

interface ColorData {
  color: string;
}

const config: PluginConfig<ColorData> = {
  id: "color",
  name: "Solid Color",
  description: "A simple solid color background.",
  type: "background",
  defaultData: { color: "#1e293b" },
  component: ColorBackground,
};

function ColorBackground({ api }: { api: PluginAPI<ColorData> }) {
  const { color } = api.data.get();
  return (
    <div
      className="fixed inset-0 -z-10"
      style={{ backgroundColor: color }}
    />
  );
}

export default config;
