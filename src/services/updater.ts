export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  releaseNotes?: string;
  error?: string;
}

const GITHUB_RELEASE_API = "https://api.github.com/repos/SMYQH/wbhp/releases/latest";
const FALLBACK_RELEASE_URL = "https://github.com/SMYQH/wbhp/releases";

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

/** Check GitHub Releases API for new version */
export async function checkForUpdates(currentVersion: string = "0.2.0"): Promise<UpdateCheckResult> {
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

    const data = (await res.json()) as { tag_name?: string; html_url?: string; body?: string };
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

    const hasUpdate = compareSemver(rawTag, currentVersion) > 0;
    return {
      hasUpdate,
      currentVersion,
      latestVersion: rawTag,
      releaseUrl,
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
