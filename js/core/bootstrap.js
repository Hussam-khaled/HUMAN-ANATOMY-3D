import { AppConfig } from "./config.js";
import { SettingsService } from "./settings.js";
import { DatabaseService } from "../data/db.js";
import { I18n } from "../localization/i18n.js";
import { ROUTES, Router } from "../ui/router.js";
import { renderView, cleanupActiveView } from "../ui/views.js";
import { getIcon } from "../ui/icons.js";

const dom = {};

function cacheDom() {
  dom.sidebar = document.getElementById("sidebar");
  dom.backdrop = document.getElementById("drawer-backdrop");
  dom.sidebarNav = document.getElementById("sidebar-nav");
  dom.bottomNav = document.getElementById("bottom-nav");
  dom.topbarTitle = document.getElementById("topbar-title");
  dom.brandTitle = document.getElementById("brand-title");
  dom.offlineStatus = document.getElementById("offline-status");
  dom.viewContainer = document.getElementById("view-container");
  dom.btnMenu = document.getElementById("btn-menu");
  dom.btnQuickLang = document.getElementById("btn-quick-lang");
  dom.modal = document.getElementById("app-modal");
  dom.btnModalClose = document.getElementById("btn-modal-close");
}

function toggleDrawer(forceState) {
  const shouldOpen = typeof forceState === "boolean" ? forceState : !dom.sidebar.classList.contains("is-open");
  dom.sidebar.classList.toggle("is-open", shouldOpen);
  dom.backdrop.classList.toggle("is-visible", shouldOpen);
}

function updateNetworkIndicator() {
  if (!dom.offlineStatus) return;
  const isOnline = navigator.onLine;
  dom.offlineStatus.textContent = isOnline ? I18n.t("status_online") : I18n.t("status_offline_active");
  dom.offlineStatus.style.color = isOnline ? "var(--accent-medical)" : "#FCD34D";
}

function renderNavigationMenus(activeRouteId) {
  dom.sidebarNav.innerHTML = ROUTES.map(
    (route) => `
      <button class="nav-item ${route.id === activeRouteId ? "is-active" : ""}" type="button" data-route="${route.id}">
        <span class="nav-icon">${getIcon(route.icon)}</span>
        <span>${I18n.t(route.titleKey)}</span>
      </button>
    `
  ).join("");

  dom.sidebarNav.querySelectorAll("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleDrawer(false);
      Router.navigate(btn.getAttribute("data-route"));
    });
  });

  dom.bottomNav.innerHTML = ROUTES.filter((r) => r.quickNav)
    .map(
      (route) => `
        <button class="bottom-nav-btn ${route.id === activeRouteId ? "is-active" : ""}" type="button" data-route="${route.id}">
          <span class="bottom-nav-icon">${getIcon(route.icon)}</span>
          <span>${I18n.t(route.titleKey).split(" ")[0]}</span>
        </button>
      `
    )
    .join("");

  dom.bottomNav.querySelectorAll("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      Router.navigate(btn.getAttribute("data-route"));
    });
  });
}

function updateChromeText(activeRouteId) {
  const activeRoute = ROUTES.find((r) => r.id === activeRouteId) || ROUTES[0];
  document.title = `${I18n.t(activeRoute.titleKey)} | ${I18n.t("app_short")}`;
  dom.brandTitle.textContent = I18n.t("app_short");
  dom.topbarTitle.textContent = I18n.t(activeRoute.titleKey);
  dom.btnQuickLang.textContent = I18n.currentLang === "ar" ? "EN" : "عربي";
  updateNetworkIndicator();
}

async function handleRouteChange(routeId) {
  cleanupActiveView();
  updateChromeText(routeId);
  renderNavigationMenus(routeId);
  await renderView(routeId, dom.viewContainer, handleLanguageSwitch);
}

async function handleLanguageSwitch(targetLang) {
  const nextLang = targetLang || (I18n.currentLang === "ar" ? "en" : "ar");
  SettingsService.setLanguage(nextLang);
  await I18n.load(nextLang);
  await handleRouteChange(Router.getCurrentRoute().id);
}

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register(AppConfig.paths.serviceWorker);
    } catch (err) {
      console.warn("[SW] Registration warning:", err.message);
    }
  }
}

async function bootstrap() {
  cacheDom();

  dom.btnMenu.innerHTML = getIcon("menu");
  dom.btnModalClose.innerHTML = getIcon("close");

  const savedLang = SettingsService.getLanguage();
  SettingsService.getGraphicsQuality();

  await I18n.load(savedLang);
  await DatabaseService.init();
  await registerServiceWorker();

  dom.btnMenu.addEventListener("click", () => toggleDrawer());
  dom.backdrop.addEventListener("click", () => toggleDrawer(false));
  dom.btnQuickLang.addEventListener("click", () => handleLanguageSwitch());
  dom.btnModalClose.addEventListener("click", () => dom.modal.classList.remove("is-open"));
  dom.modal.addEventListener("click", (e) => {
    if (e.target === dom.modal) dom.modal.classList.remove("is-open");
  });

  window.addEventListener("online", updateNetworkIndicator);
  window.addEventListener("offline", updateNetworkIndicator);

  Router.init(handleRouteChange);
}

document.addEventListener("DOMContentLoaded", bootstrap);
