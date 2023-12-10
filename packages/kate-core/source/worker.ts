/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

const version = "{{VERSION}}";
const cache_name = `kate-cache-${version}`;

async function remove_old_caches() {
  for (const key of await caches.keys()) {
    if (key !== cache_name) {
      await caches.delete(key);
      console.debug(`[kate:worker] Removed cache ${key}`);
    }
  }
}

async function update_cache() {
  const app_files: string[] = ["/"].concat(await (await fetch("/cache-manifest.json")).json());
  try {
    const cache = await caches.open(cache_name);
    for (const entry of app_files) {
      await cache.add(new Request(entry, { cache: "reload" }));
    }
    console.debug(`[kate:worker] Updated cache to ${version}`);
    return true;
  } catch (e) {
    console.error("[kate:worker] cache unavailable", e);
    return false;
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
    console.error("[kate:worker] Failed to process message", ev, "Reason: ", e);
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

    case "version": {
      return version;
    }

    case "force-update": {
      (self as any).skipWaiting();
      return null;
    }

    default:
      throw new Error(`[kate:worker] Unknown message ${data?.type}`);
  }
}

self.addEventListener("install", (ev0: any) => {
  console.debug(`[kate:worker] Installing worker ${version}`);
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
  console.debug(`[kate:worker] Activating worker ${version}`);
  const ev = ev0 as ExtendableEvent;
  ev.waitUntil(remove_old_caches());
});
