/* Voxel Craft service worker — installable + offline app shell.
 * Plain Service Worker APIs only (no importScripts, no external code). */

const CACHE_VERSION = 'voxelcraft-v1';

/* App shell. Paths are RELATIVE and resolved against the SW scope
 * (the SW lives at /minecraft/sw.js, so scope is /minecraft/). */
const APP_SHELL = [
  './',
  './index.html',
  './main.js',
  './world.js',
  './blocks.js',
  './noise.js',
  './audio.js',
  './share.js',
  './touch.js',
  './vendor/three.module.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
];

/* Precache the shell. Some files (audio.js / share.js / touch.js) may not
 * exist yet at install time, so cache each URL independently with
 * allSettled — a single missing file must NOT fail the whole install. */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await Promise.allSettled(
        APP_SHELL.map(async (url) => {
          try {
            // cache: 'reload' bypasses the HTTP cache for fresh shell copies.
            const response = await fetch(new Request(url, { cache: 'reload' }));
            if (response && response.ok) {
              await cache.put(url, response.clone());
            }
          } catch (err) {
            // Ignore: file may not exist yet. Other URLs still get cached.
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

/* Drop caches that don't match the current version, then take control. */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

/* Stale-while-revalidate: serve from cache immediately for speed/offline, but
 * always refetch in the background and update the cache, so a redeploy reaches
 * returning players on their next load instead of being stuck forever (the
 * trap of plain cache-first). Falls back to the cached shell when offline. */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle same-origin GET requests.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(request);

      // Kick off a background refresh regardless of cache hit.
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type !== 'opaque') {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => null);

      // Serve cache now if we have it; otherwise wait for the network.
      if (cached) return cached;

      const response = await network;
      if (response) return response;

      // Offline and uncached: for navigations, serve the cached shell.
      if (request.mode === 'navigate') {
        const fallback =
          (await cache.match('./index.html')) || (await cache.match('./'));
        if (fallback) return fallback;
      }
      return Response.error();
    })()
  );
});
