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

    this.params = {
      hr: 72,
      rr: 14,
      tidalPct: 60,
      motility: 55,
      loadPct: 35
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
          <section class="sim-panel">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
              <span id="phys-active-title" class="card-title"></span>
              <span id="phys-state-badge" class="badge badge-ok"></span>
            </div>

            <div class="monitor-stage">
              <div class="organ-diagram-box">
                <div id="phys-organ-svg"></div>
                <span id="phys-organ-caption" class="organ-diagram-label"></span>
              </div>

              <div class="waveform-box">
                <div class="monitor-top-bar">
                  <span><span class="live-dot"></span><span id="phys-trace-title"></span></span>
                  <span id="phys-trace-rate"></span>
                </div>
                <svg id="phys-wave-svg" class="waveform-svg" viewBox="0 0 400 140" preserveAspectRatio="none">
                  <g stroke="#13202e" stroke-width="1">
                    <line x1="0" y1="28" x2="400" y2="28" />
                    <line x1="0" y1="56" x2="400" y2="56" />
                    <line x1="0" y1="84" x2="400" y2="84" />
                    <line x1="0" y1="112" x2="400" y2="112" />
                    <line x1="80" y1="0" x2="80" y2="140" />
                    <line x1="160" y1="0" x2="160" y2="140" />
                    <line x1="240" y1="0" x2="240" y2="140" />
                    <line x1="320" y1="0" x2="320" y2="140" />
                  </g>
                  <line x1="0" y1="70" x2="400" y2="70" stroke="#263b52" stroke-width="1" stroke-dasharray="4 4" />
                  <path id="phys-wave-glow" fill="none" stroke="rgba(45, 212, 191, 0.22)" stroke-width="6" d="" />
                  <path id="phys-wave-path" fill="none" stroke="#2dd4bf" stroke-width="2.2" d="" />
                </svg>
              </div>
            </div>

            <div id="phys-metrics" class="metrics-grid"></div>
            <div id="phys-explanation" class="educational-note"></div>
          </section>

          <section class="sim-panel">
            <div class="card-title">${I18n.t("phys_controls_title")}</div>
            <div id="phys-controls" style="display:flex;flex-direction:column;gap:10px;"></div>

            <div class="card-desc" style="margin-top:2px;">${I18n.t("phys_presets_title")}</div>
            <div class="preset-row">
              <button id="btn-preset-rest" class="btn-secondary" type="button">${I18n.t("phys_preset_rest")}</button>
              <button id="btn-preset-exercise" class="btn-primary" type="button">${I18n.t("phys_preset_exercise")}</button>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  renderOrganGraphic() {
    const host = this.containerEl.querySelector("#phys-organ-svg");
    const cap = this.containerEl.querySelector("#phys-organ-caption");
    if (!host) return;

    if (this.activeModule === "cardio") {
      cap.textContent = I18n.t("phys_cap_heart");
      host.innerHTML = `
        <svg id="svg-heart" width="96" height="96" viewBox="0 0 100 100" style="transform-origin:center;transition:transform 0.08s ease;">
          <path d="M50 86 C20 65 10 42 22 25 C31 13 45 18 50 30 C55 18 69 13 78 25 C90 42 80 65 50 86 Z"
                fill="rgba(239, 68, 68, 0.28)" stroke="#f87171" stroke-width="2.5" />
          <line x1="50" y1="28" x2="50" y2="82" stroke="#fca5a5" stroke-width="1.2" stroke-dasharray="3 2" opacity="0.6" />
          <line x1="22" y1="48" x2="78" y2="48" stroke="#fca5a5" stroke-width="1.2" stroke-dasharray="3 2" opacity="0.6" />
        </svg>
      `;
    } else if (this.activeModule === "respiratory") {
      cap.textContent = I18n.t("phys_cap_lungs");
      host.innerHTML = `
        <svg id="svg-lungs" width="104" height="96" viewBox="0 0 120 100" style="transform-origin:center;transition:transform 0.12s ease;">
          <path d="M60 12 V42 M42 42 H78" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" />
          <path d="M42 42 C24 44 16 62 20 84 C26 90 44 88 52 78 L52 46 Z"
                fill="rgba(56, 189, 248, 0.22)" stroke="#38bdf8" stroke-width="2.2" />
          <path d="M78 42 C96 44 104 62 100 84 C94 90 76 88 68 78 L68 46 Z"
                fill="rgba(56, 189, 248, 0.22)" stroke="#38bdf8" stroke-width="2.2" />
        </svg>
      `;
    } else if (this.activeModule === "digestive") {
      cap.textContent = I18n.t("phys_cap_digest");
      host.innerHTML = `
        <svg id="svg-digest" width="104" height="96" viewBox="0 0 110 100" style="transform-origin:center;">
          <path d="M36 22 C36 38 24 42 28 56 C32 68 58 66 64 52 C68 42 54 34 44 36"
                fill="none" stroke="#fb923c" stroke-width="4" stroke-linecap="round" />
          <path d="M34 70 H76 V86 H34 Z" rx="8"
                fill="rgba(251, 146, 60, 0.16)" stroke="#fdba74" stroke-width="2" />
        </svg>
      `;
    } else {
      cap.textContent = I18n.t("phys_cap_musc");
      host.innerHTML = `
        <svg id="svg-muscle" width="110" height="96" viewBox="0 0 120 100" style="transform-origin:center;">
          <rect x="10" y="44" width="16" height="12" rx="3" fill="#cbd5e1" />
          <rect x="94" y="44" width="16" height="12" rx="3" fill="#cbd5e1" />
          <path id="muscle-belly" d="M26 50 Q60 24 94 50 Q60 76 26 50 Z"
                fill="rgba(244, 63, 94, 0.26)" stroke="#fb7185" stroke-width="2.4" />
        </svg>
      `;
    }
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
      this.params.hr = 148;
      this.params.rr = 32;
      this.params.tidalPct = 92;
      this.params.motility = 25;
      this.params.loadPct = 85;
      this.syncModuleUI();
    });
  }

  syncModuleUI() {
    this.renderOrganGraphic();

    const titleEl = this.containerEl.querySelector("#phys-active-title");
    const badgeEl = this.containerEl.querySelector("#phys-state-badge");
    const traceTitleEl = this.containerEl.querySelector("#phys-trace-title");
    const traceRateEl = this.containerEl.querySelector("#phys-trace-rate");
    const metricsEl = this.containerEl.querySelector("#phys-metrics");
    const expEl = this.containerEl.querySelector("#phys-explanation");
    const controlsEl = this.containerEl.querySelector("#phys-controls");

    if (this.activeModule === "cardio") {
      titleEl.textContent = I18n.t("phys_mod_cardio");
      traceTitleEl.textContent = I18n.t("phys_trace_ecg");
      traceRateEl.textContent = `${this.params.hr} BPM`;

      const isHigh = this.params.hr > 105;
      badgeEl.textContent = isHigh ? I18n.t("phys_state_exertion") : I18n.t("phys_state_normal");
      badgeEl.className = `badge ${isHigh ? "badge-warn" : "badge-ok"}`;

      const strokeVolMl = isHigh ? 92 : 70;
      const cardiacOutputL = ((this.params.hr * strokeVolMl) / 1000).toFixed(1);
      const estSys = Math.min(185, Math.round(115 + (this.params.hr - 70) * 0.45));

      metricsEl.innerHTML = `
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_hr")}</div><div class="metric-value">${this.params.hr} BPM</div><div class="metric-sub">${I18n.t("phys_ref_hr")}</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_co")}</div><div class="metric-value">${cardiacOutputL} L/min</div><div class="metric-sub">${I18n.t("phys_ref_co")}</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_bp_sys")}</div><div class="metric-value">~${estSys} mmHg</div><div class="metric-sub">${I18n.t("phys_ref_bp")}</div></div>
      `;
      expEl.textContent = I18n.t("phys_exp_cardio");

      controlsEl.innerHTML = `
        <div class="control-group">
          <div class="control-header"><span>${I18n.t("phys_hr")}</span><span class="control-val">${this.params.hr} BPM</span></div>
          <input id="ctrl-hr" class="range-slider" type="range" min="45" max="180" value="${this.params.hr}" />
        </div>
      `;
      controlsEl.querySelector("#ctrl-hr").addEventListener("input", (e) => {
        this.params.hr = Number(e.target.value);
        this.syncModuleUI();
      });
    } else if (this.activeModule === "respiratory") {
      titleEl.textContent = I18n.t("phys_mod_resp");
      traceTitleEl.textContent = I18n.t("phys_trace_resp");
      traceRateEl.textContent = `${this.params.rr} /min`;

      const isHigh = this.params.rr > 22;
      badgeEl.textContent = isHigh ? I18n.t("phys_state_exertion") : I18n.t("phys_state_normal");
      badgeEl.className = `badge ${isHigh ? "badge-warn" : "badge-ok"}`;

      const tidalLiters = (0.3 + (this.params.tidalPct / 100) * 0.7).toFixed(2);
      const minVentilation = (this.params.rr * Number(tidalLiters)).toFixed(1);

      metricsEl.innerHTML = `
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_rr")}</div><div class="metric-value">${this.params.rr} /min</div><div class="metric-sub">${I18n.t("phys_ref_rr")}</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_tidal")}</div><div class="metric-value">${tidalLiters} L</div><div class="metric-sub">${this.params.tidalPct}%</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_vent")}</div><div class="metric-value">${minVentilation} L/min</div><div class="metric-sub">${I18n.t("phys_ref_vent")}</div></div>
      `;
      expEl.textContent = I18n.t("phys_exp_resp");

      controlsEl.innerHTML = `
        <div class="control-group">
          <div class="control-header"><span>${I18n.t("phys_rr")}</span><span class="control-val">${this.params.rr} /min</span></div>
          <input id="ctrl-rr" class="range-slider" type="range" min="8" max="40" value="${this.params.rr}" />
        </div>
        <div class="control-group">
          <div class="control-header"><span>${I18n.t("phys_tidal")}</span><span class="control-val">${this.params.tidalPct}%</span></div>
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
      traceTitleEl.textContent = I18n.t("phys_trace_digest");
      traceRateEl.textContent = `${this.params.motility}%`;

      badgeEl.textContent = I18n.t("phys_state_normal");
      badgeEl.className = "badge badge-ok";

      const estTransitHrs = Math.max(8, Math.round(36 - this.params.motility * 0.22));
      const absorptionScore = Math.min(98, Math.round(65 + this.params.motility * 0.3));

      metricsEl.innerHTML = `
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_motility")}</div><div class="metric-value">${this.params.motility}%</div><div class="metric-sub">${I18n.t("phys_ref_motility")}</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_transit")}</div><div class="metric-value">~${estTransitHrs}h</div><div class="metric-sub">${I18n.t("phys_ref_transit")}</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_absorption")}</div><div class="metric-value">${absorptionScore}%</div><div class="metric-sub">${I18n.t("phys_ref_abs")}</div></div>
      `;
      expEl.textContent = I18n.t("phys_exp_digest");

      controlsEl.innerHTML = `
        <div class="control-group">
          <div class="control-header"><span>${I18n.t("phys_motility")}</span><span class="control-val">${this.params.motility}%</span></div>
          <input id="ctrl-motility" class="range-slider" type="range" min="10" max="100" value="${this.params.motility}" />
        </div>
      `;
      controlsEl.querySelector("#ctrl-motility").addEventListener("input", (e) => {
        this.params.motility = Number(e.target.value);
        this.syncModuleUI();
      });
    } else if (this.activeModule === "musculoskeletal") {
      titleEl.textContent = I18n.t("phys_mod_musc");
      traceTitleEl.textContent = I18n.t("phys_trace_musc");
      traceRateEl.textContent = `${this.params.loadPct}%`;

      const highLoad = this.params.loadPct > 70;
      badgeEl.textContent = highLoad ? I18n.t("phys_state_fatigue") : I18n.t("phys_state_normal");
      badgeEl.className = `badge ${highLoad ? "badge-warn" : "badge-ok"}`;

      const forceN = Math.round(this.params.loadPct * 6.5);
      const fatiguePct = Math.min(100, Math.round(this.params.loadPct * 0.92));

      metricsEl.innerHTML = `
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_load")}</div><div class="metric-value">${this.params.loadPct}%</div><div class="metric-sub">${I18n.t("phys_ref_load")}</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_force")}</div><div class="metric-value">~${forceN} N</div><div class="metric-sub">${I18n.t("phys_ref_force")}</div></div>
        <div class="metric-box"><div class="metric-label">${I18n.t("phys_fatigue")}</div><div class="metric-value">${fatiguePct}%</div><div class="metric-sub">${I18n.t("phys_ref_fatigue")}</div></div>
      `;
      expEl.textContent = I18n.t("phys_exp_musc");

      controlsEl.innerHTML = `
        <div class="control-group">
          <div class="control-header"><span>${I18n.t("phys_load")}</span><span class="control-val">${this.params.loadPct}%</span></div>
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
    const glowEl = this.containerEl.querySelector("#phys-wave-glow");

    const step = () => {
      this.animId = requestAnimationFrame(step);

      let freq = 0.04;
      let amp = 32;

      if (this.activeModule === "cardio") {
        freq = (this.params.hr / 72) * 0.055;
        amp = 42;
        const heartSvg = this.containerEl.querySelector("#svg-heart");
        if (heartSvg) {
          const beat = Math.pow(Math.max(0, Math.sin(this.phase)), 8);
          heartSvg.style.transform = `scale(${(1 + beat * 0.14).toFixed(3)})`;
        }
      } else if (this.activeModule === "respiratory") {
        freq = (this.params.rr / 14) * 0.035;
        amp = 18 + (this.params.tidalPct / 100) * 32;
        const lungsSvg = this.containerEl.querySelector("#svg-lungs");
        if (lungsSvg) {
          const breath = Math.sin(this.phase) * (0.04 + (this.params.tidalPct / 100) * 0.08);
          lungsSvg.style.transform = `scale(${(1 + breath).toFixed(3)})`;
        }
      } else if (this.activeModule === "digestive") {
        freq = (this.params.motility / 55) * 0.028;
        amp = 22;
      } else if (this.activeModule === "musculoskeletal") {
        freq = 0.045;
        amp = 14 + (this.params.loadPct / 100) * 36;
        const belly = this.containerEl.querySelector("#muscle-belly");
        if (belly) {
          const bulge = 18 + (this.params.loadPct / 100) * 16;
          belly.setAttribute("d", `M26 50 Q60 ${50 - bulge} 94 50 Q60 ${50 + bulge} 26 50 Z`);
        }
      }

      this.phase += freq;

      let d = "";
      for (let x = 0; x <= 400; x += 4) {
        const t = this.phase + x * 0.032;
        let y = 70;

        if (this.activeModule === "cardio") {
          const mod = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const pWave = Math.exp(-Math.pow((mod - 1.1) * 7, 2)) * -8;
          const qDip = Math.exp(-Math.pow((mod - 1.65) * 18, 2)) * 12;
          const rPeak = Math.exp(-Math.pow((mod - 1.9) * 16, 2)) * -(amp * 1.15);
          const sDip = Math.exp(-Math.pow((mod - 2.15) * 18, 2)) * 16;
          const tWave = Math.exp(-Math.pow((mod - 3.2) * 5.5, 2)) * -13;
          y = 70 + pWave + qDip + rPeak + sDip + tWave;
        } else {
          y = 70 - Math.sin(t) * amp;
        }

        d += `${x === 0 ? "M" : "L"} ${x} ${y.toFixed(1)} `;
      }

      if (pathEl) pathEl.setAttribute("d", d);
      if (glowEl) glowEl.setAttribute("d", d);
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
