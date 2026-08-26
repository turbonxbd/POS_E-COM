// SmartPOS - Service Worker Caching & Instant Automatic Background Update Engine
const CACHE_NAME = 'smartpos-v6.3.0';
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
  './subscription-modal.js',
  './manifest.json',
  './icons/icon.svg'
];

// Service Worker Install Event - Cache app shell assets instantly
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed new version:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Service Worker Activate Event - Purge stale caches and claim clients immediately
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

// Fetch Event - Resilient Stale-While-Revalidate PWA App Live Update Strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Ignore chrome-extensions, Firebase WebSockets, and Firestore long-polling requests
  if (url.includes('chrome-extension') || url.includes('firestore.googleapis.com') || url.includes('firebaseio.com')) {
    return;
  }

  // Core App Shell & Scripts (.html, .js, .css): Stale-While-Revalidate Strategy (Cache Instant Load + Background Refresh)
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);

      // Revalidate in background asynchronously without blocking script execution
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => null);

      if (cachedResponse) {
        return cachedResponse;
      }

      // If asset is not in cache yet, wait for network fetch
      const netResp = await fetchPromise;
      if (netResp) return netResp;

      // Fallback matching for page paths
      const cleanUrl = url.split('?')[0].split('#')[0];
      const pageMatch = await caches.match(cleanUrl);
      if (pageMatch) return pageMatch;

      // Final offline fallback
      return caches.match('./portal.html') || caches.match('./index.html');
    })()
  );
});

