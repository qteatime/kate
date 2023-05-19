"use strict";
async function cache_version(version) {
    const cache_name = "kate-cache-v2";
    const app_files = await (await fetch("/cache-manifest.json")).json();
    try {
        const cache = await caches.open(cache_name);
        const existing = new Set((await cache.keys()).map((x) => new URL(x.url).pathname));
        const to_add = app_files.filter((x) => !existing.has(x));
        await cache.addAll(to_add);
        console.log("[Kate] Updated cache to version", version);
    }
    catch (e) {
        console.error("[Kate] cache unavailable", e);
    }
}
const original_version = new URL(location.href).searchParams.get("version") ?? null;
self.addEventListener("message", (ev) => {
    if (ev.data?.type === "set-version") {
        const version = ev.data?.version ?? null;
        if (version != null) {
            cache_version(version);
        }
    }
});
self.addEventListener("install", (ev0) => {
    const ev = ev0;
    ev.waitUntil((async () => {
        if (original_version != null) {
            await cache_version(original_version);
        }
    })());
});
