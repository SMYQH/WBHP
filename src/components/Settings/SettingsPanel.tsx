import { useEffect, useId, useRef, useState } from "react";
import type { WBHPSettings, ThemeMode, WebDAVConfig } from "../../plugins/types";
import { getBackgroundPlugins, getWidgetPlugins } from "../../plugins/registry";
import { checkWebDAVConnection, backupToWebDAV, restoreFromWebDAV } from "../../services/webdav";
import { exportAll, importAll, clearAll } from "../../services/storage";
import type { StorageSnapshot } from "../../services/storage";
import PluginCard from "../ui/PluginCard";

interface SettingsPanelProps {
  settings: WBHPSettings;
  updateSettings: (patch: Partial<WBHPSettings>) => void;
  onClose: () => void;
}

type Tab = "general" | "background" | "backup" | "data";

export default function SettingsPanel({ settings, updateSettings, onClose }: SettingsPanelProps) {
  const [tab, setTab] = useState<Tab>("general");
  const [webdavStatus, setWebdavStatus] = useState<string | null>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "background", label: "Background" },
    { id: "backup", label: "Backup" },
    { id: "data", label: "Data" },
  ];

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: "system", label: "System" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];

  useEffect(() => {
    closeBtnRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="m-4 flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl animate-scale-in dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 id={titleId} className="text-lg font-semibold">
            Settings
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="flex border-b border-gray-200 px-6 dark:border-gray-700" role="tablist" aria-label="Settings sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4" role="tabpanel">
          {tab === "general" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Theme</label>
                <div className="flex gap-2" role="group" aria-label="Theme">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSettings({ theme: opt.value })}
                      className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                        settings.theme === opt.value
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                      }`}
                      aria-pressed={settings.theme === opt.value}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="wbhp-user-name" className="mb-1 block text-sm font-medium">
                  Your Name
                </label>
                <input
                  id="wbhp-user-name"
                  type="text"
                  value={settings.userName}
                  onChange={(e) => updateSettings({ userName: e.target.value })}
                  placeholder="Enter your name..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  autoComplete="nickname"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Active Widgets</label>
                <p className="mb-2 text-xs opacity-60">
                  Empty selection shows all widgets. Click to toggle.
                </p>
                <div className="space-y-2">
                  {getWidgetPlugins().map((p) => {
                    const isActive =
                      settings.activeWidgets.length === 0
                        ? true
                        : settings.activeWidgets.includes(p.id);
                    return (
                      <PluginCard
                        key={p.id}
                        plugin={p}
                        isActive={isActive}
                        onToggle={() => {
                          const base =
                            settings.activeWidgets.length === 0
                              ? getWidgetPlugins().map((wp) => wp.id)
                              : settings.activeWidgets;
                          const updated = isActive
                            ? base.filter((id) => id !== p.id)
                            : [...base, p.id];
                          updateSettings({ activeWidgets: updated });
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === "background" && (
            <div>
              <label className="mb-2 block text-sm font-medium">Background</label>
              <div className="space-y-2">
                {getBackgroundPlugins().map((p) => (
                  <PluginCard
                    key={p.id}
                    plugin={p}
                    isActive={settings.activeBackground === p.id}
                    onToggle={() => updateSettings({ activeBackground: p.id })}
                  />
                ))}
              </div>
            </div>
          )}

          {tab === "backup" && (
            <WebDAVSection
              config={settings.webdav}
              updateConfig={(patch) =>
                updateSettings({ webdav: { ...settings.webdav, ...patch } })
              }
              status={webdavStatus}
              setStatus={setWebdavStatus}
              backupMsg={backupMsg}
              setBackupMsg={setBackupMsg}
            />
          )}

          {tab === "data" && <DataSection />}
        </div>
      </div>
    </div>
  );
}

function WebDAVSection({
  config,
  updateConfig,
  status,
  setStatus,
  backupMsg,
  setBackupMsg,
}: {
  config: WebDAVConfig;
  updateConfig: (patch: Partial<WebDAVConfig>) => void;
  status: string | null;
  setStatus: (s: string | null) => void;
  backupMsg: string | null;
  setBackupMsg: (s: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);

  const testConnection = async () => {
    setBusy(true);
    setStatus("Testing...");
    try {
      const ok = await checkWebDAVConnection(config);
      setStatus(ok ? "✓ Connected successfully" : "✗ Connection failed");
    } finally {
      setBusy(false);
    }
  };

  const doBackup = async () => {
    setBusy(true);
    setBackupMsg("Backing up...");
    try {
      const result = await backupToWebDAV(config);
      setBackupMsg(result.message);
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    if (!confirm("Restore will overwrite local WBHP data. Continue?")) return;
    setBusy(true);
    setBackupMsg("Restoring...");
    try {
      const result = await restoreFromWebDAV(config);
      setBackupMsg(result.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" htmlFor="wbhp-webdav-toggle">
          Enable WebDAV
        </label>
        <button
          id="wbhp-webdav-toggle"
          type="button"
          role="switch"
          aria-checked={config.enabled}
          onClick={() => updateConfig({ enabled: !config.enabled })}
          className={`h-6 w-10 rounded-full transition-colors ${
            config.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <div
            className={`m-1 h-4 w-4 rounded-full bg-white transition-transform ${
              config.enabled ? "translate-x-4" : ""
            }`}
          />
        </button>
      </div>

      {config.enabled && (
        <>
          <input
            type="url"
            value={config.url}
            onChange={(e) => updateConfig({ url: e.target.value })}
            placeholder="WebDAV URL (e.g. https://dav.example.com/remote.php/dav/files/user/)"
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            autoComplete="url"
          />
          <input
            type="text"
            value={config.username}
            onChange={(e) => updateConfig({ username: e.target.value })}
            placeholder="Username"
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            autoComplete="username"
          />
          <input
            type="password"
            value={config.password}
            onChange={(e) => updateConfig({ password: e.target.value })}
            placeholder="Password / app token"
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            autoComplete="current-password"
          />
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="wbhp-autobackup">
              Auto-backup interval (minutes, 0 = off)
            </label>
            <input
              id="wbhp-autobackup"
              type="number"
              min={0}
              value={config.autoBackupInterval}
              onChange={(e) =>
                updateConfig({ autoBackupInterval: Math.max(0, parseInt(e.target.value, 10) || 0) })
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={testConnection}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Test Connection
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={doBackup}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
            >
              Backup Now
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={doRestore}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm text-white hover:bg-amber-600 disabled:opacity-50"
            >
              Restore
            </button>
          </div>
          {status && <p className="text-sm" role="status">{status}</p>}
          {backupMsg && <p className="text-sm" role="status">{backupMsg}</p>}
          <p className="text-xs opacity-60">
            Credentials are stored locally in this browser profile. Prefer app passwords / tokens.
          </p>
        </>
      )}
    </div>
  );
}

function DataSection() {
  const [msg, setMsg] = useState<string | null>(null);

  const handleExport = () => {
    const snapshot = exportAll();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wbhp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Data exported.");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const snapshot = JSON.parse(reader.result as string) as StorageSnapshot;
          importAll(snapshot);
          setMsg("Data imported. Refreshing...");
          setTimeout(() => window.location.reload(), 800);
        } catch {
          setMsg("Invalid backup file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClear = () => {
    if (confirm("Are you sure? This will delete all WBHP data.")) {
      clearAll();
      setMsg("All data cleared. Refreshing...");
      setTimeout(() => window.location.reload(), 800);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleExport}
        className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
      >
        Export Data (JSON)
      </button>
      <button
        type="button"
        onClick={handleImport}
        className="w-full rounded-lg bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600"
      >
        Import Data (JSON)
      </button>
      <button
        type="button"
        onClick={handleClear}
        className="w-full rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
      >
        Clear All Data
      </button>
      {msg && (
        <p className="text-center text-sm" role="status">
          {msg}
        </p>
      )}
    </div>
  );
}
