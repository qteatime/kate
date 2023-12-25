/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// A small abstraction on top of OPFS for byte-only storage which combines
// bucket-based storage with process-specified quotas and keeps track of
// them for proper garbage-collection.

import { iterate_stream, lock, make_id } from "../../utils";

type PartitionId = "temporary" | "cartridge";
type BucketId = string & { __bucket_id: true };
type BucketRefs = Map<BucketId, Set<KateFileBucket>>;

type Header = {
  persistent_keys: PersistentKey[];
};

export type Holder = {
  type: "cartridge";
  id: string;
  version: string;
};

export type PersistentKey = {
  bucket: BucketId;
  partition: PartitionId;
  id: string;
  holder: Holder;
};

export class KateFileStore {
  private _references = new Map<PartitionId, BucketRefs>();
  constructor() {}

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

  async from_key(key: PersistentKey) {
    const partition = await this.get_partition(key.partition);
    return await partition.get(key.bucket);
  }

  private initialise_references(partition: PartitionId) {
    const refs = this._references.get(partition) ?? new Map();
    this._references.set(partition, refs);
    return refs;
  }
}

export class KateFilePartition {
  constructor(
    readonly store: KateFileStore,
    readonly id: PartitionId,
    private _references: BucketRefs,
    readonly root: FileSystemDirectoryHandle
  ) {}

  async create() {
    const id = make_id() as BucketId;
    const bucket = await this.root.getDirectoryHandle(id, { create: true });
    await this.write_header(id, { persistent_keys: [] });
    return this.record_memory_reference(new KateFileBucket(id, this, bucket));
  }

  async from_stream(stream: ReadableStream<{ path: string; data: Uint8Array }>) {
    const bucket = await this.create();
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

  async release(bucket: KateFileBucket) {
    const refs = this._references.get(bucket.id);
    if (refs != null) {
      refs.delete(bucket);
      if (refs.size === 0) {
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
    await lock(this.lock_name(key.bucket), async () => {
      const header = await this.get_header(key.bucket);
      const keys = header.persistent_keys.filter((x) => x.id !== key.id);
      await this.write_header(key.bucket, { ...header, persistent_keys: keys });
      console.debug(`[kate:file-store] released persistent reference to ${this.id}/${key.id}`);
    });
    this.attempt_gc(key.bucket);
  }

  async persist(bucket: KateFileBucket, holder: Holder): Promise<PersistentKey> {
    return await lock(this.lock_name(bucket.id), async () => {
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
    refs.add(bucket);
    return bucket;
  }

  private async attempt_gc(id: BucketId): Promise<boolean> {
    return await lock(this.lock_name(id), async () => {
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
    const memory_refs = this._references.get(id) ?? new Set();
    const persistent_refs = (await this.get_header(id)).persistent_keys;
    return memory_refs.size === 0 && persistent_refs.length === 0;
  }

  async gc() {
    console.debug(`[kate:file-store:gc] Starting garbage collection for ${this.id}`);
    for await (const [name, _handle] of this.root.entries()) {
      const removed = await this.attempt_gc(name as BucketId);
      if (!removed) {
        console.debug(`[kate:file-store:gc] Keeping ${this.id}/${name}: still has references`);
      }
    }
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

  async read() {
    const handle = await this.bucket.handle.getFileHandle(this.id);
    return await handle.getFile();
  }

  async delete() {
    await this.bucket.handle.removeEntry(this.id);
    console.debug(`[kate:file-store] Deleted ${this.id}`);
  }
}
