import zhJson from "./locales/zh.json";
import enJson from "./locales/en.json";

export type LanguageMode = "auto" | "zh" | "en";
export type FontFamily = "misans" | "serif" | "opensans" | "system";

export type Translations = typeof zhJson;

export const zhTranslations: Translations = zhJson;
export const enTranslations: Translations = enJson;
