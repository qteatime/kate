interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

const cache_name = "kate-cache-v3";

async function remove_old_caches() {
  for (const key of await caches.keys()) {
    if (key !== cache_name) {
      await caches.delete(key);
    }
  }
}

async function update_cache() {
  const app_files: string[] = await (
    await fetch("/cache-manifest.json")
  ).json();
  try {
    const cache = await caches.open(cache_name);
    const existing = new Set(
      (await cache.keys()).map((x) => new URL(x.url).pathname)
    );
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
      const version = data?.version ?? null;
      if (version != null) {
        await clear_cache();
        await update_cache();
      }
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

self.addEventListener("activate", (ev0: any) => {
  const ev = ev0 as ExtendableEvent;
  ev.waitUntil(remove_old_caches());
});
