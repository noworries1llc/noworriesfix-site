// Kill switch for the old Lovable service worker (same path: /sw.js).
// Browsers re-fetch this file on return visits; this version removes the old
// caches, unregisters itself, and reloads open tabs so visitors get the live site.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) client.navigate(client.url);
  })());
});
