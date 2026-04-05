// Minute Mantra Service Worker
// Handles: precaching, runtime caching, push notifications, background sync

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache all build assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// CDN assets — cache first
registerRoute(
  ({ url }) => url.hostname === 'minute-mantra.b-cdn.net',
  new CacheFirst({
    cacheName: 'bunny-cdn',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
);

// API — stale while revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/mantras/today'),
  new StaleWhileRevalidate({
    cacheName: 'mantra-today',
    plugins: [new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 })],
  })
);

// Push notification handler
self.addEventListener('push', event => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Minute Mantra', body: event.data.text() };
  }

  const options = {
    body: data.body || 'Your daily mantra is ready.',
    icon: 'https://minute-mantra.b-cdn.net/icons/icon-192.png',
    badge: 'https://minute-mantra.b-cdn.net/icons/badge-72.png',
    image: data.image || undefined,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open Mantra' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Minute Mantra', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
