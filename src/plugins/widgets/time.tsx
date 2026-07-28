import { useState, useEffect, useSyncExternalStore } from "react";
import type { PluginConfig, PluginAPI } from "../types";

interface TimeData {
  showSeconds: boolean;
  showDate: boolean;
  hour12: boolean;
}

function TimeWidget({ api }: { api: PluginAPI<TimeData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const { showSeconds, showDate, hour12 } = data;

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    ...(showSeconds ? { second: "2-digit" as const } : {}),
    hour12,
  };

  const dateStr = showDate
    ? now.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="select-none text-center">
      <div className="text-6xl font-light tracking-tight tabular-nums">
        {now.toLocaleTimeString(undefined, fmt)}
      </div>
      {dateStr && <div className="mt-2 text-lg opacity-70">{dateStr}</div>}
    </div>
  );
}

const config: PluginConfig<TimeData> = {
  id: "time",
  name: "Time",
  description: "Display the current time and date.",
  type: "widget",
  defaultData: { showSeconds: true, showDate: true, hour12: false },
  defaultSize: { width: 4, height: 1 },
  component: TimeWidget,
};

export default config;
