// ──────────────── Snack Bowling · Service Worker ────────────────
// Estrategia: precaching de shell + stale-while-revalidate para todo lo demás.
// Bumpear CACHE_VERSION cada vez que cambien los archivos del shell.

const CACHE_VERSION = 'snack-v37';
const CACHE_NAME = `snack-${CACHE_VERSION}`;

// Archivos críticos que se cachean al instalar (app shell)
// URLs sin .html · Cloudflare Pages sirve `/cumples.html` con redirect 308 a `/cumples`
const PRECACHE = [
  '/',
  '/cumples',
  '/eventos',
  '/historia',
  '/site.css',
  '/site.js',
  '/wireframes.css',
  '/cumples.css',
  '/eventos.css',
  '/manifest.webmanifest',
  '/assets/logo-nav.webp',
  '/assets/logo-snack.webp',
  '/assets/favicon-32.png',
  '/assets/favicon-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('snack-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname === '/sw.js') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req).then((res) => {
        // Solo cacheamos respuestas 200 OK (no redirects 308)
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone).catch(() => {}));
        }
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
