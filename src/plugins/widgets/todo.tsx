import { useState, useSyncExternalStore } from "react";
import { CheckSquare, X, Sparkles } from "lucide-react";
import type { PluginConfig, PluginAPI } from "../types";
import { getTranslations } from "../../i18n";

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface TodoData {
  items: TodoItem[];
  filter: "all" | "active" | "completed";
}

const defaultData: TodoData = {
  items: [
    { id: "1", text: "Welcome to WBHP! Explore settings and widgets.", completed: false, createdAt: Date.now() },
    { id: "2", text: "Press Ctrl+K or / to open Command Palette", completed: true, createdAt: Date.now() - 1000 },
  ],
  filter: "all",
};

function TodoWidget({ api }: { api: PluginAPI<TodoData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const t = getTranslations(api.settings.language).widgets.todo;
  const [inputText, setInputText] = useState("");

  const items = data.items || [];
  const filter = data.filter || "all";

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const newItem: TodoItem = {
      id: Date.now().toString(),
      text: inputText.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    api.data.set({ ...data, items: [newItem, ...items] });
    setInputText("");
  };

  const toggleItem = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    api.data.set({ ...data, items: updated });
  };

  const deleteItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    api.data.set({ ...data, items: updated });
  };

  const clearCompleted = () => {
    const updated = items.filter((item) => !item.completed);
    api.data.set({ ...data, items: updated });
  };

  const setFilter = (newFilter: TodoData["filter"]) => {
    api.data.set({ ...data, filter: newFilter });
  };

  const filteredItems = items.filter((item) => {
    if (filter === "active") return !item.completed;
    if (filter === "completed") return item.completed;
    return true;
  });

  const activeCount = items.filter((i) => !i.completed).length;

  return (
    <div className="w-full rounded-2xl border border-white/20 bg-white/40 p-5 shadow-lg backdrop-blur-md transition-all dark:border-white/10 dark:bg-gray-900/40">
      <div className="mb-4 flex items-center justify-between border-b border-gray-200/40 pb-3 dark:border-gray-700/40">
        <h3 className="text-base font-semibold tracking-wide flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{t.name}</span>
        </h3>
        <div className="flex gap-1 rounded-lg bg-gray-200/50 p-1 text-xs dark:bg-gray-800/50">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 transition-colors capitalize ${
                filter === f
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {t[f]}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={addItem} className="mb-4 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t.placeholder}
          className="flex-1 rounded-xl border border-gray-200/50 bg-white/60 px-4 py-2 text-sm shadow-inner backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700/50 dark:bg-gray-800/60 dark:text-white"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 disabled:opacity-40 transition-colors"
        >
          {t.addBtn}
        </button>
      </form>

      <ul className="max-h-60 space-y-2 overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <li className="py-6 text-center text-xs opacity-60 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{t.emptyState}</span>
          </li>
        ) : (
          filteredItems.map((item) => (
            <li
              key={item.id}
              className="group flex items-center justify-between rounded-xl bg-white/30 p-2.5 backdrop-blur transition-all hover:bg-white/50 dark:bg-gray-800/30 dark:hover:bg-gray-800/50"
            >
              <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleItem(item.id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 accent-blue-500 cursor-pointer"
                />
                <span
                  className={`text-sm truncate transition-all ${
                    item.completed
                      ? "line-through opacity-50 text-gray-500 dark:text-gray-400"
                      : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {item.text}
                </span>
              </label>
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-xs text-rose-500 hover:text-rose-700 transition-opacity"
                title="Delete item"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-gray-200/40 pt-3 text-xs opacity-75 dark:border-gray-700/40">
        <span>
          {activeCount} {t.itemsLeft}
        </span>
        {items.some((i) => i.completed) && (
          <button
            onClick={clearCompleted}
            className="text-rose-500 hover:underline transition-colors"
          >
            {t.clearCompleted}
          </button>
        )}
      </div>
    </div>
  );
}

const config: PluginConfig<TodoData> = {
  id: "todo",
  name: "Todo List",
  description: "A lightweight, distraction-free task management widget.",
  type: "widget",
  defaultData,
  defaultSize: { width: 4, height: 3 },
  component: TodoWidget,
};

export default config;
