import { useSyncExternalStore, useCallback } from "react";
import type { WBHPSettings } from "../plugins/types";
import { getSettings, setSettings } from "../services/storage";

const DEFAULT_SETTINGS: WBHPSettings = {
  theme: "system",
  activeWidgets: [],
  activeBackground: "gradient",
  userName: "",
  webdav: {
    enabled: false,
    url: "",
    username: "",
    password: "",
    autoBackupInterval: 0,
  },
};

const listeners = new Set<() => void>();

function getSnapshot(): WBHPSettings {
  return getSettings<WBHPSettings>(DEFAULT_SETTINGS);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function updateSettings(patch: Partial<WBHPSettings>): void {
  const prev = getSnapshot();
  const next = { ...prev, ...patch };
  setSettings(next);
  listeners.forEach((l) => l());
}

/**
 * React hook that reads global settings reactively.
 * Also returns an update function.
 */
export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const update = useCallback(
    (patch: Partial<WBHPSettings>) => updateSettings(patch),
    [],
  );
  return { settings, updateSettings: update };
}
