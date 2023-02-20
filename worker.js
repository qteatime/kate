const cache_name = "kate-cache-v1";
const app_files = [
  "/",
  "/manifest.json",
  "/kate.js",
  "/kate-resize.js",
  "/kate.css",
  "/kate-os.css",
  "/img/cancel.png",
  "/img/down.png",
  "/img/left.png",
  "/img/ok.png",
  "/img/right.png",
  "/img/up.png",
  "/icons/icon32.png",
  "/icons/icon64.png",
  "/icons/icon128.png",
  "/icons/icon256.png"
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(async () => {
    const cache = await caches.open(cache_name);
    await cache.addAll(app_files);
  })
})