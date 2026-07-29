import { describe, it, expect } from "vitest";
import { zhTranslations, enTranslations, resolveLanguage, getTranslations } from "../../src/i18n";

describe("i18n translation system", () => {
  it("should match keys between zh and en translations perfectly", () => {
    function getDeepKeys(obj: Record<string, any>, prefix = ""): string[] {
      let keys: string[] = [];
      for (const k of Object.keys(obj)) {
        const path = prefix ? `${prefix}.${k}` : k;
        if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
          keys = keys.concat(getDeepKeys(obj[k], path));
        } else {
          keys.push(path);
        }
      }
      return keys;
    }

    const zhKeys = getDeepKeys(zhTranslations).sort();
    const enKeys = getDeepKeys(enTranslations).sort();

    expect(zhKeys).toEqual(enKeys);
  });

  it("resolveLanguage should correctly resolve mode or navigator default", () => {
    expect(resolveLanguage("zh")).toBe("zh");
    expect(resolveLanguage("en")).toBe("en");
    expect(["zh", "en"]).toContain(resolveLanguage("auto"));
  });

  it("getTranslations returns correct dictionary object", () => {
    const zh = getTranslations("zh");
    const en = getTranslations("en");
    expect(zh.settings.title).toBe("设置");
    expect(en.settings.title).toBe("Settings");
  });
});
