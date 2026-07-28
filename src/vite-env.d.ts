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

interface ChromeAlarmsApi {
  create?(
    name: string,
    alarmInfo: { when?: number; delayInMinutes?: number; periodInMinutes?: number },
  ): void;
  onAlarm?: {
    addListener(callback: (alarm: { name: string }) => void): void;
  };
}

interface ChromeRuntimeApi {
  storage?: ChromeStorage;
  requestUpdateCheck?: (
    callback: (status: string, details?: { version?: string }) => void,
  ) => void;
  reload?: () => void;
  onInstalled?: { addListener(callback: () => void): void };
  onStartup?: { addListener(callback: () => void): void };
  onUpdateAvailable?: {
    addListener(callback: (details: { version?: string }) => void): void;
  };
}

interface ChromeApi {
  storage?: ChromeStorage;
  runtime?: ChromeRuntimeApi;
  alarms?: ChromeAlarmsApi;
}

declare var chrome: ChromeApi | undefined;

interface Window {
  chrome?: ChromeApi;
}

declare var globalThis: typeof globalThis & {
  chrome?: ChromeApi;
};

declare const __APP_VERSION__: string;
