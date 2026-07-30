# WBHP — Web Browser Home Page

<p align="center">
  <b>高颜值、可扩展、极致流畅的现代浏览器新标签页（New Tab）扩展</b>
</p>

---

## 🌟 项目简介

**WBHP (Web Browser Home Page)** 是一款基于 **React 19**、**Vite 8**、**TypeScript** 以及 **Tailwind CSS 4** 构建的新一代浏览器新标签页扩展。项目采用高度解耦的可插拔插件架构，支持 Chrome (Manifest V3) 与 Firefox (Manifest V3) 双主流浏览器平台。

---

## ✨ 核心特性

- 🧩 **可插拔插件架构 (Plugin Architecture)**：
  小组件（Widgets）与背景插件（Backgrounds）均采用组件化插件设计，支持极简扩展与定制。
  
- 🕒 **丰富的高效小组件 (Built-in Widgets)**：
  - **时间与问候 (Time & Greeting)**：动态实时时钟与基于时段的个性化问候。
  - **多引擎搜索 (Search)**：集成 Google、Baidu、Bing、DuckDuckGo、GitHub 以及 ChatGPT、Gemini、Perplexity、Tavily AI 智能搜索。
  - **快捷链接 (Quick Links)**：支持自定义标签分类、模糊搜索与 Google Favicon 自动解析提取。
  - **实时天气 (Weather)**：支持地点设置与实时天气状况查询。
  - **待办事项 (Todo)**：高效的任务清单管理。
  - **随手记 (Notes)**：轻量级 Markdown 风格便签。
  - **每日一言 (Quote)**：精选名言警句推荐。
  - **世界时钟 (World Clock)**：多时区对比展示。

- 🖼️ **高颜值动态背景 (Backgrounds)**：
  - Bing 每日高清壁纸
  - Unsplash 高清图库
  - 精选预设壁纸
  - 自定义图片 URL 与本地图片上传
  - 渐变色与纯色背景

- ⌨️ **极客快捷交互 (Shortcuts & Focus)**：
  - **全局命令面板**：`Ctrl + K` / `Cmd + K` 或 `/` 快捷唤起命令面板。
  - **禅模式 (Zen / Focus Mode)**：按 `Z` 键快速隐藏所有组件，专注沉浸体验。
  - **AI 深度研究侧边栏**：集成 Tavily AI Deep Research 侧边栏与抽屉助手。
  - **快捷设置面板**：`Ctrl + ,` 或右下角悬浮工具栏一键唤起。

- 🌐 **多语言与外观定制 (i18n & Customization)**：
  - 简体中文（zh）与英文（en）无缝切换与自动适配。
  - 支持跟随系统 / 浅色 (Light) / 深色 (Dark) 主题模式。
  - 预置多种美观字体（小米兰亭 MiSans、Serif 衬线体、Open Sans、系统默认字体）。

- ☁️ **数据备份与云端同步 (Sync & Storage)**：
  - 支持本地 JSON 配置文件一键导出与导入恢复。
  - 支持 WebDAV 云端实时同步。
  - 内置自动更新检测服务（`updater.ts`）。
  - 基于 `localStorage` + `useSyncExternalStore` 响应式状态管理，并镜像备份至 `chrome.storage.local`。

---

## 🛠️ 技术栈与依赖

- **前端框架**：[React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**：[Vite 8](https://vitejs.dev/) + `@tailwindcss/vite`
- **样式方案**：[Tailwind CSS 4](https://tailwindcss.com/)
- **打包与工具**：`crx3`（打包 `.crx`）+ `sharp`（图标从 `assets/icon.svg` 自动生成多尺寸 PNG）

---

## 🚀 本地开发与构建

### 1. 克隆项目与安装依赖

```bash
git clone https://github.com/WBHP/WBHP.git
cd WBHP
npm install
```

### 2. 开发与构建命令

| 命令 | 说明 |
| :--- | :--- |
| `npm run dev` | 启动 Chrome 开发模式 Vite 热更新服务器 |
| `npm run dev:firefox` | 启动 Firefox 开发模式 Vite 热更新服务器 |
| `npm run typecheck` | 运行 TypeScript 严格类型检查 (`tsc -b`) |
| `npm run build` | 构建 Chrome 扩展包（输出至 `dist-chrome/`） |
| `npm run build:firefox` | 构建 Firefox 扩展包（输出至 `dist-firefox/`） |
| `npm run build:all` | 运行类型检查并一键构建 Chrome 与 Firefox 目标包 |
| `npm run release` | 自动递增 Patch 版本号、更新 Manifest、构建打包并提交发布 |

> **Windows 用户提示**：在 PowerShell 下若遇到脚本执行受限，可通过 `pwsh -c` 执行命令，例如 `pwsh -c "npm run build:all"`。

### 3. 加载未打包扩展 (Unpacked Extension)

#### **Chrome / Edge / Brave / Opera**
1. 运行 `npm run build` 生成 `dist-chrome/`
2. 浏览器访问 `chrome://extensions`
3. 开启右上角 **“开发者模式 (Developer Mode)”**
4. 点击 **“加载已解压的扩展程序 (Load unpacked)”**，选择项目根目录下的 `dist-chrome/` 文件夹

#### **Firefox**
1. 运行 `npm run build:firefox` 生成 `dist-firefox/`
2. 浏览器访问 `about:debugging`
3. 点击 **“此 Firefox (This Firefox)”**
4. 点击 **“临时加载附加组件 (Load Temporary Add-on...)”**，选择 `dist-firefox/manifest.json`

---

## ⌨️ 常用快捷键列表

| 快捷键 | 功能 |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` 或 `/` | 打开全局命令面板 |
| `Z` | 切换禅模式 / 专注模式（隐/显组件） |
| `Ctrl + ,` / `Cmd + ,` | 打开设置面板 |
| `Esc` | 关闭当前弹窗 / 设置面板 |

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。
