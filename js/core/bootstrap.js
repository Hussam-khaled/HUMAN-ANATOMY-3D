import { AppConfig } from "./config.js";
import { SettingsService } from "./settings.js";
import { DatabaseService } from "../data/db.js";
import { I18n } from "../localization/i18n.js";

const diagnostics = {
  db: { status: "pending", detail: "" },
  systems: { status: "pending", detail: "", list: [] },
  i18n: { status: "pending", detail: "" },
  offline: { status: "pending", detail: "" },
  licenses: { status: "pending", detail: "" }
};

function renderDiagnostics() {
  document.title = I18n.t("app_title");

  document.getElementById("app-title").textContent = I18n.t("app_title");
  document.getElementById("app-subtitle").textContent = I18n.t("app_subtitle");
  document.getElementById("phase1-title").textContent = I18n.t("phase1_title");
  document.getElementById("phase1-desc").textContent = I18n.t("phase1_desc");
  document.getElementById("btn-lang").textContent = I18n.t("btn_switch_lang");

  const listEl = document.getElementById("diagnostic-list");
  listEl.innerHTML = "";

  const rows = [
    { key: "check_db", state: diagnostics.db },
    { key: "check_systems", state: diagnostics.systems },
    { key: "check_i18n", state: diagnostics.i18n },
    { key: "check_offline", state: diagnostics.offline },
    { key: "check_licenses", state: diagnostics.licenses }
  ];

  rows.forEach(({ key, state }) => {
    const li = document.createElement("li");
    li.className = "check-item";

    const badgeClass =
      state.status === "ok" ? "badge-ok" :
      state.status === "warn" ? "badge-warn" :
      state.status === "fail" ? "badge-fail" : "badge-pending";

    const badgeText = I18n.t(`status_${state.status}`);

    li.innerHTML = `
      <div>
        <span class="check-label">${I18n.t(key)}</span>
        <span class="check-detail">${state.detail}</span>
      </div>
      <span class="badge ${badgeClass}">${badgeText}</span>
    `;
    listEl.appendChild(li);
  });

  const gridEl = document.getElementById("systems-grid");
  gridEl.innerHTML = "";
  diagnostics.systems.list.forEach((sys) => {
    const div = document.createElement("div");
    div.className = "system-pill";
    div.style.borderInlineStartColor = sys.color;
    div.textContent = I18n.currentLang === "ar" ? sys.nameAr : sys.nameEn;
    gridEl.appendChild(div);
  });
}

async function registerOfflineServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    diagnostics.offline = { status: "warn", detail: "Service Worker not supported in this browser." };
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register(AppConfig.paths.serviceWorker);
    diagnostics.offline = { status: "ok", detail: `Scope: ${reg.scope}` };
  } catch (err) {
    diagnostics.offline = {
      status: "warn",
      detail: `Requires HTTPS or localhost (${err.message})`
    };
  }
}

async function verifyLicenseRegistry() {
  try {
    const res = await fetch(AppConfig.paths.licensesFile);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    diagnostics.licenses = {
      status: "ok",
      detail: `${data.assets.length} open-source entries verified`
    };
  } catch (err) {
    diagnostics.licenses = { status: "fail", detail: err.message };
  }
}

async function bootstrap() {
  // 1. Settings & Localization
  try {
    const lang = SettingsService.getLanguage();
    SettingsService.getGraphicsQuality();
    await I18n.load(lang);
    diagnostics.i18n = {
      status: "ok",
      detail: `Lang: ${I18n.currentLang.toUpperCase()} | Dir: ${I18n.dir.toUpperCase()}`
    };
  } catch (err) {
    diagnostics.i18n = { status: "fail", detail: err.message };
  }

  // 2. Local Offline Database
  try {
    await DatabaseService.init();
    diagnostics.db = { status: "ok", detail: `${AppConfig.dbName} v${AppConfig.dbVersion}` };

    const systems = await DatabaseService.getAllBodySystems();
    diagnostics.systems = {
      status: systems.length === 10 ? "ok" : "fail",
      detail: `${systems.length} / 10`,
      list: systems
    };
  } catch (err) {
    diagnostics.db = { status: "fail", detail: err.message };
    diagnostics.systems = { status: "fail", detail: "Database unavailable", list: [] };
  }

  // 3. Offline Service Worker & License Registry
  await Promise.all([registerOfflineServiceWorker(), verifyLicenseRegistry()]);

  // 4. Bind Live Language Switcher
  document.getElementById("btn-lang").addEventListener("click", async () => {
    const nextLang = I18n.currentLang === "ar" ? "en" : "ar";
    SettingsService.setLanguage(nextLang);
    await I18n.load(nextLang);
    diagnostics.i18n.detail = `Lang: ${I18n.currentLang.toUpperCase()} | Dir: ${I18n.dir.toUpperCase()}`;
    renderDiagnostics();
  });

  renderDiagnostics();
}

document.addEventListener("DOMContentLoaded", bootstrap);
