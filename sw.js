// La app intenta traer la última versión; el modelo y el detector (pesados) se guardan y se reutilizan sin internet.
const CACHE = 'mano-metro-v5';
const HEAVY = /hand_landmarker\.task$|cdn\.jsdelivr\.net/;
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'hand_landmarker.task']))); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const put = r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return r; };
  if (HEAVY.test(e.request.url)) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(put)));
  } else {
    e.respondWith(fetch(e.request).then(put).catch(() => caches.match(e.request)));
  }
});
