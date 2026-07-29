# AGENTS.md — Developer & AI Agent Guide for WBHP

Welcome to **WBHP (Web Browser Home Page)**! This document serves as the authoritative guide for AI coding agents and human developers working on this codebase.

---

## 🚀 Project Overview

WBHP is a modern, pluggable **new tab** browser extension built with **React 19**, **Vite 8**, **TypeScript**, and **Tailwind CSS 4**. It supports both **Chrome (Manifest V3)** and **Firefox (Manifest V3)**.

* **Repository Root**: `E:\GitHub\WBHP`
* **Architecture**: Pluggable Plugin System (Widgets & Backgrounds)
* **Storage**: `localStorage` + `useSyncExternalStore` reactive store, with fallback mirroring to `chrome.storage.local`
* **Cloud Sync**: WebDAV sync + Local JSON Backup/Restore

---

## 🛠️ Tech Stack & Key Dependencies

* **Framework**: React 19 (`react`, `react-dom`)
* **Build Tool**: Vite 8 (`vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`)
* **Styling**: Tailwind CSS 4
* **Language**: TypeScript (`tsc --noEmit` for type checking)
* **Packaging**: `crx3` for `.crx` extension bundling

---

## 📂 Codebase Directory Structure

```
WBHP/
├── assets/                  # Core assets (e.g. icon.svg for auto PNG generation)
├── manifest/                # Browser-specific Manifest V3 definitions
│   ├── chrome.json          # Chrome Manifest V3
│   └── firefox.json         # Firefox Manifest V3
├── src/
│   ├── components/          # Top-level UI components
│   │   ├── App.tsx          # Main entry layout (Theme, Keybindings, Floating Toolbar)
│   │   ├── CommandPalette/  # Global command palette (Ctrl+K or /)
│   │   ├── Dashboard/       # Main widget container (supports Zen/Focus mode)
│   │   ├── Settings/        # Settings modal dialog
│   │   ├── PluginHost.tsx   # Generic wrapper for rendering plugins with PluginAPI
│   │   └── ErrorBoundary.tsx
│   ├── hooks/               # React hooks (e.g., useSettings)
│   ├── i18n/                # Internationalization (zh & en translations)
│   │   ├── index.ts
│   │   └── translations.ts
│   ├── plugins/             # Pluggable plugin system
│   │   ├── registry.ts      # Global plugin registration & lookup registry
│   │   ├── types.ts         # Plugin API & Settings type definitions
│   │   ├── backgrounds/     # Background plugins (Color, Gradient, Custom, Preset, Bing)
│   │   └── widgets/         # Widget plugins (Time, Greeting, Search+AI, Links, Weather, Todo, Notes, Quote, WorldClock, RSS)
│   ├── services/            # Persistence & Sync services (storage.ts, webdav.ts)
│   ├── styles/              # Global CSS & Tailwind imports
│   ├── main.tsx             # Application entry point
│   └── vite-env.d.ts
├── package.json
├── tsconfig.json
├── vite.config.ts           # Extension packaging, manifest copying, icon rasterization
└── AGENTS.md                # This guide
```

---

## 🧩 Plugin Architecture

WBHP uses a side-effect self-registration plugin pattern.

1. **Plugin Definition** (`PluginConfig<Data>`):
   Every widget or background exports a `PluginConfig` object containing:
   - `id`: Unique string identifier
   - `name`: Display name
   - `type`: `"widget"` | `"background"`
   - `component`: React component receiving `{ api: PluginAPI<Data> }`
   - `defaultData`: Default state object

2. **Self-Registration**:
   Plugins self-register on import by calling `registerPlugin(config)` in:
   - `src/plugins/widgets/index.ts`
   - `src/plugins/backgrounds/index.ts`

3. **Reactive Data Access**:
   Inside plugin components, read state reactively using `useSyncExternalStore(api.data.subscribe, api.data.get, api.data.get)` and update using `api.data.set(...)`.

---

## ⌨️ Key Features & Shortcuts

* **Command Palette**: `Ctrl + K` / `Cmd + K` or `/` anywhere on the page
* **Zen / Focus Mode**: `Z` key toggle or floating toolbar button 🧘
* **Settings Dialog**: `Ctrl + ,` or floating toolbar button ⚙️
* **AI Search Integration**: Switch search engines to ChatGPT, Gemini, or Perplexity directly from the search widget
* **Favicon & Category Filtering**: Quick links widget supports custom tags and Google Favicon fetching

---

## 🧪 Development Workflow & Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Launch Vite development server (Chrome target) |
| `npm run dev:firefox` | Launch Vite dev server with `BROWSER=firefox` |
| `npm run typecheck` | Run TypeScript strict type check (`tsc --noEmit`) |
| `npm run build` | Build Chrome extension into `dist-chrome/` |
| `npm run build:firefox` | Build Firefox extension into `dist-firefox/` |
| `npm run build:all` | Run TypeScript check and build both `.crx` bundles |

---

## 🤖 Guidelines for AI Agents

1. **Always Verify Types**: Run `npm run typecheck` after adding or modifying components/plugins.
2. **Preserve i18n**: Whenever introducing user-facing text, add corresponding key-value pairs in `src/i18n/translations.ts` for both `zh` and `en`.
3. **Keep Plugins Self-Contained**: Place new widget plugins in `src/plugins/widgets/` and backgrounds in `src/plugins/backgrounds/`, and register them in `index.ts`.
4. **Build Verification**: Before declaring success, execute `npm run build:all` to ensure zero compilation or bundling errors.
