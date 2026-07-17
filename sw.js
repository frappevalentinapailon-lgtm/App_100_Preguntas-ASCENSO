const CACHE_NAME = 'app-100-cache-v2';
const urlsToCache = [
  './index.html',
  './style.css',
  './app.js',
  './data.js',
  './images/logo.png',
  './instalar/pwa.js',
  './instalar/icon-192.png',
  './instalar/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache abierto');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
      .catch(err => console.error('[SW] Error al cachear:', err))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Eliminando cache viejo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});