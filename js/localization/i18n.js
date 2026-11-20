import { AppConfig } from "../core/config.js";

class LocalizationService {
  constructor() {
    this.currentLang = AppConfig.defaultLanguage;
    this.dir = "rtl";
    this.strings = {};
    this.listeners = new Set();
  }

  async load(langCode) {
    const targetLang = AppConfig.supportedLanguages.includes(langCode)
      ? langCode
      : AppConfig.defaultLanguage;

    const url = `${AppConfig.paths.localesDir}/${targetLang}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load locale file: ${url} (HTTP ${response.status})`);
    }

    const data = await response.json();
    this.currentLang = data.languageCode || targetLang;
    this.dir = data.dir || (this.currentLang === "ar" ? "rtl" : "ltr");
    this.strings = data.strings || {};

    this.applyDocumentDirection();
    this.listeners.forEach((cb) => cb(this.currentLang, this.dir));
  }

  applyDocumentDirection() {
    document.documentElement.lang = this.currentLang;
    document.documentElement.dir = this.dir;
  }

  t(key) {
    return this.strings[key] || `[${key}]`;
  }

  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export const I18n = new LocalizationService();
