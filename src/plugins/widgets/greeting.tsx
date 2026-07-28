import { useSyncExternalStore } from "react";
import type { PluginConfig, PluginAPI } from "../types";
import { getTranslations } from "../../i18n";

interface GreetingData {
  name: string;
}

function getGreetingKey(hour: number): "night" | "morning" | "afternoon" | "evening" {
  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function GreetingWidget({ api }: { api: PluginAPI<GreetingData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const displayName = data.name || api.settings.userName || "";
  const t = getTranslations(api.settings.language).widgets.greeting;

  const key = getGreetingKey(new Date().getHours());
  const greetingText = t[key];

  return (
    <div className="text-center">
      <p className="text-3xl font-light tracking-tight drop-shadow-sm">
        {greetingText}
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
