import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { X, Cloud, HardDrive, Sparkles, Zap, Check, ExternalLink, Globe, Sliders, Palette, Database } from "lucide-react";
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
  const [tavilyKey, setTavilyKey] = useState(() => localStorage.getItem("wbhp_tavily_key") || "");
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const t = getTranslations(settings.language);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: t.settings.tabs.general, icon: <Sliders className="w-4 h-4" /> },
    { id: "background", label: t.settings.tabs.background, icon: <Palette className="w-4 h-4" /> },
    { id: "data", label: t.settings.tabs.data, icon: <Database className="w-4 h-4" /> },
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md animate-fade-in p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[88vh] w-full max-w-xl flex-col rounded-2xl border border-slate-200/80 bg-white/95 text-slate-900 shadow-2xl backdrop-blur-2xl animate-scale-in dark:bg-slate-950/90 dark:text-slate-100 dark:border-cyan-500/40 dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:bg-cyan-500/20 dark:border-cyan-400/30 dark:text-cyan-300">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 id={titleId} className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-wide">
              {t.settings.title}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label={t.settings.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Glass Segmented Tabs */}
        <div className="px-6 pt-4">
          <div className="flex rounded-xl bg-slate-100/80 dark:bg-slate-900/60 p-1 border border-slate-200/80 dark:border-white/10" role="tablist" aria-label={t.settings.tabsAria}>
            {tabs.map((tabItem) => {
              const isSelected = tab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setTab(tabItem.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    isSelected
                      ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-800 dark:bg-cyan-500/25 dark:border-cyan-400/50 dark:text-cyan-200 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className={isSelected ? "text-cyan-600 dark:text-cyan-300" : "text-slate-400"}>{tabItem.icon}</span>
                  <span>{tabItem.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Panel Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5" role="tabpanel">
          {tab === "general" && (
            <>
              {/* Theme Selector */}
              <div>
                <label className="mb-2 block text-xs font-mono font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300/80">
                  {t.settings.general.theme}
                </label>
                <div className="flex gap-2" role="group" aria-label={t.settings.general.theme}>
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSettings({ theme: opt.value })}
                      className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150 border focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        settings.theme === opt.value
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-900 font-bold dark:bg-cyan-500/25 dark:border-cyan-400 dark:text-cyan-200 shadow-sm"
                          : "bg-slate-100/80 border-slate-200/80 text-slate-700 hover:border-slate-300 hover:text-slate-900 dark:bg-slate-900/60 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
                      }`}
                      aria-pressed={settings.theme === opt.value}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selector */}
              <div>
                <label className="mb-2 block text-xs font-mono font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300/80">
                  {t.settings.general.language}
                </label>
                <div className="flex gap-2" role="group" aria-label={t.settings.general.language}>
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSettings({ language: opt.value })}
                      className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150 border focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        settings.language === opt.value
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-900 font-bold dark:bg-cyan-500/25 dark:border-cyan-400 dark:text-cyan-200 shadow-sm"
                          : "bg-slate-100/80 border-slate-200/80 text-slate-700 hover:border-slate-300 hover:text-slate-900 dark:bg-slate-900/60 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
                      }`}
                      aria-pressed={settings.language === opt.value}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Selector */}
              <div>
                <label className="mb-2 block text-xs font-mono font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300/80">
                  {t.settings.general.font}
                </label>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label={t.settings.general.font}>
                  {fontOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSettings({ fontFamily: opt.value })}
                      className={`rounded-xl px-3 py-2.5 text-xs text-left transition-all duration-150 border focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        settings.fontFamily === opt.value
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-900 font-bold dark:bg-cyan-500/25 dark:border-cyan-400 dark:text-cyan-200 shadow-sm"
                          : "bg-slate-100/80 border-slate-200/80 text-slate-700 hover:border-slate-300 hover:text-slate-900 dark:bg-slate-900/60 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
                      }`}
                      aria-pressed={settings.fontFamily === opt.value}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Name Input */}
              <div>
                <label htmlFor="wbhp-user-name" className="mb-1.5 block text-xs font-mono font-semibold uppercase tracking-wider text-cyan-300/80">
                  {t.settings.general.userName}
                </label>
                <input
                  id="wbhp-user-name"
                  type="text"
                  value={settings.userName}
                  onChange={(e) => updateSettings({ userName: e.target.value })}
                  placeholder={t.settings.general.userNamePlaceholder}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                  autoComplete="nickname"
                />
              </div>

              {/* Tavily API Key Section */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="wbhp-tavily-key" className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" /> {t.settings.general.tavilyApiKeyTitle}
                  </label>
                </div>
                <p className="text-xs text-slate-400">
                  {t.settings.general.tavilyApiKeyHelp}
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    id="wbhp-tavily-key"
                    type="password"
                    value={tavilyKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTavilyKey(val);
                      localStorage.setItem("wbhp_tavily_key", val.trim());
                    }}
                    placeholder="tvly-..."
                    className="flex-1 rounded-xl border border-emerald-500/30 bg-slate-900/90 px-3.5 py-2 text-xs font-mono text-emerald-300 placeholder-emerald-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              </div>

              {/* Active Widgets */}
              <div>
                <label className="mb-1 block text-xs font-mono font-semibold uppercase tracking-wider text-cyan-300/80">
                  {t.settings.general.activeWidgets}
                </label>
                <p className="mb-2.5 text-xs text-slate-400">
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

              {/* Auto Update Section */}
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
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5 border-b border-white/10 pb-2">
                  <Cloud className="w-4 h-4 text-cyan-400 shrink-0" /> {t.settings.backup.webdavTitle}
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
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5 border-b border-white/10 pb-2">
                  <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" /> {t.settings.data.localBackupTitle}
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
      <label className="mb-2 block text-xs font-mono font-semibold uppercase tracking-wider text-cyan-300/80">
        {t.settings.background.title}
      </label>
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
        <div className="mt-4 rounded-xl border border-cyan-500/30 bg-slate-900/60 p-4 space-y-4">
          <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">{t.settings.background.custom}</h4>
          
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              {t.settings.background.customUpload}
            </label>
            <input
              type="file"
              accept="image/*"
              aria-label={t.settings.background.customUpload}
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-cyan-300 hover:file:bg-cyan-500/30 cursor-pointer transition-all"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">
              {t.settings.background.customUrl}
            </label>
            <input
              type="url"
              value={customData.imageUrl}
              aria-label={t.settings.background.customUrl}
              onChange={(e) => updateCustomData({ imageUrl: e.target.value })}
              placeholder={t.settings.background.customUrlPlaceholder}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{t.settings.background.blur}</span>
              <span className="font-mono text-cyan-300">{customData.blur}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={customData.blur}
              aria-label={t.settings.background.blur}
              onChange={(e) => updateCustomData({ blur: parseInt(e.target.value, 10) || 0 })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{t.settings.background.overlay}</span>
              <span className="font-mono text-cyan-300">{customData.overlayOpacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              value={customData.overlayOpacity}
              aria-label={t.settings.background.overlay}
              onChange={(e) =>
                updateCustomData({ overlayOpacity: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      )}

      {activeBg === "preset" && (
        <div className="mt-4 rounded-xl border border-cyan-500/30 bg-slate-900/60 p-4 space-y-3">
          <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">{t.settings.background.presetStyle}</h4>
          <div className="grid grid-cols-2 gap-2">
            {(["aurora", "cosmic", "mesh", "emerald", "sunset"] as PresetStyle[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => updatePresetData(st)}
                className={`rounded-xl px-3 py-2 text-xs capitalize transition-all border focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  presetData.style === st
                    ? "bg-cyan-500/25 border-cyan-400 text-cyan-200 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    : "bg-slate-950 border-white/10 text-slate-300 hover:border-white/20 hover:text-white"
                }`}
              >
                {t.settings.background.presetStyles?.[st] ?? st}
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
      <div className="flex items-center justify-between rounded-xl bg-slate-900/60 p-3.5 border border-white/10">
        <label className="text-xs font-semibold text-slate-200" htmlFor="wbhp-webdav-toggle">
          {t.enableWebdav}
        </label>
        <button
          id="wbhp-webdav-toggle"
          type="button"
          role="switch"
          aria-checked={config.enabled}
          onClick={() => updateConfig({ enabled: !config.enabled })}
          className={`h-6 w-11 rounded-full transition-all duration-200 border ${
            config.enabled ? "bg-cyan-400 border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.4)]" : "bg-slate-800 border-slate-700"
          }`}
        >
          <div
            className={`m-0.5 h-4 w-4 rounded-full bg-slate-950 transition-transform ${
              config.enabled ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      {config.enabled && (
        <div className="space-y-3 rounded-xl border border-cyan-500/20 bg-slate-900/40 p-4">
          <input
            type="url"
            value={config.url}
            aria-label={t.urlPlaceholder}
            onChange={(e) => updateConfig({ url: e.target.value })}
            placeholder={t.urlPlaceholder}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            autoComplete="url"
          />
          <input
            type="text"
            value={config.username}
            aria-label={t.usernamePlaceholder}
            onChange={(e) => updateConfig({ username: e.target.value })}
            placeholder={t.usernamePlaceholder}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            autoComplete="username"
          />
          <input
            type="password"
            value={config.password}
            aria-label={t.passwordPlaceholder}
            onChange={(e) => updateConfig({ password: e.target.value })}
            placeholder={t.passwordPlaceholder}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            autoComplete="current-password"
          />
          <div>
            <label className="mb-1 block text-xs text-slate-400" htmlFor="wbhp-autobackup">
              {t.autoInterval}
            </label>
            <input
              id="wbhp-autobackup"
              type="number"
              min={0}
              value={config.autoBackupInterval}
              aria-label={t.autoInterval}
              onChange={(e) =>
                updateConfig({ autoBackupInterval: Math.max(0, parseInt(e.target.value, 10) || 0) })
              }
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 font-mono"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={testConnection}
              className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50 transition-all"
            >
              {t.testBtn}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={doBackup}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-slate-950 hover:brightness-110 disabled:opacity-50 shadow-md shadow-cyan-500/20 transition-all"
            >
              {t.backupBtn}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={doRestore}
              className="rounded-xl border border-amber-500/40 bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 disabled:opacity-50 transition-all"
            >
              {t.restoreBtn}
            </button>
          </div>
          {status && <p className="text-xs font-semibold text-cyan-300" role="status">{status}</p>}
          {backupMsg && <p className="text-xs font-semibold text-cyan-300" role="status">{backupMsg}</p>}
          <p className="text-[11px] text-slate-400">
            {t.notice}
          </p>
        </div>
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
        className="w-full rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-4 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 shadow-sm transition-all"
      >
        {t.exportBtn}
      </button>
      <button
        type="button"
        onClick={handleImport}
        className="w-full rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 shadow-sm transition-all"
      >
        {t.importBtn}
      </button>
      <button
        type="button"
        onClick={handleClear}
        className="w-full rounded-xl border border-rose-400/40 bg-rose-500/15 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 shadow-sm transition-all"
      >
        {t.clearBtn}
      </button>
      {msg && (
        <p className="text-center text-xs font-semibold text-cyan-300" role="status">
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
    <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" /> WBHP v{currentVer}
          </h4>
          <p className="text-[11px] text-slate-400">Web Browser Home Page</p>
        </div>
        <button
          type="button"
          disabled={checking}
          onClick={handleCheck}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:brightness-110 disabled:opacity-50 transition-all shadow-md shadow-cyan-500/20"
        >
          {checking ? t.checking : t.checkUpdateBtn}
        </button>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-950/60 p-3 border border-white/5 hover:border-white/10 transition-all">
        <input
          type="checkbox"
          className="mt-0.5 accent-cyan-400"
          checked={autoCheck}
          aria-label={t.autoCheck}
          onChange={(e) => onChange({ autoCheck: e.target.checked })}
        />
        <span>
          <span className="block text-xs font-semibold text-slate-200">{t.autoCheck}</span>
          <span className="block text-[11px] text-slate-400">{t.autoCheckHelp}</span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-950/60 p-3 border border-white/5 hover:border-white/10 transition-all">
        <input
          type="checkbox"
          className="mt-0.5 accent-cyan-400"
          checked={autoDownload}
          disabled={!autoCheck}
          aria-label={t.autoDownload}
          onChange={(e) => onChange({ autoDownload: e.target.checked })}
        />
        <span>
          <span className="block text-xs font-semibold text-slate-200">{t.autoDownload}</span>
          <span className="block text-[11px] text-slate-400">{t.autoDownloadHelp}</span>
        </span>
      </label>

      {result && (
        <div className="pt-2 border-t border-white/10 text-xs">
          {result.hasUpdate ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-emerald-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> {t.updateAvailable}: v{result.latestVersion}
                </span>
                <a
                  href={result.releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-emerald-200 flex items-center gap-1"
                >
                  {t.downloadUpdate} <ExternalLink className="w-3 h-3 inline" />
                </a>
              </div>
              {(result.downloadZipUrl || result.downloadUrl) && (
                <button
                  type="button"
                  onClick={() => handleDownload(result.downloadZipUrl || result.downloadUrl)}
                  className="w-full rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{t.autoDownloadBtn} (v{result.latestVersion})</span>
                </button>
              )}
            </div>
          ) : result.error ? (
            <span className="text-rose-400">{t.failed}: {result.error}</span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              {t.upToDate} (v{currentVer})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
