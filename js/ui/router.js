export const ROUTES = Object.freeze([
  { id: "atlas", titleKey: "nav_atlas", icon: "atlas", quickNav: true },
  { id: "systems", titleKey: "nav_systems", icon: "systems", quickNav: true },
  { id: "anatomy-lab", titleKey: "nav_anatomy_lab", icon: "anatomyLab", quickNav: false },
  { id: "physiology-lab", titleKey: "nav_physiology_lab", icon: "physiologyLab", quickNav: false },
  { id: "imaging-lab", titleKey: "nav_imaging_lab", icon: "imagingLab", quickNav: false },
  { id: "academy", titleKey: "nav_academy", icon: "academy", quickNav: true },
  { id: "quiz", titleKey: "nav_quiz", icon: "quiz", quickNav: false },
  { id: "settings", titleKey: "nav_settings", icon: "settings", quickNav: true }
]);

class AppRouter {
  constructor() {
    this.currentRouteId = "atlas";
    this.onNavigateCallback = null;
  }

  init(onNavigateCallback) {
    this.onNavigateCallback = onNavigateCallback;
    window.addEventListener("hashchange", () => this.syncFromHash());
    this.syncFromHash();
  }

  syncFromHash() {
    const rawHash = window.location.hash.replace("#", "").trim();
    const valid = ROUTES.find((r) => r.id === rawHash);
    this.currentRouteId = valid ? valid.id : "atlas";
    if (this.onNavigateCallback) {
      this.onNavigateCallback(this.currentRouteId);
    }
  }

  navigate(routeId) {
    const valid = ROUTES.find((r) => r.id === routeId);
    const target = valid ? valid.id : "atlas";
    if (window.location.hash !== `#${target}`) {
      window.location.hash = `#${target}`;
    } else if (this.onNavigateCallback) {
      this.onNavigateCallback(target);
    }
  }

  getCurrentRoute() {
    return ROUTES.find((r) => r.id === this.currentRouteId) || ROUTES[0];
  }
}

export const Router = new AppRouter();
