import { useMemo, useRef, useSyncExternalStore } from "react";
import type { PluginDataStore, PluginCacheStore } from "../plugins/types";
import {
  getPluginData,
  setPluginData,
  subscribePluginData,
} from "../services/storage";

/** Create a reactive PluginDataStore backed by localStorage. */
function createDataStore<D>(pluginId: string, fallback: D): PluginDataStore<D> {
  return {
    get: () => getPluginData<D>(pluginId, fallback),
    set: (updater) => {
      const prev = getPluginData<D>(pluginId, fallback);
      const next =
        typeof updater === "function"
          ? (updater as (prev: D) => D)(prev)
          : updater;
      if (Object.is(next, prev)) return;
      setPluginData(pluginId, next);
    },
    subscribe: (listener) => subscribePluginData(pluginId, listener),
  };
}

/** Create an in-memory cache store with subscription support. */
function createCacheStore<C>(fallback: C): PluginCacheStore<C> {
  let state: C =
    fallback !== null && typeof fallback === "object"
      ? ({ ...(fallback as object) } as C)
      : fallback;
  const listeners = new Set<() => void>();

  return {
    get: () => state,
    set: (updater) => {
      const next =
        typeof updater === "function"
          ? (updater as (prev: C) => C)(state)
          : updater;
      if (Object.is(next, state)) return;
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * React hook that returns a stable PluginDataStore + PluginCacheStore.
 * Both stores trigger re-renders via useSyncExternalStore.
 */
export function usePluginData<D, C = Record<string, never>>(
  pluginId: string,
  defaultData: D,
  defaultCache: C = {} as C,
): { data: PluginDataStore<D>; cache: PluginCacheStore<C> } {
  const dataRef = useRef<PluginDataStore<D> | null>(null);
  const cacheRef = useRef<PluginCacheStore<C> | null>(null);
  const idRef = useRef(pluginId);

  if (dataRef.current === null || idRef.current !== pluginId) {
    idRef.current = pluginId;
    dataRef.current = createDataStore(pluginId, defaultData);
    cacheRef.current = createCacheStore(defaultCache);
  }

  const data = dataRef.current;
  const cache = cacheRef.current!;

  useSyncExternalStore(data.subscribe, data.get, data.get);
  useSyncExternalStore(cache.subscribe, cache.get, cache.get);

  return useMemo(() => ({ data, cache }), [data, cache]);
}
