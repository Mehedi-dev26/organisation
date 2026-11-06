// Service Worker for Somoyer Batighor (সময়ের বাতিঘর)
// Supports 100% Offline PWA Mode, Millisecond Caching & Sound-Enabled Web Push Notifications

const CACHE_VERSION = 'batighor-v3';
const STATIC_CACHE = `batighor-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `batighor-dynamic-${CACHE_VERSION}`;
const BANNER_CACHE = `batighor-banner-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/logo.png',
  '/logo-round.png',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/pwa-icon-maskable.png',
  '/default-avatar-cap.svg',
  '/sounds/notification.mp3'
];

// Pre-cache essential app shell on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Clean up stale caches on activate and claim clients immediately
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, BANNER_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!currentCaches.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch handler: Network-First navigation with offline fallback & Millisecond caching for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 1. Navigation requests (HTML pages): Network-First, fallback to cached /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // OFFLINE FALLBACK: Return cached page or app shell index.html
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          const cachedShell = await caches.match('/index.html');
          if (cachedShell) return cachedShell;
          return caches.match('/');
        })
    );
    return;
  }

  // 2. Images, banners & media: Cache-First with Stale-While-Revalidate
  const isImageOrMedia =
    request.destination === 'image' ||
    request.destination === 'audio' ||
    request.destination === 'font' ||
    url.pathname.includes('/site/hero-') ||
    url.pathname.includes('/gallery-images/') ||
    url.pathname.includes('/sounds/') ||
    /\.(jpg|jpeg|png|webp|svg|gif|mp3|wav|woff2?|ttf)$/i.test(url.pathname);

  if (isImageOrMedia) {
    event.respondWith(
      caches.open(BANNER_CACHE).then(async (cache) => {
        const cached = await cache.match(request);

        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 3. Vite assets (JS, CSS chunks with hashes) & Static Files: Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, networkResponse.clone()).catch(() => {});
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});

// Handle incoming Web Push notifications with custom sound & vibration
self.addEventListener('push', (event) => {
  let data = {
    title: 'সময়ের বাতিঘর (Somoyer Batighor)',
    body: 'আপনার সদস্য পোর্টালে নতুন নোটিফিকেশন এসেছে।',
    url: '/member/notices',
    icon: '/pwa-icon-192.png',
    badge: '/favicon.png',
    tag: 'batighor-notification-' + Date.now(),
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (err) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/pwa-icon-192.png',
    badge: data.badge || '/favicon.png',
    sound: '/sounds/notification.mp3',
    data: {
      url: data.url || '/member/notices',
      timestamp: Date.now(),
    },
    vibrate: [250, 100, 250, 100, 250],
    tag: data.tag || 'batighor-push',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Handle notification click: focus or navigate to target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/member/notices';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
