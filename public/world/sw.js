/* プチヘルメースの谷 service worker — installable + offline app shell.
 * /minecraft 版と同じ方針: 素のSW APIのみ、相対パスは scope (/world/) 基準。 */

const CACHE_VERSION = 'world-v1';

const APP_SHELL = [
  './',
  './index.html',
  './main.js',
  './layout.js',
  './data.js',
  './terrain.js',
  './sky.js',
  './water.js',
  './vegetation.js',
  './buildings.js',
  './interiors.js',
  './props.js',
  './character.js',
  './npc.js',
  './controls.js',
  './touch.js',
  './collide.js',
  './hotspots.js',
  './dialog.js',
  './quests.js',
  './petals.js',
  './audio.js',
  './geo.js',
  './vendor/three.module.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
];

/* 1ファイル欠けても install を失敗させない（allSettled でプリキャッシュ） */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => Promise.allSettled(APP_SHELL.map((u) => cache.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/* cache-first（オフラインで遊べることを優先）、取得できたら裏で更新 */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((hit) => {
      const net = fetch(event.request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(event.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    }),
  );
});
