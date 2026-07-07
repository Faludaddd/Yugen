/**
 * Yugen Service Worker
 *
 * Caching strategy:
 *   - App shell (HTML, CSS, JS, fonts): cache-first with network fallback
 *   - Static assets (icons, splash): cache-first
 *   - AniList API responses: stale-while-revalidate (5 min cache)
 *   - Stream proxy / video segments: network-only (don't cache video)
 *   - Images from AniList CDN: cache-first (they don't change)
 */

const CACHE_VERSION = 'yugen-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const APP_SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.svg',
  '/logo-lockup.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS).catch(() => {
        // If any asset fails, ignore — we'll cache on demand
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip video segments and stream proxy — never cache
  if (url.pathname.startsWith('/api/proxy') || url.pathname.includes('.m3u8') || url.pathname.includes('.ts')) {
    return;
  }

  // Skip cross-origin requests except AniList CDN
  const isSameOrigin = url.origin === self.location.origin;
  const isAniListCDN = url.hostname.includes('anilist.co') || url.hostname.includes('s4.anilist.co');

  if (!isSameOrigin && !isAniListCDN) return;

  // App shell (HTML, CSS, JS) — cache-first
  if (isSameOrigin && (request.destination === 'style' || request.destination === 'script' || request.destination === 'document')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Static assets (icons, splash, logo) — cache-first
  if (isSameOrigin && (request.destination === 'image' || url.pathname.startsWith('/icon-') || url.pathname.startsWith('/splash/') || url.pathname.startsWith('/logo'))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // AniList API responses — stale-while-revalidate
  if (isSameOrigin && url.pathname.startsWith('/api/anime')) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              cache.put(request, clone);
            }
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // AniList CDN images — cache-first
  if (isAniListCDN && request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cached) => {
          return cached || fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              cache.put(request, clone);
            }
            return response;
          }).catch(() => cached);
        });
      })
    );
    return;
  }
});
