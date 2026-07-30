import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { X, Cloud, HardDrive, Sparkles, Zap, Check, ExternalLink } from "lucide-react";
import type { WBHPSettings, ThemeMode, LanguageMode, FontFamily, WebDAVConfig } from "../../plugins/types";
import { getBackgroundPlugins, getWidgetPlugins } from "../../plugins/registry";
import { checkWebDAVConnection, backupToWebDAV, restoreFromWebDAV } from "../../services/webdav";
import { exportAll, importAll, clearAll, getItem, setItem } from "../../services/storage";
import type { StorageSnapshot } from "../../services/storage";
import type { CustomBackgroundData } from "../../plugins/backgrounds/custom";
import type { PresetBackgroundData, PresetStyle } from "../../plugins/backgrounds/preset";
import { getTranslations } from "../../i18n";
import PluginCard from "../ui/PluginCard";
import { checkForUpdates, triggerAutoDownload, type UpdateCheckResult } from "../../services/updater";

interface SettingsPanelProps {
  settings: WBHPSettings;
  updateSettings: (patch: Partial<WBHPSettings>) => void;
  onClose: () => void;
}

type Tab = "general" | "background" | "data";

export default function SettingsPanel({ settings, updateSettings, onClose }: SettingsPanelProps) {
  const [tab, setTab] = useState<Tab>("general");
  const [webdavStatus, setWebdavStatus] = useState<string | null>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const t = getTranslations(settings.language);

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: t.settings.tabs.general },
    { id: "background", label: t.settings.tabs.background },
    { id: "data", label: t.settings.tabs.data },
  ];

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: "system", label: t.settings.general.themeOptions.system },
    { value: "light", label: t.settings.general.themeOptions.light },
    { value: "dark", label: t.settings.general.themeOptions.dark },
  ];

  const languageOptions: { value: LanguageMode; label: string }[] = [
    { value: "auto", label: t.settings.general.languageOptions.auto },
    { value: "zh", label: t.settings.general.languageOptions.zh },
    { value: "en", label: t.settings.general.languageOptions.en },
  ];

  const fontOptions: { value: FontFamily; label: string }[] = [
    { value: "misans", label: t.settings.general.fontOptions.misans },
    { value: "serif", label: t.settings.general.fontOptions.serif },
    { value: "opensans", label: t.settings.general.fontOptions.opensans },
    { value: "system", label: t.settings.general.fontOptions.system },
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
        className="m-4 flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl animate-scale-in dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 id={titleId} className="text-lg font-semibold">
            {t.settings.title}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label={t.settings.close}
          >
            <X className="w-4 h-4 opacity-70" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 px-6 dark:border-gray-800" role="tablist" aria-label="Settings sections">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.id}
              type="button"
              role="tab"
              aria-selected={tab === tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === tabItem.id
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5" role="tabpanel">
          {tab === "general" && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium">{t.settings.general.theme}</label>
                <div className="flex gap-2" role="group" aria-label={t.settings.general.theme}>
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSettings({ theme: opt.value })}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
                        settings.theme === opt.value
                          ? "bg-blue-500 font-medium text-white shadow-sm"
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
                <label className="mb-2 block text-sm font-medium">{t.settings.general.language}</label>
                <div className="flex gap-2" role="group" aria-label={t.settings.general.language}>
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSettings({ language: opt.value })}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
                        settings.language === opt.value
                          ? "bg-blue-500 font-medium text-white shadow-sm"
                          : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                      }`}
                      aria-pressed={settings.language === opt.value}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">{t.settings.general.font}</label>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label={t.settings.general.font}>
                  {fontOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSettings({ fontFamily: opt.value })}
                      className={`rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                        settings.fontFamily === opt.value
                          ? "bg-blue-500 font-medium text-white shadow-sm"
                          : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                      }`}
                      aria-pressed={settings.fontFamily === opt.value}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="wbhp-user-name" className="mb-1.5 block text-sm font-medium">
                  {t.settings.general.userName}
                </label>
                <input
                  id="wbhp-user-name"
                  type="text"
                  value={settings.userName}
                  onChange={(e) => updateSettings({ userName: e.target.value })}
                  placeholder={t.settings.general.userNamePlaceholder}
                  className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                  autoComplete="nickname"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">{t.settings.general.activeWidgets}</label>
                <p className="mb-2.5 text-xs opacity-60">
                  {t.settings.general.activeWidgetsHelp}
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
                        language={settings.language}
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

              <UpdateSection
                language={settings.language}
                autoCheck={settings.update?.autoCheck !== false}
                autoDownload={settings.update?.autoDownload === true}
                onChange={(patch) =>
                  updateSettings({
                    update: {
                      autoCheck: settings.update?.autoCheck !== false,
                      autoDownload: settings.update?.autoDownload === true,
                      ...patch,
                    },
                  })
                }
              />
            </>
          )}

          {tab === "background" && (
            <BackgroundSettingsSection settings={settings} updateSettings={updateSettings} />
          )}

          {tab === "data" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 border-b border-gray-200 pb-2 dark:border-gray-800">
                  <Cloud className="w-4 h-4 text-blue-500 shrink-0" /> {t.settings.backup.webdavTitle}
                </h3>
                <WebDAVSection
                  config={settings.webdav}
                  language={settings.language}
                  updateConfig={(patch) =>
                    updateSettings({ webdav: { ...settings.webdav, ...patch } })
                  }
                  status={webdavStatus}
                  setStatus={setWebdavStatus}
                  backupMsg={backupMsg}
                  setBackupMsg={setBackupMsg}
                />
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 border-b border-gray-200 pb-2 dark:border-gray-800">
                  <HardDrive className="w-4 h-4 text-emerald-500 shrink-0" /> {t.settings.data.localBackupTitle}
                </h3>
                <DataSection language={settings.language} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BackgroundSettingsSection({
  settings,
  updateSettings,
}: {
  settings: WBHPSettings;
  updateSettings: (patch: Partial<WBHPSettings>) => void;
}) {
  const t = getTranslations(settings.language);
  const activeBg = settings.activeBackground;

  // Custom background data local state
  const customDataKey = "plugin:custom";
  const defaultCustomData: CustomBackgroundData = {
    imageUrl: "",
    blur: 0,
    overlayOpacity: 30,
  };
  const [customData, setCustomData] = useState<CustomBackgroundData>(() =>
    getItem<CustomBackgroundData>(customDataKey, defaultCustomData),
  );

  const updateCustomData = (patch: Partial<CustomBackgroundData>) => {
    const next = { ...customData, ...patch };
    setCustomData(next);
    setItem(customDataKey, next);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        updateCustomData({ imageUrl: result });
      }
    };
    reader.readAsDataURL(file);
  };

  // Preset background data local state
  const presetDataKey = "plugin:preset";
  const defaultPresetData: PresetBackgroundData = { style: "aurora" };
  const [presetData, setPresetData] = useState<PresetBackgroundData>(() =>
    getItem<PresetBackgroundData>(presetDataKey, defaultPresetData),
  );

  const updatePresetData = (style: PresetStyle) => {
    const next = { style };
    setPresetData(next);
    setItem(presetDataKey, next);
  };

  return (
    <div className="space-y-4">
      <label className="mb-2 block text-sm font-medium">{t.settings.background.title}</label>
      <div className="space-y-2">
        {getBackgroundPlugins().map((p) => (
          <PluginCard
            key={p.id}
            plugin={p}
            isActive={activeBg === p.id}
            language={settings.language}
            onToggle={() => updateSettings({ activeBackground: p.id })}
          />
        ))}
      </div>

      {activeBg === "custom" && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-4 dark:border-gray-800 dark:bg-gray-800/40">
          <h4 className="text-sm font-semibold">{t.settings.background.custom}</h4>
          
          <div>
            <label className="mb-1 block text-xs font-medium opacity-80">
              {t.settings.background.customUpload}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium opacity-80">
              {t.settings.background.customUrl}
            </label>
            <input
              type="url"
              value={customData.imageUrl}
              onChange={(e) => updateCustomData({ imageUrl: e.target.value })}
              placeholder="https://example.com/wallpaper.jpg"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>{t.settings.background.blur}</span>
              <span>{customData.blur}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={customData.blur}
              onChange={(e) => updateCustomData({ blur: parseInt(e.target.value, 10) || 0 })}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>{t.settings.background.overlay}</span>
              <span>{customData.overlayOpacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              value={customData.overlayOpacity}
              onChange={(e) =>
                updateCustomData({ overlayOpacity: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      )}

      {activeBg === "preset" && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3 dark:border-gray-800 dark:bg-gray-800/40">
          <h4 className="text-sm font-semibold">{t.settings.background.presetStyle}</h4>
          <div className="grid grid-cols-2 gap-2">
            {(["aurora", "cosmic", "mesh", "emerald", "sunset"] as PresetStyle[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => updatePresetData(st)}
                className={`rounded-lg px-3 py-2 text-xs capitalize transition-colors ${
                  presetData.style === st
                    ? "bg-blue-500 font-medium text-white shadow-sm"
                    : "bg-white hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



function WebDAVSection({
  config,
  language,
  updateConfig,
  status,
  setStatus,
  backupMsg,
  setBackupMsg,
}: {
  config: WebDAVConfig;
  language: LanguageMode;
  updateConfig: (patch: Partial<WebDAVConfig>) => void;
  status: string | null;
  setStatus: (s: string | null) => void;
  backupMsg: string | null;
  setBackupMsg: (s: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const t = getTranslations(language).settings.backup;

  const testConnection = async () => {
    setBusy(true);
    setStatus(t.testing);
    try {
      const ok = await checkWebDAVConnection(config);
      setStatus(ok ? t.connected : t.failed);
    } finally {
      setBusy(false);
    }
  };

  const doBackup = async () => {
    setBusy(true);
    setBackupMsg(t.backingUp);
    try {
      const result = await backupToWebDAV(config);
      setBackupMsg(result.success ? t.backupSuccess : t.backupFailed);
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    if (!confirm(t.restoreConfirm)) return;
    setBusy(true);
    setBackupMsg(t.restoring);
    try {
      const result = await restoreFromWebDAV(config);
      setBackupMsg(result.success ? t.restoreSuccess : t.restoreFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" htmlFor="wbhp-webdav-toggle">
          {t.enableWebdav}
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
            placeholder={t.urlPlaceholder}
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            autoComplete="url"
          />
          <input
            type="text"
            value={config.username}
            onChange={(e) => updateConfig({ username: e.target.value })}
            placeholder={t.usernamePlaceholder}
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            autoComplete="username"
          />
          <input
            type="password"
            value={config.password}
            onChange={(e) => updateConfig({ password: e.target.value })}
            placeholder={t.passwordPlaceholder}
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            autoComplete="current-password"
          />
          <div>
            <label className="mb-1 block text-xs font-medium" htmlFor="wbhp-autobackup">
              {t.autoInterval}
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

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={testConnection}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              {t.testBtn}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={doBackup}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {t.backupBtn}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={doRestore}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {t.restoreBtn}
            </button>
          </div>
          {status && <p className="text-sm font-medium" role="status">{status}</p>}
          {backupMsg && <p className="text-sm font-medium" role="status">{backupMsg}</p>}
          <p className="text-xs opacity-60">
            {t.notice}
          </p>
        </>
      )}
    </div>
  );
}

function DataSection({ language }: { language: LanguageMode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const t = getTranslations(language).settings.data;

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
    setMsg(t.exported);
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
          setMsg(t.imported);
          setTimeout(() => window.location.reload(), 800);
        } catch {
          setMsg(t.invalid);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClear = () => {
    if (confirm(t.clearConfirm)) {
      clearAll();
      setMsg(t.cleared);
      setTimeout(() => window.location.reload(), 800);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleExport}
        className="w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-600 shadow-sm"
      >
        {t.exportBtn}
      </button>
      <button
        type="button"
        onClick={handleImport}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 shadow-sm"
      >
        {t.importBtn}
      </button>
      <button
        type="button"
        onClick={handleClear}
        className="w-full rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700 shadow-sm"
      >
        {t.clearBtn}
      </button>
      {msg && (
        <p className="text-center text-sm font-medium" role="status">
          {msg}
        </p>
      )}
    </div>
  );
}

function UpdateSection({
  language,
  autoCheck,
  autoDownload,
  onChange,
}: {
  language: LanguageMode;
  autoCheck: boolean;
  autoDownload: boolean;
  onChange: (patch: { autoCheck?: boolean; autoDownload?: boolean }) => void;
}) {
  const t = getTranslations(language).updater;
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<UpdateCheckResult | null>(null);

  const currentVer = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.4.1";

  const handleCheck = async () => {
    setChecking(true);
    setResult(null);
    try {
      const res = await checkForUpdates(currentVer);
      setResult(res);
    } finally {
      setChecking(false);
    }
  };

  const handleDownload = (url?: string) => {
    if (!url) return;
    triggerAutoDownload(url);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/40 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" /> WBHP v{currentVer}
          </h4>
          <p className="text-xs opacity-60">Web Browser Home Page</p>
        </div>
        <button
          type="button"
          disabled={checking}
          onClick={handleCheck}
          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {checking ? t.checking : t.checkUpdateBtn}
        </button>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-white/70 p-3 dark:bg-gray-900/40">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={autoCheck}
          onChange={(e) => onChange({ autoCheck: e.target.checked })}
        />
        <span>
          <span className="block text-sm font-medium">{t.autoCheck}</span>
          <span className="block text-xs opacity-60">{t.autoCheckHelp}</span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-white/70 p-3 dark:bg-gray-900/40">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={autoDownload}
          disabled={!autoCheck}
          onChange={(e) => onChange({ autoDownload: e.target.checked })}
        />
        <span>
          <span className="block text-sm font-medium">{t.autoDownload}</span>
          <span className="block text-xs opacity-60">{t.autoDownloadHelp}</span>
        </span>
      </label>

      {result && (
        <div className="pt-2 border-t border-gray-200/50 text-xs dark:border-gray-700/50">
          {result.hasUpdate ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> {t.updateAvailable}: v{result.latestVersion}
                </span>
                <a
                  href={result.releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-emerald-700 opacity-80 hover:opacity-100 flex items-center gap-1"
                >
                  {t.downloadUpdate} <ExternalLink className="w-3 h-3 inline" />
                </a>
              </div>
              {(result.downloadZipUrl || result.downloadUrl) && (
                <button
                  type="button"
                  onClick={() => handleDownload(result.downloadZipUrl || result.downloadUrl)}
                  className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{t.autoDownloadBtn} (v{result.latestVersion})</span>
                </button>
              )}
            </div>
          ) : result.error ? (
            <span className="text-rose-500">{t.failed}: {result.error}</span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              {t.upToDate} (v{currentVer})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

