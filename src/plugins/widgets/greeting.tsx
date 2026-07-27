import type { PluginConfig, PluginAPI } from "../types";

interface GreetingData {
  /** Display name override (falls back to global userName). */
  name: string;
}

const config: PluginConfig<GreetingData> = {
  id: "greeting",
  name: "Greeting",
  description: "A friendly greeting that changes with the time of day.",
  type: "widget",
  defaultData: { name: "" },
  defaultSize: { width: 4, height: 1 },
  component: GreetingWidget,
};

function getGreeting(hour: number): string {
  if (hour < 6) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function GreetingWidget({ api }: { api: PluginAPI<GreetingData> }) {
  // Direct read — this widget is simple enough that we just read on mount
  const data = api.data.get();
  const displayName = data.name || api.settings.userName || "";

  return (
    <div className="text-center">
      <p className="text-3xl font-light">
        {getGreeting(new Date().getHours())}
        {displayName ? `, ${displayName}` : ""}
      </p>
    </div>
  );
}

export default config;
