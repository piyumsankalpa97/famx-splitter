// FamX Splitter — Service Worker
// Strategy:
//   - Static assets (/_next/static/*): cache-first (hashed filenames are immutable)
//   - Google Fonts / CDN: stale-while-revalidate
//   - Everything else (Supabase API, pages): network-only (always fresh data)

const CACHE_VERSION = "famx-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  // Claim all clients so the SW controls pages without a reload
  event.waitUntil(
    (async () => {
      // Delete old cache versions
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("famx-") && k !== STATIC_CACHE && k !== FONT_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Next.js static assets — cache-first (filenames are content-hashed, safe to cache forever)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 2. Google Fonts — stale-while-revalidate
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  // 3. Everything else (Supabase, page navigations) — network only
  // No caching; data must always be fresh.
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  return cached ?? networkPromise;
}
