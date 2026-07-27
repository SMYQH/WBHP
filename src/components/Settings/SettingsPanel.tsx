import { useState } from "react";
import type { WBHPSettings, ThemeMode, WebDAVConfig } from "../../plugins/types";
import { getBackgroundPlugins, getWidgetPlugins } from "../../plugins/registry";
import { checkWebDAVConnection, backupToWebDAV, restoreFromWebDAV } from "../../services/webdav";
import { exportAll, importAll, clearAll } from "../../services/storage";
import type { StorageSnapshot } from "../../services/storage";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {tab === "general" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Theme</label>
                <div className="flex gap-2">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateSettings({ theme: opt.value })}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        settings.theme === opt.value
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Your Name</label>
                <input
                  type="text"
                  value={settings.userName}
                  onChange={(e) => updateSettings({ userName: e.target.value })}
                  placeholder="Enter your name..."
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                />
              </div>

              {/* Active widgets picker */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Active Widgets (drag to reorder — coming soon)
                </label>
                <div className="space-y-2">
                  {getWidgetPlugins().map((p) => {
                    const isActive = settings.activeWidgets.length === 0
                      ? true // show all by default
                      : settings.activeWidgets.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          // If user has never customized, seed with all widgets
                          const base =
                            settings.activeWidgets.length === 0
                              ? getWidgetPlugins().map((wp) => wp.id)
                              : settings.activeWidgets;
                          const updated = isActive
                            ? base.filter((id) => id !== p.id)
                            : [...base, p.id];
                          updateSettings({ activeWidgets: updated });
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isActive
                            ? "border-blue-400 bg-blue-500/10"
                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{p.name}</span>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isActive ? "border-blue-400 bg-blue-400" : "border-gray-300"
                            }`}
                          >
                            {isActive && <span className="text-white text-[10px]">✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === "background" && (
            <div>
              <label className="block text-sm font-medium mb-2">Background</label>
              <div className="space-y-2">
                {getBackgroundPlugins().map((p) => (
                  <div
                    key={p.id}
                    onClick={() => updateSettings({ activeBackground: p.id })}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      settings.activeBackground === p.id
                        ? "border-blue-400 bg-blue-500/10"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{p.name}</span>
                      <span className="text-xs opacity-60">{p.description}</span>
                    </div>
                  </div>
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

          {tab === "data" && (
            <DataSection />
          )}
        </div>
      </div>
    </div>
  );
}

// ── WebDAV Sub-component ────────────────────────────────────────────

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
  const testConnection = async () => {
    setStatus("Testing...");
    const ok = await checkWebDAVConnection(config);
    setStatus(ok ? "✓ Connected successfully" : "✗ Connection failed");
  };

  const doBackup = async () => {
    setBackupMsg("Backing up...");
    const result = await backupToWebDAV(config);
    setBackupMsg(result.message);
  };

  const doRestore = async () => {
    setBackupMsg("Restoring...");
    const result = await restoreFromWebDAV(config);
    setBackupMsg(result.message);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Enable WebDAV</label>
        <button
          onClick={() => updateConfig({ enabled: !config.enabled })}
          className={`w-10 h-6 rounded-full transition-colors ${
            config.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform m-1 ${
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
            placeholder="WebDAV URL (e.g. https://dav.example.com/)"
            className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
          />
          <input
            type="text"
            value={config.username}
            onChange={(e) => updateConfig({ username: e.target.value })}
            placeholder="Username"
            className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
          />
          <input
            type="password"
            value={config.password}
            onChange={(e) => updateConfig({ password: e.target.value })}
            placeholder="Password"
            className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
          />
          <div>
            <label className="block text-sm font-medium mb-1">
              Auto-backup interval (minutes, 0 = off)
            </label>
            <input
              type="number"
              min={0}
              value={config.autoBackupInterval}
              onChange={(e) =>
                updateConfig({ autoBackupInterval: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={testConnection}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
            >
              Test Connection
            </button>
            <button
              onClick={doBackup}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm"
            >
              Backup Now
            </button>
            <button
              onClick={doRestore}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm"
            >
              Restore
            </button>
          </div>
          {status && <p className="text-sm">{status}</p>}
          {backupMsg && <p className="text-sm">{backupMsg}</p>}
        </>
      )}
    </div>
  );
}

// ── Data Management Sub-component ───────────────────────────────────

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
    input.accept = ".json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const snapshot = JSON.parse(reader.result as string) as StorageSnapshot;
          importAll(snapshot);
          setMsg("Data imported. Refreshing...");
          setTimeout(() => window.location.reload(), 1000);
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
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleExport}
        className="w-full px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm"
      >
        Export Data (JSON)
      </button>
      <button
        onClick={handleImport}
        className="w-full px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm"
      >
        Import Data (JSON)
      </button>
      <button
        onClick={handleClear}
        className="w-full px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm"
      >
        Clear All Data
      </button>
      {msg && <p className="text-sm text-center">{msg}</p>}
    </div>
  );
}
