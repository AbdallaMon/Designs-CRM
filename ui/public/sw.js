// public/sw.js

// Bump this when you want to force-clear old cached media
const CACHE_NAME = "dream-chat-media-v1";

// What we want to cache (same-origin)
function isUploadsRequest(url) {
  return (
    url.origin === self.location.origin && url.pathname.startsWith("/uploads/")
  );
}

// Optional: avoid caching SW file itself
function isServiceWorkerFile(url) {
  return url.origin === self.location.origin && url.pathname === "/sw.js";
}

self.addEventListener("install", (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control immediately + cleanup old caches
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("dream-chat-media-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== "GET") return;

  // Don't interfere with the SW file itself
  if (isServiceWorkerFile(url)) return;

  // Only cache /uploads/*
  if (!isUploadsRequest(url)) return;

  // IMPORTANT for video/audio:
  // Many browsers use Range requests (streaming). Handling Range in SW cache is complex.
  // For now: let Range requests go to network (browser HTTP cache will still help).
  if (req.headers.has("range")) {
    return; // default fetch
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Cache-first
      const cached = await cache.match(req);
      if (cached) return cached;

      // Fetch and cache
      const res = await fetch(req);

      // Cache only successful, basic/cors responses
      if (res && res.ok) {
        cache.put(req, res.clone());
      }

      return res;
    })()
  );
});
