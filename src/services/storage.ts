const STORAGE_PREFIX = "wbhp:";

function key(name: string): string {
  return `${STORAGE_PREFIX}${name}`;
}

// ── In-memory cache (stable snapshots for useSyncExternalStore) ─────
const memoryCache = new Map<string, unknown>();

// ── Subscription bus ────────────────────────────────────────────────
type Listener = () => void;
const keyListeners = new Map<string, Set<Listener>>();
const globalListeners = new Set<Listener>();

function notify(storageKey: string): void {
  keyListeners.get(storageKey)?.forEach((l) => l());
  globalListeners.forEach((l) => l());
}

/** Subscribe to a specific logical key (without prefix). */
export function subscribeKey(storageKey: string, listener: Listener): () => void {
  if (!keyListeners.has(storageKey)) keyListeners.set(storageKey, new Set());
  const set = keyListeners.get(storageKey)!;
  set.add(listener);
  return () => {
    set.delete(listener);
    if (set.size === 0) keyListeners.delete(storageKey);
  };
}

/** Subscribe to any storage mutation. */
export function subscribeAll(listener: Listener): () => void {
  globalListeners.add(listener);
  return () => globalListeners.delete(listener);
}

/** Drop a key from the memory cache (does not touch localStorage). */
export function invalidate(storageKey: string): void {
  memoryCache.delete(storageKey);
}

/** Drop the entire memory cache. */
export function invalidateAll(): void {
  memoryCache.clear();
}

function extensionStorage(): ChromeStorageArea | null {
  try {
    // Prefer the extension storage API when available (MV3 best practice).
    // Falls back to localStorage for plain web preview (`vite` / `preview`).
    const api = globalThis.chrome ?? (typeof window !== "undefined" ? window.chrome : undefined);
    if (api?.storage?.local) return api.storage.local;
  } catch {
    // ignore
  }
  return null;
}

// ── Cross-tab / cross-context sync ──────────────────────────────────
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (!e.key || !e.key.startsWith(STORAGE_PREFIX)) return;
    const logical = e.key.slice(STORAGE_PREFIX.length);
    memoryCache.delete(logical);
    notify(logical);
  });

  try {
    const api = globalThis.chrome ?? window.chrome;
    api?.storage?.onChanged?.addListener((changes, area) => {
      if (area !== "local") return;
      for (const k of Object.keys(changes)) {
        if (!k.startsWith(STORAGE_PREFIX)) continue;
        const logical = k.slice(STORAGE_PREFIX.length);
        memoryCache.delete(logical);
        notify(logical);
      }
    });
  } catch {
    // ignore when chrome is unavailable
  }
}

// ── Generic localStorage helpers ────────────────────────────────────
export function getItem<T>(storageKey: string, fallback: T): T {
  if (memoryCache.has(storageKey)) {
    return memoryCache.get(storageKey) as T;
  }
  try {
    const raw = localStorage.getItem(key(storageKey));
    if (raw === null) {
      memoryCache.set(storageKey, fallback);
      return fallback;
    }
    const parsed = JSON.parse(raw) as T;
    memoryCache.set(storageKey, parsed);
    return parsed;
  } catch {
    memoryCache.set(storageKey, fallback);
    return fallback;
  }
}

export function setItem<T>(storageKey: string, value: T): void {
  // Keep a stable reference for useSyncExternalStore: only replace when
  // the serialized payload actually changes.
  const prev = memoryCache.get(storageKey);
  if (prev !== undefined) {
    try {
      if (JSON.stringify(prev) === JSON.stringify(value)) {
        // Still ensure localStorage is warm, but skip notify to avoid loops.
        return;
      }
    } catch {
      // fall through and write
    }
  }

  memoryCache.set(storageKey, value);
  const serialized = JSON.stringify(value);
  try {
    localStorage.setItem(key(storageKey), serialized);
  } catch {
    console.warn(`Failed to write localStorage key "${storageKey}".`);
  }

  // Best-effort mirror into chrome.storage.local for extension contexts.
  const ext = extensionStorage();
  if (ext) {
    void ext.set({ [key(storageKey)]: value }).catch(() => {
      /* ignore quota / permission errors */
    });
  }

  notify(storageKey);
}

export function removeItem(storageKey: string): void {
  memoryCache.delete(storageKey);
  try {
    localStorage.removeItem(key(storageKey));
  } catch {
    /* ignore */
  }
  const ext = extensionStorage();
  if (ext) {
    void ext.remove(key(storageKey)).catch(() => {});
  }
  notify(storageKey);
}

// ── Plugin-scoped data ──────────────────────────────────────────────
export function getPluginData<D>(pluginId: string, fallback: D): D {
  return getItem<D>(`plugin:${pluginId}`, fallback);
}

export function setPluginData<D>(pluginId: string, data: D): void {
  setItem(`plugin:${pluginId}`, data);
}

export function subscribePluginData(
  pluginId: string,
  listener: Listener,
): () => void {
  return subscribeKey(`plugin:${pluginId}`, listener);
}

// ── Global settings ─────────────────────────────────────────────────
const SETTINGS_KEY = "settings";

export function getSettings<T>(fallback: T): T {
  return getItem<T>(SETTINGS_KEY, fallback);
}

export function setSettings<T>(settings: T): void {
  setItem(SETTINGS_KEY, settings);
}

export function subscribeSettings(listener: Listener): () => void {
  return subscribeKey(SETTINGS_KEY, listener);
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
  if (!snapshot || snapshot.version !== 1 || !snapshot.entries) {
    throw new Error("Invalid backup snapshot.");
  }
  invalidateAll();
  for (const [k, v] of Object.entries(snapshot.entries)) {
    memoryCache.set(k, v);
    try {
      localStorage.setItem(key(k), JSON.stringify(v));
    } catch {
      console.warn(`Failed to import key "${k}".`);
    }
    const ext = extensionStorage();
    if (ext) {
      void ext.set({ [key(k)]: v }).catch(() => {});
    }
  }
  for (const k of Object.keys(snapshot.entries)) notify(k);
  globalListeners.forEach((l) => l());
}

export function clearAll(): void {
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STORAGE_PREFIX)) toRemove.push(k);
  }
  invalidateAll();
  toRemove.forEach((k) => localStorage.removeItem(k));
  const ext = extensionStorage();
  if (ext) {
    void ext.remove(toRemove).catch(() => {});
  }
  for (const set of keyListeners.values()) set.forEach((l) => l());
  globalListeners.forEach((l) => l());
}
