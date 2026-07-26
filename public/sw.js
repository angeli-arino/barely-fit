const CACHE_NAME = 'barely-fit-v2';
const scopedUrl = (path = '') => new URL(path, self.registration.scope).href;
self.addEventListener('install', (event) => event.waitUntil((async () => {
  const cache = await caches.open(CACHE_NAME);
  const indexUrl = scopedUrl('index.html');
  const indexResponse = await fetch(indexUrl);
  const indexText = await indexResponse.clone().text();
  await cache.put(indexUrl, indexResponse);
  const assetPaths = [...indexText.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => !path.startsWith('http'));
  const shellUrls = [...new Set([
    scopedUrl(),
    scopedUrl('manifest.webmanifest'),
    scopedUrl('icon.svg'),
    scopedUrl('icon-maskable.svg'),
    ...assetPaths.map((path) => new URL(path, self.registration.scope).href),
  ])];
  await cache.addAll(shellUrls);
  await self.skipWaiting();
})()));
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // The release browser suite uses a same-origin fake API; leaving it outside
  // the service worker keeps Playwright routing deterministic.
  if (url.pathname.includes('/e2e-supabase/')) return;
  if (['script', 'style', 'image', 'font', 'manifest'].includes(event.request.destination)) {
    event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    })));
    return;
  }
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok && event.request.destination === 'document') {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then((cached) => {
    if (cached) return cached;
    if (event.request.mode === 'navigate') return caches.match(scopedUrl('index.html')).then((shell) => shell ?? new Response('Offline', { status: 503 }));
    return new Response('Offline', { status: 503 });
  })));
});
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(self.registration.showNotification(data.title ?? 'Rest complete', {
    body: data.body ?? 'Your next Set is ready.', icon: scopedUrl('icon-maskable.svg'), tag: data.tag ?? 'barely-fit-rest-timer', renotify: true,
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients[0];
    return existing ? existing.focus() : self.clients.openWindow(scopedUrl());
  }));
});
