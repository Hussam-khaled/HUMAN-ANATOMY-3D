import { AppConfig } from "../core/config.js";
import { SettingsService } from "../core/settings.js";
import { DatabaseService } from "../data/db.js";
import { I18n } from "../localization/i18n.js";
import { Router } from "./router.js";
import { AnatomyViewer3D } from "../anatomy3d/viewer3d.js";

let activeViewer = null;

export function cleanupActiveView() {
  if (activeViewer) {
    activeViewer.dispose();
    activeViewer = null;
  }
}

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
        <button class="btn-secondary" type="button" data-goto="atlas">${I18n.t("nav_atlas")}</button>
        <button class="btn-secondary" type="button" data-goto="systems">${I18n.t("nav_systems")}</button>
      </div>
    </div>
  `;
}

export async function renderView(routeId, containerEl, onLanguageChange) {
  cleanupActiveView();

  if (routeId === "atlas") {
    containerEl.innerHTML = `
      <div class="atlas-layout">
        <div id="prototype-disclaimer" class="disclaimer-banner">
          <span>${I18n.t("atlas_prototype_disclaimer")}</span>
        </div>

        <div class="viewport-wrapper">
          <div id="viewer-loading" class="viewport-loading">
            <span>${I18n.t("status_pending")}</span>
          </div>

          <div class="viewport-hud-top">
            <span id="hud-model-stats" class="hud-pill">${I18n.t("atlas_meshes_loading")}</span>
            <span class="hud-pill">${I18n.t("atlas_gesture_hint")}</span>
          </div>

          <div id="atlas-canvas-host" class="viewport-canvas-host"></div>

          <div class="viewport-hud-bottom">
            <button id="btn-reset-cam" class="hud-btn" type="button">${I18n.t("btn_reset_camera")}</button>
            <button id="btn-toggle-skin" class="hud-btn is-active" type="button">${I18n.t("btn_toggle_skin")}</button>
            <button id="btn-auto-rotate" class="hud-btn" type="button">${I18n.t("btn_auto_rotate")}</button>
          </div>
        </div>

        <section class="import-bar">
          <div>
            <div class="card-title">${I18n.t("atlas_import_title")}</div>
            <div class="card-desc">${I18n.t("atlas_import_desc")}</div>
          </div>
          <div class="import-actions">
            <input id="glb-file-input" class="file-input-hidden" type="file" accept=".glb,.gltf" />
            <button id="btn-import-glb" class="btn-primary" type="button">${I18n.t("btn_import_glb")}</button>
            <button id="btn-restore-proto" class="btn-secondary" type="button" style="display:none;">${I18n.t("btn_restore_prototype")}</button>
          </div>
        </section>
      </div>
    `;

    const canvasHost = containerEl.querySelector("#atlas-canvas-host");
    const statsEl = containerEl.querySelector("#hud-model-stats");
    const loadingEl = containerEl.querySelector("#viewer-loading");
    const disclaimerEl = containerEl.querySelector("#prototype-disclaimer");
    const btnSkin = containerEl.querySelector("#btn-toggle-skin");
    const btnRotate = containerEl.querySelector("#btn-auto-rotate");
    const btnRestore = containerEl.querySelector("#btn-restore-proto");
    const fileInput = containerEl.querySelector("#glb-file-input");

    activeViewer = new AnatomyViewer3D(canvasHost, ({ label, meshCount, isCustomModel }) => {
      statsEl.textContent = `${label} • ${meshCount} ${I18n.t("atlas_parts_unit")}`;
      btnSkin.style.display = isCustomModel ? "none" : "inline-block";
      btnRestore.style.display = isCustomModel ? "inline-block" : "none";
      disclaimerEl.style.display = isCustomModel ? "none" : "flex";
    });

    activeViewer.init();

    containerEl.querySelector("#btn-reset-cam").addEventListener("click", () => {
      activeViewer.resetCamera();
    });

    btnSkin.addEventListener("click", () => {
      const visible = activeViewer.toggleSkinLayer();
      btnSkin.classList.toggle("is-active", visible);
    });

    btnRotate.addEventListener("click", () => {
      const rotating = activeViewer.toggleAutoRotate();
      btnRotate.classList.toggle("is-active", rotating);
    });

    containerEl.querySelector("#btn-import-glb").addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      loadingEl.classList.add("is-visible");
      try {
        await activeViewer.loadLocalGltfFile(file);
      } catch (err) {
        alert(`${I18n.t("atlas_import_error")}: ${err.message}`);
      } finally {
        loadingEl.classList.remove("is-visible");
        fileInput.value = "";
      }
    });

    btnRestore.addEventListener("click", () => {
      activeViewer.loadPrototypeModel();
      btnSkin.classList.add("is-active");
    });

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
