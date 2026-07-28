import { useEffect, useSyncExternalStore } from "react";
import type { PluginConfig, PluginAPI } from "../types";

interface WeatherData {
  city: string;
  temp: string;
  condition: string;
  unit: "celsius" | "fahrenheit";
}

function WeatherWidget({ api }: { api: PluginAPI<WeatherData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const { city, temp, condition, unit } = data;

  useEffect(() => {
    // Fetch live weather based on IP location via wttr.in API
    fetch("https://wttr.in/?format=j1")
      .then((res) => res.json())
      .then((resData) => {
        if (resData && resData.current_condition && resData.current_condition[0]) {
          const current = resData.current_condition[0];
          const area = resData.nearest_area && resData.nearest_area[0];
          const cityName = area?.areaName?.[0]?.value || area?.region?.[0]?.value || city || "Local";
          const condText = current.weatherDesc?.[0]?.value || condition || "Sunny";
          const tempVal = unit === "fahrenheit" ? current.temp_F : current.temp_C;

          api.data.set((prev) => ({
            ...prev,
            city: cityName,
            temp: tempVal || prev.temp,
            condition: condText,
          }));
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch live IP weather:", err);
      });
  }, [unit]);

  const unitLabel = unit === "fahrenheit" ? "°F" : "°C";

  return (
    <div className="text-center select-none" aria-live="polite">
      <div className="text-4xl" aria-hidden>
        {getWeatherIcon(condition)}
      </div>
      <div className="text-2xl font-light tracking-tight mt-1">
        {temp ? `${temp}${unitLabel}` : `--${unitLabel}`}
      </div>
      <div className="text-sm opacity-70">{condition || "Sunny"}</div>
      <div className="mt-1 text-xs opacity-60 flex items-center justify-center gap-1 font-medium">
        <span>📍 {city || "Local"}</span>
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
  description: "Real-time weather forecast based on IP location.",
  type: "widget",
  defaultData: {
    city: "Local",
    temp: "--",
    condition: "Sunny",
    unit: "celsius",
  },
  defaultSize: { width: 2, height: 1 },
  component: WeatherWidget,
};

export default config;
