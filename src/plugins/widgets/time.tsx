import type { PluginConfig, PluginAPI } from "../types";
import { usePluginData } from "../../hooks/usePluginData";

interface TimeData {
  showSeconds: boolean;
  showDate: boolean;
  hour12: boolean;
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

function TimeWidget(_props: { api: PluginAPI<TimeData> }) {
  const { data } = usePluginData("time", config.defaultData, {});

  // Simple state — re-render every second
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { showSeconds, showDate, hour12 } = data.get();

  const fmt: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    ...(showSeconds ? { second: "2-digit" } : {}),
    ...(hour12 ? { hour12: true } : { hour12: false }),
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
    <div className="text-center select-none">
      <div className="text-6xl font-light tracking-tight tabular-nums">
        {now.toLocaleTimeString(undefined, fmt)}
      </div>
      {dateStr && (
        <div className="mt-2 text-lg opacity-70">{dateStr}</div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
export default config;
