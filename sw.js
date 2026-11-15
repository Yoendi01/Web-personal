// ============================================
// 1. CONFIGURACIÓN
// ============================================
const CACHE_NAME = 'yoendi';
const CACHE_STATIC = 'yoendi-v1';
const CACHE_DYNAMIC = 'yoendi-v1';

// Archivos que queremos tener SIEMPRE disponibles offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './img/Perfil.jpg',
  './img/Kiosko.png',
  './img/icono.png',
  './app.js',
  './icono.webp',
  './Kiosko.webp'
];

// ============================================
// 2. INSTALL: precachear archivos estáticos
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => {
        console.log('[SW] Precacheados los assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // activa inmediatamente sin esperar
  );
});

// ============================================
// 3. ACTIVATE: limpiar cachés viejas
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_STATIC && key !== CACHE_DYNAMIC)
          .map((key) => {
            console.log('[SW] Borrando caché vieja:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim()) // toma control de páginas abiertas
  );
});

// ============================================
// 4. FETCH: interceptar peticiones
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo manejamos GET
  if (request.method !== 'GET') return;

  // No interceptar peticiones de otros orígenes (APIs externas, etc.)
  // (opcional, pero recomendable)
  const url = new URL(request.url);
//   if (url.origin !== self.location.origin) return;

  // Estrategia: Cache First para estáticos, Network First para el resto
  if (ASSETS_TO_CACHE.some((asset) => request.url.endsWith(asset.replace('./', '')))) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});
