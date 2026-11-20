const CACHE_NAME = "ha3d-core-v7.0.0";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/css/tokens.css",
  "./assets/css/layout.css",
  "./assets/css/atlas3d.css",
  "./assets/css/physiology.css",
  "./assets/css/imaging.css",
  "./assets/css/academy.css",
  "./data/licenses.json",
  "./data/locales/ar.json",
  "./data/locales/en.json",
  "./js/core/config.js",
  "./js/core/settings.js",
  "./js/data/db.js",
  "./js/localization/i18n.js",
  "./js/ui/icons.js",
  "./js/ui/router.js",
  "./js/anatomy3d/prototypeModel.js",
  "./js/anatomy3d/viewer3d.js",
  "./js/physiology/physiologyLab.js",
  "./js/imaging/imagingLab.js",
  "./js/academy/academyLab.js",
  "./js/ui/views.js",
  "./js/core/bootstrap.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((oldKey) => caches.delete(oldKey))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;
  const isCdn = url.hostname === "cdn.jsdelivr.net" || url.hostname === "www.gstatic.com";

  if (!isLocal && !isCdn) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
