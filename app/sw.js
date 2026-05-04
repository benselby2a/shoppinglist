const CACHE_NAME = "shopping-list-dev-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        const network = await fetch(event.request, { cache: "no-store" });
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, network.clone());
        return network;
      } catch {
        const cached = await caches.match(event.request);
        return cached || Response.error();
      }
    })()
  );
});
