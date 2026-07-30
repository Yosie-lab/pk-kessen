const CACHE_NAME = "pk-kessen-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./game.js",
  "./audio.js",
  "./styles.css",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./sounds/kick.mp3",
  "./sounds/kick-quick.mp3",
  "./sounds/cheer.mp3",
  "./sounds/cheer-yell.mp3",
  "./sounds/cheer-victory.mp3",
  "./sounds/cheer-whistle.mp3",
  "./sounds/cheer-short.mp3",
  "./sounds/cheer-chant.mp3",
  "./sounds/cheer-chaos.mp3",
  "./sounds/crowd-stadium.mp3",
  "./sounds/applause-medium.mp3",
  "./sounds/applause-stadium.mp3",
  "./sounds/applause-crowd.mp3",
  "./sounds/applause-strong.mp3",
  "./sounds/applause-rhythm.mp3",
  "./sounds/applause-hall.mp3",
  "./sounds/post-hit-1.mp3",
  "./sounds/post-hit-2.mp3",
  "./sounds/post-hit-3.mp3",
  "./sounds/post-hit-4.mp3",
  "./sounds/bar-hit-1.mp3",
  "./sounds/bar-hit-2.mp3",
  "./sounds/bar-hit-3.mp3",
  "./sounds/metal-tap.mp3",
  "./sounds/whistle-blast.m4a"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  const isCoreScriptOrDocument =
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/game.js") ||
    url.pathname.endsWith("/audio.js") ||
    url.pathname.endsWith("/styles.css");

  if (isCoreScriptOrDocument) {
    // Network-First（常に最新コードを先に取得）
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-First with Background Revalidate for assets & audio
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(e.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(e.request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }
        return fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});
