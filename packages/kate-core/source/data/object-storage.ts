import { Database, Transaction } from "../db-schema";
import { make_id } from "../utils";
import { kate } from "./db";

export type CartridgeId = string;
export type VersionId = string | null;

export type OSPartition = {
  /* The unique cartridge id that owns this partition */
  cartridge_id: CartridgeId;
  /* The version of the cartridge, `{major}.{minor}` format */
  version_id: VersionId;
  /* A unique id for the bucket within the version partition */
  bucket_name: string;
  /* Timestamp when this bucket was created */
  created_at: Date;
  /* An universally unique id for the bucket in the storage */
  unique_bucket_id: string;
};
export const os_partition = kate.table3<
  OSPartition,
  "cartridge_id",
  "version_id",
  "bucket_name"
>({
  since: 9,
  name: "object_store_partition",
  path: ["cartridge_id", "version_id", "bucket_name"],
  auto_increment: false,
});
export const idx_os_partition_by_cartridge = os_partition.index1({
  since: 9,
  name: "by_cartridge",
  path: ["cartridge_id"],
  unique: false,
  multi_entry: false,
});
export const idx_os_partition_by_version = os_partition.index2({
  since: 9,
  name: "by_version",
  path: ["cartridge_id", "version_id"],
  unique: false,
  multi_entry: false,
});

export type OSEntry = {
  /* The unique id for the bucket in the storage */
  unique_bucket_id: string;
  /* A user-provided key that is unique within the bucket */
  key: string;
  /* Timestamp when this entry was created */
  created_at: Date;
  /* Timestamp when this entry was updated */
  updated_at: Date;
  /* Estimated size of the entry */
  size: number;
  /* Mime-type of the entry */
  type: string;
  /* Arbitrary meta-data associated with the entry */
  meta_data: unknown;
};
export const os_entry = kate.table2<OSEntry, "unique_bucket_id", "key">({
  since: 9,
  name: "os_entry",
  path: ["unique_bucket_id", "key"],
  auto_increment: false,
});
export const idx_entry_by_bucket = os_entry.index1<"unique_bucket_id">({
  since: 9,
  name: "by_bucket",
  path: ["unique_bucket_id"],
  multi_entry: false,
  unique: false,
});

export type OSData = {
  /* The unique id for the bucket in the storage */
  unique_bucket_id: string;
  /* A user-provided key that is unique within the bucket */
  key: string;
  /* The data stored */
  data: unknown;
};
export const os_data = kate.table2<OSData, "unique_bucket_id", "key">({
  since: 9,
  name: "os_data",
  path: ["unique_bucket_id", "key"],
  auto_increment: false,
});

export type CartridgeQuota = {
  /* The unique id for the cartridge */
  cartridge_id: CartridgeId;
  /* The version of the cartridge (`{major}.{minor}`) */
  version_id: VersionId;
  /* Maximum storage size allowed, in bytes */
  maximum_size_in_bytes: number;
  /* Maximum number of items in storage */
  maximum_items_in_storage: number;
  /* Maximum number of buckets in storage */
  maximum_buckets_in_storage: number;
  /* Current storage size, in bytes */
  current_size_in_bytes: number;
  /* Current number of items in storage */
  current_items_in_storage: number;
  /* Current number of buckets in storage */
  current_buckets_in_storage: number;
};
export const cartridge_quota = kate.table2<
  CartridgeQuota,
  "cartridge_id",
  "version_id"
>({
  since: 9,
  name: "cartridge_quota",
  path: ["cartridge_id", "version_id"],
  auto_increment: false,
});

export class EQuotaExceeded extends Error {
  constructor(
    readonly cartridge_id: CartridgeId,
    readonly version_id: VersionId,
    readonly type: "size" | "entries" | "buckets",
    readonly quota: number,
    readonly current: number
  ) {
    super(
      `${cartridge_id}@${version_id} exceeded the ${type} quota. Maximum: ${quota}, Current: ${current}`
    );
  }
}

export class ObjectStorage {
  constructor(readonly transaction: Transaction) {}

  static transaction<A>(
    db: Database,
    mode: IDBTransactionMode,
    fn: (storage: ObjectStorage) => Promise<A>
  ) {
    return db.transaction(
      [os_partition, os_entry, os_data, cartridge_quota],
      mode,
      async (txn) => {
        return await fn(new ObjectStorage(txn));
      }
    );
  }

  get partitions() {
    return this.transaction.get_table3(os_partition);
  }

  get entries() {
    return this.transaction.get_table2(os_entry);
  }

  get entries_by_bucket() {
    return this.transaction.get_index1(idx_entry_by_bucket);
  }

  get data() {
    return this.transaction.get_table2(os_data);
  }

  get quota() {
    return this.transaction.get_table2(cartridge_quota);
  }

  async add_bucket(
    cartridge_id: CartridgeId,
    version: VersionId,
    name: string
  ) {
    const id = make_id();
    await this.partitions.add({
      cartridge_id: cartridge_id,
      version_id: version,
      bucket_name: name,
      created_at: new Date(),
      unique_bucket_id: id,
    });
    const quota = await this.quota.get([cartridge_id, version]);
    const new_items = quota.current_buckets_in_storage + 1;
    if (new_items > quota.maximum_buckets_in_storage) {
      throw new EQuotaExceeded(
        cartridge_id,
        version,
        "buckets",
        quota.maximum_buckets_in_storage,
        new_items
      );
    }
    await this.quota.put({ ...quota, current_buckets_in_storage: new_items });
    return id;
  }

  async remove_bucket(
    cartridge_id: CartridgeId,
    version_id: VersionId,
    name: string
  ) {
    const bucket = await this.partitions.get([cartridge_id, version_id, name]);
    const entries = await this.entries_by_bucket.get_all(bucket.bucket_name);
    for (const entry of entries) {
      await this.delete_entry(
        cartridge_id,
        version_id,
        bucket.bucket_name,
        entry.key
      );
    }
    await this.partitions.delete([cartridge_id, version_id, name]);
    const quota = await this.quota.get([cartridge_id, version_id]);
    await this.quota.put({
      ...quota,
      current_buckets_in_storage: quota.current_buckets_in_storage - 1,
    });
  }

  async delete_entry(
    cartridge_id: CartridgeId,
    version_id: VersionId,
    bucket_id: string,
    key: string
  ) {
    const entry = await this.entries.get([bucket_id, key]);
    await this.entries.delete([bucket_id, key]);
    await this.data.delete([bucket_id, key]);
    const quota = await this.quota.get([cartridge_id, version_id]);
    await this.quota.put({
      ...quota,
      current_items_in_storage: quota.current_items_in_storage - 1,
      current_size_in_bytes: quota.current_size_in_bytes - entry.size,
    });
  }

  async add_entry(
    cartridge_id: CartridgeId,
    version_id: VersionId,
    bucket_id: string,
    entry: {
      key: string;
      metadata: unknown;
      size: number;
      type: string;
      data: unknown;
    }
  ) {
    await this.entries.add({
      unique_bucket_id: bucket_id,
      key: entry.key,
      created_at: new Date(),
      updated_at: new Date(),
      size: entry.size,
      type: entry.type,
      meta_data: entry.metadata,
    });
    await this.data.add({
      unique_bucket_id: bucket_id,
      key: entry.key,
      data: entry.data,
    });
    const quota = await this.quota.get([cartridge_id, version_id]);
    const new_items = quota.current_items_in_storage + 1;
    const new_size = quota.current_size_in_bytes + entry.size;
    if (new_items > quota.maximum_items_in_storage) {
      throw new EQuotaExceeded(
        cartridge_id,
        version_id,
        "entries",
        quota.maximum_items_in_storage,
        new_items
      );
    }
    if (new_size > quota.maximum_size_in_bytes) {
      throw new EQuotaExceeded(
        cartridge_id,
        version_id,
        "size",
        quota.maximum_size_in_bytes,
        new_size
      );
    }
    await this.quota.put({
      ...quota,
      current_items_in_storage: new_items,
      current_size_in_bytes: new_size,
    });
  }

  async update_entry(
    cartridge_id: CartridgeId,
    version_id: VersionId,
    bucket_id: string,
    entry: {
      key: string;
      metadata: unknown;
      size: number;
      type: string;
      data: unknown;
    }
  ) {
    const previous_entry = await this.entries.get([bucket_id, entry.key]);
    await this.entries.put({
      unique_bucket_id: bucket_id,
      key: entry.key,
      created_at: previous_entry.created_at,
      updated_at: new Date(),
      size: entry.size,
      type: entry.type,
      meta_data: entry.metadata,
    });
    await this.data.put({
      unique_bucket_id: bucket_id,
      key: entry.key,
      data: entry.data,
    });
    const quota = await this.quota.get([cartridge_id, version_id]);
    const new_size =
      quota.current_size_in_bytes + entry.size - previous_entry.size;
    if (new_size > quota.maximum_size_in_bytes) {
      throw new EQuotaExceeded(
        cartridge_id,
        version_id,
        "size",
        quota.maximum_size_in_bytes,
        new_size
      );
    }
    await this.quota.put({
      ...quota,
      current_size_in_bytes: new_size,
    });
  }
}
