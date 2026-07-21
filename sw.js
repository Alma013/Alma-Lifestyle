// Harta · service worker: offline app shell, network-first with cache fallback.
const CACHE = "alma-v21";
const ASSETS = [
  "./", "./index.html", "./css/styles.css", "./manifest.webmanifest",
  "./js/app.js", "./js/store.js", "./js/ui.js", "./js/data.js", "./js/data2.js",
  "./js/views-plan.js", "./js/views-track.js", "./js/views-recharge.js",
  "./js/views-signals.js", "./js/views-journal.js", "./js/audio.js", "./js/idb.js", "./js/voice.js", "./js/interpret.js", "./js/talk.js", "./js/views-speak.js",
  "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) =>
        r || (e.request.mode === "navigate" ? caches.match("./index.html") : Response.error())))
  );
});
