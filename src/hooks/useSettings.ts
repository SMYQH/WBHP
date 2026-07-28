import { useCallback, useSyncExternalStore } from "react";
import type { WBHPSettings } from "../plugins/types";
import {
  getSettings,
  setSettings,
  subscribeSettings,
} from "../services/storage";

export const DEFAULT_SETTINGS: WBHPSettings = {
  theme: "system",
  language: "auto",
  fontFamily: "misans",
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
  update: {
    autoCheck: true,
    autoDownload: false,
  },
};

function isWellFormed(raw: unknown): raw is WBHPSettings {
  if (!raw || typeof raw !== "object") return false;
  const s = raw as Partial<WBHPSettings>;
  return (
    typeof s.theme === "string" &&
    typeof s.language === "string" &&
    typeof s.fontFamily === "string" &&
    Array.isArray(s.activeWidgets) &&
    typeof s.activeBackground === "string" &&
    !!s.webdav &&
    typeof s.webdav === "object" &&
    typeof s.webdav.url === "string" &&
    typeof s.userName === "string" &&
    !!s.update &&
    typeof s.update === "object" &&
    typeof s.update.autoCheck === "boolean" &&
    typeof s.update.autoDownload === "boolean"
  );
}

function normalize(raw: unknown): WBHPSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<WBHPSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...r,
    language: r.language ?? DEFAULT_SETTINGS.language,
    fontFamily: r.fontFamily ?? DEFAULT_SETTINGS.fontFamily,
    webdav: {
      ...DEFAULT_SETTINGS.webdav,
      ...(r.webdav ?? {}),
    },
    update: {
      ...DEFAULT_SETTINGS.update,
      ...(r.update ?? {}),
    },
    activeWidgets: Array.isArray(r.activeWidgets) ? r.activeWidgets : [],
  };
}

let cachedNormalized: { raw: unknown; value: WBHPSettings } | null = null;

/**
 * Snapshot must be pure and referentially stable when data is unchanged.
 * Never write to storage inside getSnapshot — that breaks React concurrent mode.
 */
function getSnapshot(): WBHPSettings {
  const raw = getSettings<unknown>(DEFAULT_SETTINGS);
  if (isWellFormed(raw)) return raw;
  if (cachedNormalized && cachedNormalized.raw === raw) {
    return cachedNormalized.value;
  }
  const normalized = normalize(raw);
  cachedNormalized = { raw, value: normalized };
  return normalized;
}

function subscribe(listener: () => void): () => void {
  return subscribeSettings(listener);
}

function applyPatch(patch: Partial<WBHPSettings>): void {
  const prev = getSnapshot();
  const next: WBHPSettings = {
    ...prev,
    ...patch,
    webdav: patch.webdav ? { ...prev.webdav, ...patch.webdav } : prev.webdav,
    update: patch.update ? { ...prev.update, ...patch.update } : prev.update,
  };
  setSettings(next);
}

/**
 * React hook that reads global settings reactively.
 * Also returns an update function.
 */
export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_SETTINGS);
  const update = useCallback(
    (patch: Partial<WBHPSettings>) => applyPatch(patch),
    [],
  );
  return { settings, updateSettings: update };
}
