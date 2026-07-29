// Service Worker for POS Prima Motor PWA
// Caches static assets and provides offline fallback

const CACHE_NAME = "prima-motor-v1";

const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: pre-cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently fail if some assets can't be cached
      });
    }),
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch: network-first strategy for API, cache-first for static
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip Supabase API & Next.js HMR
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/_next/")
  ) {
    return; // Let these pass through to network
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response.ok) return response;

          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });

          return response;
        })
        .catch(() => {
          // Offline fallback
          if (event.request.mode === "navigate") {
            return caches.match("/dashboard");
          }
          return new Response("Offline", { status: 503 });
        });
    }),
  );
});
