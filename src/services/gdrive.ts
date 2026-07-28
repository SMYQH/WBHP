import type { GoogleDriveConfig } from "../plugins/types";
import type { StorageSnapshot } from "./storage";
import { exportAll, importAll } from "./storage";

// ── Google OAuth & Drive Constants ──────────────────────────────────
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";
const GDRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const GDRIVE_UPLOAD_ENDPOINT = "https://www.googleapis.com/upload/drive/v3/files";
const SCOPES = [
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

const BACKUP_FILENAME = "wbhp-backup.json";

// Chrome extension global type helper
declare const chrome: {
  identity?: {
    getRedirectURL: (path?: string) => string;
    launchWebAuthFlow: (
      details: { url: string; interactive?: boolean },
      callback?: (redirectUrl?: string) => void,
    ) => Promise<string>;
  };
};

/** Get the OAuth Redirect URI based on execution environment. */
export function getRedirectUri(): string {
  if (typeof chrome !== "undefined" && chrome?.identity?.getRedirectURL) {
    return chrome.identity.getRedirectURL();
  }
  return window.location.origin + window.location.pathname;
}

/** Build Google OAuth 2.0 Authorization URL */
export function getGoogleAuthUrl(clientId: string): string {
  const redirectUri = getRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: SCOPES,
    include_granted_scopes: "true",
    prompt: "consent",
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

/** Perform Google OAuth 2.0 Authorization */
export async function authenticateWithGoogle(
  clientId: string,
): Promise<{ accessToken: string; expiresAt: number; userEmail?: string; userName?: string }> {
  if (!clientId.trim()) {
    throw new Error("Client ID is required for Google OAuth.");
  }

  const authUrl = getGoogleAuthUrl(clientId);

  // 1. Chrome Extension Environment
  if (typeof chrome !== "undefined" && chrome?.identity?.launchWebAuthFlow) {
    const redirectUrl = await new Promise<string>((resolve, reject) => {
      chrome.identity!.launchWebAuthFlow(
        { url: authUrl, interactive: true },
        (responseUrl) => {
          if (chrome.identity && (chrome as unknown as { runtime?: { lastError?: { message: string } } }).runtime?.lastError) {
            const err = (chrome as unknown as { runtime?: { lastError?: { message: string } } }).runtime?.lastError;
            reject(new Error(err?.message || "OAuth flow failed or was cancelled."));
            return;
          }
          if (!responseUrl) {
            reject(new Error("No response URL returned from OAuth flow."));
            return;
          }
          resolve(responseUrl);
        },
      );
    });

    const parsed = parseOAuthRedirectUrl(redirectUrl);
    const userInfo = await fetchGoogleUserInfo(parsed.accessToken);
    return {
      accessToken: parsed.accessToken,
      expiresAt: parsed.expiresAt,
      userEmail: userInfo.email,
      userName: userInfo.name,
    };
  }

  // 2. Web Browser Popup Environment
  return new Promise((resolve, reject) => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      "google_oauth_popup",
      `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no`,
    );

    if (!popup) {
      reject(new Error("Popup blocked. Please allow popups for this site."));
      return;
    }

    const checkTimer = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(checkTimer);
          reject(new Error("Authentication popup was closed by user."));
          return;
        }

        const href = popup.location.href;
        if (href && href.includes("access_token=")) {
          clearInterval(checkTimer);
          popup.close();

          const parsed = parseOAuthRedirectUrl(href);
          const userInfo = await fetchGoogleUserInfo(parsed.accessToken);
          resolve({
            accessToken: parsed.accessToken,
            expiresAt: parsed.expiresAt,
            userEmail: userInfo.email,
            userName: userInfo.name,
          });
        }
      } catch {
        // Cross-origin access error while popup is navigating - expected until redirect matches
      }
    }, 500);
  });
}

function parseOAuthRedirectUrl(url: string): { accessToken: string; expiresAt: number } {
  const hashIndex = url.indexOf("#");
  const queryIndex = url.indexOf("?");
  const hash = hashIndex !== -1 ? url.substring(hashIndex + 1) : queryIndex !== -1 ? url.substring(queryIndex + 1) : "";
  const params = new URLSearchParams(hash);

  const accessToken = params.get("access_token");
  const expiresIn = params.get("expires_in");

  if (!accessToken) {
    const error = params.get("error") || "Failed to retrieve access token.";
    throw new Error(`Google OAuth error: ${error}`);
  }

  const durationSec = parseInt(expiresIn || "3600", 10);
  const expiresAt = Date.now() + durationSec * 1000;

  return { accessToken, expiresAt };
}

/** Fetch user profile info using access token */
export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<{ email?: string; name?: string }> {
  try {
    const res = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { email?: string; name?: string };
    return { email: data.email, name: data.name };
  } catch {
    return {};
  }
}

/** Check if token is valid and Google Drive API is reachable */
export async function checkGoogleDriveConnection(accessToken: string): Promise<boolean> {
  if (!accessToken) return false;
  try {
    const url = `${GDRIVE_FILES_ENDPOINT}?spaces=appDataFolder&pageSize=1`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Find file ID by name in appDataFolder */
async function findFileIdInAppData(accessToken: string, filename: string): Promise<string | null> {
  const q = encodeURIComponent(`name = '${filename}' and 'appDataFolder' in parents and trashed = false`);
  const url = `${GDRIVE_FILES_ENDPOINT}?spaces=appDataFolder&q=${q}&fields=files(id,name)`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { files?: { id: string; name: string }[] };
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/** Upload string content to Google Drive appDataFolder */
export async function uploadToGoogleDrive(
  accessToken: string,
  filename: string,
  content: string,
): Promise<boolean> {
  try {
    const existingFileId = await findFileIdInAppData(accessToken, filename);

    if (existingFileId) {
      // Update content (PATCH / PUT)
      const uploadUrl = `${GDRIVE_UPLOAD_ENDPOINT}/${existingFileId}?uploadType=media`;
      const res = await fetch(uploadUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: content,
      });
      return res.ok;
    } else {
      // Multipart create (metadata + media content)
      const metadata = {
        name: filename,
        parents: ["appDataFolder"],
      };

      const boundary = "-------WBHP_GDRIVE_BOUNDARY";
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const body =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        content +
        closeDelimiter;

      const uploadUrl = `${GDRIVE_UPLOAD_ENDPOINT}?uploadType=multipart`;
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      });
      return res.ok;
    }
  } catch {
    return false;
  }
}

/** Download string content from Google Drive appDataFolder */
export async function downloadFromGoogleDrive(
  accessToken: string,
  filename: string,
): Promise<string | null> {
  try {
    const fileId = await findFileIdInAppData(accessToken, filename);
    if (!fileId) return null;

    const downloadUrl = `${GDRIVE_FILES_ENDPOINT}/${fileId}?alt=media`;
    const res = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ── High-Level Backup / Restore ────────────────────────────────────

export async function backupToGoogleDrive(
  config: GoogleDriveConfig,
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled) {
    return { success: false, message: "Google Drive sync is disabled." };
  }
  if (!config.accessToken) {
    return { success: false, message: "Not authorized with Google." };
  }
  if (config.tokenExpiry && Date.now() >= config.tokenExpiry) {
    return { success: false, message: "Google authorization token expired. Please re-authorize." };
  }

  const snapshot = exportAll();
  const ok = await uploadToGoogleDrive(
    config.accessToken,
    BACKUP_FILENAME,
    JSON.stringify(snapshot, null, 2),
  );

  return ok
    ? { success: true, message: "Backup successfully uploaded to Google Drive." }
    : { success: false, message: "Failed to upload backup to Google Drive." };
}

export async function restoreFromGoogleDrive(
  config: GoogleDriveConfig,
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled) {
    return { success: false, message: "Google Drive sync is disabled." };
  }
  if (!config.accessToken) {
    return { success: false, message: "Not authorized with Google." };
  }
  if (config.tokenExpiry && Date.now() >= config.tokenExpiry) {
    return { success: false, message: "Google authorization token expired. Please re-authorize." };
  }

  const raw = await downloadFromGoogleDrive(config.accessToken, BACKUP_FILENAME);
  if (!raw) {
    return { success: false, message: "No backup found on Google Drive." };
  }

  try {
    const snapshot = JSON.parse(raw) as StorageSnapshot;
    if (snapshot.version !== 1) {
      return { success: false, message: "Unsupported backup format." };
    }
    importAll(snapshot);
    return { success: true, message: "Data successfully restored from Google Drive." };
  } catch {
    return { success: false, message: "Backup file on Google Drive is corrupted." };
  }
}

// ── Auto-backup Scheduler ──────────────────────────────────────────

let _gdriveIntervalId: ReturnType<typeof setInterval> | null = null;
let _gdriveLastKey = "";

export function startGDriveAutoBackup(config: GoogleDriveConfig): void {
  const key = JSON.stringify({
    enabled: config.enabled,
    accessToken: config.accessToken,
    autoBackupInterval: config.autoBackupInterval,
  });

  if (_gdriveIntervalId !== null && key === _gdriveLastKey) return;

  stopGDriveAutoBackup();
  _gdriveLastKey = key;

  if (!config.enabled || !config.accessToken || config.autoBackupInterval <= 0) return;

  _gdriveIntervalId = setInterval(() => {
    backupToGoogleDrive(config).catch(console.warn);
  }, config.autoBackupInterval * 60_000);
}

export function stopGDriveAutoBackup(): void {
  if (_gdriveIntervalId !== null) {
    clearInterval(_gdriveIntervalId);
    _gdriveIntervalId = null;
  }
  _gdriveLastKey = "";
}
