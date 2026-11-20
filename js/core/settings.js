import { AppConfig } from "./config.js";

const STORAGE_KEYS = {
  language: "ha3d_language",
  quality: "ha3d_graphics_quality"
};

export const SettingsService = {
  getLanguage() {
    const saved = localStorage.getItem(STORAGE_KEYS.language);
    if (saved && AppConfig.supportedLanguages.includes(saved)) {
      return saved;
    }
    return AppConfig.defaultLanguage;
  },

  setLanguage(langCode) {
    const valid = AppConfig.supportedLanguages.includes(langCode)
      ? langCode
      : AppConfig.defaultLanguage;
    localStorage.setItem(STORAGE_KEYS.language, valid);
    return valid;
  },

  /**
   * Detects reasonable default graphics quality for mid-range mobile phones.
   * Returns 'low' | 'medium' | 'high'
   */
  getGraphicsQuality() {
    const saved = localStorage.getItem(STORAGE_KEYS.quality);
    if (saved) return saved;

    const deviceMemory = navigator.deviceMemory || 4;
    const defaultQuality = deviceMemory <= 4 ? "medium" : "high";
    localStorage.setItem(STORAGE_KEYS.quality, defaultQuality);
    return defaultQuality;
  },

  setGraphicsQuality(level) {
    if (["low", "medium", "high"].includes(level)) {
      localStorage.setItem(STORAGE_KEYS.quality, level);
    }
  }
};
