/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

const cache_name = `kate-cache-v0.23.10`;

async function remove_old_caches() {
  for (const key of await caches.keys()) {
    if (key !== cache_name) {
      await caches.delete(key);
    }
  }
}

async function update_cache() {
  const app_files: string[] = ["/"].concat(await (await fetch("/cache-manifest.json")).json());
  try {
    const cache = await caches.open(cache_name);
    const existing = new Set((await cache.keys()).map((x) => new URL(x.url).pathname));
    const to_add = app_files.filter((x) => !existing.has(x));
    await cache.addAll(to_add);
    console.log("[Kate] Updated cache");
  } catch (e) {
    console.error("[Kate] cache unavailable", e);
  }
}

async function clear_cache() {
  const cache = await caches.open(cache_name);
  for (const key of await cache.keys()) {
    await cache.delete(key);
  }
}

self.addEventListener("message", async (ev) => {
  const reply_channel = ev.ports[0] ?? null;
  try {
    const answer = await handle(ev.data ?? null);
    reply_channel?.postMessage({
      type: "reply",
      id: ev.data?.id,
      ok: true,
      value: answer,
    });
  } catch (e) {
    console.error("Failed to process message", ev, "Reason: ", e);
    reply_channel?.postMessage({
      type: "reply",
      id: ev.data?.id,
      ok: false,
      reason: "failed",
    });
  }
});

async function handle(data: any | null) {
  switch (data?.type) {
    case "refresh-cache": {
      await clear_cache();
      await update_cache();
      return null;
    }

    default:
      throw new Error(`Unknown message ${data?.type}`);
  }
}

self.addEventListener("install", (ev0: any) => {
  const ev = ev0 as ExtendableEvent;
  ev.waitUntil(update_cache());
});

self.addEventListener("fetch", (ev0: any) => {
  ev0.respondWith(
    (async () => {
      const response = await caches.match(ev0.request);
      return response || fetch(ev0.request);
    })()
  );
});

self.addEventListener("activate", (ev0: any) => {
  const ev = ev0 as ExtendableEvent;
  ev.waitUntil(remove_old_caches());
});
