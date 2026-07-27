import { useSyncExternalStore, useCallback } from "react";
import type { PluginDataStore, PluginCacheStore } from "../plugins/types";
import { getPluginData, setPluginData } from "../services/storage";

/** Create a reactive PluginDataStore backed by localStorage. */
function createDataStore<D>(pluginId: string, fallback: D): PluginDataStore<D> {
  const listeners = new Set<() => void>();

  const getSnapshot = (): D => getPluginData<D>(pluginId, fallback);

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const set = (updater: D | ((prev: D) => D)) => {
    const prev = getSnapshot();
    const next =
      typeof updater === "function" ? (updater as (prev: D) => D)(prev) : updater;
    if (next === prev) return;
    setPluginData(pluginId, next);
    listeners.forEach((l) => l());
  };

  return {
    get: getSnapshot,
    set,
    subscribe,
  };
}

/** Create an in-memory cache store (not persisted). */
function createCacheStore<C>(fallback: C): PluginCacheStore<C> {
  let state = { ...fallback };
  return {
    get: () => state,
    set: (updater) => {
      const next =
        typeof updater === "function"
          ? (updater as (prev: C) => C)(state)
          : updater;
      if (next === state) return;
      state = { ...next };
    },
  };
}

/**
 * React hook that returns a PluginDataStore + PluginCacheStore for a plugin.
 * Uses useSyncExternalStore for efficient reactivity.
 */
export function usePluginData<D, C>(
  pluginId: string,
  defaultData: D,
  defaultCache: C,
): { data: PluginDataStore<D>; cache: PluginCacheStore<C> } {
  // We wrap in useCallback to keep stable refs across renders.
  const data = useCallback(
    () => createDataStore<D>(pluginId, defaultData),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )();

  const cache = useCallback(
    () => createCacheStore<C>(defaultCache),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )();

  // Subscribe to data changes so components re-render.
  useSyncExternalStore(
    data.subscribe,
    data.get,
    data.get,
  );

  return { data, cache };
}
