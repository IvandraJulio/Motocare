const CACHE_NAME = 'motocare-v11';
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
    }).then(() => self.clients.claim())
  );
});

// Network-First strategy agar update HTML/JS/Gambar langsung tampil, fallback ke cache saat offline
self.addEventListener('fetch', (evt) => {
  if (evt.request.method !== 'GET') return;
  evt.respondWith(
    fetch(evt.request)
      .then((res) => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          const targetCache = evt.request.url.includes('/api/') ? 'motocare-data' : CACHE_NAME;
          caches.open(targetCache).then((cache) => cache.put(evt.request, resClone));
        }
        return res;
      })
      .catch(() => caches.match(evt.request))
  );
});
