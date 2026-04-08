const CACHE_NAME = 'wsc-entries-v1';
const ASSETS = ['/wsc-halsail-pwa/', '/wsc-halsail-pwa/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'WSC Entries', body: event.data.text(), type: 'detect' };
  }
  const options = {
    body: data.body,
    icon: '/wsc-halsail-pwa/icon-192.png',
    badge: '/wsc-halsail-pwa/icon-192.png',
    tag: data.type === 'complete' ? 'wsc-complete' : 'wsc-detect',
    renotify: true,
    requireInteraction: data.type === 'detect',
    data: { type: data.type, url: self.registration.scope },
    actions: data.type === 'detect' ? [{ action: 'view', title: 'Review Entries' }] : [],
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(self.registration.scope);
    })
  );
});
