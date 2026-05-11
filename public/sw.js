const CACHE_NAME = 'cyber-cloud-v1';
const MAINTENANCE_PAGE = '/maintenance.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([MAINTENANCE_PAGE]);
    })
  );
  self.skipWaiting(); // Force activation
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Take control immediately
});

self.addEventListener('fetch', (event) => {
  // Only intercept navigation requests to the main app or API calls that fail
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(MAINTENANCE_PAGE);
      })
    );
  }
});
