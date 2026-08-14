// Service Worker for POS Prima Motor PWA
// Caches static assets and provides offline fallback.
//
// Strategi:
//   • Navigasi (HTML) → NETWORK-FIRST. Selalu ambil fresh dari jaringan saat
//     online; cache hanya dipakai saat offline. Mencegah HTML basi tersaji.
//   • Aset statis → cache-first dengan update dari jaringan.
//   • API & _next/ → tidak disentuh (pass-through).

const CACHE_NAME = "prima-motor-v2"; // bump versi ini jika berubah struktural

const STATIC_ASSETS = ["/icons/icon-192.png", "/icons/icon-512.png"];

// Install: pre-cache static assets (jangan pre-cache HTML/navigasi —
// biar selalu fresh dari jaringan)
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

// Fetch: network-first for navigations, cache-first for static
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip Supabase API & Next.js HMR & Next.js chunks
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/_next/")
  ) {
    return; // Let these pass through to network
  }

  // Navigasi (halaman HTML): NETWORK-FIRST
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() =>
          // Offline fallback: cache halaman terakhir, atau dashboard
          caches
            .match(event.request)
            .then((cached) => cached || caches.match("/dashboard")),
        ),
    );
    return;
  }

  // Aset statis (icons, dll): cache-first dengan update dari jaringan
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
        .catch(() => new Response("Offline", { status: 503 }));
    }),
  );
});
