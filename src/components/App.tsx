import { useState, useEffect, useCallback } from "react";
import { getPlugin } from "../plugins/registry";
import { useSettings } from "../hooks/useSettings";
import { startAutoBackup, stopAutoBackup } from "../services/webdav";
import Dashboard from "./Dashboard/Dashboard";
import SettingsPanel from "./Settings/SettingsPanel";
import CommandPalette from "./CommandPalette/CommandPalette";
import PluginHost from "./PluginHost";
import ErrorBoundary from "./ErrorBoundary";
import { getTranslations } from "../i18n";

import "../plugins/widgets";
import "../plugins/backgrounds";

export default function App() {
  const { settings, updateSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);
  const toggleZen = useCallback(() => setIsZenMode((prev) => !prev), []);

  const t = getTranslations(settings.language);

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



  // ── Keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Avoid shortcuts if active element is input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isEditing = targetTag === "input" || targetTag === "textarea" || targetTag === "select" || (e.target as HTMLElement)?.isContentEditable;

      if (e.key === "Escape") {
        if (showSettings) setShowSettings(false);
        if (showPalette) setShowPalette(false);
        if (isZenMode) setIsZenMode(false);
        return;
      }

      // Ctrl/Cmd + K or '/' → Command Palette
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (!isEditing && e.key === "/")) {
        e.preventDefault();
        setShowPalette((prev) => !prev);
        return;
      }

      // Ctrl/Cmd + , → settings
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        setShowSettings(true);
        return;
      }

      // 'z' or 'Z' → Zen Mode (when not typing in an input)
      if (!isEditing && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSettings, showPalette, isZenMode]);

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

      {/* Top right floating toolbar */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowPalette(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm backdrop-blur transition-all hover:bg-white/30 hover:scale-105 dark:bg-white/10 dark:hover:bg-white/20 shadow-sm"
          title="Command Palette (Ctrl+K or /)"
          aria-label="Open Command Palette"
        >
          🔍
        </button>

        <button
          type="button"
          onClick={toggleZen}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm backdrop-blur transition-all hover:scale-105 shadow-sm ${
            isZenMode
              ? "bg-blue-500 text-white font-bold ring-2 ring-blue-300"
              : "bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20"
          }`}
          title={isZenMode ? t.zenMode.exit : t.zenMode.enter}
          aria-label="Toggle Zen Mode"
        >
          🧘
        </button>

        <button
          type="button"
          onClick={openSettings}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg backdrop-blur transition-all hover:bg-white/30 hover:scale-105 dark:bg-white/10 dark:hover:bg-white/20 shadow-sm"
          title="Settings (Ctrl+,)"
          aria-label="Open settings"
        >
          ⚙
        </button>
      </div>

      <Dashboard isZenMode={isZenMode} />

      <CommandPalette
        settings={settings}
        updateSettings={updateSettings}
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
        onOpenSettings={openSettings}
        onToggleZen={toggleZen}
        isZenMode={isZenMode}
      />

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
