import { useState, useEffect, useSyncExternalStore } from "react";
import type { PluginConfig, PluginAPI } from "../types";

interface WeatherData {
  location: string;
  unit: "celsius" | "fahrenheit";
}

interface WeatherCache {
  temp: string;
  condition: string;
  icon: string;
  location: string;
  fetchedAt: number;
}

const CACHE_TTL_MS = 30 * 60_000;

function WeatherWidget({ api }: { api: PluginAPI<WeatherData, WeatherCache> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const cached = useSyncExternalStore(api.cache.subscribe, api.cache.get, api.cache.get);
  const { location, unit } = data;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchWeather(force = false) {
      if (
        !force &&
        cached.fetchedAt > 0 &&
        Date.now() - cached.fetchedAt < CACHE_TTL_MS &&
        cached.temp !== "--"
      ) {
        return;
      }

      setLoading(true);
      try {
        const query = location.trim();
        const res = await fetch(
          `https://wttr.in/${encodeURIComponent(query)}?format=j1`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;

        const current = json.current_condition?.[0];
        const nearest = json.nearest_area?.[0];
        const tempValue =
          unit === "fahrenheit" ? current?.temp_F : current?.temp_C;
        const unitLabel = unit === "fahrenheit" ? "F" : "C";

        api.cache.set({
          temp: tempValue != null ? `${tempValue}°${unitLabel}` : "--",
          condition: current?.weatherDesc?.[0]?.value ?? "Unknown",
          icon: getWeatherIcon(current?.weatherCode),
          location:
            nearest?.areaName?.[0]?.value ??
            nearest?.region?.[0]?.value ??
            query ??
            "",
          fetchedAt: Date.now(),
        });
        setError(null);
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        setError("Unable to load weather");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Force refresh when location/unit change so unit labels stay correct.
    fetchWeather(true);
    const id = setInterval(() => fetchWeather(false), CACHE_TTL_MS);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, unit]);

  if (error) {
    return (
      <p className="text-sm opacity-50" role="status">
        {error}
      </p>
    );
  }

  return (
    <div className="text-center" aria-live="polite">
      <div className="text-4xl" aria-hidden>
        {cached.icon}
      </div>
      <div className="text-2xl font-light">
        {loading && cached.temp === "--" ? "…" : cached.temp}
      </div>
      <div className="text-sm opacity-70">{cached.condition}</div>
      {cached.location && (
        <div className="mt-0.5 text-xs opacity-50">{cached.location}</div>
      )}
    </div>
  );
}

function getWeatherIcon(code?: string): string {
  if (!code) return "☁️";
  const c = parseInt(code, 10);
  if (Number.isNaN(c)) return "☁️";
  if (c === 113) return "☀️";
  if (c === 116) return "⛅";
  if (c === 119 || c === 122) return "☁️";
  if ([143, 248, 260].includes(c)) return "🌫️";
  if ([200, 386, 389, 392, 395].includes(c)) return "⛈️";
  if ([179, 182, 185, 227, 230, 281, 284, 311, 314, 317, 320, 323, 326, 329, 332, 335, 338, 350, 374, 377].includes(c)) {
    return "❄️";
  }
  if (c >= 176 && c <= 377) return "🌧️";
  return "☁️";
}

const config: PluginConfig<WeatherData, WeatherCache> = {
  id: "weather",
  name: "Weather",
  description: "Current weather via wttr.in (no API key needed).",
  type: "widget",
  defaultData: { location: "", unit: "celsius" },
  defaultCache: {
    temp: "--",
    condition: "Loading...",
    icon: "☁️",
    location: "",
    fetchedAt: 0,
  },
  defaultSize: { width: 2, height: 1 },
  component: WeatherWidget,
};

export default config;
