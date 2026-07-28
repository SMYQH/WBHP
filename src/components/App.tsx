import { useState, useEffect, useCallback } from "react";
import { getPlugin } from "../plugins/registry";
import { useSettings } from "../hooks/useSettings";
import { startAutoBackup, stopAutoBackup } from "../services/webdav";
import { startGDriveAutoBackup, stopGDriveAutoBackup } from "../services/gdrive";
import Dashboard from "./Dashboard/Dashboard";
import SettingsPanel from "./Settings/SettingsPanel";
import PluginHost from "./PluginHost";
import ErrorBoundary from "./ErrorBoundary";

import "../plugins/widgets";
import "../plugins/backgrounds";

export default function App() {
  const { settings, updateSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  // ── Theme management ──────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const isDark =
        settings.theme === "dark" ||
        (settings.theme === "system" && mq.matches);
      root.classList.toggle("dark", isDark);
      root.style.colorScheme = isDark ? "dark" : "light";
    };

    apply();

    if (settings.theme !== "system") return;

    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [settings.theme]);

  // ── Font management ───────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute("data-font", settings.fontFamily || "misans");
  }, [settings.fontFamily]);

  // ── Auto-backup ───────────────────────────────────────────────────
  useEffect(() => {
    startAutoBackup(settings.webdav);
    return () => stopAutoBackup();
  }, [settings.webdav]);

  useEffect(() => {
    startGDriveAutoBackup(settings.gdrive);
    return () => stopGDriveAutoBackup();
  }, [settings.gdrive]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSettings(false);
        return;
      }
      // Ctrl/Cmd + , → settings (common desktop convention)
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        setShowSettings(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const bgPlugin = getPlugin(settings.activeBackground);

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-gray-100">
      {/* Background layer */}
      {bgPlugin && bgPlugin.type === "background" && (
        <ErrorBoundary fallbackLabel={`Background: ${bgPlugin.name}`}>
          <PluginHost
            plugin={bgPlugin}
            settings={settings}
            updateSettings={updateSettings}
          />
        </ErrorBoundary>
      )}

      {/* Settings toggle */}
      <button
        type="button"
        onClick={openSettings}
        className="fixed top-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg backdrop-blur transition-colors hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20"
        title="Settings (Ctrl+,)"
        aria-label="Open settings"
      >
        ⚙
      </button>

      <Dashboard />

      {showSettings && (
        <SettingsPanel
          settings={settings}
          updateSettings={updateSettings}
          onClose={closeSettings}
        />
      )}
    </div>
  );
}
