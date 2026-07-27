import { useState, useEffect } from "react";
import type { PluginConfig, PluginAPI } from "../types";
import { usePluginData } from "../../hooks/usePluginData";

interface WeatherData {
  location: string; // empty = auto-detect
  unit: "celsius" | "fahrenheit";
}

interface WeatherCache {
  temp: string;
  condition: string;
  icon: string;
  location: string;
}

const config: PluginConfig<WeatherData, WeatherCache> = {
  id: "weather",
  name: "Weather",
  description: "Current weather via wttr.in (no API key needed).",
  type: "widget",
  defaultData: { location: "", unit: "celsius" },
  defaultCache: { temp: "--", condition: "Loading...", icon: "☁️", location: "" },
  defaultSize: { width: 2, height: 1 },
  component: WeatherWidget,
};

function WeatherWidget(_props: { api: PluginAPI<WeatherData, WeatherCache> }) {
  const { data, cache } = usePluginData("weather", config.defaultData, config.defaultCache!);
  const { location, unit } = data.get();
  const cached = cache.get();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchWeather() {
      try {
        const query = location || "";
        const unitParam = unit === "fahrenheit" ? "u" : "m";
        const res = await fetch(
          `https://wttr.in/${encodeURIComponent(query)}?format=j1&${unitParam}`,
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        if (cancelled) return;
        const current = json.current_condition?.[0];
        const nearest = json.nearest_area?.[0];
        cache.set({
          temp: current ? `${current.temp_C}°${unit === "fahrenheit" ? "F" : "C"}` : "--",
          condition: current?.weatherDesc?.[0]?.value ?? "Unknown",
          icon: getWeatherIcon(current?.weatherCode),
          location: nearest?.areaName?.[0]?.value ?? nearest?.region?.[0]?.value ?? query,
        });
        setError(null);
      } catch {
        if (!cancelled) setError("Unable to load weather");
      }
    }
    fetchWeather();
    const id = setInterval(fetchWeather, 30 * 60_000); // refresh every 30 min
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [location, unit, cache]);

  if (error) {
    return <p className="text-sm opacity-50">{error}</p>;
  }

  return (
    <div className="text-center">
      <div className="text-4xl">{cached.icon}</div>
      <div className="text-2xl font-light">{cached.temp}</div>
      <div className="text-sm opacity-70">{cached.condition}</div>
      {cached.location && (
        <div className="text-xs opacity-50 mt-0.5">{cached.location}</div>
      )}
    </div>
  );
}

function getWeatherIcon(code?: string): string {
  if (!code) return "☁️";
  const c = parseInt(code, 10);
  if (c >= 200 && c < 300) return "⛈️";
  if (c >= 300 && c < 400) return "🌧️";
  if (c >= 500 && c < 600) return "🌧️";
  if (c >= 600 && c < 700) return "❄️";
  if (c >= 700 && c < 800) return "🌫️";
  if (c === 800) return "☀️";
  if (c > 800) return "⛅";
  return "☁️";
}

export default config;
