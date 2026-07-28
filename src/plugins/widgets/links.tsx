import { useState, useSyncExternalStore, type FormEvent } from "react";
import type { PluginConfig, PluginAPI } from "../types";

interface Link {
  id: string;
  title: string;
  url: string;
}

interface LinksData {
  links: Link[];
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

function faviconUrl(linkUrl: string): string {
  try {
    const host = new URL(linkUrl).hostname;
    return `https://icons.duckduckgo.com/ip3/${host}.ico`;
  } catch {
    return "";
  }
}

function LinksWidget({ api }: { api: PluginAPI<LinksData> }) {
  const data = useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get);
  const { links } = data;
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const removeLink = (id: string) => {
    api.data.set({ links: links.filter((l) => l.id !== id) });
  };

  const addLink = (e?: FormEvent) => {
    e?.preventDefault();
    const normalized = normalizeUrl(url);
    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!normalized) {
      setFormError("Enter a valid http(s) URL.");
      return;
    }
    const newLink: Link = {
      id: crypto.randomUUID(),
      title: title.trim(),
      url: normalized,
    };
    api.data.set({ links: [...links, newLink] });
    setTitle("");
    setUrl("");
    setFormError(null);
    setAdding(false);
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            className="group relative flex flex-col items-center gap-1 rounded-xl p-2 transition-colors hover:bg-white/20 dark:hover:bg-white/10"
          >
            <img
              src={faviconUrl(link.url)}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.visibility = "hidden";
              }}
            />
            <span className="w-full truncate text-center text-xs">{link.title}</span>
            <button
              type="button"
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                removeLink(link.id);
              }}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              title="Remove"
              aria-label={`Remove ${link.title}`}
            >
              ×
            </button>
          </a>
        ))}

        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/30 p-2 text-xs opacity-70 transition-colors hover:bg-white/10 hover:opacity-100"
            aria-label="Add link"
          >
            <span className="text-lg">+</span>
            Add
          </button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={addLink}
          className="mt-3 flex flex-col gap-2 rounded-xl bg-white/10 p-3 sm:flex-row sm:items-start"
        >
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="flex-1 rounded-lg bg-white/20 px-3 py-2 text-sm dark:bg-white/10"
              autoFocus
            />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-[2] rounded-lg bg-white/20 px-3 py-2 text-sm dark:bg-white/10"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setFormError(null);
              }}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
            >
              Cancel
            </button>
          </div>
          {formError && (
            <p className="w-full text-xs text-red-300 sm:basis-full" role="alert">
              {formError}
            </p>
          )}
        </form>
      )}
    </div>
  );
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

export default config;
