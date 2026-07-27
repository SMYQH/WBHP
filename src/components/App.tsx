import { useState, useEffect } from "react";
import type { PluginAPI } from "../plugins/types";
import { getPlugin } from "../plugins/registry";
import { useSettings } from "../hooks/useSettings";
import { startAutoBackup, stopAutoBackup } from "../services/webdav";
import Dashboard from "./Dashboard/Dashboard";
import SettingsPanel from "./Settings/SettingsPanel";

import "../plugins/widgets";
import "../plugins/backgrounds";

export default function App() {
  const { settings, updateSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  // ── Theme management ──────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.theme === "dark" ||
      (settings.theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    root.classList.toggle("dark", isDark);

    if (settings.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle("dark", e.matches);
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [settings.theme]);

  // ── WebDAV auto-backup ─────────────────────────────────────────────
  useEffect(() => {
    startAutoBackup(settings.webdav);
    return () => stopAutoBackup();
  }, [settings.webdav]);

  // ── Keyboard shortcut for settings ─────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSettings(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Render active background plugin ────────────────────────────────
  const bgPlugin = getPlugin(settings.activeBackground);
  const BackgroundComponent = bgPlugin?.component;

  return (
    <div className="relative min-h-screen">
      {/* Background layer */}
      {BackgroundComponent && bgPlugin && (
        <BackgroundComponent
          api={
            {
              data: {
                get: () => bgPlugin.defaultData,
                set: () => {},
                subscribe: () => () => {},
              },
              cache: { get: () => ({}), set: () => {} },
              settings,
              updateSettings,
            } satisfies PluginAPI
          }
        />
      )}

      {/* Settings toggle button */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-4 right-4 z-40 w-10 h-10 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur hover:bg-white/30 dark:hover:bg-white/20 transition-colors flex items-center justify-center text-lg"
        title="Settings"
      >
        ⚙
      </button>

      {/* Main dashboard */}
      <Dashboard />

      {/* Settings modal */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          updateSettings={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
