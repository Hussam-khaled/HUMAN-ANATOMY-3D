import { AppConfig } from "../core/config.js";

const CORE_BODY_SYSTEMS = [
  { id: "skeletal", nameAr: "الجهاز الهيكلي", nameEn: "Skeletal System", color: "#E5E0D5", order: 1, defaultVisible: true },
  { id: "muscular", nameAr: "الجهاز العضلي", nameEn: "Muscular System", color: "#B84A4A", order: 2, defaultVisible: true },
  { id: "nervous", nameAr: "الجهاز العصبي", nameEn: "Nervous System", color: "#E5C158", order: 3, defaultVisible: false },
  { id: "cardiovascular", nameAr: "الجهاز القلبي الوعائي", nameEn: "Cardiovascular System", color: "#C93B3B", order: 4, defaultVisible: false },
  { id: "respiratory", nameAr: "الجهاز التنفسي", nameEn: "Respiratory System", color: "#5EA3C4", order: 5, defaultVisible: false },
  { id: "digestive", nameAr: "الجهاز الهضمي", nameEn: "Digestive System", color: "#C78D52", order: 6, defaultVisible: false },
  { id: "urinary", nameAr: "الجهاز البولي", nameEn: "Urinary System", color: "#D4A843", order: 7, defaultVisible: false },
  { id: "reproductive", nameAr: "الجهاز التناسلي", nameEn: "Reproductive System", color: "#9E6B8F", order: 8, defaultVisible: false },
  { id: "lymphatic", nameAr: "الجهاز اللمفاوي", nameEn: "Lymphatic System", color: "#6BA368", order: 9, defaultVisible: false },
  { id: "endocrine", nameAr: "جهاز الغدد الصماء", nameEn: "Endocrine System", color: "#8C7AE6", order: 10, defaultVisible: false }
];

class LocalDatabase {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(AppConfig.dbName, AppConfig.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("bodySystems")) {
          const store = db.createObjectStore("bodySystems", { keyPath: "id" });
          store.createIndex("order", "order", { unique: false });
        }

        if (!db.objectStoreNames.contains("organs")) {
          const store = db.createObjectStore("organs", { keyPath: "id" });
          store.createIndex("systemId", "systemId", { unique: false });
        }

        if (!db.objectStoreNames.contains("anatomyModels")) {
          const store = db.createObjectStore("anatomyModels", { keyPath: "id" });
          store.createIndex("systemId", "systemId", { unique: false });
        }

        if (!db.objectStoreNames.contains("imagingSeries")) {
          const store = db.createObjectStore("imagingSeries", { keyPath: "id" });
          store.createIndex("modality", "modality", { unique: false });
        }

        if (!db.objectStoreNames.contains("academyArticles")) {
          const store = db.createObjectStore("academyArticles", { keyPath: "id" });
          store.createIndex("systemId", "systemId", { unique: false });
        }

        if (!db.objectStoreNames.contains("quizQuestions")) {
          const store = db.createObjectStore("quizQuestions", { keyPath: "id" });
          store.createIndex("systemId", "systemId", { unique: false });
        }

        if (!db.objectStoreNames.contains("userQuizResults")) {
          const store = db.createObjectStore("userQuizResults", { keyPath: "id", autoIncrement: true });
          store.createIndex("completedAt", "completedAt", { unique: false });
        }
      };

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(new Error(`IndexedDB open error: ${event.target.error}`));
    });

    await this.seedCoreSystemsIfEmpty();
    return this.db;
  }

  async seedCoreSystemsIfEmpty() {
    const existing = await this.getAllBodySystems();
    if (existing.length > 0) return;

    await new Promise((resolve, reject) => {
      const tx = this.db.transaction("bodySystems", "readwrite");
      const store = tx.objectStore("bodySystems");
      CORE_BODY_SYSTEMS.forEach((sys) => store.put(sys));
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async getAllBodySystems() {
    this._ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("bodySystems", "readonly");
      const store = tx.objectStore("bodySystems");
      const req = store.getAll();
      req.onsuccess = () => {
        const sorted = (req.result || []).sort((a, b) => a.order - b.order);
        resolve(sorted);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async saveQuizResult(resultRecord) {
    this._ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("userQuizResults", "readwrite");
      const store = tx.objectStore("userQuizResults");
      const req = store.add({
        ...resultRecord,
        completedAt: Date.now()
      });
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  _ensureReady() {
    if (!this.db) {
      throw new Error("Database not initialized. Call DatabaseService.init() first.");
    }
  }
}

export const DatabaseService = new LocalDatabase();
