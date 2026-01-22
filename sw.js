
const STATIC_CACHE = 'atd-static-v2';
const MODULE_CACHE = 'atd-modules-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/logo.png',
  '/types.ts',
  '/constants.ts'
];

// Helper to check if a request is for an esm.sh module
const isModuleRequest = (url) => url.includes('esm.sh');

// Helper to check if a request is for the Gemini API
const isApiRequest = (url) => url.includes('generativelanguage.googleapis.com');

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('ATD: Pre-caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== MODULE_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip caching for API requests (Gemini API uses POST)
  // We handle these with Network-Only logic and a custom offline response
  if (isApiRequest(request.url)) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: {
              code: 503,
              message: "ATD Neural Link Offline: The service worker detected no network connection to the intelligence core.",
              status: "OFFLINE_UNAVAILABLE"
            }
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 2. Stale-While-Revalidate for external modules (esm.sh)
  if (isModuleRequest(request.url)) {
    event.respondWith(
      caches.open(MODULE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 3. Cache-First for internal static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        // Cache static files dynamically if they aren't in the pre-cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
