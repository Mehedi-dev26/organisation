// Service Worker for Somoyer Batighor (সময়ের বাতিঘর) Web Push Notifications
const CACHE_NAME = 'batighor-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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

