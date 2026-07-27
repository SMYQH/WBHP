import type { PluginConfig, PluginAPI } from "../types";

interface GradientData {
  from: string;
  to: string;
  direction: string;
}

const config: PluginConfig<GradientData> = {
  id: "gradient",
  name: "Gradient",
  description: "A smooth gradient background.",
  type: "background",
  defaultData: {
    from: "#0f172a",
    to: "#1e1b4b",
    direction: "to bottom right",
  },
  component: GradientBackground,
};

function GradientBackground({ api }: { api: PluginAPI<GradientData> }) {
  const { from, to, direction } = api.data.get();
  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        background: `linear-gradient(${direction}, ${from}, ${to})`,
      }}
    />
  );
}

export default config;
