import { useState, useEffect, useSyncExternalStore } from "react";
import { Globe, Sun, Moon } from "lucide-react";
import type { PluginConfig, PluginAPI } from "../types";
import { getTranslations } from "../../i18n";

export interface CityClock {
  id: string;
  name: string;
  timezone: string;
}

export interface WorldClockData {
  cities: CityClock[];
}

const DEFAULT_CITIES: CityClock[] = [
  { id: "1", name: "Beijing", timezone: "Asia/Shanghai" },
  { id: "2", name: "London", timezone: "Europe/London" },
  { id: "3", name: "New York", timezone: "America/New_York" },
  { id: "4", name: "Tokyo", timezone: "Asia/Tokyo" },
];

function WorldClockWidget({ api }: { api: PluginAPI<WorldClockData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const t = getTranslations(api.settings.language).widgets.worldclock;

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cities = data.cities || DEFAULT_CITIES;

  return (
    <div className="w-full rounded-2xl border border-white/20 bg-white/40 p-5 shadow-lg backdrop-blur-md transition-all dark:border-white/10 dark:bg-gray-900/40">
      <div className="mb-4 flex items-center justify-between border-b border-gray-200/40 pb-3 dark:border-gray-700/40">
        <h3 className="text-base font-semibold tracking-wide flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{t.name}</span>
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cities.map((city) => {
          let timeString = "--:--";
          let dateString = "";
          let isNight = false;
          const localizedName = (t.cities as Record<string, string> | undefined)?.[city.name] ?? city.name;
          try {
            const timeFormatter = new Intl.DateTimeFormat("en-US", {
              timeZone: city.timezone,
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
            timeString = timeFormatter.format(now);
            const hour = parseInt(timeString.split(":")[0], 10);
            isNight = hour < 6 || hour >= 18;

            const dateFormatter = new Intl.DateTimeFormat("en-US", {
              timeZone: city.timezone,
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            dateString = dateFormatter.format(now);
          } catch (e) {
            console.error(e);
          }

          return (
            <div
              key={city.id}
              role="region"
              aria-label={`${localizedName}: ${timeString}`}
              className="flex flex-col items-center justify-center rounded-xl bg-white/40 p-3 text-center backdrop-blur shadow-sm dark:bg-gray-800/40"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold opacity-80 mb-1">
                {isNight ? (
                  <Moon className="w-3.5 h-3.5 text-indigo-300 shrink-0" aria-hidden />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden />
                )}
                <span>{localizedName}</span>
              </div>
              <div className="text-xl font-bold tracking-tight tabular-nums">
                {timeString}
              </div>
              <div className="text-[10px] opacity-60 mt-0.5">
                {dateString}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const config: PluginConfig<WorldClockData> = {
  id: "worldclock",
  name: "World Clock",
  description: "Multi-timezone cards for global cities.",
  type: "widget",
  defaultData: { cities: DEFAULT_CITIES },
  defaultSize: { width: 4, height: 2 },
  component: WorldClockWidget,
};

export default config;
