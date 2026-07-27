import type { WebDAVConfig } from "../plugins/types";
import type { StorageSnapshot } from "./storage";
import { exportAll, importAll } from "./storage";

// ── Low-level WebDAV helpers ────────────────────────────────────────

function authHeaders(config: WebDAVConfig): Record<string, string> {
  const token = btoa(`${config.username}:${config.password}`);
  return {
    Authorization: `Basic ${token}`,
  };
}

async function request(
  config: WebDAVConfig,
  method: string,
  path: string,
  body?: BodyInit | null,
): Promise<Response> {
  const url = `${config.url.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  return fetch(url, {
    method,
    headers: {
      ...authHeaders(config),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body,
  });
}

// ── Public API ──────────────────────────────────────────────────────

export async function checkWebDAVConnection(
  config: WebDAVConfig,
): Promise<boolean> {
  try {
    const res = await request(config, "PROPFIND", "", null);
    return res.ok || res.status === 207;
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
    return res.ok || res.status === 201;
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
    return { success: true, message: "Data restored. Please refresh the page." };
  } catch {
    return { success: false, message: "Backup file is corrupted." };
  }
}

// ── Auto-backup scheduler ───────────────────────────────────────────

let _intervalId: ReturnType<typeof setInterval> | null = null;

export function startAutoBackup(config: WebDAVConfig): void {
  stopAutoBackup();
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
}
