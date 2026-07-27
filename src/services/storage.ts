const STORAGE_PREFIX = "wbhp:";

function key(name: string): string {
  return `${STORAGE_PREFIX}${name}`;
}

// ── Generic localStorage helpers ────────────────────────────────────
export function getItem<T>(storageKey: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key(storageKey));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setItem<T>(storageKey: string, value: T): void {
  try {
    localStorage.setItem(key(storageKey), JSON.stringify(value));
  } catch {
    console.warn(`Failed to write localStorage key "${storageKey}".`);
  }
}

export function removeItem(storageKey: string): void {
  localStorage.removeItem(key(storageKey));
}

// ── Plugin-scoped data ──────────────────────────────────────────────
export function getPluginData<D>(pluginId: string, fallback: D): D {
  return getItem<D>(`plugin:${pluginId}`, fallback);
}

export function setPluginData<D>(pluginId: string, data: D): void {
  setItem(`plugin:${pluginId}`, data);
}

// ── Global settings ─────────────────────────────────────────────────
const SETTINGS_KEY = "settings";

export function getSettings<T>(fallback: T): T {
  return getItem<T>(SETTINGS_KEY, fallback);
}

export function setSettings<T>(settings: T): void {
  setItem(SETTINGS_KEY, settings);
}

// ── Bulk export / import ────────────────────────────────────────────
export interface StorageSnapshot {
  version: 1;
  exportedAt: string;
  entries: Record<string, unknown>;
}

export function exportAll(): StorageSnapshot {
  const entries: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STORAGE_PREFIX)) {
      try {
        entries[k.slice(STORAGE_PREFIX.length)] = JSON.parse(
          localStorage.getItem(k)!,
        );
      } catch {
        // skip unparseable
      }
    }
  }
  return { version: 1, exportedAt: new Date().toISOString(), entries };
}

export function importAll(snapshot: StorageSnapshot): void {
  for (const [k, v] of Object.entries(snapshot.entries)) {
    setItem(k, v);
  }
}

export function clearAll(): void {
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STORAGE_PREFIX)) toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
}
