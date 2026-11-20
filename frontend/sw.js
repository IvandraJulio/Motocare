const CACHE_NAME = 'motocare-v8';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './images/icon-192.png',
  './images/icon-512.png',
  './images/motor-adv.png',
  './images/oli-mesin.png',
  './images/busi.png',
  './images/kampas-rem.png',
  './images/ban.png',
  './images/profile.jpg'
];

self.addEventListener('install', (evt) => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== 'motocare-data')
            .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  // Handle API requests with Network First, falling back to cache
  if (evt.request.url.includes('/api/')) {
    evt.respondWith(
      fetch(evt.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open('motocare-data').then((cache) => cache.put(evt.request, resClone));
          return res;
        })
        .catch(() => caches.match(evt.request))
    );
  } else {
    // Handle static assets with Cache First, falling back to network
    evt.respondWith(
      caches.match(evt.request).then((cacheRes) => cacheRes || fetch(evt.request))
    );
  }
});
