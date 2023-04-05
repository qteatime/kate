import type { KateOS } from "../os";
import * as Db from "../../data/db";

export class KateObjectStore {
  readonly DEFAULT_QUOTA = 32 * 1024 * 1024; // 32MB

  constructor(readonly os: KateOS) {}

  private default_quota(cart_id: string): Db.QuotaUsage {
    return {
      cart_id: cart_id,
      available: this.DEFAULT_QUOTA,
      used: 0,
    };
  }

  async get_usage(cart_id: string): Promise<Db.QuotaUsage> {
    return await this.os.db.transaction(
      [Db.quota_usage],
      "readonly",
      async (t) => {
        const usage = t.get_table1(Db.quota_usage);
        const value = await usage.try_get(cart_id);
        if (value != null) {
          return value;
        } else {
          return this.default_quota(cart_id);
        }
      }
    );
  }

  private async assert_can_store(
    cart_id: string,
    usage: Db.QuotaUsage,
    size: number
  ) {
    if (usage.used + size > usage.available) {
      this.os.notifications.push_transient(
        cart_id,
        "Quota exceeded",
        `Failed to save data because storage quota has been exceeded`
      );
      throw new Error(`Storage quota exceeded`);
    }
  }

  async list(cart_id: string, count?: number) {
    return await this.os.db.transaction(
      [Db.object_store],
      "readonly",
      async (t) => {
        const index = t.get_index1(Db.idx_cart_object_store_by_cart);
        return (await index.get_all(cart_id, count)).map((x) => x.data);
      }
    );
  }

  async add(cart_id: string, key: string, value: unknown) {
    const size = estimate(value) + estimate(key);
    return await this.os.db.transaction(
      [Db.object_store, Db.quota_usage],
      "readwrite",
      async (t) => {
        const store = t.get_table2(Db.object_store);
        const quota = t.get_table1(Db.quota_usage);
        const usage =
          (await quota.try_get(cart_id)) ?? this.default_quota(cart_id);

        this.assert_can_store(cart_id, usage, size);

        await store.add({
          cart_id,
          id: key,
          size,
          data: value,
        });
        await quota.put({
          cart_id,
          available: usage.available,
          used: usage.used + size,
        });
      }
    );
  }

  async put(cart_id: string, key: string, value: unknown) {
    const size = estimate(value) + estimate(key);
    return await this.os.db.transaction(
      [Db.object_store, Db.quota_usage],
      "readwrite",
      async (t) => {
        const store = t.get_table2(Db.object_store);
        const quota = t.get_table1(Db.quota_usage);

        const previous_size = (await store.try_get([cart_id, key]))?.size ?? 0;
        const usage =
          (await quota.try_get(cart_id)) ?? this.default_quota(cart_id);

        this.assert_can_store(cart_id, usage, size - previous_size);

        await store.put({
          cart_id,
          id: key,
          size,
          data: value,
        });
        await quota.put({
          cart_id,
          available: usage.available,
          used: usage.used + size - previous_size,
        });
      }
    );
  }

  async delete(cart_id: string, key: string) {
    return await this.os.db.transaction(
      [Db.object_store, Db.quota_usage],
      "readwrite",
      async (t) => {
        const store = t.get_table2(Db.object_store);
        const quota = t.get_table1(Db.quota_usage);

        const previous_size = (await store.get([cart_id, key])).size;
        const usage =
          (await quota.try_get(cart_id)) ?? this.default_quota(cart_id);

        await store.delete([cart_id, key]);
        await quota.put({
          cart_id,
          available: usage.available,
          used: usage.used - previous_size,
        });
      }
    );
  }

  async get(cart_id: string, key: string) {
    return await this.os.db.transaction(
      [Db.object_store, Db.quota_usage],
      "readwrite",
      async (t) => {
        const store = t.get_table2(Db.object_store);

        return (await store.get([cart_id, key])).data;
      }
    );
  }

  async try_get(cart_id: string, key: string) {
    return await this.os.db.transaction(
      [Db.object_store, Db.quota_usage],
      "readwrite",
      async (t) => {
        const store = t.get_table2(Db.object_store);

        return (await store.try_get([cart_id, key]))?.data ?? null;
      }
    );
  }

  async get_local_storage(cart_id: string): Promise<unknown> {
    return (
      (await this.try_get(cart_id, "kate:local-storage")) ?? Object.create(null)
    );
  }
}

function estimate(value: unknown): number {
  if (typeof value === "string") {
    return value.length * 2;
  } else if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value == null ||
    typeof value === "undefined"
  ) {
    return 2;
  } else if (typeof value === "bigint") {
    return Math.ceil(value.toString(16).length / 2);
  } else if (Array.isArray(value)) {
    return value.map(estimate).reduce((a, b) => a + b, 0);
  } else if (
    value instanceof Uint8Array ||
    value instanceof Uint32Array ||
    value instanceof Uint16Array ||
    value instanceof Uint8ClampedArray ||
    value instanceof BigUint64Array ||
    value instanceof Int16Array ||
    value instanceof Int32Array ||
    value instanceof Int8Array
  ) {
    return value.byteLength;
  } else if (typeof value === "object") {
    let size = 0;
    for (const [k, v] of Object.entries(value)) {
      size += estimate(k) + estimate(v);
    }
    return size;
  } else {
    throw new Error(`Serialisation not supported: ${value}`);
  }
}
