import type { LanguageMode, Translations } from "./translations";
import { zhTranslations, enTranslations } from "./translations";

export * from "./translations";

export function resolveLanguage(mode: LanguageMode = "auto"): "zh" | "en" {
  if (mode === "zh") return "zh";
  if (mode === "en") return "en";
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  }
  return "zh";
}

export function getTranslations(mode: LanguageMode = "auto"): Translations {
  const lang = resolveLanguage(mode);
  return lang === "zh" ? zhTranslations : enTranslations;
}
