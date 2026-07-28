import type { WebDAVConfig } from "../plugins/types";
import type { StorageSnapshot } from "./storage";
import { exportAll, importAll } from "./storage";

// ── Low-level WebDAV helpers ────────────────────────────────────────

function authHeaders(config: WebDAVConfig): Record<string, string> {
  // btoa is fine for ASCII credentials; encodeURIComponent handles unicode.
  const token = btoa(
    `${unescape(encodeURIComponent(config.username))}:${unescape(encodeURIComponent(config.password))}`,
  );
  return {
    Authorization: `Basic ${token}`,
  };
}

function joinUrl(base: string, path: string): string {
  const cleanedBase = base.replace(/\/+$/, "");
  const cleanedPath = path.replace(/^\/+/, "");
  return cleanedPath ? `${cleanedBase}/${cleanedPath}` : cleanedBase;
}

async function request(
  config: WebDAVConfig,
  method: string,
  path: string,
  body?: BodyInit | null,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  const url = joinUrl(config.url, path);
  return fetch(url, {
    method,
    headers: {
      ...authHeaders(config),
      ...extraHeaders,
      ...(body !== undefined && body !== null
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: body ?? undefined,
  });
}

// ── Public API ──────────────────────────────────────────────────────

export async function checkWebDAVConnection(
  config: WebDAVConfig,
): Promise<boolean> {
  try {
    // PROPFIND requires Depth; many servers 400 without it.
    const res = await request(config, "PROPFIND", "", null, {
      Depth: "0",
      "Content-Type": "application/xml",
    });
    if (res.ok || res.status === 207) return true;
    // Some providers only allow GET on the collection root.
    const get = await request(config, "GET", "", null);
    return get.ok || get.status === 404 || get.status === 405;
  } catch {
    return false;
  }
}

export async function uploadToWebDAV(
  config: WebDAVConfig,
  remotePath: string,
  content: string,
): Promise<boolean> {
  try {
    const res = await request(config, "PUT", remotePath, content);
    return res.ok || res.status === 201 || res.status === 204;
  } catch {
    return false;
  }
}

export async function downloadFromWebDAV(
  config: WebDAVConfig,
  remotePath: string,
): Promise<string | null> {
  try {
    const res = await request(config, "GET", remotePath, null);
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

// ── Backup / Restore ────────────────────────────────────────────────

export async function backupToWebDAV(
  config: WebDAVConfig,
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled) {
    return { success: false, message: "WebDAV is not enabled." };
  }
  if (!config.url.trim()) {
    return { success: false, message: "WebDAV URL is empty." };
  }
  const snapshot = exportAll();
  const ok = await uploadToWebDAV(
    config,
    "wbhp-backup.json",
    JSON.stringify(snapshot, null, 2),
  );
  return ok
    ? { success: true, message: "Backup completed successfully." }
    : { success: false, message: "Backup upload failed." };
}

export async function restoreFromWebDAV(
  config: WebDAVConfig,
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled) {
    return { success: false, message: "WebDAV is not enabled." };
  }
  const raw = await downloadFromWebDAV(config, "wbhp-backup.json");
  if (!raw) {
    return { success: false, message: "No backup found on server." };
  }
  try {
    const snapshot = JSON.parse(raw) as StorageSnapshot;
    if (snapshot.version !== 1) {
      return { success: false, message: "Unsupported backup format." };
    }
    importAll(snapshot);
    return { success: true, message: "Data restored successfully." };
  } catch {
    return { success: false, message: "Backup file is corrupted." };
  }
}

// ── Auto-backup scheduler ───────────────────────────────────────────

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _lastConfigKey = "";

export function startAutoBackup(config: WebDAVConfig): void {
  const key = JSON.stringify({
    enabled: config.enabled,
    url: config.url,
    username: config.username,
    // intentionally omit password from identity key noise; still restart on change
    password: config.password,
    autoBackupInterval: config.autoBackupInterval,
  });
  if (_intervalId !== null && key === _lastConfigKey) return;

  stopAutoBackup();
  _lastConfigKey = key;
  if (!config.enabled || config.autoBackupInterval <= 0) return;

  _intervalId = setInterval(() => {
    backupToWebDAV(config).catch(console.warn);
  }, config.autoBackupInterval * 60_000);
}

export function stopAutoBackup(): void {
  if (_intervalId !== null) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
  _lastConfigKey = "";
}
