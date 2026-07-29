import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkWebDAVConnection,
  backupToWebDAV,
  restoreFromWebDAV,
} from "../../src/services/webdav";
import type { WebDAVConfig } from "../../src/plugins/types";

describe("webdav service", () => {
  const dummyConfig: WebDAVConfig = {
    enabled: true,
    url: "https://dav.example.com",
    username: "user",
    password: "pass",
    autoBackupInterval: 60,
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("checkWebDAVConnection returns true when PROPFIND succeeds", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 207,
    });

    const result = await checkWebDAVConnection(dummyConfig);
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://dav.example.com",
      expect.objectContaining({
        method: "PROPFIND",
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
          Depth: "0",
        }),
      })
    );
  });

  it("backupToWebDAV uploads storage snapshot to WebDAV", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 201,
    });

    const res = await backupToWebDAV(dummyConfig);
    expect(res.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://dav.example.com/wbhp-backup.json",
      expect.objectContaining({
        method: "PUT",
      })
    );
  });

  it("restoreFromWebDAV handles missing backup cleanly", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const res = await restoreFromWebDAV(dummyConfig);
    expect(res.success).toBe(false);
    expect(res.message).toContain("No backup found");
  });
});
