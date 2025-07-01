const CACHE_NAME = 'payment-allocator-v2'; // Updated version
const URLS_TO_CACHE = [
  '/payment-allocator-app/',
  '/payment-allocator-app/index.html',
  '/payment-allocator-app/app.js',
  '/payment-allocator-app/manifest.json',
  '/payment-allocator-app/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});