import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const rootDir = path.resolve(__dirname, "../../");

describe("Extension Build & Background Script Regression Tests", () => {
  it("verifies public/background.js exists and evaluates cleanly without top-level errors", () => {
    const bgPath = path.join(rootDir, "public", "background.js");
    expect(fs.existsSync(bgPath)).toBe(true);

    const code = fs.readFileSync(bgPath, "utf-8");
    expect(code.trim().length).toBeGreaterThan(0);

    // Mock chrome extension environment to simulate Chrome Service Worker evaluation
    const mockChrome = {
      runtime: {
        onInstalled: { addListener: () => {} },
        onStartup: { addListener: () => {} },
        onUpdateAvailable: { addListener: () => {} },
        requestUpdateCheck: () => {},
        reload: () => {},
      },
      alarms: {
        create: () => {},
        onAlarm: { addListener: () => {} },
      },
    };

    const context = vm.createContext({
      chrome: mockChrome,
      typeof: (val: unknown) => typeof val,
      console,
    });

    // Should evaluate without throwing any uncaught exceptions
    expect(() => {
      vm.runInContext(code, context);
    }).not.toThrow();
  });

  it("verifies manifest definitions for background scripts in chrome.json and firefox.json", () => {
    const chromeManifestPath = path.join(rootDir, "manifest", "chrome.json");
    const firefoxManifestPath = path.join(rootDir, "manifest", "firefox.json");

    expect(fs.existsSync(chromeManifestPath)).toBe(true);
    expect(fs.existsSync(firefoxManifestPath)).toBe(true);

    const chromeManifest = JSON.parse(fs.readFileSync(chromeManifestPath, "utf-8"));
    const firefoxManifest = JSON.parse(fs.readFileSync(firefoxManifestPath, "utf-8"));

    // Chrome MV3 requirement: background.service_worker must be specified
    expect(chromeManifest.manifest_version).toBe(3);
    expect(chromeManifest.background).toBeDefined();
    expect(chromeManifest.background.service_worker).toBe("background.js");

    // Firefox MV3 requirement: background.scripts or background.service_worker
    expect(firefoxManifest.manifest_version).toBe(3);
    expect(firefoxManifest.background).toBeDefined();
    expect(firefoxManifest.background.scripts).toContain("background.js");
  });

  it("verifies built artifacts structure and background.js inclusion", () => {
    const distChrome = path.join(rootDir, "dist-chrome");
    const distFirefox = path.join(rootDir, "dist-firefox");

    if (fs.existsSync(distChrome)) {
      expect(fs.existsSync(path.join(distChrome, "background.js"))).toBe(true);
      expect(fs.existsSync(path.join(distChrome, "manifest.json"))).toBe(true);
      expect(fs.existsSync(path.join(distChrome, "wbhp-chrome.crx"))).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(path.join(distChrome, "manifest.json"), "utf-8"));
      expect(manifest.background?.service_worker).toBe("background.js");
    }

    if (fs.existsSync(distFirefox)) {
      expect(fs.existsSync(path.join(distFirefox, "background.js"))).toBe(true);
      expect(fs.existsSync(path.join(distFirefox, "manifest.json"))).toBe(true);
      expect(fs.existsSync(path.join(distFirefox, "wbhp-firefox.crx"))).toBe(true);
    }
  });
});
