import { useMemo } from "react";
import { getPlugin, getWidgetPlugins } from "../../plugins/registry";
import { useSettings } from "../../hooks/useSettings";
import PluginHost from "../PluginHost";
import ErrorBoundary from "../ErrorBoundary";

export default function Dashboard() {
  const { settings, updateSettings } = useSettings();

  const activeWidgets = useMemo(() => {
    if (settings.activeWidgets.length > 0) {
      return settings.activeWidgets
        .map((id) => getPlugin(id))
        .filter((p): p is NonNullable<typeof p> => !!p && p.type === "widget");
    }
    // Empty list means "show all widgets" (first-run default).
    return getWidgetPlugins();
  }, [settings.activeWidgets]);

  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      {activeWidgets.map((plugin) => (
        <ErrorBoundary key={plugin.id} fallbackLabel={`Widget: ${plugin.name}`}>
          <PluginHost
            plugin={plugin}
            settings={settings}
            updateSettings={updateSettings}
            as="section"
            className="w-full max-w-3xl"
          />
        </ErrorBoundary>
      ))}
    </main>
  );
}
