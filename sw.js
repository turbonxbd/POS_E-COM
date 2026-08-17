// SmartPOS - Service Worker Caching & Network-First Auto-Update Engine
const CACHE_NAME = 'smartpos-v2.6.0';
const ASSETS_TO_CACHE = [
  './portal.html',
  './cashier.html',
  './admin.html',
  './index.html',
  './super-admin.html',
  './style.css',
  './landing.css',
  './super-admin.css',
  './firebase-db.js',
  './print_hub.js',
  './demo_data.js',
  './cashier.js',
  './admin.js',
  './landing.js',
  './pwa-install.js',
  './manifest.json',
  './icons/icon.svg'
];

// Service Worker Install Event - Force Skip Waiting to prepare for new version
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed new version:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Service Worker Activate Event - Purge all stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating new version:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Purging old cache:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

// Message Event - Respond to client update commands
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.action === 'skipWaiting' || event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.action === 'purgeCache' || event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map(key => caches.delete(key)));
    });
  }
});

// Fetch Event - Network-First Strategy for HTML/JS/CSS (Always fetch fresh from server when online, fallback to cache when offline)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isCoreAsset = url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname === '/';

  if (isCoreAsset) {
    // Network-First for core code assets
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          console.log('[Service Worker] Network unavailable, serving cached asset:', event.request.url);
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-First for static assets (images, fonts)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});
