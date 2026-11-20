import { AppConfig } from "../core/config.js";
import { SettingsService } from "../core/settings.js";
import { DatabaseService } from "../data/db.js";
import { I18n } from "../localization/i18n.js";
import { Router } from "./router.js";
import { AnatomyViewer3D } from "../anatomy3d/viewer3d.js";
import { PhysiologyLabController } from "../physiology/physiologyLab.js";

let activeViewer = null;
let activePhysiology = null;

export function cleanupActiveView() {
  if (activeViewer) {
    activeViewer.dispose();
    activeViewer = null;
  }
  if (activePhysiology) {
    activePhysiology.dispose();
    activePhysiology = null;
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
        <button class="btn-secondary" type="button" data-goto="physiology-lab">${I18n.t("nav_physiology_lab")}</button>
      </div>
    </div>
  `;
}

function renderInteractive3DWorkspace(containerEl, isLabMode) {
  const layerDefs = [
    { key: "skin", labelKey: "layer_skin" },
    { key: "skeletal", labelKey: "layer_skeletal" },
    { key: "muscular", labelKey: "layer_muscular" },
    { key: "organs", labelKey: "layer_organs" },
    { key: "nervous", labelKey: "layer_nervous" },
    { key: "vascular", labelKey: "layer_vascular" }
  ];

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
          <span class="hud-pill">${I18n.t("atlas_tap_hint")}</span>
        </div>

        <div id="atlas-canvas-host" class="viewport-canvas-host"></div>

        <div class="viewport-hud-bottom">
          <button id="btn-reset-cam" class="hud-btn" type="button">${I18n.t("btn_reset_camera")}</button>
          <button id="btn-show-all" class="hud-btn" type="button">${I18n.t("btn_show_all")}</button>
          <button id="btn-auto-rotate" class="hud-btn" type="button">${I18n.t("btn_auto_rotate")}</button>
        </div>
      </div>

      <section id="selection-card" class="selection-card">
        <div class="selection-header">
          <div>
            <div id="selected-name-primary" class="card-title"></div>
            <div id="selected-name-secondary" class="card-desc"></div>
          </div>
          <span id="selected-layer-badge" class="badge badge-ok"></span>
        </div>
        <div class="selection-actions">
          <button id="btn-isolate" class="btn-primary" type="button">${I18n.t("btn_isolate")}</button>
          <button id="btn-hide-part" class="btn-secondary" type="button">${I18n.t("btn_hide_part")}</button>
          <button id="btn-clear-sel" class="btn-secondary" type="button">${I18n.t("btn_clear_selection")}</button>
        </div>
      </section>

      <section class="tools-panel">
        <div class="explode-row">
          <div class="explode-header">
            <span>${I18n.t("tool_exploded_view")}</span>
            <span id="explode-percent">0%</span>
          </div>
          <input id="explode-slider" class="range-slider" type="range" min="0" max="100" value="0" />
        </div>

        <div id="layers-section">
          <div class="card-desc" style="margin-bottom:8px;">${I18n.t("tool_layers_title")}</div>
          <div class="layers-grid">
            ${layerDefs
              .map(
                (l) =>
                  `<button class="layer-chip is-active" type="button" data-layer="${l.key}">${I18n.t(l.labelKey)}</button>`
              )
              .join("")}
          </div>
        </div>
      </section>

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
  const layersSection = containerEl.querySelector("#layers-section");
  const btnRotate = containerEl.querySelector("#btn-auto-rotate");
  const btnRestore = containerEl.querySelector("#btn-restore-proto");
  const fileInput = containerEl.querySelector("#glb-file-input");

  const selectionCard = containerEl.querySelector("#selection-card");
  const selPrimary = containerEl.querySelector("#selected-name-primary");
  const selSecondary = containerEl.querySelector("#selected-name-secondary");
  const selBadge = containerEl.querySelector("#selected-layer-badge");
  const explodeSlider = containerEl.querySelector("#explode-slider");
  const explodePercent = containerEl.querySelector("#explode-percent");

  activeViewer = new AnatomyViewer3D(canvasHost, {
    onStatsUpdate: ({ label, meshCount, isCustomModel }) => {
      statsEl.textContent = `${label} • ${meshCount} ${I18n.t("atlas_parts_unit")}`;
      layersSection.style.display = isCustomModel ? "none" : "block";
      btnRestore.style.display = isCustomModel ? "inline-block" : "none";
      disclaimerEl.style.display = isCustomModel ? "none" : "flex";
    },
    onSelectPart: (part) => {
      if (!part) {
        selectionCard.classList.remove("is-visible");
        return;
      }
      selPrimary.textContent = I18n.currentLang === "ar" ? part.nameAr : part.nameEn;
      selSecondary.textContent = I18n.currentLang === "ar" ? part.nameEn : part.nameAr;
      const layerKey = `layer_${part.layer}`;
      selBadge.textContent = I18n.t(layerKey) !== layerKey ? I18n.t(layerKey) : part.layer;
      selectionCard.classList.add("is-visible");
    }
  });

  activeViewer.init();

  if (isLabMode) {
    explodeSlider.value = "25";
    explodePercent.textContent = "25%";
    activeViewer.setExplodeFactor(0.25);
  }

  containerEl.querySelector("#btn-reset-cam").addEventListener("click", () => {
    activeViewer.resetCamera();
  });

  containerEl.querySelector("#btn-show-all").addEventListener("click", () => {
    activeViewer.showAllParts();
    explodeSlider.value = "0";
    explodePercent.textContent = "0%";
    activeViewer.setExplodeFactor(0);
    containerEl.querySelectorAll(".layer-chip").forEach((c) => c.classList.add("is-active"));
  });

  btnRotate.addEventListener("click", () => {
    const rotating = activeViewer.toggleAutoRotate();
    btnRotate.classList.toggle("is-active", rotating);
  });

  containerEl.querySelector("#btn-isolate").addEventListener("click", () => {
    activeViewer.isolateSelected();
  });

  containerEl.querySelector("#btn-hide-part").addEventListener("click", () => {
    activeViewer.hideSelected();
  });

  containerEl.querySelector("#btn-clear-sel").addEventListener("click", () => {
    activeViewer.clearSelection();
  });

  explodeSlider.addEventListener("input", (e) => {
    const val = Number(e.target.value);
    explodePercent.textContent = `${val}%`;
    activeViewer.setExplodeFactor(val / 100);
  });

  containerEl.querySelectorAll(".layer-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const nextActive = !chip.classList.contains("is-active");
      chip.classList.toggle("is-active", nextActive);
      activeViewer.setLayerVisibility(chip.getAttribute("data-layer"), nextActive);
    });
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
      explodeSlider.value = "0";
      explodePercent.textContent = "0%";
    } catch (err) {
      alert(`${I18n.t("atlas_import_error")}: ${err.message}`);
    } finally {
      loadingEl.classList.remove("is-visible");
      fileInput.value = "";
    }
  });

  btnRestore.addEventListener("click", () => {
    activeViewer.loadPrototypeModel();
    explodeSlider.value = "0";
    explodePercent.textContent = "0%";
    containerEl.querySelectorAll(".layer-chip").forEach((c) => c.classList.add("is-active"));
  });
}

export async function renderView(routeId, containerEl, onLanguageChange) {
  cleanupActiveView();

  if (routeId === "atlas") {
    renderInteractive3DWorkspace(containerEl, false);
    return;
  }

  if (routeId === "anatomy-lab") {
    renderInteractive3DWorkspace(containerEl, true);
    return;
  }

  if (routeId === "physiology-lab") {
    activePhysiology = new PhysiologyLabController(containerEl);
    activePhysiology.init();
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
