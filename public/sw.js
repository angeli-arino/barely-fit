const CACHE_NAME = 'barely-fit-v1';
self.addEventListener('install', (event) => event.waitUntil((async () => {
  const cache = await caches.open(CACHE_NAME);
  const indexResponse = await fetch('./index.html');
  const indexText = await indexResponse.clone().text();
  await cache.put('./index.html', indexResponse);
  const assetPaths = [...indexText.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => !path.startsWith('http'));
  await cache.addAll(['./', './manifest.webmanifest', './icon.svg', './icon-maskable.svg', ...assetPaths]);
  await self.skipWaiting();
})()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok && ['document', 'script', 'style', 'image', 'font', 'manifest'].includes(event.request.destination)) {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then((cached) => {
    if (cached) return cached;
    if (event.request.mode === 'navigate') return caches.match('./index.html').then((shell) => shell ?? new Response('Offline', { status: 503 }));
    return new Response('Offline', { status: 503 });
  })));
});
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(self.registration.showNotification(data.title ?? 'Rest complete', {
    body: data.body ?? 'Your next Set is ready.', icon: './icon-maskable.svg', tag: data.tag ?? 'barely-fit-rest-timer', renotify: true,
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients[0];
    return existing ? existing.focus() : self.clients.openWindow('./');
  }));
});
