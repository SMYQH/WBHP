# AGENTS.md — Developer & AI Agent Guide for WBHP

Welcome to **WBHP (Web Browser Home Page)**! This document serves as the authoritative guide for AI coding agents and human developers working on this codebase.

---

## 🚀 Project Overview

WBHP is a modern, pluggable **new tab** browser extension built with **React 19**, **Vite 8**, **TypeScript**, and **Tailwind CSS 4**. It supports both **Chrome (Manifest V3)** and **Firefox (Manifest V3)**.

- **Repository Root**: `E:\GitHub\WBHP`
- **Architecture**: Pluggable Plugin System (Widgets & Backgrounds) + Event-Driven Communication
- **Storage**: `localStorage` + `useSyncExternalStore` reactive store, with fallback mirroring to `chrome.storage.local`
- **Cloud Sync & Updater**: WebDAV sync + Local JSON Backup/Restore + Auto Update Check Service (`updater.ts`)

---

## 🛠️ Tech Stack & Key Dependencies

- **Framework**: React 19 (`react`, `react-dom`)
- **Build Tool**: Vite 8 (`vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript (`tsc -b` for type checking)
- **Packaging & Utilities**: `crx3` for `.crx` bundling, `sharp` for SVG-to-PNG icon rasterization

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
│   │   ├── TavilySidebar.tsx # Tavily AI deep research sidebar & drawer
│   │   ├── PluginHost.tsx   # Generic wrapper for rendering plugins with PluginAPI
│   │   ├── ErrorBoundary.tsx
│   │   └── ui/              # Reusable UI components (e.g. PluginCard.tsx)
│   ├── hooks/               # React hooks (useSettings.ts, usePluginData.ts)
│   ├── i18n/                # Internationalization (JSON translation dictionaries)
│   │   ├── locales/         # Language dictionaries (zh.json, en.json)
│   │   ├── index.ts         # Language resolution & helper functions
│   │   └── translations.ts  # Types & JSON imports
│   ├── plugins/             # Pluggable plugin system
│   │   ├── registry.ts      # Global plugin registration & lookup registry
│   │   ├── types.ts         # Plugin API & Settings type definitions
│   │   ├── backgrounds/     # Background plugins (Bing, Custom, Preset, Unsplash)
│   │   └── widgets/         # Widget plugins (Time, Greeting, Search, Links, Weather, Todo, Notes, Quote, WorldClock)
│   ├── services/            # Persistence, Sync & Update services (storage.ts, webdav.ts, updater.ts)
│   ├── styles/              # Global CSS & Tailwind imports
│   ├── main.tsx             # Application entry point
│   └── vite-env.d.ts
├── package.json
├── tsconfig.json
├── vite.config.ts           # Extension packaging, manifest copying, icon rasterization
└── AGENTS.md                # This guide
```

---

## 🧩 Architecture & Key Patterns

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

4. **Event Bus Communication**:
   Components communicate cross-plugin via global `CustomEvent`.
   - Example: Search widget dispatches `wbhp:open-tavily` event, captured by `App.tsx` / `TavilySidebar.tsx`.

---

## ⌨️ Key Features & Shortcuts

- **Command Palette**: `Ctrl + K` / `Cmd + K` or `/` anywhere on the page
- **Zen / Focus Mode**: `Z` key toggle or floating toolbar button 🧘
- **Settings Dialog**: `Ctrl + ,` or floating toolbar button ⚙️
- **AI Search & Deep Research**: Switch search engines to ChatGPT, Gemini, or Perplexity + Tavily AI Deep Research sidebar
- **Favicon & Category Filtering**: Quick links widget supports custom tags and Google Favicon fetching

---

## 🧪 Development Workflow & Commands

| Command                 | Action                                                                                   |
| :---------------------- | :--------------------------------------------------------------------------------------- |
| `npm run dev`           | Launch Vite development server (Chrome target)                                           |
| `npm run dev:firefox`   | Launch Vite dev server with `BROWSER=firefox`                                            |
| `npm run typecheck`     | Run TypeScript strict type check (`tsc -b`)                                              |
| `npm run build`         | Build Chrome extension into `dist-chrome/`                                               |
| `npm run build:firefox` | Build Firefox extension into `dist-firefox/`                                             |
| `npm run build:all`     | Run TypeScript check and build both `.crx` bundles                                       |
| `npm run release`       | Auto-bump patch version, update manifests, build, commit, tag vX.Y.Z, and push to GitHub |
| `npm run release:patch` | Same as `npm run release` (auto patch version increment)                                 |
| `npm run release:minor` | Minor version bump and release                                                           |

> **Windows Shell Tip**: If running on Windows PowerShell where script execution policy is restricted, execute npm commands via `pwsh -c` (e.g. `pwsh -c "npm run build:all"` or `pwsh -c "npm run release"`).

---

## 🤖 Guidelines for AI Agents

1. **Always Verify Types**: Run `npm run typecheck` or `npm run build:all` after adding or modifying components/plugins.
2. **Preserve i18n**: Whenever introducing user-facing text, add corresponding key-value pairs in `src/i18n/locales/zh.json` and `src/i18n/locales/en.json` (and maintain TypeScript types via `translations.ts`).
3. **Keep Plugins Self-Contained**: Place new widget plugins in `src/plugins/widgets/` and backgrounds in `src/plugins/backgrounds/`, and register them in `index.ts`.
4. **Event Bus Naming Standard**: Use `wbhp:<action>` naming convention for global `CustomEvent` communications.
5. **Windows Shell Safety**: Use `pwsh -c` wrapper when executing shell commands if running under PowerShell restricted execution environments.
6. **Build Verification**: Before declaring success, execute `pwsh -c "npm run build:all"` to ensure zero compilation or bundling errors.
7. **Release & CD Monitoring Workflow**: After completing optimization tasks that involve source code changes (e.g. `src/`, plugins, UI components, core logic), run `pwsh -c "npm run release"` to auto-increment the patch version (e.g., v0.5.1 -> v0.5.2), sync manifests and update files, run full build, commit, tag, and push to GitHub. The script automatically waits 30 seconds for GitHub Actions to trigger, then streams and monitors the CD workflow logs via `gh CLI` (`gh run watch` / `gh run view`) until release completion. **Note**: If a task does NOT involve source code changes (e.g., pure documentation updates like `AGENTS.md` or `README.md`), skip the release process and commit directly without bumping version or triggering CD.
8. **Language**: All responses, comments, and commit messages should be in Chinese Simplified.
