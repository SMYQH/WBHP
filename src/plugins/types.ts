import type { ComponentType } from "react";

// ── Plugin Data & Cache ────────────────────────────────────────────
/** Per-plugin typed data store (persisted to localStorage). */
export interface PluginDataStore<D = Record<string, unknown>> {
  get(): D;
  set(updater: D | ((prev: D) => D)): void;
  subscribe(listener: () => void): () => void;
}

/** Per-plugin ephemeral cache (not persisted). */
export interface PluginCacheStore<C = Record<string, unknown>> {
  get(): C;
  set(updater: C | ((prev: C) => C)): void;
  subscribe(listener: () => void): () => void;
}

// ── Plugin API ─────────────────────────────────────────────────────
/** The API surface exposed to every plugin component. */
export interface PluginAPI<
  D = Record<string, unknown>,
  C = Record<string, unknown>,
> {
  /** Persisted data store scoped to this plugin. */
  data: PluginDataStore<D>;
  /** Ephemeral cache scoped to this plugin. */
  cache: PluginCacheStore<C>;
  /** Global settings (read-only snapshot). */
  settings: WBHPSettings;
  /** Update global settings. */
  updateSettings: (patch: Partial<WBHPSettings>) => void;
}

// ── Plugin Registration ────────────────────────────────────────────
/** Descriptor for a single plugin. */
export interface PluginConfig<
  D = Record<string, unknown>,
  C = Record<string, unknown>,
> {
  /** Unique plugin id (e.g. "time", "unsplash"). */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Short description. */
  description: string;
  /** Category: "widget" or "background". */
  type: "widget" | "background";
  /** React component rendered for this plugin. */
  component: ComponentType<{ api: PluginAPI<D, C> }>;
  /** Default persisted data. */
  defaultData: D;
  /** Default cache values. */
  defaultCache?: C;
  /** Default dimensions hint (widgets only). */
  defaultSize?: { width: number; height: number };
}

// ── Widget / Background references ─────────────────────────────────
/** Reference to a widget placed on the dashboard. */
export interface DashboardWidget {
  pluginId: string;
  /** Display order (lower = first). */
  order: number;
  /** User-configured overrides merged into the plugin's data. */
  configOverrides?: Record<string, unknown>;
}

// ── Settings ───────────────────────────────────────────────────────
export type ThemeMode = "system" | "light" | "dark";
export type LanguageMode = "auto" | "zh" | "en";
export type FontFamily = "misans" | "serif" | "opensans" | "system";

export interface WebDAVConfig {
  enabled: boolean;
  url: string;
  username: string;
  password: string;
  /** Auto-backup interval in minutes (0 = disabled). */
  autoBackupInterval: number;
}

export interface UpdateSettings {
  /** Periodically check GitHub Releases for a newer version. */
  autoCheck: boolean;
  /** When a newer version is found, automatically download the install package. */
  autoDownload: boolean;
}

export interface WBHPSettings {
  theme: ThemeMode;
  language: LanguageMode;
  fontFamily: FontFamily;
  /** Ids of plugins the user has chosen as active widgets (in order). */
  activeWidgets: string[];
  /** Id of the active background plugin. */
  activeBackground: string;
  webdav: WebDAVConfig;
  /** User's display name for the greeting widget. */
  userName: string;
  /** In-app update preferences (GitHub Releases + browser update_url). */
  update: UpdateSettings;
}

