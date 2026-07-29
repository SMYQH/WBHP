import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function runCmd(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: rootDir, stdio: "inherit" });
}

function getPkgVersion() {
  const pkgPath = path.join(rootDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  return pkg.version;
}

function parseSemver(v) {
  const match = v.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function computeNextVersion(currentVersion, arg) {
  if (!arg || arg === "patch") {
    const sem = parseSemver(currentVersion);
    if (!sem) throw new Error(`Cannot parse semver: ${currentVersion}`);
    return `${sem.major}.${sem.minor}.${sem.patch + 1}`;
  }
  if (arg === "minor") {
    const sem = parseSemver(currentVersion);
    if (!sem) throw new Error(`Cannot parse semver: ${currentVersion}`);
    return `${sem.major}.${sem.minor + 1}.0`;
  }
  if (arg === "major") {
    const sem = parseSemver(currentVersion);
    if (!sem) throw new Error(`Cannot parse semver: ${currentVersion}`);
    return `${sem.major + 1}.0.0`;
  }
  // Remove leading 'v' if user typed 'v0.4.4'
  const clean = arg.replace(/^v/, "");
  if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(clean)) {
    throw new Error(`Invalid version target: "${arg}". Must be a valid semver string or patch/minor/major.`);
  }
  return clean;
}

function updateFile(filePath, replacer) {
  const fullPath = path.join(rootDir, filePath);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, "utf-8");
  const updated = replacer(content);
  fs.writeFileSync(fullPath, updated, "utf-8");
  console.log(`Updated ${filePath}`);
}

async function main() {
  const arg = process.argv[2];
  const currentVersion = getPkgVersion();
  const nextVersion = computeNextVersion(currentVersion, arg);

  console.log(`\n🚀 Preparing WBHP Release v${nextVersion} (current: v${currentVersion})\n`);

  // 1. Update version in package.json
  updateFile("package.json", (code) =>
    code.replace(/"version":\s*"[^"]+"/, `"version": "${nextVersion}"`)
  );

  // 2. Update version in manifest/chrome.json
  updateFile("manifest/chrome.json", (code) =>
    code.replace(/"version":\s*"[^"]+"/, `"version": "${nextVersion}"`)
  );

  // 3. Update version in manifest/firefox.json
  updateFile("manifest/firefox.json", (code) =>
    code.replace(/"version":\s*"[^"]+"/, `"version": "${nextVersion}"`)
  );

  // 4. Update version in updates-chrome.xml
  updateFile("updates-chrome.xml", (code) =>
    code.replace(/version="[^"]+"/, `version="${nextVersion}"`)
  );

  // 5. Update version in updates-firefox.json
  updateFile("updates-firefox.json", (code) =>
    code.replace(/"version":\s*"[^"]+"/, `"version": "${nextVersion}"`)
  );

  // 6. Build and typecheck verification
  console.log("\n📦 Running full build and typecheck...");
  runCmd("npm run build:all");

  // 7. Git commit, tag, and push
  console.log("\n🔀 Committing version bump, creating tag, and pushing to origin...");
  runCmd("git add -A");
  runCmd(`git commit -m "chore(release): release v${nextVersion}"`);
  runCmd(`git tag -a v${nextVersion} -m "v${nextVersion} release"`);
  runCmd("git push origin master --tags");

  console.log(`\n✅ Release v${nextVersion} successfully published and pushed to GitHub!\n`);
}

main().catch((err) => {
  console.error(`\n❌ Release failed: ${err.message}`);
  process.exit(1);
});
