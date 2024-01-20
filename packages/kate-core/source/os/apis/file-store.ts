/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// A small abstraction on top of OPFS for byte-only storage which combines
// bucket-based storage with process-specified quotas and keeps track of
// them for proper garbage-collection.

import { iterate_stream, lock, make_id, sleep, unreachable } from "../../utils";
import type { KateOS } from "../os";

export type PartitionId = "temporary" | "cartridge" | "kernel";
export type BucketId = string & { __bucket_id: true };
type BucketRefs = Map<BucketId, Set<WeakRef<KateFileBucket>>>;
type KernelResource = "media";

type Header = {
  persistent_keys: PersistentKey[];
};

export type Holder =
  | {
      type: "cartridge";
      id: string;
      version: string;
    }
  | { type: "kernel"; resource: KernelResource };

export type PersistentKey = {
  bucket: BucketId;
  partition: PartitionId;
  id: string;
  holder: Holder;
};

export class KateFileStore {
  private _references = new Map<PartitionId, BucketRefs>();
  constructor(readonly os: KateOS) {}

  private non_sticky_partitions: PartitionId[] = ["temporary", "cartridge"];

  async get_partition(partition: PartitionId) {
    const root = await navigator.storage.getDirectory();
    const refs = this.initialise_references(partition);
    return new KateFilePartition(
      this,
      partition,
      refs,
      await root.getDirectoryHandle(partition, { create: true })
    );
  }

  async get_kernel_bucket(name: KernelResource) {
    const partition = await this.get_partition("kernel");
    if (!(await partition.exists(name as BucketId))) {
      const bucket = await partition.create(name as BucketId);
      await partition.persist(bucket, { type: "kernel", resource: name });
      return bucket;
    } else {
      return partition.get(name as BucketId);
    }
  }

  async from_key(key: PersistentKey) {
    const partition = await this.get_partition(key.partition);
    return { partition, bucket: await partition.get(key.bucket) };
  }

  private initialise_references(partition: PartitionId) {
    const refs = this._references.get(partition) ?? new Map();
    this._references.set(partition, refs);
    return refs;
  }

  async gc() {
    console.debug(`[kate:file-store:gc] Starting regular GC...`);
    this.os.kernel.console.resources.take("gc");
    try {
      for (const id of this.non_sticky_partitions) {
        const partition = await this.get_partition(id);
        await partition.gc();
      }
    } finally {
      this.os.kernel.console.resources.release("gc");
    }
  }
}

export class KateFilePartition {
  readonly _finalisers = new FinalizationRegistry<BucketId>((id) => {
    if (!this.has_memory_refs(id)) {
      this.attempt_gc(id);
    }
  });

  constructor(
    readonly store: KateFileStore,
    readonly id: PartitionId,
    private _references: BucketRefs,
    readonly root: FileSystemDirectoryHandle
  ) {}

  async create(name: string | null) {
    const id = (name ?? make_id()) as BucketId;
    const bucket = await this.root.getDirectoryHandle(id, { create: true });
    await this.write_header(id, { persistent_keys: [] });
    return this.record_memory_reference(new KateFileBucket(id, this, bucket));
  }

  async exists(id: BucketId) {
    try {
      await this.root.getDirectoryHandle(id);
      return true;
    } catch (_) {
      return false;
    }
  }

  async from_stream(stream: ReadableStream<{ path: string; data: Uint8Array }>) {
    const bucket = await this.create(null);
    const mapping = new Map<string, string>();
    for await (const entry of iterate_stream(stream)) {
      const file = await bucket.put(entry.data);
      mapping.set(entry.path, file.id);
    }
    return { bucket, mapping };
  }

  async get(id: BucketId) {
    const bucket = await this.root.getDirectoryHandle(id);
    return this.record_memory_reference(new KateFileBucket(id, this, bucket));
  }

  release(bucket: KateFileBucket) {
    const refs = this._references.get(bucket.id);
    if (refs != null) {
      for (const ref of refs) {
        const value = ref.deref();
        if (value === bucket) {
          refs.delete(ref);
          break;
        }
      }
      if (this.has_memory_refs(bucket.id)) {
        console.debug(
          `[kate:file-store:gc] scheduling ${this.id}/${bucket.id} for deletion (reason: no more memory-refs)`
        );
        this.attempt_gc(bucket.id);
      }
    }
  }

  async release_persistent(key: PersistentKey): Promise<void> {
    if (key.partition !== this.id) {
      throw new Error(`[kate:file-store] release_persistent() called with invalid key`);
    }
    await this.lock(key.bucket, async () => {
      const header = await this.get_header(key.bucket);
      const keys = header.persistent_keys.filter((x) => x.id !== key.id);
      await this.write_header(key.bucket, { ...header, persistent_keys: keys });
      console.debug(`[kate:file-store] released persistent reference to ${this.id}/${key.id}`);
    });
    this.attempt_gc(key.bucket);
  }

  async persist(bucket: KateFileBucket, holder: Holder): Promise<PersistentKey> {
    return await this.lock(bucket.id, async () => {
      const header = await this.get_header(bucket.id);
      const id = make_id();
      const key = { partition: this.id, bucket: bucket.id, id, holder };
      header.persistent_keys.push(key);
      await this.write_header(bucket.id, header);
      console.debug(`[kate:file-store] acquired persistent reference to ${this.id}/${bucket.id}`);
      return key;
    });
  }

  private record_memory_reference(bucket: KateFileBucket) {
    if (!this._references.has(bucket.id)) {
      this._references.set(bucket.id, new Set());
    }
    const refs = this._references.get(bucket.id)!;
    this._finalisers.register(bucket, bucket.id);
    refs.add(new WeakRef(bucket));
    return bucket;
  }

  private async attempt_gc(id: BucketId): Promise<boolean> {
    return await this.lock(id, async () => {
      if (await this.elligible_for_gc(id)) {
        console.debug(`[kate:file-store:gc] deleting ${this.id}/${id} (reason: no more refs)`);
        await this.root.removeEntry(id, { recursive: true });
        return true;
      } else {
        return false;
      }
    });
  }

  private async get_header(id: BucketId) {
    const bucket = await this.root.getDirectoryHandle(id);
    const header_handle = await bucket.getFileHandle("_header");
    const header_file = await header_handle.getFile();
    return JSON.parse(await header_file.text()) as Header;
  }

  private async write_header(id: BucketId, contents: Header) {
    const bucket = await this.root.getDirectoryHandle(id);
    const header_handle = await bucket.getFileHandle("_header", { create: true });
    const writer = await header_handle.createWritable();
    await writer.write(JSON.stringify(contents));
    await writer.close();
  }

  private async elligible_for_gc(id: BucketId) {
    const persistent_refs = (await this.get_header(id)).persistent_keys;
    return !this.has_memory_refs(id) && persistent_refs.length === 0;
  }

  async gc() {
    console.debug(`[kate:file-store:gc] Starting garbage collection for ${this.id}`);
    this.store.os.kernel.console.resources.take("gc");
    try {
      for await (const [name, _handle] of this.root.entries()) {
        await this.mark_persistent_refs(name as BucketId);
        const removed = await this.attempt_gc(name as BucketId);
        if (!removed) {
          console.debug(`[kate:file-store:gc] Keeping ${this.id}/${name}: still has references`);
        }
        await sleep(1000);
      }
    } finally {
      this.store.os.kernel.console.resources.release("gc");
    }
  }

  private has_memory_refs(id: BucketId) {
    const set = this._references.get(id);
    if (set == null) {
      return false;
    }

    let limit = 100;
    for (const ref of set.values()) {
      const underlying = ref.deref();
      if (underlying == null) {
        set.delete(ref);
      }
      if (--limit <= 0) {
        break;
      }
    }

    return set.size > 0;
  }

  private async mark_persistent_refs(id: BucketId) {
    return await this.lock(id, async () => {
      const header = await this.get_header(id);
      const alive: PersistentKey[] = [];
      for (const key of header.persistent_keys) {
        if (await this.is_holder_alive(key.holder)) {
          alive.push(key);
        }
      }
      if (header.persistent_keys.length !== alive.length) {
        header.persistent_keys = alive;
        await this.write_header(id, header);
      }
    });
  }

  private async is_holder_alive(holder: Holder) {
    switch (holder.type) {
      case "cartridge": {
        const meta = await this.store.os.cart_manager.try_read_metadata(holder.id);
        return meta?.bucket_key != null && meta?.version === holder.version;
      }

      case "kernel": {
        return true;
      }

      default:
        throw unreachable(holder);
    }
  }

  private lock<T>(id: BucketId, fn: () => Promise<T>) {
    return lock(this.lock_name(id), fn);
  }

  private lock_name(id: BucketId) {
    return `kate:file-store:lock::${this.id}/${id}`;
  }
}

export class KateFileBucket {
  constructor(
    readonly id: BucketId,
    readonly partition: KateFilePartition,
    readonly handle: FileSystemDirectoryHandle
  ) {}

  get path() {
    return `${this.partition.id}/${this.id}`;
  }

  async put(data: Uint8Array) {
    const id = make_id();
    const file = await this.handle.getFileHandle(id, { create: true });
    const writer = await file.createWritable();
    await writer.write(data);
    await writer.close();
    console.debug(`[kate:file-store] Wrote ${this.path}/${id}`);
    return new KateFile(this, id);
  }

  file(id: string) {
    return new KateFile(this, id);
  }
}

export class KateFile {
  constructor(readonly bucket: KateFileBucket, readonly id: string) {}

  get path() {
    return `${this.bucket.path}/${this.id}`;
  }

  async append(data: Uint8Array) {
    const handle = await this.bucket.handle.getFileHandle(this.id);
    const writer = await handle.createWritable({ keepExistingData: true });
    await writer.write(data);
    await writer.close();
  }

  async read() {
    const handle = await this.bucket.handle.getFileHandle(this.id);
    return await handle.getFile();
  }

  async delete() {
    await this.bucket.handle.removeEntry(this.id);
    console.debug(`[kate:file-store] Deleted ${this.id}`);
  }
}
