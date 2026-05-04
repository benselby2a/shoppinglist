const CACHE_VERSION = "msl-shell-v7";
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/app/styles.css",
  "/app/app.js",
  "/manifest.webmanifest",
  "/icons/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      for (const asset of SHELL_ASSETS) {
        const req = new Request(asset, { cache: "reload" });
        const res = await fetch(req);
        await cache.put(asset, res);
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_VERSION ? Promise.resolve() : caches.delete(k))));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Never cache Supabase API responses here; let app-level sync own data flow.
  if (!isSameOrigin || url.pathname.startsWith("/rest/v1/") || url.pathname.startsWith("/realtime/")) {
    return;
  }

  // Cache-first for app shell assets.
  if (SHELL_ASSETS.includes(url.pathname) || url.pathname === "/") {
    event.respondWith(
      (async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        const fresh = await fetch(event.request);
        const cache = await caches.open(CACHE_VERSION);
        cache.put(event.request, fresh.clone());
        return fresh;
      })()
    );
    return;
  }

  // Network-first fallback for other same-origin GETs.
  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(event.request);
        const cache = await caches.open(CACHE_VERSION);
        cache.put(event.request, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(event.request);
        return cached || caches.match("/index.html");
      }
    })()
  );
});
