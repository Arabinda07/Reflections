// Reflections PWA – Service Worker
// Strategy: Cache-First for app shell, Network-First for API/Supabase
// ─────────────────────────────────────────────────────────────────────

const CACHE_NAME = 'reflections-shell-v1';

// Core app shell files to cache on install
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  // Google Fonts preloaded during install
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,400..700;1,400..700&display=swap',
  // Quill styles
  'https://cdn.quilljs.com/1.3.6/quill.snow.css',
];

// ── Install: precache the app shell ─────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()) // Activate immediately, don't wait for old SW to die
  );
});

// ── Activate: delete stale caches from old versions ─────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim()) // Take control of all open tabs immediately
  );
});

// ── Fetch: serve strategy based on request type ───────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // --- Never intercept: Supabase API, other external APIs ---
  const isSupabase = url.hostname.includes('supabase');
  const isGoogleApi = url.hostname.includes('googleapis') && !url.pathname.includes('/css');
  const isCloudFront = url.hostname.includes('cloudfront.net');
  const isEsmSh = url.hostname.includes('esm.sh');

  if (isSupabase || isGoogleApi || isCloudFront || isEsmSh) {
    // Network-only: always fetch live, never cache
    return;
  }

  // --- App shell & static assets: Cache-First ---
  if (
    request.method === 'GET' &&
    (url.origin === self.location.origin ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com') ||
      url.hostname.includes('cdn.quilljs.com'))
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        // Not in cache — fetch, clone, cache, return
        return fetch(request)
          .then((response) => {
            // Only cache successful, non-opaque responses
            if (
              response &&
              response.status === 200 &&
              response.type !== 'opaque'
            ) {
              const cloned = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
            }
            return response;
          })
          .catch(() => {
            // Offline fallback: serve index.html for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
    );
  }
});
