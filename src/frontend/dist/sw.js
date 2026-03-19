const CACHE_NAME = 'daily-focus-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: pre-cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for navigation & static assets, network-first for API calls
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Network-first for backend/API calls
  if (url.pathname.startsWith('/api') || url.hostname.endsWith('.ic0.app') || url.hostname.endsWith('.icp0.io')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for everything else (HTML, JS, CSS, fonts, images)
  e.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          // Cache valid responses for future offline use
          if (response && response.status === 200 && response.type !== 'opaque') {
            cache.put(e.request, response.clone());
          }
          return response;
        }).catch(() => {
          // For navigation requests, serve index.html from cache
          if (e.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
    )
  );
});
