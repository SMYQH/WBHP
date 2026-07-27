import { useState } from "react";
import type { PluginConfig, PluginAPI } from "../types";
import { usePluginData } from "../../hooks/usePluginData";

interface Link {
  id: string;
  title: string;
  url: string;
}

interface LinksData {
  links: Link[];
}

const config: PluginConfig<LinksData> = {
  id: "links",
  name: "Quick Links",
  description: "Your favorite bookmarks at a glance.",
  type: "widget",
  defaultData: {
    links: [
      { id: "1", title: "GitHub", url: "https://github.com" },
      { id: "2", title: "YouTube", url: "https://youtube.com" },
      { id: "3", title: "Reddit", url: "https://reddit.com" },
      { id: "4", title: "Gmail", url: "https://mail.google.com" },
    ],
  },
  defaultSize: { width: 4, height: 2 },
  component: LinksWidget,
};

function LinksWidget(_props: { api: PluginAPI<LinksData> }) {
  const { data } = usePluginData("links", config.defaultData, {});
  const { links } = data.get();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const removeLink = (id: string) => {
    data.set({ links: links.filter((l) => l.id !== id) });
  };

  const addLink = () => {
    if (!title.trim() || !url.trim()) return;
    const newLink: Link = {
      id: crypto.randomUUID(),
      title: title.trim(),
      url: url.trim(),
    };
    data.set({ links: [...links, newLink] });
    setTitle("");
    setUrl("");
    setAdding(false);
  };

  const faviconUrl = (linkUrl: string) => {
    try {
      const host = new URL(linkUrl).hostname;
      return `https://icons.duckduckgo.com/ip3/${host}.ico`;
    } catch {
      return "";
    }
  };

  return (
    <div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            className="group relative flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
          >
            <img
              src={faviconUrl(link.url)}
              alt=""
              className="w-8 h-8 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="text-xs text-center truncate w-full">
              {link.title}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeLink(link.id);
              }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Remove"
            >
              ×
            </button>
          </a>
        ))}
      </div>

      {adding ? (
        <div className="mt-3 flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="flex-1 px-3 py-1.5 rounded-lg bg-white/20 dark:bg-white/10 border border-white/20 text-sm"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-white/20 dark:bg-white/10 border border-white/20 text-sm"
          />
          <button
            onClick={addLink}
            className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium"
          >
            Add
          </button>
          <button
            onClick={() => setAdding(false)}
            className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 text-sm opacity-50 hover:opacity-100 transition-opacity"
        >
          + Add link
        </button>
      )}
    </div>
  );
}

export default config;
