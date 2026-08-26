// SmartPOS - Service Worker Caching & Instant Automatic Background Update Engine
const CACHE_NAME = 'smartpos-v6.5.0-ULTRA-LIVE';
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
  './version.json',
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

// Fetch Event - Instant Automatic PWA App Live Update Strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Always fetch version.json live without cache to detect instant GitHub deployment updates
  if (url.includes('version.json')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  // Ignore chrome-extensions, Firebase WebSockets, and Firestore long-polling requests
  if (url.includes('chrome-extension') || url.includes('firestore.googleapis.com') || url.includes('firebaseio.com')) {
    return;
  }

  // HTML Pages & Core JS/CSS Application Files: Robust Network-First with 8.0s Timeout Fallback for Remote 3G/4G Connections
  if (url.includes('.html') || url.includes('.js') || url.includes('.css') || url.endsWith('/') || url === self.location.origin) {
    event.respondWith(
      (async () => {
        try {
          const controller = new AbortController();
          // 8.0s timeout ensures remote merchants on 3G/4G mobile data receive complete JS/CSS updates without premature aborts
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const networkResponse = await fetch(event.request, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        } catch (err) {
          // Offline fallback: load cached asset when network is truly unavailable
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;

          // Fallback matching for relative page paths
          const cleanUrl = url.split('?')[0].split('#')[0];
          const pageMatch = await caches.match(cleanUrl);
          if (pageMatch) return pageMatch;

          throw err;
        }
      })()
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset instantly (0.01s load) while revalidating in background
        if (url.startsWith(self.location.origin)) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }

      // If not in cache, fetch with 8s timeout fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      return fetch(event.request, { signal: controller.signal })
        .then((networkResponse) => {
          clearTimeout(timeoutId);
          if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          clearTimeout(timeoutId);
          return caches.match('./index.html');
        });
    })
  );
});
