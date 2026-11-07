const CACHE_VERSION = "msl-shell-v162";
// Holds the meal-plan .ics the wizard generates (see app/wizard.js); kept across releases.
const CALENDAR_CACHE = "msl-calendar";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./app/styles.css",
  "./app/app.js",
  "./app/wizard.js",
  "./app/vendor/supabase.js",
  "./manifest.webmanifest",
  "./icons/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const scopeUrl = new URL(self.registration.scope);
      for (const asset of SHELL_ASSETS) {
        const req = new Request(new URL(asset, scopeUrl).toString(), { cache: "reload" });
        const res = await fetch(req);
        await cache.put(req, res);
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_VERSION || k === CALENDAR_CACHE ? Promise.resolve() : caches.delete(k))));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const scopePath = new URL(self.registration.scope).pathname.replace(/\/$/, "");
  const withinScope = url.pathname.startsWith(scopePath);
  const relPath = withinScope ? url.pathname.slice(scopePath.length) || "/" : url.pathname;

  // Never cache Supabase API responses here; let app-level sync own data flow.
  if (!isSameOrigin || relPath.startsWith("/rest/v1/") || relPath.startsWith("/realtime/")) {
    return;
  }

  // Serve the wizard's generated calendar as a real file download.
  if (relPath === "/__calendar/meals.ics") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CALENDAR_CACHE);
        return (await cache.match(event.request, { ignoreSearch: true })) || new Response("Not found", { status: 404 });
      })()
    );
    return;
  }

  // Cache-first for app shell assets.
  if (
    relPath === "/" ||
    relPath === "/index.html" ||
    relPath === "/app/styles.css" ||
    relPath === "/app/app.js" ||
    relPath === "/app/wizard.js" ||
    relPath === "/app/vendor/supabase.js" ||
    relPath === "/manifest.webmanifest" ||
    relPath === "/icons/icon.svg"
  ) {
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
        if (cached) return cached;
        const fallbackReq = new Request(new URL("./index.html", self.registration.scope).toString());
        return caches.match(fallbackReq);
      }
    })()
  );
});
