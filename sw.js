// SmartPOS - Service Worker Caching & Instant Automatic Background Update Engine
const CACHE_NAME = 'smartpos-v4.3.0';
const ASSETS_TO_CACHE = [
  './',
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

// Robust Multi-Path Cache Matcher for Desktop PCs and Mobile Browsers
async function getCachedAsset(request) {
  // 1. Try direct match
  const directMatch = await caches.match(request);
  if (directMatch) return directMatch;

  // 2. Extract pathname and filename
  const urlObj = new URL(request.url);
  const pathname = urlObj.pathname;
  const filename = pathname.split('/').pop() || 'index.html';

  // 3. Try relative path variants
  const relativeVariants = [
    `./${filename}`,
    `/${filename}`,
    filename
  ];

  for (const variant of relativeVariants) {
    const matched = await caches.match(variant);
    if (matched) return matched;
  }

  // 4. Desktop/Mobile HTML Navigation Fallback Engine
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html') || pathname.endsWith('.html') || !pathname.includes('.')) {
    if (pathname.includes('cashier')) return (await caches.match('./cashier.html')) || (await caches.match('cashier.html'));
    if (pathname.includes('admin') && !pathname.includes('super-admin')) return (await caches.match('./admin.html')) || (await caches.match('admin.html'));
    if (pathname.includes('super-admin')) return (await caches.match('./super-admin.html')) || (await caches.match('super-admin.html'));
    if (pathname.includes('portal')) return (await caches.match('./portal.html')) || (await caches.match('portal.html'));
    return (await caches.match('./index.html')) || (await caches.match('index.html'));
  }

  return null;
}

// Fetch Event - Instant Automatic PWA App Live Update & Desktop Offline Strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Ignore chrome-extensions, Firebase WebSockets, and Firestore long-polling requests
  if (url.includes('chrome-extension') || url.includes('firestore.googleapis.com') || url.includes('firebaseio.com')) {
    return;
  }

  // HTML Pages & Application Scripts: Network-First when online, Robust Cache Fallback when offline
  if (url.includes('.html') || url.includes('.js') || url.endsWith('/') || url === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await getCachedAsset(event.request);
          if (cached) return cached;
          return new Response('Offline Page', { status: 200, headers: { 'Content-Type': 'text/html' } });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(async (cachedResponse) => {
      if (cachedResponse) {
        if (url.startsWith(self.location.origin) && !url.includes('.html')) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }

      // Try multi-path asset matcher before network timeout
      const fallbackCache = await getCachedAsset(event.request);
      if (fallbackCache) return fallbackCache;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      return fetch(event.request, { signal: controller.signal })
        .then((networkResponse) => {
          clearTimeout(timeoutId);
          if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          clearTimeout(timeoutId);
          const finalFallback = await getCachedAsset(event.request);
          if (finalFallback) return finalFallback;
          return caches.match('./index.html');
        });
    })
  );
});
