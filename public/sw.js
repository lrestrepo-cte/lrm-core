// LRM Trade Consulting · service worker mínimo para que la app se pueda instalar.
// No guarda nada en caché: siempre trae la versión más nueva publicada.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})