/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateOS } from "../os";
import * as Cart from "../../cart";
import * as Db from "../../data";
import { mb } from "../../utils";
import { CartridgeId, VersionId } from "../../data";

export class KateObjectStore {
  static readonly DEFAULT_QUOTA = {
    maximum_size: mb(64),
    maximum_buckets: 1_000,
    maximum_entries: 10_000,
  };
  static readonly SPECIAL_BUCKET_KEY = "kate:special";
  static readonly LOCAL_STORAGE_KEY = "kate:local-storage";
  static readonly UNVERSIONED_KEY = "<unversioned>";

  get default_quota() {
    return KateObjectStore.DEFAULT_QUOTA;
  }

  constructor(readonly os: KateOS) {}

  cartridge(cart: Cart.CartMeta, versioned: boolean) {
    return new CartridgeObjectStore(
      this,
      cart.id,
      versioned ? cart.version : KateObjectStore.UNVERSIONED_KEY
    );
  }

  async delete_cartridge_data(cart_id: string, version_id: string) {
    await Db.ObjectStorage.transaction(this.os.db, "readwrite", async (store) => {
      await store.delete_partitions_and_quota(cart_id);
      await store.initialise_partitions(cart_id, version_id);
    });
    this.os.events.on_cart_changed.emit({
      id: cart_id,
      reason: "save-data-changed",
    });
  }

  async usage_estimates() {
    return this.os.db.transaction([Db.cartridge_quota], "readonly", async (t) => {
      const quota = t.get_index1(Db.idx_os_quota_by_cartridge);
      const result = new Map<string, Db.CartridgeQuota[]>();
      for (const entry of await quota.get_all()) {
        const versions = result.get(entry.cartridge_id) ?? [];
        versions.push(entry);
        result.set(entry.cartridge_id, versions);
      }
      return result;
    });
  }
}

export class CartridgeObjectStore {
  constructor(
    readonly store: KateObjectStore,
    readonly cartridge_id: CartridgeId,
    readonly version: VersionId
  ) {}

  private get db() {
    return this.store.os.db;
  }

  private transaction<A>(mode: IDBTransactionMode, fn: (txn: Db.ObjectStorage) => Promise<A>) {
    return Db.ObjectStorage.transaction(this.db, mode, fn);
  }

  async usage() {
    return await this.transaction("readonly", async (storage) => {
      return storage.quota.get([this.cartridge_id, this.version]);
    });
  }

  async add_bucket(name: string) {
    const bucket = await this.transaction("readwrite", async (storage) => {
      return storage.add_bucket(this.cartridge_id, this.version, name);
    });
    return new CartridgeBucket(this, bucket);
  }

  async ensure_bucket(name: string) {
    const bucket = await this.transaction("readwrite", async (storage) => {
      const bucket = await storage.partitions.try_get([this.cartridge_id, this.version, name]);
      if (bucket == null) {
        return storage.add_bucket(this.cartridge_id, this.version, name);
      } else {
        return bucket;
      }
    });
    return new CartridgeBucket(this, bucket);
  }

  async get_bucket(name: string) {
    const bucket = await this.transaction("readonly", async (storage) => {
      return await storage.partitions.get([this.cartridge_id, this.version, name]);
    });
    return new CartridgeBucket(this, bucket);
  }

  async get_local_storage() {
    const bucket = await this.get_bucket(KateObjectStore.SPECIAL_BUCKET_KEY);
    const entry = await bucket.try_read(KateObjectStore.LOCAL_STORAGE_KEY);
    if (entry != null) {
      return entry.data;
    } else {
      return {};
    }
  }

  async list_buckets(count?: number) {
    const buckets = await this.transaction("readonly", async (storage) => {
      return await storage.partitions_by_version.get_all([this.cartridge_id, this.version], count);
    });
    return buckets.map((x) => new CartridgeBucket(this, x));
  }
}

export class CartridgeBucket {
  constructor(readonly parent: CartridgeObjectStore, readonly bucket: Db.OSPartition) {}

  private get db() {
    return this.parent.store.os.db;
  }

  private transaction<A>(mode: IDBTransactionMode, fn: (txn: Db.ObjectStorage) => Promise<A>) {
    return Db.ObjectStorage.transaction(this.db, mode, fn);
  }

  async delete_bucket() {
    await this.transaction("readwrite", async (storage) => {
      await storage.remove_bucket(
        this.parent.cartridge_id,
        this.parent.version,
        this.bucket.bucket_name
      );
    });
  }

  async list_metadata(count?: number) {
    return await this.transaction("readonly", async (storage) => {
      return storage.entries_by_bucket.get_all(this.bucket.unique_bucket_id, count);
    });
  }

  async count() {
    return await this.transaction("readonly", async (storage) => {
      return storage.entries_by_bucket.count(this.bucket.unique_bucket_id);
    });
  }

  async read(key: string) {
    return await this.transaction("readonly", async (storage) => {
      const metadata = await storage.entries.get([this.bucket.unique_bucket_id, key]);
      const data = await storage.data.get([this.bucket.unique_bucket_id, key]);
      return { ...metadata, data: data.data };
    });
  }

  async try_read(key: string) {
    return await this.transaction("readonly", async (storage) => {
      const metadata = await storage.entries.try_get([this.bucket.unique_bucket_id, key]);
      if (metadata == null) {
        return null;
      } else {
        const data = await storage.data.get([this.bucket.unique_bucket_id, key]);
        return { ...metadata, data: data.data };
      }
    });
  }

  async create(key: string, entry: { type: string; metadata: unknown; data: unknown }) {
    const size =
      estimate(entry.data) + estimate(entry.metadata) + estimate(entry.type) + estimate(key);
    await this.transaction("readwrite", async (storage) => {
      await storage.add_entry(
        this.parent.cartridge_id,
        this.parent.version,
        this.bucket.unique_bucket_id,
        {
          key: key,
          type: entry.type,
          size: size,
          metadata: entry.metadata,
          data: entry.data,
        }
      );
    });
  }

  async write(key: string, entry: { type: string; metadata: unknown; data: unknown }) {
    const size =
      estimate(entry.data) + estimate(entry.metadata) + estimate(entry.type) + estimate(key);
    await this.transaction("readwrite", async (storage) => {
      await storage.write_entry(
        this.parent.cartridge_id,
        this.parent.version,
        this.bucket.unique_bucket_id,
        {
          key: key,
          type: entry.type,
          size: size,
          metadata: entry.metadata,
          data: entry.data,
        }
      );
    });
  }

  async delete(key: string) {
    await this.transaction("readwrite", async (storage) => {
      storage.delete_entry(
        this.parent.cartridge_id,
        this.parent.version,
        this.bucket.unique_bucket_id,
        key
      );
    });
  }
}

function estimate(value: unknown): number {
  if (value == null) {
    return 2;
  }

  switch (typeof value) {
    case "number":
      return 8;
    case "boolean":
      return 2;
    case "bigint":
      return Math.ceil(value.toString(16).length / 2);
    case "string":
      return value.length * 2;
  }

  if (value instanceof RegExp) {
    return value.source.length * 2 + value.flags.length * 2;
  }

  if (Array.isArray(value)) {
    let size = 8;
    for (const x of value) {
      size += estimate(x);
    }
    return size;
  }

  if (value instanceof Map) {
    let size = 8;
    for (const [k, v] of value.entries()) {
      size += estimate(k) + estimate(v);
    }
    return size;
  }

  if (value instanceof Set) {
    let size = 8;
    for (const x of value) {
      size += estimate(x);
    }
    return size;
  }

  if (
    value instanceof Uint8Array ||
    value instanceof Uint32Array ||
    value instanceof Uint16Array ||
    value instanceof Uint8ClampedArray ||
    value instanceof BigUint64Array ||
    value instanceof Int16Array ||
    value instanceof Int32Array ||
    value instanceof Int8Array ||
    value instanceof ArrayBuffer
  ) {
    return value.byteLength;
  }

  if (value instanceof Date) {
    return 8;
  }

  const proto = Object.getPrototypeOf(value);
  if (proto === null || proto === Object.prototype) {
    let size = 0;
    for (const [k, v] of Object.entries(value)) {
      size += estimate(k) + estimate(v);
    }
    return size;
  }

  throw new Error(`Serialisation not supported: ${value}`);
}
