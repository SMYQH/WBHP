import { useSyncExternalStore } from "react";
import type { PluginConfig, PluginAPI } from "../types";

interface GreetingData {
  name: string;
}

function getGreeting(hour: number): string {
  if (hour < 6) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function GreetingWidget({ api }: { api: PluginAPI<GreetingData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
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

const config: PluginConfig<GreetingData> = {
  id: "greeting",
  name: "Greeting",
  description: "A friendly greeting that changes with the time of day.",
  type: "widget",
  defaultData: { name: "" },
  defaultSize: { width: 4, height: 1 },
  component: GreetingWidget,
};

export default config;
