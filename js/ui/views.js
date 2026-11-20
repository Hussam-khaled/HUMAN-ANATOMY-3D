import { AppConfig } from "../core/config.js";
import { SettingsService } from "../core/settings.js";
import { DatabaseService } from "../data/db.js";
import { I18n } from "../localization/i18n.js";
import { Router } from "./router.js";
import { AnatomyViewer3D } from "../anatomy3d/viewer3d.js";
import { ImagingLabController } from "../imaging/imagingLab.js";

let activeViewer = null;
let physAnimId = null;

export function cleanupActiveView() {
  if (activeViewer) {
    activeViewer.dispose();
    activeViewer = null;
  }
  if (physAnimId) {
    cancelAnimationFrame(physAnimId);
    physAnimId = null;
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

function renderPhysiologyLab(containerEl) {
  const isAr = I18n.currentLang === "ar";
  let mode = "cardio";
  let hr = 72;
  let rr = 14;
  let load = 35;
  let phase = 0;

  containerEl.innerHTML = `
    <div class="phys-layout">
      <section class="section-hero">
        <h2>${I18n.t("nav_physiology_lab")}</h2>
        <p>${I18n.t("desc_physiology_lab")}</p>
      </section>

      <div class="phys-tabs">
        <button class="phys-tab-btn is-active" type="button" data-pmode="cardio">${isAr ? "القلب والدورة الدموية" : "Heart & Circulation"}</button>
        <button class="phys-tab-btn" type="button" data-pmode="resp">${isAr ? "التنفس والرئتان" : "Lungs & Respiration"}</button>
        <button class="phys-tab-btn" type="button" data-pmode="musc">${isAr ? "العضلات والمفاصل" : "Muscles & Joints"}</button>
      </div>

      <div class="phys-workspace">
        <section class="sim-panel">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <span id="p-title" class="card-title"></span>
            <span id="p-badge" class="badge badge-ok"></span>
          </div>

          <div class="monitor-stage">
            <div class="organ-diagram-box">
              <div id="p-organ-box"></div>
              <span id="p-organ-lbl" class="organ-diagram-label"></span>
            </div>

            <div class="waveform-box">
              <div class="monitor-top-bar">
                <span><span class="live-dot"></span><span id="p-trace-lbl"></span></span>
                <span id="p-trace-val"></span>
              </div>
              <svg class="waveform-svg" viewBox="0 0 400 135" preserveAspectRatio="none">
                <line x1="0" y1="68" x2="400" y2="68" stroke="#24384e" stroke-width="1" stroke-dasharray="4 4" />
                <path id="p-wave-glow" fill="none" stroke="rgba(45, 212, 191, 0.22)" stroke-width="6" d="" />
                <path id="p-wave-line" fill="none" stroke="#2dd4bf" stroke-width="2.2" d="" />
              </svg>
            </div>
          </div>

          <div id="p-metrics" class="metrics-grid"></div>
          <div id="p-note" class="educational-note"></div>
        </section>

        <section class="sim-panel">
          <div class="card-title">${isAr ? "متحكمات المحاكاة" : "Simulation Controls"}</div>
          <div id="p-sliders" style="display:flex;flex-direction:column;gap:10px;"></div>
          <div class="preset-row">
            <button id="p-rest" class="btn-secondary" type="button">${isAr ? "وضع الراحة" : "Rest State"}</button>
            <button id="p-exert" class="btn-primary" type="button">${isAr ? "مجهود بدني" : "Exercise State"}</button>
          </div>
        </section>
      </div>
    </div>
  `;

  function updateUI() {
    const titleEl = containerEl.querySelector("#p-title");
    const badgeEl = containerEl.querySelector("#p-badge");
    const organBox = containerEl.querySelector("#p-organ-box");
    const organLbl = containerEl.querySelector("#p-organ-lbl");
    const traceLbl = containerEl.querySelector("#p-trace-lbl");
    const traceVal = containerEl.querySelector("#p-trace-val");
    const metricsEl = containerEl.querySelector("#p-metrics");
    const noteEl = containerEl.querySelector("#p-note");
    const slidersEl = containerEl.querySelector("#p-sliders");

    if (mode === "cardio") {
      titleEl.textContent = isAr ? "القلب والدورة الدموية" : "Heart & Circulation";
      const high = hr > 105;
      badgeEl.textContent = high ? (isAr ? "استجابة لمجهود" : "Exertion") : (isAr ? "فيزيولوجي طبيعي" : "Normal");
      badgeEl.className = `badge ${high ? "badge-warn" : "badge-ok"}`;
      organLbl.textContent = isAr ? "مخطط القلب" : "Heart Model";
      organBox.innerHTML = `<svg id="p-heart-svg" width="88" height="88" viewBox="0 0 100 100" style="transform-origin:center;"><path d="M50 86 C20 65 10 42 22 25 C31 13 45 18 50 30 C55 18 69 13 78 25 C90 42 80 65 50 86 Z" fill="rgba(239,68,68,0.28)" stroke="#f87171" stroke-width="2.5"/></svg>`;
      traceLbl.textContent = isAr ? "تخطيط النبض" : "Pulse Trace";
      traceVal.textContent = `${hr} BPM`;

      const co = ((hr * (high ? 92 : 70)) / 1000).toFixed(1);
      const bp = Math.min(185, Math.round(115 + (hr - 70) * 0.45));
      metricsEl.innerHTML = `
        <div class="metric-box"><div class="metric-label">${isAr ? "معدل النبض" : "Heart Rate"}</div><div class="metric-value">${hr} BPM</div></div>
        <div class="metric-box"><div class="metric-label">${isAr ? "النتاج القلبي" : "Cardiac Output"}</div><div class="metric-value">${co} L/m</div></div>
        <div class="metric-box"><div class="metric-label">${isAr ? "الضغط التقريبي" : "Est. Systolic"}</div><div class="metric-value">~${bp} mmHg</div></div>
      `;
      noteEl.textContent = isAr
        ? "زيادة معدل النبض ترفع النتاج القلبي وتزيد سرعة الموجة لتلبية احتياج الأنسجة للأكسجين."
        : "Higher heart rate increases cardiac output and waveform frequency to meet oxygen demand.";
      slidersEl.innerHTML = `
        <div class="control-group">
          <div class="control-header"><span>${isAr ? "معدل نبض القلب" : "Heart Rate"}</span><span class="control-val">${hr} BPM</span></div>
          <input id="s-hr" class="range-slider" type="range" min="45" max="180" value="${hr}" />
        </div>
      `;
      slidersEl.querySelector("#s-hr").addEventListener("input", (e) => {
        hr = Number(e.target.value);
        updateUI();
      });
    } else if (mode === "resp") {
      titleEl.textContent = isAr ? "التنفس والرئتان" : "Lungs & Respiration";
      const high = rr > 22;
      badgeEl.textContent = high ? (isAr ? "استجابة لمجهود" : "Exertion") : (isAr ? "فيزيولوجي طبيعي" : "Normal");
      badgeEl.className = `badge ${high ? "badge-warn" : "badge-ok"}`;
      organLbl.textContent = isAr ? "تمدد الرئتين" : "Lung Cycle";
      organBox.innerHTML = `<svg id="p-lungs-svg" width="96" height="88" viewBox="0 0 120 100" style="transform-origin:center;"><path d="M60 12 V42 M42 42 H78" stroke="#94a3b8" stroke-width="3"/><path d="M42 42 C24 44 16 62 20 84 C26 90 44 88 52 78 L52 46 Z" fill="rgba(56,189,248,0.22)" stroke="#38bdf8" stroke-width="2.2"/><path d="M78 42 C96 44 104 62 100 84 C94 90 76 88 68 78 L68 46 Z" fill="rgba(56,189,248,0.22)" stroke="#38bdf8" stroke-width="2.2"/></svg>`;
      traceLbl.textContent = isAr ? "التهوية الرئوية" : "Ventilation";
      traceVal.textContent = `${rr} /min`;

      const vent = (rr * 0.65).toFixed(1);
      metricsEl.innerHTML = `
        <div class="metric-box"><div class="metric-label">${isAr ? "معدل التنفس" : "Resp. Rate"}</div><div class="metric-value">${rr} /m</div></div>
        <div class="metric-box"><div class="metric-label">${isAr ? "التهوية الدقيقة" : "Minute Vent."}</div><div class="metric-value">${vent} L/m</div></div>
        <div class="metric-box"><div class="metric-label">${isAr ? "التبادل الغازي" : "Gas Exchange"}</div><div class="metric-value">${high ? "↑" : "Normal"}</div></div>
      `;
      noteEl.textContent = isAr
        ? "يرتفع معدل التنفس أثناء الجهد لزيادة إدخال الأكسجين وطرح ثنائي أكسيد الكربون."
        : "Respiratory rate rises during exertion to support oxygen uptake and CO2 clearance.";
      slidersEl.innerHTML = `
        <div class="control-group">
          <div class="control-header"><span>${isAr ? "معدل التنفس" : "Respiratory Rate"}</span><span class="control-val">${rr} /min</span></div>
          <input id="s-rr" class="range-slider" type="range" min="8" max="40" value="${rr}" />
        </div>
      `;
      slidersEl.querySelector("#s-rr").addEventListener("input", (e) => {
        rr = Number(e.target.value);
        updateUI();
      });
    } else {
      titleEl.textContent = isAr ? "العضلات والمفاصل" : "Muscles & Joints";
      const high = load > 70;
      badgeEl.textContent = high ? (isAr ? "إجهاد مرتفع" : "High Load") : (isAr ? "فيزيولوجي طبيعي" : "Normal");
      badgeEl.className = `badge ${high ? "badge-warn" : "badge-ok"}`;
      organLbl.textContent = isAr ? "الليف العضلي" : "Muscle Fiber";
      organBox.innerHTML = `<svg width="104" height="88" viewBox="0 0 120 100"><rect x="10" y="44" width="16" height="12" rx="3" fill="#cbd5e1"/><rect x="94" y="44" width="16" height="12" rx="3" fill="#cbd5e1"/><path id="p-muscle-path" d="M26 50 Q60 ${50 - (16 + load * 0.16)} 94 50 Q60 ${50 + (16 + load * 0.16)} 26 50 Z" fill="rgba(244,63,94,0.26)" stroke="#fb7185" stroke-width="2.4"/></svg>`;
      traceLbl.textContent = isAr ? "الجهد العضلي" : "Muscle Tension";
      traceVal.textContent = `${load}%`;

      metricsEl.innerHTML = `
        <div class="metric-box"><div class="metric-label">${isAr ? "الحمل العضلي" : "Muscle Load"}</div><div class="metric-value">${load}%</div></div>
        <div class="metric-box"><div class="metric-label">${isAr ? "القوة التقديرية" : "Est. Force"}</div><div class="metric-value">~${Math.round(load * 6.5)} N</div></div>
        <div class="metric-box"><div class="metric-label">${isAr ? "مؤشر الإجهاد" : "Fatigue"}</div><div class="metric-value">${Math.min(100, Math.round(load * 0.9))}%</div></div>
      `;
      noteEl.textContent = isAr
        ? "زيادة المقاومة ترفع القوة العضلية لكنها تسرّع تراكم الإجهاد العضلي."
        : "Higher load increases generated force while accelerating muscular fatigue.";
      slidersEl.innerHTML = `
        <div class="control-group">
          <div class="control-header"><span>${isAr ? "نسبة الحمل" : "Muscle Load"}</span><span class="control-val">${load}%</span></div>
          <input id="s-load" class="range-slider" type="range" min="5" max="100" value="${load}" />
        </div>
      `;
      slidersEl.querySelector("#s-load").addEventListener("input", (e) => {
        load = Number(e.target.value);
        updateUI();
      });
    }
  }

  containerEl.querySelectorAll("[data-pmode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.getAttribute("data-pmode");
      containerEl.querySelectorAll("[data-pmode]").forEach((b) => b.classList.toggle("is-active", b === btn));
      updateUI();
    });
  });

  containerEl.querySelector("#p-rest").addEventListener("click", () => {
    hr = 72; rr = 14; load = 20;
    updateUI();
  });

  containerEl.querySelector("#p-exert").addEventListener("click", () => {
    hr = 145; rr = 30; load = 85;
    updateUI();
  });

  updateUI();

  const waveLine = containerEl.querySelector("#p-wave-line");
  const waveGlow = containerEl.querySelector("#p-wave-glow");

  const tick = () => {
    physAnimId = requestAnimationFrame(tick);
    const speed = mode === "cardio" ? (hr / 72) * 0.055 : mode === "resp" ? (rr / 14) * 0.035 : 0.04;
    const amp = mode === "cardio" ? 38 : mode === "resp" ? 26 : 14 + (load / 100) * 28;
    phase += speed;

    if (mode === "cardio") {
      const heart = containerEl.querySelector("#p-heart-svg");
      if (heart) {
        const beat = Math.pow(Math.max(0, Math.sin(phase)), 8);
        heart.style.transform = `scale(${(1 + beat * 0.14).toFixed(3)})`;
      }
    } else if (mode === "resp") {
      const lungs = containerEl.querySelector("#p-lungs-svg");
      if (lungs) {
        lungs.style.transform = `scale(${(1 + Math.sin(phase) * 0.08).toFixed(3)})`;
      }
    }

    let d = "";
    for (let x = 0; x <= 400; x += 4) {
      const t = phase + x * 0.032;
      let y = 68;
      if (mode === "cardio") {
        const mod = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const rPeak = Math.exp(-Math.pow((mod - 1.9) * 16, 2)) * -(amp * 1.1);
        const tWave = Math.exp(-Math.pow((mod - 3.2) * 5.5, 2)) * -12;
        y = 68 + rPeak + tWave;
      } else {
        y = 68 - Math.sin(t) * amp;
      }
      d += `${x === 0 ? "M" : "L"} ${x} ${y.toFixed(1)} `;
    }
    if (waveLine) waveLine.setAttribute("d", d);
    if (waveGlow) waveGlow.setAttribute("d", d);
  };

  tick();
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
    renderPhysiologyLab(containerEl);
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
