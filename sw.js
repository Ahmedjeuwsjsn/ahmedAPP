
const CACHE_NAME = 'sufra-baghdad-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://cdn-icons-png.flaticon.com/512/1830/1830839.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
