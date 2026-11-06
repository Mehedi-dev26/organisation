// Service Worker for Somoyer Batighor (সময়ের বাতিঘর)
// Supports Web Push Notifications & Ultra-Fast Millisecond Image/Banner Caching
const CACHE_NAME = 'batighor-v2';
const BANNER_CACHE = 'batighor-banner-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Intercept image & banner requests for instant millisecond load (Cache-First / Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isImageRequest = 
    event.request.destination === 'image' ||
    url.pathname.includes('/site/hero-') ||
    url.pathname.includes('/gallery-images/') ||
    url.pathname.includes('/images/banner') ||
    /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(url.pathname);

  // Only cache GET image requests
  if (event.request.method === 'GET' && isImageRequest) {
    event.respondWith(
      caches.open(BANNER_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);

        // Fetch from network to update cache in background
        const networkFetch = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => {
            // Return cached response if offline/network fails
            return cachedResponse;
          });

        // If we have a cached response, return it in ~1ms!
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise return the network response
        return networkFetch;
      })
    );
  }
});

// Handle incoming Web Push notifications
self.addEventListener('push', (event) => {
  let data = {
    title: 'সময়ের বাতিঘর (Somoyer Batighor)',
    body: 'আপনার সদস্য পোর্টালে নতুন নোটিফিকেশন এসেছে।',
    url: '/member/notices',
    icon: '/favicon.png',
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
    icon: data.icon || '/favicon.png',
    badge: data.badge || '/favicon.png',
    data: {
      url: data.url || '/member/notices',
      timestamp: Date.now(),
    },
    vibrate: [150, 80, 150],
    tag: data.tag || 'batighor-push',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Handle notification click: focus or open the target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/member/notices';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/member') && 'focus' in client) {
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
