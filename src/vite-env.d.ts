/// <reference types="vite/client" />

/** Minimal chrome.storage typings used by the storage bridge. */
interface ChromeStorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

interface ChromeStorageArea {
  get(
    keys?: string | string[] | Record<string, unknown> | null,
  ): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
  clear(): Promise<void>;
}

interface ChromeStorage {
  local: ChromeStorageArea;
  sync: ChromeStorageArea;
  session?: ChromeStorageArea;
  onChanged: {
    addListener(
      callback: (
        changes: Record<string, ChromeStorageChange>,
        areaName: string,
      ) => void,
    ): void;
    removeListener(
      callback: (
        changes: Record<string, ChromeStorageChange>,
        areaName: string,
      ) => void,
    ): void;
  };
}

interface ChromeRuntimeApi {
  storage?: ChromeStorage;
}

declare var chrome: ChromeRuntimeApi | undefined;

interface Window {
  chrome?: ChromeRuntimeApi;
}

declare var globalThis: typeof globalThis & {
  chrome?: ChromeRuntimeApi;
};

declare const __APP_VERSION__: string;
