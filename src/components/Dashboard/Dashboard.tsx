import { useMemo, useSyncExternalStore, useCallback, type ComponentType } from "react";
import type { PluginAPI, PluginDataStore } from "../../plugins/types";
import { getPlugin, getWidgetPlugins } from "../../plugins/registry";
import { useSettings } from "../../hooks/useSettings";
import {
  getPluginData,
  setPluginData,
  setSettings as saveSettings,
  getSettings,
} from "../../services/storage";

const dataListeners = new Map<string, Set<() => void>>();

function getOrCreateListeners(key: string): Set<() => void> {
  if (!dataListeners.has(key)) dataListeners.set(key, new Set());
  return dataListeners.get(key)!;
}

function useWidgetDataStore<D>(pluginId: string, fallback: D): PluginDataStore<D> {
  const listeners = getOrCreateListeners(`plugin:${pluginId}`);

  const getSnapshot = useCallback(
    () => getPluginData<D>(pluginId, fallback),
    [pluginId, fallback],
  );

  const subscribe = useCallback(
    (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    [listeners],
  );

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    get: getSnapshot,
    set: (updater) => {
      const prev = getSnapshot();
      const next =
        typeof updater === "function"
          ? (updater as (prev: D) => D)(prev)
          : updater;
      if (next === prev) return;
      setPluginData(pluginId, next);
      listeners.forEach((l) => l());
    },
    subscribe,
  };
}

export default function Dashboard() {
  const { settings } = useSettings();

  const activeWidgets = useMemo(() => {
    if (settings.activeWidgets.length > 0) {
      return settings.activeWidgets
        .map((id) => getPlugin(id))
        .filter(Boolean);
    }
    return getWidgetPlugins();
  }, [settings.activeWidgets]);

  return (
    <main className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-8 px-4 py-12">
      {activeWidgets.map((plugin) => {
        if (!plugin || plugin.type !== "widget") return null;

        const dataStore = useWidgetDataStore(plugin.id, plugin.defaultData);

        const api: PluginAPI = {
          data: dataStore,
          cache: { get: () => ({}), set: () => {} },
          settings,
          updateSettings: (patch) => {
            const current = getSettings(settings);
            saveSettings({ ...current, ...patch });
            window.dispatchEvent(new Event("wbhp:settings-changed"));
          },
        };

        const Comp = plugin.component as ComponentType<{ api: PluginAPI }>;
        return (
          <section key={plugin.id} className="w-full max-w-3xl">
            <Comp api={api} />
          </section>
        );
      })}
    </main>
  );
}
