import { useState, useEffect, useRef } from "react";
import type React from "react";
import {
  Search,
  Settings,
  Sparkles,
  Eye,
  Sun,
  Moon,
  Monitor,
  LayoutGrid,
  Image,
} from "lucide-react";
import type { WBHPSettings } from "../../plugins/types";
import { getWidgetPlugins, getBackgroundPlugins } from "../../plugins/registry";
import { getTranslations } from "../../i18n";

interface ActionItem {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  perform: () => void;
}

interface CommandPaletteProps {
  settings: WBHPSettings;
  updateSettings: (patch: Partial<WBHPSettings>) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onToggleZen: () => void;
  isZenMode: boolean;
}

export default function CommandPalette({
  settings,
  updateSettings,
  isOpen,
  onClose,
  onOpenSettings,
  onToggleZen,
  isZenMode,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = getTranslations(settings.language);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const actions: ActionItem[] = [
    {
      id: "action-settings",
      label: t.commandPalette.actions.openSettings,
      category: t.commandPalette.categories.system,
      icon: <Settings className="w-4 h-4" />,
      perform: () => {
        onOpenSettings();
        onClose();
      },
    },
    {
      id: "action-update",
      label: t.updater.checkUpdateBtn,
      category: t.commandPalette.categories.system,
      icon: <Sparkles className="w-4 h-4" />,
      perform: () => {
        onOpenSettings();
        onClose();
      },
    },
    {
      id: "action-zen",
      label: isZenMode ? t.zenMode.exit : t.zenMode.enter,
      category: t.commandPalette.categories.mode,
      icon: <Eye className="w-4 h-4" />,
      perform: () => {
        onToggleZen();
        onClose();
      },
    },
    {
      id: "theme-light",
      label: t.commandPalette.actions.themeLight,
      category: t.commandPalette.categories.theme,
      icon: <Sun className="w-4 h-4" />,
      perform: () => {
        updateSettings({ theme: "light" });
        onClose();
      },
    },
    {
      id: "theme-dark",
      label: t.commandPalette.actions.themeDark,
      category: t.commandPalette.categories.theme,
      icon: <Moon className="w-4 h-4" />,
      perform: () => {
        updateSettings({ theme: "dark" });
        onClose();
      },
    },
    {
      id: "theme-system",
      label: t.commandPalette.actions.themeSystem,
      category: t.commandPalette.categories.theme,
      icon: <Monitor className="w-4 h-4" />,
      perform: () => {
        updateSettings({ theme: "system" });
        onClose();
      },
    },
  ];

  // Add Widget toggles
  getWidgetPlugins().forEach((p) => {
    const active =
      settings.activeWidgets.length === 0
        ? true
        : settings.activeWidgets.includes(p.id);
    actions.push({
      id: `widget-${p.id}`,
      label: `${active ? t.commandPalette.actions.hideWidget : t.commandPalette.actions.showWidget}: ${p.name}`,
      category: t.commandPalette.categories.widgets,
      icon: <LayoutGrid className="w-4 h-4" />,
      perform: () => {
        const base =
          settings.activeWidgets.length === 0
            ? getWidgetPlugins().map((wp) => wp.id)
            : settings.activeWidgets;
        const updated = active
          ? base.filter((id) => id !== p.id)
          : [...base, p.id];
        updateSettings({ activeWidgets: updated });
        onClose();
      },
    });
  });

  // Add Background toggles
  getBackgroundPlugins().forEach((p) => {
    actions.push({
      id: `bg-${p.id}`,
      label: `${t.commandPalette.actions.setBackground}: ${p.name}`,
      category: t.commandPalette.categories.backgrounds,
      icon: <Image className="w-4 h-4" />,
      perform: () => {
        updateSettings({ activeBackground: p.id });
        onClose();
      },
    });
  });

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase().trim()) ||
    a.category.toLowerCase().includes(query.toLowerCase().trim())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].perform();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <Search className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={t.commandPalette.placeholder}
            className="flex-1 bg-transparent text-base focus:outline-none dark:text-white"
          />
          <kbd className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm opacity-60">
              {t.commandPalette.noResults}
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.perform}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-500 text-white font-medium shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`text-xs ${
                      isSelected ? "text-white/80" : "text-gray-400"
                    }`}
                  >
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-gray-200 px-4 py-2 text-[11px] text-gray-400 dark:border-gray-800 flex items-center justify-between">
          <span>{t.commandPalette.shortcutHint}</span>
          <div className="flex gap-2">
            <span>{t.commandPalette.navigate}</span>
            <span>{t.commandPalette.select}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
