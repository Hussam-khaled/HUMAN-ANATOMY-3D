import { DatabaseService } from "../data/db.js";
import { I18n } from "../localization/i18n.js";

const STORAGE_KEY = "ha3d_academy_mastered_v1";

const SYSTEM_SUMMARIES = {
  skeletal: {
    ar: "يدعم بنية الجسم، يحمي الأعضاء الحيوية، ويشارك في الحركة وتكوين خلايا الدم.",
    en: "Supports body structure, protects vital organs, enables movement, and produces blood cells."
  },
  muscular: {
    ar: "يولّد الحركة والوضعية والثبات الحراري عبر الألياف العضلية الهيكلية والملساء والقلبية.",
    en: "Generates movement, posture, and heat through skeletal, smooth, and cardiac muscle fibers."
  },
  nervous: {
    ar: "ينسّق الاستجابات السريعة والتحكم الحسي والحركي والمعرفي عبر الجهاز المركزي والمحيطي.",
    en: "Coordinates rapid signaling, sensation, motor control, and cognition via central and peripheral pathways."
  },
  cardiovascular: {
    ar: "يضخ الدم عبر القلب والأوعية الدموية لنقل الأكسجين والمغذيات وإزالة الفضلات.",
    en: "Circulates blood through heart and vessels to deliver oxygen and nutrients and clear waste."
  },
  respiratory: {
    ar: "يؤمّن تبادل الأكسجين وثاني أكسيد الكربون بين الهواء الجوي والدم عبر الرئتين والحويصلات.",
    en: "Facilitates oxygen and carbon dioxide exchange between inhaled air and blood across alveoli."
  },
  digestive: {
    ar: "يفكّك الطعام ميكانيكياً وكيميائياً ويمتص المغذيات والماء ويطرح الفضلات غير المهضومة.",
    en: "Breaks down food mechanically and enzymatically, absorbs nutrients and water, and eliminates waste."
  },
  urinary: {
    ar: "يرشّح الدم لتنظيم توازن السوائل والكهارل والتخلص من الفضلات النيتروجينية عبر الكليتين.",
    en: "Filters blood to regulate fluid and electrolyte balance and excrete metabolic waste via kidneys."
  },
  reproductive: {
    ar: "يؤدي دوراً محورياً في التكاثر وإنتاج الأمشاج والهرمونات الجنسية المنظمة للوظائف الحيوية.",
    en: "Supports reproduction, gamete production, and sex hormone regulation."
  },
  lymphatic: {
    ar: "يعيد السائل الخلالي إلى الدورة الدموية ويدعم الدفاع المناعي عبر العقد والطحال والخلايا اللمفاوية.",
    en: "Returns interstitial fluid to circulation and supports immune defense via lymphoid organs."
  },
  endocrine: {
    ar: "ينظّم النمو والاستقلاب والاتزان الداخلي بإفراز الهرمونات في مجرى الدم.",
    en: "Regulates growth, metabolism, and homeostasis by secreting hormones into circulation."
  }
};

const MEDICAL_GLOSSARY = [
  { id: "term_anterior", ar: "أمامي (بطني)", en: "Anterior / Ventral", descAr: "يشير إلى الجهة الأمامية من الجسم أو العضو.", descEn: "Toward the front surface of the body or organ." },
  { id: "term_posterior", ar: "خلفي (ظهري)", en: "Posterior / Dorsal", descAr: "يشير إلى الجهة الخلفية من الجسم أو العضو.", descEn: "Toward the back surface of the body or organ." },
  { id: "term_medial", ar: "أنسي (قريب من الخط المتوسط)", en: "Medial", descAr: "أقرب إلى الخط المنصّف الطولي للجسم.", descEn: "Closer to the midline of the body." },
  { id: "term_lateral", ar: "وحشي (بعيد عن الخط المتوسط)", en: "Lateral", descAr: "أبعد عن الخط المنصّف الطولي للجسم نحو الجانب.", descEn: "Farther away from the midline toward the side." },
  { id: "term_proximal", ar: "قريب (من المنشأ أو الجذع)", en: "Proximal", descAr: "أقرب إلى نقطة اتصال الطرف بالجذع أو منشأ التركيب.", descEn: "Closer to the point of attachment or trunk origin." },
  { id: "term_distal", ar: "بعيد (عن المنشأ أو الجذع)", en: "Distal", descAr: "أبعد عن نقطة اتصال الطرف بالجذع.", descEn: "Farther from the point of attachment or trunk." }
];

export class AcademyLabController {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.tab = "systems"; // "systems" | "glossary"
    this.searchQuery = "";
    this.systems = [];
    this.masteredIds = new Set(this.loadMastered());
  }

  loadMastered() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveMastered() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.masteredIds]));
    } catch {
      // Ignore storage quota issues
    }
  }

  async init() {
    this.systems = await DatabaseService.getAllBodySystems();
    this.render();
    this.bindEvents();
    this.renderList();
  }

  render() {
    const isAr = I18n.currentLang === "ar";
    this.containerEl.innerHTML = `
      <div class="acad-layout">
        <section class="section-hero">
          <h2>${I18n.t("nav_academy")}</h2>
          <p>${I18n.t("desc_academy")}</p>
        </section>

        <div class="acad-progress-box">
          <div>
            <strong id="acad-progress-label"></strong>
            <div class="card-desc">${isAr ? "يُحفظ تقدم المراجعة تلقائياً على جهازك دون إنترنت." : "Study progress is saved locally on your device offline."}</div>
          </div>
          <span id="acad-progress-badge" class="badge badge-ok"></span>
        </div>

        <div class="acad-controls-bar">
          <div class="img-group">
            <button class="phys-tab-btn is-active" type="button" data-atab="systems">${isAr ? "الأجهزة التشريحية (10)" : "Body Systems (10)"}</button>
            <button class="phys-tab-btn" type="button" data-atab="glossary">${isAr ? "المصطلحات التشريحية" : "Anatomical Terms"}</button>
          </div>
          <input id="acad-search" class="acad-search" type="search" placeholder="${isAr ? "ابحث عن جهاز أو مصطلح..." : "Search system or term..."}" />
        </div>

        <div id="acad-list" class="acad-grid"></div>
      </div>
    `;
  }

  bindEvents() {
    this.containerEl.querySelectorAll("[data-atab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.tab = btn.getAttribute("data-atab");
        this.containerEl.querySelectorAll("[data-atab]").forEach((b) => b.classList.toggle("is-active", b === btn));
        this.renderList();
      });
    });

    this.containerEl.querySelector("#acad-search").addEventListener("input", (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.renderList();
    });
  }

  updateProgressHeader() {
    const isAr = I18n.currentLang === "ar";
    const totalItems = this.systems.length + MEDICAL_GLOSSARY.length;
    const doneCount = this.masteredIds.size;

    this.containerEl.querySelector("#acad-progress-label").textContent = isAr
      ? `تمت مراجعة ${doneCount} من أصل ${totalItems} عنصر تعليمي`
      : `Reviewed ${doneCount} of ${totalItems} study items`;

    this.containerEl.querySelector("#acad-progress-badge").textContent = `${Math.round((doneCount / totalItems) * 100)}%`;
  }

  renderList() {
    this.updateProgressHeader();
    const isAr = I18n.currentLang === "ar";
    const listEl = this.containerEl.querySelector("#acad-list");

    const items =
      this.tab === "systems"
        ? this.systems.map((s) => {
            const info = SYSTEM_SUMMARIES[s.id] || { ar: "", en: "" };
            return {
              id: `sys_${s.id}`,
              title: isAr ? s.nameAr : s.nameEn,
              subTitle: isAr ? s.nameEn : s.nameAr,
              body: isAr ? info.ar : info.en,
              accent: s.color
            };
          })
        : MEDICAL_GLOSSARY.map((g) => ({
            id: g.id,
            title: isAr ? g.ar : g.en,
            subTitle: isAr ? g.en : g.ar,
            body: isAr ? g.descAr : g.descEn,
            accent: "#2dd4bf"
          }));

    const filtered = items.filter((item) => {
      if (!this.searchQuery) return true;
      return (
        item.title.toLowerCase().includes(this.searchQuery) ||
        item.subTitle.toLowerCase().includes(this.searchQuery) ||
        item.body.toLowerCase().includes(this.searchQuery)
      );
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="card"><p class="card-desc">${isAr ? "لا توجد نتائج مطابقة للبحث." : "No matching items found."}</p></div>`;
      return;
    }

    listEl.innerHTML = filtered
      .map((item) => {
        const mastered = this.masteredIds.has(item.id);
        return `
          <article class="acad-card ${mastered ? "is-mastered" : ""}" style="border-top:3px solid ${item.accent}">
            <div>
              <div class="acad-card-top">
                <div class="card-title">${item.title}</div>
                ${mastered ? `<span class="badge badge-ok">${isAr ? "مُراجع" : "Reviewed"}</span>` : ""}
              </div>
              <div class="acad-term-en">${item.subTitle}</div>
              <p class="acad-card-body" style="margin-top:8px;">${item.body}</p>
            </div>
            <div class="acad-card-footer">
              <button class="btn-secondary" type="button" data-toggle-master="${item.id}">
                ${
                  mastered
                    ? (isAr ? "إلغاء التحديد" : "Unmark")
                    : (isAr ? "تحديد كمُراجع" : "Mark Reviewed")
                }
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    listEl.querySelectorAll("[data-toggle-master]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-toggle-master");
        if (this.masteredIds.has(id)) {
          this.masteredIds.delete(id);
        } else {
          this.masteredIds.add(id);
        }
        this.saveMastered();
        this.renderList();
      });
    });
  }

  dispose() {}
}
