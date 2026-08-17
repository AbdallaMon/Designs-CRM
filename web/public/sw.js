// public/sw.js

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
          .filter((k) => k.startsWith("dream-chat-media-"))
          .map((k) => caches.delete(k))
      );
    })()
  );
});
