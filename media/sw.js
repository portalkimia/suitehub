const CACHE_NAME = 'portal-kimia-v7-final';
const STATIC_ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First with Cache Fallback for HTML/data, Cache First for static
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Ignore Google Apps Script API calls or external domains for dynamic data
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin || requestUrl.pathname.endsWith('/Guru.html')) {
    return;
  }

  // Assessment pages should receive current submission rules whenever connected.
  if (event.request.mode === 'navigate' || requestUrl.pathname.endsWith('.html')) {
    event.respondWith(fetch(event.request).then(async response => {
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    }).catch(async () => (await caches.match(event.request)) || new Response('Halaman belum tersedia offline. Sambungkan jaringan untuk memuat media.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to revalidate cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback to index if navigation request
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
