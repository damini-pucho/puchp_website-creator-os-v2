// Service worker — the app installs to a phone's home screen and opens on a bad connection.
// Hashed /assets/* (Vite build output) are immutable → cache-first. A navigation is network-first and, offline, falls
// back to the last app shell it cached. /api/* (database, flows, inbound) and /health are never cached — a stale record
// is worse than a spinner. Adapted from the Pucho OS kernel's sw.js for a Vite SPA.
const VERSION = 'wco-shell-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(VERSION)); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/health')) return;
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/brand/')) {
    e.respondWith(caches.open(VERSION).then(async (c) => (await c.match(e.request)) || fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; })));
    return;
  }
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put('/__offline', copy)); } return r; }).catch(() => caches.match('/__offline')));
  }
});
