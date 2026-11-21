/* TuloyLang service worker: precaches the whole built app so it runs fully offline. */

// Both values are replaced at build time by the `pwa-precache` plugin in vite.config.ts.
const BUILD_ID = '__BUILD_ID__'
const PRECACHE_URLS = self.__PRECACHE_URLS__ || ['/', '/manifest.webmanifest', '/icon.svg']

const CACHE_PREFIX = 'tuloylang-'
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`
const SHELL_URL = '/index.html'
// Servers may send `Vary: Origin`. `crossorigin` script/style tags send an Origin header the
// precache request did not, so without ignoreVary every lookup would miss while offline.
const MATCH_OPTIONS = { ignoreVary: true }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // `reload` bypasses the HTTP cache so a new build never precaches stale files.
      .then((cache) => cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // SPA navigations (/, /dashboard, /habits, ...): network first so updates show up,
  // falling back to the cached app shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(SHELL_URL, copy))
          }
          return response
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME)
          return (
            (await cache.match(SHELL_URL, MATCH_OPTIONS)) ??
            (await cache.match('/', MATCH_OPTIONS)) ??
            new Response('TuloyLang is offline and has not been cached yet.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          )
        }),
    )
    return
  }

  // Hashed build assets never change: serve from cache, fetch only if missing.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request, MATCH_OPTIONS).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            }
            return response
          }),
      ),
    )
    return
  }

  // Other same-origin files (icons, manifest): stale-while-revalidate.
  event.respondWith(
    caches.match(request, MATCH_OPTIONS).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached ?? Response.error())

      return cached ?? network
    }),
  )
})
