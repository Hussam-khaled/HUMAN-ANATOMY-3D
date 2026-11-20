import { I18n } from "../localization/i18n.js";

export class ImagingLabController {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.modality = "CT";     // "CT" | "MRI"
    this.plane = "axial";     // "axial" | "coronal" | "sagittal"
    this.sliceIndex = 50;     // 0..100
    this.brightness = 100;    // 50..150
    this.contrast = 100;      // 50..150
  }

  init() {
    this.render();
    this.bindEvents();
    this.drawSlice();
  }

  render() {
    const isAr = I18n.currentLang === "ar";
    this.containerEl.innerHTML = `
      <div class="img-layout">
        <section class="section-hero">
          <h2>${I18n.t("nav_imaging_lab")}</h2>
          <p>${I18n.t("desc_imaging_lab")}</p>
        </section>

        <div class="disclaimer-banner">
          <span>${
            isAr
              ? "تنبيه تعليمي: المقاطع المعروضة محاكاة تعليمية مولّدة برمجياً لتوضيح المحاور التشريحية والفرق بين CT وMRI، وليست صوراً تشخيصية سريرية."
              : "Educational Note: Slices are synthetically generated educational simulations illustrating anatomical planes and CT/MRI contrast concepts, not clinical diagnostic scans."
          }</span>
        </div>

        <div class="img-toolbar">
          <div class="img-group">
            <button class="phys-tab-btn is-active" type="button" data-mod="CT">CT Scan</button>
            <button class="phys-tab-btn" type="button" data-mod="MRI">MRI Scan</button>
          </div>
          <div class="img-group">
            <button class="layer-chip is-active" type="button" data-plane="axial">${isAr ? "محوري (Axial)" : "Axial"}</button>
            <button class="layer-chip" type="button" data-plane="coronal">${isAr ? "إكليلي (Coronal)" : "Coronal"}</button>
            <button class="layer-chip" type="button" data-plane="sagittal">${isAr ? "سهمي (Sagittal)" : "Sagittal"}</button>
          </div>
        </div>

        <div class="img-workspace">
          <div class="scan-viewport">
            <div class="scan-hud">
              <span id="img-meta-left"></span>
              <span id="img-meta-right"></span>
            </div>
            <canvas id="scan-canvas" class="scan-canvas" width="320" height="320"></canvas>
            <div id="img-structure-note" class="card-desc" style="text-align:center;"></div>
          </div>

          <div class="scan-controls">
            <div class="card-title">${isAr ? "التحكم بالمقطع والنافذة" : "Slice & Window Controls"}</div>

            <div class="control-group">
              <div class="control-header">
                <span>${isAr ? "رقم المقطع (Slice)" : "Slice Position"}</span>
                <span id="lbl-slice" class="control-val">50 / 100</span>
              </div>
              <input id="sl-slice" class="range-slider" type="range" min="0" max="100" value="${this.sliceIndex}" />
            </div>

            <div class="control-group">
              <div class="control-header">
                <span>${isAr ? "السطوع (Brightness)" : "Brightness"}</span>
                <span id="lbl-bright" class="control-val">100%</span>
              </div>
              <input id="sl-bright" class="range-slider" type="range" min="60" max="140" value="${this.brightness}" />
            </div>

            <div class="control-group">
              <div class="control-header">
                <span>${isAr ? "التباين (Contrast)" : "Contrast"}</span>
                <span id="lbl-contrast" class="control-val">100%</span>
              </div>
              <input id="sl-contrast" class="range-slider" type="range" min="60" max="140" value="${this.contrast}" />
            </div>

            <div class="educational-note" id="img-edu-note"></div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.containerEl.querySelectorAll("[data-mod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.modality = btn.getAttribute("data-mod");
        this.containerEl.querySelectorAll("[data-mod]").forEach((b) => b.classList.toggle("is-active", b === btn));
        this.drawSlice();
      });
    });

    this.containerEl.querySelectorAll("[data-plane]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.plane = btn.getAttribute("data-plane");
        this.containerEl.querySelectorAll("[data-plane]").forEach((b) => b.classList.toggle("is-active", b === btn));
        this.drawSlice();
      });
    });

    const slSlice = this.containerEl.querySelector("#sl-slice");
    const slBright = this.containerEl.querySelector("#sl-bright");
    const slContrast = this.containerEl.querySelector("#sl-contrast");

    slSlice.addEventListener("input", (e) => {
      this.sliceIndex = Number(e.target.value);
      this.containerEl.querySelector("#lbl-slice").textContent = `${this.sliceIndex} / 100`;
      this.drawSlice();
    });

    slBright.addEventListener("input", (e) => {
      this.brightness = Number(e.target.value);
      this.containerEl.querySelector("#lbl-bright").textContent = `${this.brightness}%`;
      this.drawSlice();
    });

    slContrast.addEventListener("input", (e) => {
      this.contrast = Number(e.target.value);
      this.containerEl.querySelector("#lbl-contrast").textContent = `${this.contrast}%`;
      this.drawSlice();
    });
  }

  drawSlice() {
    const isAr = I18n.currentLang === "ar";
    const canvas = this.containerEl.querySelector("#scan-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // Normalized position (-1 to +1)
    const pos = (this.sliceIndex - 50) / 50;
    const scaleFactor = Math.max(0.25, 1 - Math.abs(pos) * 0.65);

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.filter = `brightness(${this.brightness}%) contrast(${this.contrast}%)`;

    // Background dark scan field
    ctx.fillStyle = "#04070a";
    ctx.fillRect(0, 0, w, h);

    // Subtle crosshair guides
    ctx.strokeStyle = "rgba(45, 212, 191, 0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.stroke();

    // Outer cranial/body contour
    const rx = (this.plane === "sagittal" ? 95 : 108) * scaleFactor;
    const ry = 115 * scaleFactor;
    ctx.strokeStyle = this.modality === "CT" ? "#e2e8f0" : "#94a3b8";
    ctx.lineWidth = this.modality === "CT" ? 7 : 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Soft tissue fill
    ctx.fillStyle = this.modality === "CT" ? "#26323f" : "#374151";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx - 4, ry - 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner structures shifting smoothly with sliceIndex
    const shiftX = this.plane === "sagittal" ? pos * 28 : 0;
    const shiftY = this.plane === "axial" ? pos * 18 : 0;

    // Ventricular / central cavity
    ctx.fillStyle = this.modality === "CT" ? "#0f172a" : "#e2e8f0";
    ctx.beginPath();
    ctx.ellipse(cx + shiftX, cy + shiftY, 26 * scaleFactor, 16 * scaleFactor, 0, 0, Math.PI * 2);
    ctx.fill();

    // Left & right lobes
    ctx.fillStyle = this.modality === "CT" ? "#475569" : "#64748b";
    ctx.beginPath();
    ctx.ellipse(cx - 34 * scaleFactor + shiftX * 0.5, cy + shiftY * 0.5, 22 * scaleFactor, 36 * scaleFactor, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 34 * scaleFactor + shiftX * 0.5, cy + shiftY * 0.5, 22 * scaleFactor, 36 * scaleFactor, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Update HUD & educational note
    this.containerEl.querySelector("#img-meta-left").textContent = `${this.modality} • ${this.plane.toUpperCase()}`;
    this.containerEl.querySelector("#img-meta-right").textContent = `SLICE ${String(this.sliceIndex).padStart(3, "0")}`;

    this.containerEl.querySelector("#img-structure-note").textContent = isAr
      ? `مستوى المقطع الحالي: ${this.sliceIndex}% (${this.plane}) — جرّب تغيير المحور أو السطوع لملاحظة التباين.`
      : `Current slice position: ${this.sliceIndex}% (${this.plane}) — adjust plane or windowing to inspect contrast.`;

    this.containerEl.querySelector("#img-edu-note").textContent =
      this.modality === "CT"
        ? (isAr
            ? "في الأشعة المقطعية (CT): تظهر العظام الكثيفة بلون فاتح/أبيض واضح، بينما تظهر السوائل والهواء أغمق."
            : "In CT scans: Dense bone appears bright/hyperdense, while fluid and air appear darker.")
        : (isAr
            ? "في الرنين المغناطيسي (MRI): يعتمد على الإشارات المغناطيسية للأنسجة الرخوة والسوائل ويوفّر تبايناً عالياً بين الأنسجة دون أشعة مؤينة."
            : "In MRI scans: Relies on magnetic resonance signals for superior soft-tissue contrast without ionizing radiation.");
  }

  dispose() {}
}
