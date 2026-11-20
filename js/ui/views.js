import { AppConfig } from "../core/config.js";
import { SettingsService } from "../core/settings.js";
import { DatabaseService } from "../data/db.js";
import { I18n } from "../localization/i18n.js";
import { Router } from "./router.js";

function renderStageNotice(titleKey, descKey, phaseLabelKey) {
  return `
    <section class="section-hero">
      <h2>${I18n.t(titleKey)}</h2>
      <p>${I18n.t(descKey)}</p>
    </section>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <span class="card-title">${I18n.t("module_ready_shell")}</span>
        <span class="badge badge-warn">${I18n.t(phaseLabelKey)}</span>
      </div>
      <p class="card-desc">${I18n.t("module_honesty_note")}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn-secondary" type="button" data-goto="systems">${I18n.t("nav_systems")}</button>
        <button class="btn-secondary" type="button" data-goto="settings">${I18n.t("nav_settings")}</button>
      </div>
    </div>
  `;
}

export async function renderView(routeId, containerEl, onLanguageChange) {
  if (routeId === "atlas") {
    containerEl.innerHTML = renderStageNotice("nav_atlas", "desc_atlas", "planned_phase_3");
    bindGotoButtons(containerEl);
    return;
  }

  if (routeId === "systems") {
    const systems = await DatabaseService.getAllBodySystems();
    const cardsHtml = systems
      .map((sys) => {
        const name = I18n.currentLang === "ar" ? sys.nameAr : sys.nameEn;
        const secondaryName = I18n.currentLang === "ar" ? sys.nameEn : sys.nameAr;
        const visBadge = sys.defaultVisible
          ? `<span class="badge badge-ok">${I18n.t("status_active_layer")}</span>`
          : `<span class="badge badge-pending">${I18n.t("status_ondemand_layer")}</span>`;

        return `
          <article class="system-card" style="border-inline-start-color:${sys.color}">
            <div>
              <div class="card-title">${name}</div>
              <div class="system-meta">${secondaryName}</div>
            </div>
            ${visBadge}
          </article>
        `;
      })
      .join("");

    containerEl.innerHTML = `
      <section class="section-hero">
        <h2>${I18n.t("nav_systems")}</h2>
        <p>${I18n.t("desc_systems")}</p>
      </section>
      <div class="cards-grid">${cardsHtml}</div>
    `;
    return;
  }

  if (routeId === "anatomy-lab") {
    containerEl.innerHTML = renderStageNotice("nav_anatomy_lab", "desc_anatomy_lab", "planned_phase_4");
    bindGotoButtons(containerEl);
    return;
  }

  if (routeId === "physiology-lab") {
    containerEl.innerHTML = renderStageNotice("nav_physiology_lab", "desc_physiology_lab", "planned_phase_6");
    bindGotoButtons(containerEl);
    return;
  }

  if (routeId === "imaging-lab") {
    containerEl.innerHTML = renderStageNotice("nav_imaging_lab", "desc_imaging_lab", "planned_phase_7");
    bindGotoButtons(containerEl);
    return;
  }

  if (routeId === "academy") {
    containerEl.innerHTML = renderStageNotice("nav_academy", "desc_academy", "planned_phase_8");
    bindGotoButtons(containerEl);
    return;
  }

  if (routeId === "quiz") {
    containerEl.innerHTML = renderStageNotice("nav_quiz", "desc_quiz", "planned_phase_9");
    bindGotoButtons(containerEl);
    return;
  }

  if (routeId === "settings") {
    const currentLang = SettingsService.getLanguage();
    const currentQuality = SettingsService.getGraphicsQuality();

    containerEl.innerHTML = `
      <section class="section-hero">
        <h2>${I18n.t("nav_settings")}</h2>
        <p>${I18n.t("desc_settings")}</p>
      </section>

      <div class="setting-row">
        <div>
          <div class="card-title">${I18n.t("setting_language")}</div>
          <div class="card-desc">${I18n.t("setting_language_desc")}</div>
        </div>
        <select id="select-language" class="select-control">
          <option value="ar" ${currentLang === "ar" ? "selected" : ""}>العربية (RTL)</option>
          <option value="en" ${currentLang === "en" ? "selected" : ""}>English (LTR)</option>
        </select>
      </div>

      <div class="setting-row">
        <div>
          <div class="card-title">${I18n.t("setting_quality")}</div>
          <div class="card-desc">${I18n.t("setting_quality_desc")}</div>
        </div>
        <select id="select-quality" class="select-control">
          <option value="low" ${currentQuality === "low" ? "selected" : ""}>${I18n.t("quality_low")}</option>
          <option value="medium" ${currentQuality === "medium" ? "selected" : ""}>${I18n.t("quality_medium")}</option>
          <option value="high" ${currentQuality === "high" ? "selected" : ""}>${I18n.t("quality_high")}</option>
        </select>
      </div>

      <div class="setting-row">
        <div>
          <div class="card-title">${I18n.t("check_licenses")}</div>
          <div class="card-desc">${I18n.t("setting_licenses_desc")}</div>
        </div>
        <button id="btn-open-licenses" class="btn-primary" type="button">${I18n.t("btn_view_licenses")}</button>
      </div>
    `;

    containerEl.querySelector("#select-language").addEventListener("change", async (e) => {
      await onLanguageChange(e.target.value);
    });

    containerEl.querySelector("#select-quality").addEventListener("change", (e) => {
      SettingsService.setGraphicsQuality(e.target.value);
    });

    containerEl.querySelector("#btn-open-licenses").addEventListener("click", openLicensesModal);
  }
}

function bindGotoButtons(containerEl) {
  containerEl.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => {
      Router.navigate(btn.getAttribute("data-goto"));
    });
  });
}

async function openLicensesModal() {
  const modal = document.getElementById("app-modal");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");

  titleEl.textContent = I18n.t("check_licenses");
  bodyEl.innerHTML = `<p class="card-desc">${I18n.t("status_pending")}</p>`;
  modal.classList.add("is-open");

  try {
    const res = await fetch(AppConfig.paths.licensesFile);
    const data = await res.json();
    bodyEl.innerHTML = data.assets
      .map(
        (asset) => `
        <div class="license-item">
          <strong>${asset.name} (${asset.license})</strong>
          <small>${asset.category}</small>
          <small>${asset.notes}</small>
          <small style="direction:ltr;text-align:start;margin-top:4px;color:var(--text-primary);">${asset.sourceUrl}</small>
        </div>
      `
      )
      .join("");
  } catch (err) {
    bodyEl.innerHTML = `<p class="card-desc">${err.message}</p>`;
  }
}
