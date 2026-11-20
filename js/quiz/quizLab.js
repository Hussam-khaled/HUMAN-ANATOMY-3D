import { I18n } from "../localization/i18n.js";

const QUIZ_HISTORY_KEY = "ha3d_quiz_stats_v1";

const QUESTIONS = [
  {
    id: "q1",
    topicAr: "التشريح العام",
    topicEn: "General Anatomy",
    qAr: "أي مصطلح اتجاهي يشير إلى موقع أقرب إلى الخط المنصّف الطولي للجسم؟",
    qEn: "Which directional term indicates a position closer to the body's midline?",
    optionsAr: ["وحشي (Lateral)", "أنسي (Medial)", "بعيد (Distal)", "خلفي (Posterior)"],
    optionsEn: ["Lateral", "Medial", "Distal", "Posterior"],
    correctIndex: 1,
    expAr: "المصطلح «أنسي (Medial)» يعني الأقرب إلى خط المنتصف الطولي للجسم، بينما «وحشي» يعني الأبعد عنه.",
    expEn: "Medial means closer to the midline of the body, whereas lateral means farther from the midline."
  },
  {
    id: "q2",
    topicAr: "القلب والدورة الدموية",
    topicEn: "Cardiovascular",
    qAr: "ما المعادلة الأساسية التي تحدد النتاج القلبي (Cardiac Output)؟",
    qEn: "What is the primary determinant of Cardiac Output?",
    optionsAr: [
      "معدل ضربات القلب × الحجم النابض (Stroke Volume)",
      "معدل التنفس × الحجم المدّي",
      "ضغط الدم × المقاومة الوعائية فقط",
      "عدد كريات الدم الحمراء × الهيموغلوبين"
    ],
    optionsEn: [
      "Heart Rate × Stroke Volume",
      "Respiratory Rate × Tidal Volume",
      "Blood Pressure × Vascular Resistance only",
      "RBC Count × Hemoglobin"
    ],
    correctIndex: 0,
    expAr: "النتاج القلبي يساوي حاصل ضرب معدل نبض القلب (BPM) في الحجم النابض (حجم الدم المقذوف في كل نبضة).",
    expEn: "Cardiac output equals heart rate multiplied by stroke volume (blood ejected per beat)."
  },
  {
    id: "q3",
    topicAr: "الجهاز التنفسي",
    topicEn: "Respiratory",
    qAr: "أين يحدث التبادل الغازي الرئيسي للأكسجين وثاني أكسيد الكربون في الرئة؟",
    qEn: "Where does primary gas exchange of O2 and CO2 occur in the lung?",
    optionsAr: ["القصبة الهوائية الرئيسية", "الحويصلات الهوائية (Alveoli)", "الجنبة الجدارية", "الحنجرة"],
    optionsEn: ["Main Trachea", "Alveoli", "Parietal Pleura", "Larynx"],
    correctIndex: 1,
    expAr: "تتم عملية التبادل الغازي عبر الجدران الرقيقة جداً للحويصلات الهوائية المحاطة بالشعيرات الدموية.",
    expEn: "Gas exchange takes place across the thin alveolar-capillary membranes of the alveoli."
  },
  {
    id: "q4",
    topicAr: "التصوير الطبي",
    topicEn: "Medical Imaging",
    qAr: "في مقاطع الأشعة المقطعية (CT)، كيف تظهر العظام الكثيفة غالباً مقارنة بالأنسجة الرخوة؟",
    qEn: "On CT scans, how does dense bone typically appear compared to soft tissue?",
    optionsAr: [
      "أكثر إشراقاً وبياضاً (عالية الكثافة)",
      "سوداء بالكامل مثل الهواء",
      "غير مرئية في جميع المقاطع",
      "أغمق دائماً من السوائل"
    ],
    optionsEn: [
      "Brighter / whiter (hyperdense)",
      "Completely black like air",
      "Invisible across all slices",
      "Always darker than fluid"
    ],
    correctIndex: 0,
    expAr: "تمتص العظام الكثيفة قدراً أكبر من الأشعة السينية، فتظهر بلون فاتح/أبيض واضح في صور CT.",
    expEn: "Dense bone attenuates more X-rays, appearing bright/hyperdense on CT images."
  },
  {
    id: "q5",
    topicAr: "الجهاز العصبي والهيكلي",
    topicEn: "Neuro & Skeletal",
    qAr: "ما الوظيفة الأساسية للعمود الفقري بالإضافة إلى دعم الجذع؟",
    qEn: "Besides supporting the trunk, what is a key protective role of the vertebral column?",
    optionsAr: [
      "حماية الحبل الشوكي",
      "إفراز العصارة الصفراوية",
      "ضخ الدم الشرياني",
      "تصفية البول"
    ],
    optionsEn: [
      "Protecting the spinal cord",
      "Secreting bile",
      "Pumping arterial blood",
      "Filtering urine"
    ],
    correctIndex: 0,
    expAr: "تشكّل الفقرات القناة الفقرية التي تحيط بالحبل الشوكي وتحميه من الصدمات الميكانيكية.",
    expEn: "The vertebrae form the spinal canal that encases and protects the spinal cord."
  }
];

export class QuizLabController {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.currentIndex = 0;
    this.score = 0;
    this.answered = false;
    this.finished = false;
    this.stats = this.loadStats();
  }

  loadStats() {
    try {
      const raw = localStorage.getItem(QUIZ_HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed.bestPercent === "number"
        ? parsed
        : { attempts: 0, bestPercent: 0 };
    } catch {
      return { attempts: 0, bestPercent: 0 };
    }
  }

  saveStats(percent) {
    this.stats.attempts += 1;
    if (percent > this.stats.bestPercent) {
      this.stats.bestPercent = percent;
    }
    try {
      localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(this.stats));
    } catch {
      // Ignore storage errors
    }
  }

  resetStats() {
    this.stats = { attempts: 0, bestPercent: 0 };
    try {
      localStorage.removeItem(QUIZ_HISTORY_KEY);
    } catch {
      // Ignore
    }
    this.render();
  }

  init() {
    this.render();
  }

  startNewAttempt() {
    this.currentIndex = 0;
    this.score = 0;
    this.answered = false;
    this.finished = false;
    this.render();
  }

  render() {
    const isAr = I18n.currentLang === "ar";

    this.containerEl.innerHTML = `
      <div class="quiz-layout">
        <section class="section-hero">
          <h2>${I18n.t("nav_quiz")}</h2>
          <p>${I18n.t("desc_quiz")}</p>
        </section>

        <div class="quiz-stats-bar">
          <div>
            <strong>${isAr ? "أعلى نتيجة محفوظة:" : "Best Score:"}</strong>
            <span class="badge badge-ok" style="margin-inline-start:6px;">${this.stats.bestPercent}%</span>
            <span class="card-desc" style="margin-inline-start:10px;">
              ${isAr ? `المحاولات: ${this.stats.attempts}` : `Attempts: ${this.stats.attempts}`}
            </span>
          </div>
          <button id="btn-reset-quiz-stats" class="btn-secondary" type="button">
            ${isAr ? "تصفير السجل" : "Reset Stats"}
          </button>
        </div>

        <div id="quiz-stage"></div>
      </div>
    `;

    this.containerEl.querySelector("#btn-reset-quiz-stats").addEventListener("click", () => {
      this.resetStats();
    });

    if (this.finished) {
      this.renderSummary();
    } else {
      this.renderQuestion();
    }
  }

  renderQuestion() {
    const isAr = I18n.currentLang === "ar";
    const stage = this.containerEl.querySelector("#quiz-stage");
    const q = QUESTIONS[this.currentIndex];
    const options = isAr ? q.optionsAr : q.optionsEn;
    const topic = isAr ? q.topicAr : q.topicEn;
    const questionText = isAr ? q.qAr : q.qEn;

    stage.innerHTML = `
      <article class="quiz-card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="badge badge-ok">${topic}</span>
          <span class="card-desc">
            ${isAr ? `السؤال ${this.currentIndex + 1} من ${QUESTIONS.length}` : `Question ${this.currentIndex + 1} of ${QUESTIONS.length}`}
          </span>
        </div>

        <div class="quiz-question-text">${questionText}</div>

        <div class="quiz-options" id="quiz-options">
          ${options
            .map(
              (opt, idx) =>
                `<button class="quiz-option-btn" type="button" data-opt="${idx}">${opt}</button>`
            )
            .join("")}
        </div>

        <div id="quiz-feedback-box" style="display:none;"></div>

        <div class="quiz-footer-actions">
          <span class="card-desc">
            ${isAr ? `النقاط الحالية: ${this.score}` : `Current Score: ${this.score}`}
          </span>
          <button id="btn-next-q" class="btn-primary" type="button" style="display:none;">
            ${
              this.currentIndex + 1 < QUESTIONS.length
                ? (isAr ? "السؤال التالي" : "Next Question")
                : (isAr ? "عرض النتيجة" : "Finish Quiz")
            }
          </button>
        </div>
      </article>
    `;

    const optButtons = stage.querySelectorAll("[data-opt]");
    const feedbackBox = stage.querySelector("#quiz-feedback-box");
    const nextBtn = stage.querySelector("#btn-next-q");

    optButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (this.answered) return;
        this.answered = true;

        const chosen = Number(btn.getAttribute("data-opt"));
        const isCorrect = chosen === q.correctIndex;
        if (isCorrect) this.score += 1;

        optButtons.forEach((b, i) => {
          b.disabled = true;
          if (i === q.correctIndex) b.classList.add("is-correct");
          else if (i === chosen) b.classList.add("is-wrong");
        });

        const expText = isAr ? q.expAr : q.expEn;
        const statusLabel = isCorrect
          ? (isAr ? "إجابة صحيحة!" : "Correct!")
          : (isAr ? "إجابة غير صحيحة" : "Incorrect");

        feedbackBox.style.display = "block";
        feedbackBox.innerHTML = `
          <div class="quiz-feedback">
            <strong>${statusLabel}</strong>
            <p style="margin-top:4px;">${expText}</p>
          </div>
        `;

        nextBtn.style.display = "inline-block";
      });
    });

    nextBtn.addEventListener("click", () => {
      if (this.currentIndex + 1 < QUESTIONS.length) {
        this.currentIndex += 1;
        this.answered = false;
        this.renderQuestion();
      } else {
        this.finished = true;
        const pct = Math.round((this.score / QUESTIONS.length) * 100);
        this.saveStats(pct);
        this.render();
      }
    });
  }

  renderSummary() {
    const isAr = I18n.currentLang === "ar";
    const stage = this.containerEl.querySelector("#quiz-stage");
    const pct = Math.round((this.score / QUESTIONS.length) * 100);

    stage.innerHTML = `
      <article class="quiz-card" style="text-align:center;align-items:center;">
        <div class="card-title">${isAr ? "اكتمل الاختبار" : "Quiz Completed"}</div>
        <div class="quiz-score-big">${pct}%</div>
        <p class="card-desc">
          ${
            isAr
              ? `أجبت بشكل صحيح على ${this.score} من أصل ${QUESTIONS.length} أسئلة.`
              : `You answered ${this.score} out of ${QUESTIONS.length} questions correctly.`
          }
        </p>
        <button id="btn-retry-quiz" class="btn-primary" type="button">
          ${isAr ? "إعادة الاختبار" : "Try Again"}
        </button>
      </article>
    `;

    stage.querySelector("#btn-retry-quiz").addEventListener("click", () => {
      this.startNewAttempt();
    });
  }

  dispose() {}
}
