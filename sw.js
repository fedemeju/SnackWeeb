// ──────────────── Snack Bowling · Service Worker ────────────────
// Estrategia: precaching de shell + stale-while-revalidate para todo lo demás.
// Bumpear CACHE_VERSION cada vez que cambien los archivos del shell.

const CACHE_VERSION = 'snack-v27';
const CACHE_NAME = `snack-${CACHE_VERSION}`;

// Archivos críticos que se cachean al instalar (app shell)
const PRECACHE = [
  '/',
  '/index.html',
  '/cumples.html',
  '/eventos.html',
  '/historia.html',
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
    caches.open(CACHE_NAME).then((cache) =>
      // addAll falla si UNO solo falla; usamos add() individual para tolerar 404s
      Promise.all(PRECACHE.map((url) =>
        cache.add(url).catch(() => null)
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys
        .filter((k) => k.startsWith('snack-') && k !== CACHE_NAME)
        .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // No interceptar pedidos externos (Google Fonts, GA, Maps, etc.)
  if (url.origin !== location.origin) return;

  // No cachear el ServiceWorker en sí ni partials con query strings versionados
  if (url.pathname === '/sw.js') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      // Stale-while-revalidate: si está en cache, lo retorna y revalida en background
      const networkFetch = fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return resp;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
