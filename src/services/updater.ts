export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  downloadUrl?: string;
  downloadZipUrl?: string;
  releaseNotes?: string;
  error?: string;
}

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

const GITHUB_RELEASE_API = "https://api.github.com/repos/SMYQH/wbhp/releases/latest";
const FALLBACK_RELEASE_URL = "https://github.com/SMYQH/wbhp/releases";

/** Default interval between automatic update checks (24h). */
export const DEFAULT_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

const LAST_CHECK_KEY = "wbhp:update:lastCheckAt";
const LAST_RESULT_KEY = "wbhp:update:lastResult";
const DISMISSED_VERSION_KEY = "wbhp:update:dismissedVersion";
const AUTO_DOWNLOADED_VERSION_KEY = "wbhp:update:autoDownloadedVersion";

export type UpdateAvailableListener = (result: UpdateCheckResult) => void;

const availableListeners = new Set<UpdateAvailableListener>();

function compareSemver(v1: string, v2: string): number {
  const p1 = v1.split(".").map((n) => parseInt(n, 10) || 0);
  const p2 = v2.split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
}

export function getLastUpdateResult(): UpdateCheckResult | null {
  return readLocal<UpdateCheckResult | null>(LAST_RESULT_KEY, null);
}

export function getDismissedUpdateVersion(): string | null {
  return readLocal<string | null>(DISMISSED_VERSION_KEY, null);
}

export function dismissUpdateVersion(version: string): void {
  writeLocal(DISMISSED_VERSION_KEY, version);
}

export function subscribeUpdateAvailable(listener: UpdateAvailableListener): () => void {
  availableListeners.add(listener);
  return () => availableListeners.delete(listener);
}

function notifyAvailable(result: UpdateCheckResult): void {
  availableListeners.forEach((l) => {
    try {
      l(result);
    } catch (err) {
      console.warn("Update listener failed:", err);
    }
  });
}

export function shouldCheckForUpdates(intervalMs: number = DEFAULT_CHECK_INTERVAL_MS): boolean {
  const last = readLocal<number>(LAST_CHECK_KEY, 0);
  if (!last) return true;
  return Date.now() - last >= intervalMs;
}

export async function checkForUpdates(
  currentVersion: string = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.4.1",
): Promise<UpdateCheckResult> {
  try {
    const res = await fetch(GITHUB_RELEASE_API, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });

    if (!res.ok) {
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        releaseUrl: FALLBACK_RELEASE_URL,
        error: `HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as {
      tag_name?: string;
      html_url?: string;
      body?: string;
      assets?: ReleaseAsset[];
    };
    const rawTag = (data.tag_name || "").replace(/^v/, "").trim();
    const releaseUrl = data.html_url || FALLBACK_RELEASE_URL;

    if (!rawTag) {
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        releaseUrl,
      };
    }

    const assets = data.assets || [];
    const isFirefox =
      typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);
    const crxName = isFirefox ? "wbhp-firefox.crx" : "wbhp-chrome.crx";
    const zipName = isFirefox ? "wbhp-firefox.zip" : "wbhp-chrome.zip";

    const crxAsset =
      assets.find((a) => a.name === crxName) ||
      assets.find((a) => a.name.endsWith(".crx"));
    const zipAsset =
      assets.find((a) => a.name === zipName) ||
      assets.find((a) => a.name.endsWith(".zip"));

    const downloadUrl = crxAsset
      ? crxAsset.browser_download_url
      : `https://github.com/SMYQH/wbhp/releases/download/v${rawTag}/${crxName}`;
    const downloadZipUrl = zipAsset
      ? zipAsset.browser_download_url
      : `https://github.com/SMYQH/wbhp/releases/download/v${rawTag}/${zipName}`;

    const hasUpdate = compareSemver(rawTag, currentVersion) > 0;
    return {
      hasUpdate,
      currentVersion,
      latestVersion: rawTag,
      releaseUrl,
      downloadUrl,
      downloadZipUrl,
      releaseNotes: data.body,
    };
  } catch (err) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      releaseUrl: FALLBACK_RELEASE_URL,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Automatically trigger file download of the update package in browser. */
export function triggerAutoDownload(url: string, filename?: string): void {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || url.split("/").pop() || "wbhp-update.zip";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.warn("Failed to trigger automatic download:", err);
    window.open(url, "_blank");
  }
}

export interface AutoUpdateOptions {
  enabled?: boolean;
  /** When true, automatically start downloading the package if a newer version exists. */
  autoDownload?: boolean;
  intervalMs?: number;
  currentVersion?: string;
  /** Force a check even if the throttle window has not elapsed. */
  force?: boolean;
}

/**
 * Run a throttled update check. Persists result and notifies subscribers when
 * a newer version is available (and not dismissed).
 */
export async function runAutoUpdateCheck(
  options: AutoUpdateOptions = {},
): Promise<UpdateCheckResult | null> {
  const {
    enabled = true,
    autoDownload = false,
    intervalMs = DEFAULT_CHECK_INTERVAL_MS,
    currentVersion = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.4.1",
    force = false,
  } = options;

  if (!enabled) return null;
  if (!force && !shouldCheckForUpdates(intervalMs)) {
    return getLastUpdateResult();
  }

  const result = await checkForUpdates(currentVersion);
  writeLocal(LAST_CHECK_KEY, Date.now());
  writeLocal(LAST_RESULT_KEY, result);

  if (result.hasUpdate && !result.error) {
    const dismissed = getDismissedUpdateVersion();
    if (dismissed !== result.latestVersion) {
      notifyAvailable(result);
    }

    if (autoDownload) {
      const already = readLocal<string | null>(AUTO_DOWNLOADED_VERSION_KEY, null);
      const url = result.downloadZipUrl || result.downloadUrl;
      if (url && already !== result.latestVersion) {
        writeLocal(AUTO_DOWNLOADED_VERSION_KEY, result.latestVersion);
        triggerAutoDownload(url);
      }
    }
  }

  // Ask the browser to apply a pending CRX update when available (packaged installs).
  tryRequestBrowserUpdate();

  return result;
}

/** Best-effort: ask Chromium to check / apply extension auto-update via update_url. */
export function tryRequestBrowserUpdate(): void {
  try {
    const runtime = globalThis.chrome?.runtime as
      | {
          requestUpdateCheck?: (
            cb: (status: string, details?: { version?: string }) => void,
          ) => void;
          reload?: () => void;
        }
      | undefined;
    if (!runtime?.requestUpdateCheck) return;
    runtime.requestUpdateCheck((status) => {
      if (status === "update_available" && typeof runtime.reload === "function") {
        // Defer reload slightly so the page can finish painting.
        setTimeout(() => runtime.reload?.(), 1500);
      }
    });
  } catch {
    // Unpacked / non-extension contexts ignore this.
  }
}

let autoTimer: ReturnType<typeof setInterval> | null = null;

/** Start periodic in-page auto update checks (clears any previous timer). */
export function startAutoUpdateScheduler(options: AutoUpdateOptions = {}): () => void {
  stopAutoUpdateScheduler();

  const intervalMs = options.intervalMs ?? DEFAULT_CHECK_INTERVAL_MS;
  // Kick off soon after load without blocking first paint.
  const boot = window.setTimeout(() => {
    void runAutoUpdateCheck(options);
  }, 4000);

  autoTimer = setInterval(() => {
    void runAutoUpdateCheck(options);
  }, Math.max(intervalMs, 60 * 60 * 1000));

  return () => {
    window.clearTimeout(boot);
    stopAutoUpdateScheduler();
  };
}

export function stopAutoUpdateScheduler(): void {
  if (autoTimer != null) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
}
