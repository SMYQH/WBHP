# WBHP — Web Browser Home Page

A modern, pluggable **new tab** browser extension built with React 19, Vite 8, TypeScript, and Tailwind CSS 4.

## Features

- Widget system: time, greeting, search, quick links, weather
- Background plugins: solid color, gradient, photo (picsum)
- Theme: system / light / dark
- Local backup export/import + optional WebDAV sync
- Chrome + Firefox Manifest V3 packaging (`.crx` + ZIP)

## Develop

```bash
npm install
npm run dev            # Chrome-oriented Vite dev server
npm run dev:firefox    # same, with BROWSER=firefox
npm run typecheck
npm run build          # Chrome build → dist/
npm run build:firefox  # Firefox build
```

Load the unpacked extension from `dist/`:

1. Build once (`npm run build`)
2. Chrome: `chrome://extensions` → Developer mode → Load unpacked → select `dist/`
3. Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → `dist/manifest.json`

## Architecture notes

- Plugins self-register via side-effect imports under `src/plugins/**`
- `PluginHost` mounts each plugin with a real reactive `PluginAPI` (data + cache)
- Storage uses `localStorage` with an in-memory snapshot cache for `useSyncExternalStore`, and mirrors to `chrome.storage.local` when available
- Build sets `base: "./"` so assets resolve under `chrome-extension://` pages
- Icons are generated from `assets/icon.svg` at build time (PNG 16/32/48/128)

## Keyboard

- `Esc` — close settings
- `Ctrl/Cmd + ,` — open settings

## License

MIT
