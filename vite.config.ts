import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { existsSync, mkdirSync, copyFileSync, readdirSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";

const rootDir = import.meta.dirname;
const browser = process.env.BROWSER || "chrome";
const keyDir = resolve(rootDir, "keys");

/** Resolve the signing key path. In CI, reads from CRX_KEY env var (base64). */
function getKeyPath(): string {
  const envKey = process.env.CRX_KEY;
  if (envKey) {
    // CI: write base64-encoded key to temp file
    const tmpKey = resolve(tmpdir(), `wbhp-${browser}-${Date.now()}.pem`);
    writeFileSync(tmpKey, Buffer.from(envKey, "base64"));
    return tmpKey;
  }
  // Local: use key file from keys/ directory
  if (!existsSync(keyDir)) mkdirSync(keyDir, { recursive: true });
  return resolve(keyDir, `${browser}.pem`);
}

let tmpKeyPath: string | null = null;

function buildExtensionPlugin() {
  return {
    name: "build-extension",
    async closeBundle() {
      const outDir = resolve(rootDir, "dist");
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

      // 1. Copy browser-specific manifest
      const manifestSrc = resolve(rootDir, "manifest", `${browser}.json`);
      const manifestDest = resolve(outDir, "manifest.json");
      if (existsSync(manifestSrc)) {
        copyFileSync(manifestSrc, manifestDest);
        console.log(`✅ Copied ${browser} manifest.json`);
      }

      // 2. Copy icons
      const iconsDir = resolve(rootDir, "public", "icons");
      if (existsSync(iconsDir)) {
        const icons = readdirSync(iconsDir);
        for (const icon of icons) {
          copyFileSync(resolve(iconsDir, icon), resolve(outDir, icon));
        }
        console.log("✅ Copied icons");
      }

      // 3. Package as .crx (CRX3 format)
      try {
        const keyPath = getKeyPath();
        if (process.env.CRX_KEY) tmpKeyPath = keyPath;
        const { default: crx3 } = await import("crx3");
        const crxPath = resolve(outDir, "wbhp.crx");

        // List files in dist to include in CRX
        const distFiles = readdirSync(outDir, { recursive: true }) as string[];
        const manifestFiles = distFiles
          .filter((f) => f.endsWith("manifest.json"))
          .map((f) => resolve(outDir, f));

        await crx3(manifestFiles, {
          keyPath,
          crxPath,
        });

        console.log(`✅ Packaged ${browser}.crx (${keyExists ? "existing" : "new"} key)`);

        // Clean up temp key if created from env
        if (tmpKeyPath) {
          try { unlinkSync(tmpKeyPath); } catch { /* ignore */ }
          tmpKeyPath = null;
        }
      } catch (err: any) {
        // Clean up temp key on error too
        if (tmpKeyPath) {
          try { unlinkSync(tmpKeyPath); } catch { /* ignore */ }
          tmpKeyPath = null;
        }
        console.warn(`⚠️  CRX packaging skipped: ${err.message}`);
        console.warn("   Install chrome.exe for native packaging, or crx3 for cross-platform.");
      }
    },
  };
}

// Track whether key existed before this build (local file check only)
const keyExists = !process.env.CRX_KEY && existsSync(resolve(rootDir, "keys", `${browser}.pem`));

export default defineConfig({
  plugins: [tailwindcss(), react(), buildExtensionPlugin()],
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
