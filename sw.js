// ============================================
// 1. CONFIGURACIÓN
// ============================================
const CACHE_NAME = 'yoendi-v3'; // 👈 cambia versión al actualizar

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './app.js',
  './img/Perfil.jpg',
  './img/Kiosko.png',
  './img/icono.png',
  './img/icono.webp',
  './img/Kiosko.webp'
];

// ============================================
// 2. INSTALL — cachea uno por uno (tolerante a fallos)
// ============================================
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // addAll falla entero si un archivo falla → cacheamos individual
      await Promise.all(
        ASSETS_TO_CACHE.map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: 'reload' }));
          } catch (err) {
            console.warn('[SW] No se pudo cachear:', url, err);
          }
        })
      );
    })
  );
  self.skipWaiting();
});

// ============================================
// 3. ACTIVATE — limpia cachés viejas
// ============================================
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ============================================
// 4. FETCH — estrategias por tipo de petición
// ============================================
self.addEventListener('fetch', (e) => {
  const { request } = e;

  // Solo manejamos GET (POST/PUT van directo a red)
  if (request.method !== 'GET') return;

  // No interceptar peticiones a otros orígenes (CDNs, APIs externas)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegación (HTML): network-first con fallback a index.html
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request)
            .then(res => res || caches.match('/index.html'))
        )
    );
    return;
  }

  // Assets: cache-first con actualización en segundo plano
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // Actualiza en background (stale-while-revalidate)
        fetch(request).then(res => {
          if (res && res.ok) {
            caches.open(CACHE_NAME).then(c => c.put(request, res));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(request).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, copy));
        }
        return res;
      });
    })
  );
});
