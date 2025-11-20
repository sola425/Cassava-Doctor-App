
const CACHE_NAME = 'cassava-doctor-v1';

// Files we know we need immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/public/model.json',
  '/public/tm_metadata.json',
  '/public/weights.bin'
];

// Install Event: Cache core files immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(PRECACHE_URLS);
      })
  );
});

// Activate Event: Clean up old caches if necessary
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Event: The core logic
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 1. If found in cache, return it
        if (response) {
          return response;
        }

        // 2. If not in cache, fetch from network
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors' && response.type !== 'opaque') {
              return response;
            }

            // Clone the response because it's a stream and can only be consumed once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Save to cache for next time
                // We use 'put' to dynamically cache CDN links and other assets
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
