import { useSyncExternalStore } from "react";
import type { PluginConfig, PluginAPI } from "../types";
import { getTranslations } from "../../i18n";

interface WeatherData {
  city: string;
  temp: string;
  condition: string;
  unit: "celsius" | "fahrenheit";
}

function WeatherWidget({ api }: { api: PluginAPI<WeatherData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const { city, temp, condition, unit } = data;
  const t = getTranslations(api.settings.language).widgets.weather;

  const unitLabel = unit === "fahrenheit" ? "°F" : "°C";

  return (
    <div className="text-center select-none" aria-live="polite">
      <div className="text-4xl" aria-hidden>
        {getWeatherIcon(condition)}
      </div>
      <div className="text-2xl font-light tracking-tight mt-1">
        {temp ? `${temp}${unitLabel}` : `24${unitLabel}`}
      </div>
      <div className="text-sm opacity-70">{condition || "Sunny"}</div>
      <div className="mt-0.5 text-xs opacity-50 flex items-center justify-center gap-1">
        <span>📍 {city || "Tokyo"}</span>
        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full dark:bg-white/10">
          {t.offlineNotice}
        </span>
      </div>
    </div>
  );
}

function getWeatherIcon(cond: string): string {
  const lower = (cond || "").toLowerCase();
  if (lower.includes("sun") || lower.includes("clear") || lower.includes("晴")) return "☀️";
  if (lower.includes("cloud") || lower.includes("overcast") || lower.includes("云") || lower.includes("阴")) return "⛅";
  if (lower.includes("rain") || lower.includes("drizzle") || lower.includes("雨")) return "🌧️";
  if (lower.includes("snow") || lower.includes("ice") || lower.includes("雪")) return "❄️";
  if (lower.includes("thunder") || lower.includes("storm") || lower.includes("雷")) return "⛈️";
  return "🌤️";
}

const config: PluginConfig<WeatherData> = {
  id: "weather",
  name: "Weather",
  description: "Privacy-first 100% offline weather widget.",
  type: "widget",
  defaultData: {
    city: "Shanghai",
    temp: "24",
    condition: "Sunny",
    unit: "celsius",
  },
  defaultSize: { width: 2, height: 1 },
  component: WeatherWidget,
};

export default config;
