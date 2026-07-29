import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import sharp from "sharp";

const rootDir = import.meta.dirname;
const browser = process.env.BROWSER || "chrome";
const keyDir = resolve(rootDir, "keys");
const keyExists = !process.env.CRX_KEY && existsSync(resolve(keyDir, `${browser}.pem`));

let tmpKeyPath: string | null = null;

/** Resolve the signing key path. In CI, reads from CRX_KEY env var (base64). */
function getKeyPath(): string {
  const envKey = process.env.CRX_KEY;
  if (envKey) {
    const tmpKey = resolve(tmpdir(), `wbhp-${browser}-${Date.now()}.pem`);
    writeFileSync(tmpKey, Buffer.from(envKey, "base64"));
    return tmpKey;
  }
  if (!existsSync(keyDir)) mkdirSync(keyDir, { recursive: true });
  return resolve(keyDir, `${browser}.pem`);
}

/**
 * Convert icon.svg to PNGs at sizes required by the manifest.
 * Chrome's `icons` field requires raster images (PNG), not SVG.
 * SVG is the single source of truth; PNGs are generated in-process at build time.
 */
async function generatePngIcons(outDir: string): Promise<void> {
  // Source SVG lives in /assets (outside public/) so Vite's auto-copy
  // doesn't ship the unrasterized source into dist/.
  const svgPath = resolve(rootDir, "assets", "icon.svg");
  if (!existsSync(svgPath)) {
    console.warn("⚠️  icon.svg not found, skipping PNG generation");
    return;
  }
  const svgBuffer = readFileSync(svgPath);
  const sizes = [16, 32, 48, 128];
  const distIconsDir = resolve(outDir, "icons");
  mkdirSync(distIconsDir, { recursive: true });
  for (const size of sizes) {
    await sharp(svgBuffer).resize(size, size).png().toFile(resolve(distIconsDir, `icon-${size}.png`));
  }
  console.log(`✅ Generated PNG icons (${sizes.join(", ")})`);
}

function copyDirRecursive(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = resolve(src, entry.name);
    const d = resolve(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(s, d);
    else copyFileSync(s, d);
  }
}

function getAppVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(rootDir, "package.json"), "utf8")) as { version?: string };
    const envVer = (process.env.BUILD_VERSION || process.env.GITHUB_REF_NAME || "").replace(/^v/, "").trim();
    return envVer && /^\d+\.\d+/.test(envVer) ? envVer : pkg.version || "0.2.0";
  } catch {
    return "0.2.0";
  }
}

const appVersion = getAppVersion();

const outDirName = browser === "firefox" ? "dist-firefox" : "dist";

function buildExtensionPlugin() {
  return {
    name: "build-extension",
    async closeBundle() {
      const outDir = resolve(rootDir, outDirName);
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

      // 1. Copy browser-specific manifest
      const manifestSrc = resolve(rootDir, "manifest", `${browser}.json`);
      const manifestDest = resolve(outDir, "manifest.json");
      if (existsSync(manifestSrc)) {
        // Keep package version in sync with package.json or git release tag when building.
        try {
          const manifest = JSON.parse(readFileSync(manifestSrc, "utf8")) as Record<string, unknown>;
          manifest.version = appVersion;
          writeFileSync(manifestDest, JSON.stringify(manifest, null, 2) + "\n");
        } catch {
          copyFileSync(manifestSrc, manifestDest);
        }
        console.log(`✅ Copied ${browser} manifest.json (v${appVersion})`);
      }

      // 2. Generate PNG icons from SVG (Chrome requires raster icons in manifest)
      try {
        await generatePngIcons(outDir);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`⚠️  PNG icon generation failed: ${message}`);
      }

      // 3. Copy other public assets, excluding icons/ (handled above)
      const publicDir = resolve(rootDir, "public");
      if (existsSync(publicDir)) {
        for (const entry of readdirSync(publicDir, { withFileTypes: true })) {
          if (entry.name === "icons") continue;
          const src = resolve(publicDir, entry.name);
          const dest = resolve(outDir, entry.name);
          if (entry.isDirectory()) copyDirRecursive(src, dest);
          else copyFileSync(src, dest);
        }
      }

      // 4. Package as .crx (CRX3 format), browser-specific filename
      try {
        const keyPath = getKeyPath();
        if (process.env.CRX_KEY) tmpKeyPath = keyPath;
        const { default: crx3 } = await import("crx3");
        const crxPath = resolve(outDir, `wbhp-${browser}.crx`);

        const distFiles = readdirSync(outDir, { recursive: true }) as string[];
        const manifestFiles = distFiles
          .filter((f) => f.endsWith("manifest.json"))
          .map((f) => resolve(outDir, f));

        await crx3(manifestFiles, { keyPath, crxPath });

        console.log(`✅ Packaged wbhp-${browser}.crx (${keyExists ? "existing" : "new"} key)`);

        if (tmpKeyPath) {
          try { unlinkSync(tmpKeyPath); } catch { /* ignore */ }
          tmpKeyPath = null;
        }
      } catch (err: unknown) {
        if (tmpKeyPath) {
          try { unlinkSync(tmpKeyPath); } catch { /* ignore */ }
          tmpKeyPath = null;
        }
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`⚠️  CRX packaging skipped: ${message}`);
      }
    },
  };
}

export default defineConfig({
  // Extension pages are loaded as chrome-extension://…/index.html — absolute
  // root paths break asset loading. Relative base keeps JS/CSS co-located.
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [tailwindcss(), react(), buildExtensionPlugin()],
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
  },
  build: {
    outDir: outDirName,
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
    rollupOptions: {
      output: {
        // Keep chunk names stable and avoid hashed entry names that confuse
        // manual inspection of unpacked extensions.
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
