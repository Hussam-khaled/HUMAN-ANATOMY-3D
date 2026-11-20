import { I18n } from "../localization/i18n.js";

const MODULES = [
  { id: "cardio", titleKey: "phys_mod_cardio" },
  { id: "respiratory", titleKey: "phys_mod_resp" },
  { id: "digestive", titleKey: "phys_mod_digest" },
  { id: "musculoskeletal", titleKey: "phys_mod_musc" }
];

export class PhysiologyLabController {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.activeModule = "cardio";
    this.animId = null;
    this.phase = 0;

    // Simulation parameters
    this.params = {
      hr: 72,          // Beats per minute (45 - 180)
      rr: 14,          // Breaths per minute (8 - 40)
      tidalPct: 60,    // Tidal volume % (20 - 100)
      motility: 55,    // Digestive motility % (10 - 100)
      loadPct: 40      // Muscle load % (5 - 100)
    };
  }

  init() {
    this.renderSkeleton();
    this.bindEvents();
    this.syncModuleUI();
    this.startLoop();
  }

  renderSkeleton() {
    this.containerEl.innerHTML = `
      <div class="phys-layout">
        <section class="section-hero">
          <h2>${I18n.t("nav_physiology_lab")}</h2>
          <p>${I18n.t("desc_physiology_lab")}</p>
        </section>

        <div class="phys-tabs" id="phys-tabs">
          ${MODULES.map(
            (m, idx) =>
              `<button class="phys-tab-btn ${idx === 0 ? "is-active" : ""}" type="button" data-mod="${m.id}">${I18n.t(m.titleKey)}</button>`
          ).join("")}
        </div>

        <div class="phys-workspace">
          <!-- Left: Live Curve & Physiological Metrics -->
          <section class="sim-panel">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
              <span id="phys-active-title" class="card-title"></span>
              <span id="phys-state-badge" class="badge badge-ok"></span>
            </div>

            <div class="waveform-box">
              <svg id="phys-wave-svg" class="waveform-svg" viewBox="0 0 400 160" preserveAspectRatio="none">
                <line x1="0" y1="80" x2="400" y2="80" stroke="#1e293b" stroke-width="1" stroke-dasharray="4 4" />
                <path id="phys-wave-path" fill="none" stroke="#2dd4bf" stroke-width="2.5" d="" />
              </svg>
            </div>

            <div id="phys-metrics" class="metrics-grid"></div>
            <div id="phys-explanation" class="educational-note"></div>
          </section>

          <!-- Right: Interactive Parameters & Presets -->
          <section class="sim-panel">
            <div class="card-title">${I18n.t("phys_controls_title")}</div>
            <div id="phys-controls"></div>

            <div class="card-desc" style="margin-top:4px;">${I18n.t("phys_presets_title")}</div>
            <div class="preset-row">
              <button id="btn-preset-rest" class="btn-secondary" type="button">${I18n.t("phys_preset_rest")}</button>
              <button id="btn-preset-exercise" class="btn-primary" type="button">${I18n.t("phys_preset_exercise")}</button>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.containerEl.querySelectorAll("[data-mod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.activeModule = btn.getAttribute("data-mod");
        this.containerEl.querySelectorAll("[data-mod]").forEach((b) => {
          b.classList.toggle("is-active", b === btn);
        });
        this.syncModuleUI();
      });
    });

    this.containerEl.querySelector("#btn-preset-rest").addEventListener("click", () => {
      this.params.hr = 72;
      this.params.rr = 14;
      this.params.tidalPct = 60;
      this.params.motility = 55;
      this.params.loadPct = 20;
      this.syncModuleUI();
    });

    this.containerEl.querySelector("#btn-preset-exercise").addEventListener("click", () => {
      this.params.hr = 145;
      this.params.rr = 30;
      this.params.tidalPct = 90;
      this.params.motility = 25;
      this.params.loadPct = 85;
      this.syncModuleUI();
    });
  }

  syncModuleUI() {
    const titleEl = this.containerEl.querySelector("#phys-active-title");
    const badgeEl = this.containerEl.querySelector("#phys-state-badge");
    const metricsEl = this.containerEl.querySelector("#phys-metrics");
    const expEl = this.containerEl.querySelector("#phys-explanation");
    const controlsEl = this.containerEl.querySelector("#phys-controls");

    if (this.activeModule === "cardio") {
      titleEl.textContent = I18n.t("phys_mod_cardio");
      const isHigh = this.params.hr > 105;
      badgeEl.textContent = isHigh ? I18n.t("phys_state_exertion") : I18n.t("phys_state_normal");
      badgeEl.className = `badge ${isHigh ? "badge-warn" : "badge-ok"}`;

      const strokeVolMl = isHigh ? 92 : 70;
      const cardiacOutputL = ((this.params.hr * strokeVolMl) / 1000).toFixed(1);
      const estSys = Math.min(185, Math.round(115 + (this.params.hr - 70) * 0.45));

      metricsEl.innerHTML = `
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_hr")}</div><div class="metric-value">${this.params.hr} BPM</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_co")}</div><div class="metric-value">${cardiacOutputL} L/min</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_bp_sys")}</div><div class="metric-value">~${estSys} mmHg</div></div>
      `;
      expEl.textContent = I18n.t("phys_exp_cardio");

      controlsEl.innerHTML = `
        <div class="control-group">
          <div class="control-header"><span>${I18n.t("phys_hr")}</span><span>${this.params.hr} BPM</span></div>
          <input id="ctrl-hr" class="range-slider" type="range" min="45" max="180" value="${this.params.hr}" />
        </div>
      `;
      controlsEl.querySelector("#ctrl-hr").addEventListener("input", (e) => {
        this.params.hr = Number(e.target.value);
        this.syncModuleUI();
      });
    } else if (this.activeModule === "respiratory") {
      titleEl.textContent = I18n.t("phys_mod_resp");
      const isHigh = this.params.rr > 22;
      badgeEl.textContent = isHigh ? I18n.t("phys_state_exertion") : I18n.t("phys_state_normal");
      badgeEl.className = `badge ${isHigh ? "badge-warn" : "badge-ok"}`;

      const tidalLiters = (0.3 + (this.params.tidalPct / 100) * 0.7).toFixed(2);
      const minVentilation = (this.params.rr * Number(tidalLiters)).toFixed(1);

      metricsEl.innerHTML = `
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_rr")}</div><div class="metric-value">${this.params.rr} /min</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_tidal")}</div><div class="metric-value">${tidalLiters} L</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_vent")}</div><div class="metric-value">${minVentilation} L/min</div></div>
      `;
      expEl.textContent = I18n.t("phys_exp_resp");

      controlsEl.innerHTML = `
        <div class="control-group">
          <div class="control-header"><span>${I18n.t("phys_rr")}</span><span>${this.params.rr} /min</span></div>
          <input id="ctrl-rr" class="range-slider" type="range" min="8" max="40" value="${this.params.rr}" />
        </div>
        <div class="control-group">
          <div class="control-header"><span>${I18n.t("phys_tidal")}</span><span>${this.params.tidalPct}%</span></div>
          <input id="ctrl-tidal" class="range-slider" type="range" min="20" max="100" value="${this.params.tidalPct}" />
        </div>
      `;
      controlsEl.querySelector("#ctrl-rr").addEventListener("input", (e) => {
        this.params.rr = Number(e.target.value);
        this.syncModuleUI();
      });
      controlsEl.querySelector("#ctrl-tidal").addEventListener("input", (e) => {
        this.params.tidalPct = Number(e.target.value);
        this.syncModuleUI();
      });
    } else if (this.activeModule === "digestive") {
      titleEl.textContent = I18n.t("phys_mod_digest");
      badgeEl.textContent = I18n.t("phys_state_normal");
      badgeEl.className = "badge badge-ok";

      const estTransitHrs = Math.max(8, Math.round(36 - this.params.motility * 0.22));
      const absorptionScore = Math.min(98, Math.round(65 + this.params.motility * 0.3));

      metricsEl.innerHTML = `
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_motility")}</div><div class="metric-value">${this.params.motility}%</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_transit")}</div><div class="metric-value">~${estTransitHrs}h</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_absorption")}</div><div class="metric-value">${absorptionScore}%</div></div>
      `;
      expEl.textContent = I18n.t("phys_exp_digest");

      controlsEl.innerHTML = `
        <div class="control-group">
          <div class="control-header"><span>${I18n.t("phys_motility")}</span><span>${this.params.motility}%</span></div>
          <input id="ctrl-motility" class="range-slider" type="range" min="10" max="100" value="${this.params.motility}" />
        </div>
      `;
      controlsEl.querySelector("#ctrl-motility").addEventListener("input", (e) => {
        this.params.motility = Number(e.target.value);
        this.syncModuleUI();
      });
    } else if (this.activeModule === "musculoskeletal") {
      titleEl.textContent = I18n.t("phys_mod_musc");
      const highLoad = this.params.loadPct > 70;
      badgeEl.textContent = highLoad ? I18n.t("phys_state_fatigue") : I18n.t("phys_state_normal");
      badgeEl.className = `badge ${highLoad ? "badge-warn" : "badge-ok"}`;

      const forceN = Math.round(this.params.loadPct * 6.5);
      const fatiguePct = Math.min(100, Math.round(this.params.loadPct * 0.92));

      metricsEl.innerHTML = `
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_load")}</div><div class="metric-value">${this.params.loadPct}%</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_force")}</div><div class="metric-value">~${forceN} N</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_fatigue")}</div><div class="metric-value">${fatiguePct}%</div></div>
      `;
      expEl.textContent = I18n.t("phys_exp_musc");

      controlsEl.innerHTML = `
        <div class="control-group">
          <div class="control-header"><span>${I18n.t("phys_load")}</span><span>${this.params.loadPct}%</span></div>
          <input id="ctrl-load" class="range-slider" type="range" min="5" max="100" value="${this.params.loadPct}" />
        </div>
      `;
      controlsEl.querySelector("#ctrl-load").addEventListener("input", (e) => {
        this.params.loadPct = Number(e.target.value);
        this.syncModuleUI();
      });
    }
  }

  startLoop() {
    const pathEl = this.containerEl.querySelector("#phys-wave-path");
    const step = () => {
      this.animId = requestAnimationFrame(step);

      let freq = 0.04;
      let amp = 35;

      if (this.activeModule === "cardio") {
        freq = (this.params.hr / 72) * 0.05;
        amp = 42;
      } else if (this.activeModule === "respiratory") {
        freq = (this.params.rr / 14) * 0.035;
        amp = 22 + (this.params.tidalPct / 100) * 32;
      } else if (this.activeModule === "digestive") {
        freq = (this.params.motility / 55) * 0.025;
        amp = 24;
      } else if (this.activeModule === "musculoskeletal") {
        freq = 0.04;
        amp = 15 + (this.params.loadPct / 100) * 40;
      }

      this.phase += freq;

      let d = "";
      for (let x = 0; x <= 400; x += 4) {
        const t = this.phase + x * 0.035;
        let y = 80;

        if (this.activeModule === "cardio") {
          // Stylized pulse / QRS-like spike
          const mod = t % (Math.PI * 2);
          const spike = Math.exp(-Math.pow((mod - 1.5) * 5, 2)) * -amp;
          const wave = Math.sin(mod) * (amp * 0.25);
          y = 80 + spike + wave;
        } else {
          y = 80 - Math.sin(t) * amp;
        }

        d += `${x === 0 ? "M" : "L"} ${x} ${y.toFixed(1)} `;
      }

      if (pathEl) pathEl.setAttribute("d", d);
    };

    step();
  }

  dispose() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}
