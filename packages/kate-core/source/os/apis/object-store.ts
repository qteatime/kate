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

  constructor(readonly os: KateOS) {}

  cartridge(cart: Cart.CartMeta, versioned: boolean) {
    return new CartridgeObjectStore(
      this,
      cart.metadata.id,
      versioned ? cart.metadata.version_id : null
    );
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

  private transaction<A>(
    mode: IDBTransactionMode,
    fn: (txn: Db.ObjectStorage) => Promise<A>
  ) {
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
    const bucket = await this.transaction("readonly", async (storage) =>
      storage.partitions.try_get([this.cartridge_id, this.version, name])
    );
    if (bucket != null) {
      return new CartridgeBucket(this, bucket);
    } else {
      return await this.add_bucket(name);
    }
  }

  async get_bucket(name: string) {
    const bucket = await this.transaction("readonly", async (storage) => {
      return await storage.partitions.get([
        this.cartridge_id,
        this.version,
        name,
      ]);
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

  async list_buckets() {
    const buckets = await this.transaction("readonly", async (storage) => {
      return await storage.partitions_by_version.get_all([
        this.cartridge_id,
        this.version,
      ]);
    });
    return buckets.map((x) => new CartridgeBucket(this, x));
  }
}

export class CartridgeBucket {
  constructor(
    readonly parent: CartridgeObjectStore,
    readonly bucket: Db.OSPartition
  ) {}

  private get db() {
    return this.parent.store.os.db;
  }

  private transaction<A>(
    mode: IDBTransactionMode,
    fn: (txn: Db.ObjectStorage) => Promise<A>
  ) {
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
      return storage.entries_by_bucket.get_all(
        this.bucket.unique_bucket_id,
        count
      );
    });
  }

  async count() {
    return await this.transaction("readonly", async (storage) => {
      return storage.entries_by_bucket.count(this.bucket.unique_bucket_id);
    });
  }

  async read(key: string) {
    return await this.transaction("readonly", async (storage) => {
      const metadata = await storage.entries.get([
        this.bucket.unique_bucket_id,
        key,
      ]);
      const data = await storage.data.get([this.bucket.unique_bucket_id, key]);
      return { ...metadata, data: data.data };
    });
  }

  async try_read(key: string) {
    return await this.transaction("readonly", async (storage) => {
      const metadata = await storage.entries.try_get([
        this.bucket.unique_bucket_id,
        key,
      ]);
      if (metadata == null) {
        return null;
      } else {
        const data = await storage.data.get([
          this.bucket.unique_bucket_id,
          key,
        ]);
        return { ...metadata, data: data.data };
      }
    });
  }

  async add(
    key: string,
    entry: { type: string; metadata: unknown; data: unknown }
  ) {
    const size =
      estimate(entry.data) + estimate(entry.metadata) + estimate(entry.type);
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

  async update(
    key: string,
    entry: { type: string; metadata: unknown; data: unknown }
  ) {
    const size =
      estimate(entry.data) + estimate(entry.metadata) + estimate(entry.type);
    await this.transaction("readwrite", async (storage) => {
      await storage.update_entry(
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
