/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import type { KateIPC } from "./channel";

export type FileId = string & { __file_id: true };
export type PartitionId = "temporary";

export class KateFileStore {
  #channel: KateIPC;
  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  async make_temporary() {
    const id = (await this.#channel.call("kate:file-store.make-temporary-bucket", {})) as string;
    return new FileBucket(this.#channel, "temporary", id);
  }
}

export class FileBucket {
  #channel: KateIPC;
  private inodes = new Map<string, FileId>();

  constructor(channel: KateIPC, readonly partition: PartitionId, readonly id: string) {
    this.#channel = channel;
  }

  private get_id(name: string) {
    const id = this.inodes.get(name);
    if (id == null) {
      throw new Error(`File ${name} not found`);
    }
    return id;
  }

  async delete() {
    await this.#channel.call("kate:file-store.delete-bucket", { bucket_id: this.id });
  }

  async create_file(name: string, data: Uint8Array) {
    if (this.inodes.has(name)) {
      throw new Error(`File ${name} already exists`);
    }
    this.inodes.set(name, "" as FileId);
    const id = (await this.#channel.call("kate:file-store.put-file", {
      bucket_id: this.id,
      data,
    })) as string;
    this.inodes.set(name, id as FileId);
    return new KateFile(this.#channel, this, id);
  }

  async replace_file(name: string, data: Uint8Array) {
    await this.delete_file(name);
    return this.create_file(name, data);
  }

  async open_file(name: string) {
    const id = this.get_id(name);
    return new KateFile(this.#channel, this, id);
  }

  async delete_file(name: string) {
    const id = this.get_id(name);
    await this.#channel.call("kate:file-store.delete-file", { bucket_id: this.id, file_id: id });
  }
}

export class KateFile {
  #channel: KateIPC;
  constructor(channel: KateIPC, readonly bucket: FileBucket, readonly id: string) {
    this.#channel = channel;
  }

  async size() {
    return (await this.#channel.call("kate:file-store.file-size", {
      bucket_id: this.bucket.id,
      file_id: this.id,
    })) as number;
  }

  async create_read_stream(
    chunk_size: number = 1024 * 1024 * 8
  ): Promise<ReadableStream<Uint8Array>> {
    let offset = 0;
    let size = 0;

    return new ReadableStream(
      {
        start: async (controller) => {
          size = await this.size();
          offset = 0;
          if (size === 0) {
            controller.close();
          }
        },
        pull: async (controller) => {
          const chunk = await this.read_slice(offset, chunk_size);
          offset += chunk.byteLength;
          controller.enqueue(chunk);
          if (offset >= size) {
            controller.close();
            return;
          }
        },
      },
      new CountQueuingStrategy({ highWaterMark: 1 })
    );
  }

  async create_write_stream(options: {
    keep_existing_data: boolean;
    expected_size?: number;
  }): Promise<WritableStream<Uint8Array>> {
    return new WritableStream(
      {
        start: async (controller) => {
          await this.#channel.call("kate:file-store.create-write-stream", {
            bucket_id: this.bucket.id,
            file_id: this.id,
            keep_existing_data: options.keep_existing_data,
            expected_size: options.expected_size,
          });
        },
        write: async (chunk: Uint8Array, controller) => {
          await this.#channel.call("kate:file-store.write-chunk", {
            writer_id: this.id,
            chunk,
          });
        },
        close: async () => {
          await this.#channel.call("kate:file-store.close-write-stream", {
            writer_id: this.id,
          });
        },
      },
      new CountQueuingStrategy({ highWaterMark: 1 })
    );
  }

  async read_slice(offset: number, size?: number) {
    return (await this.#channel.call("kate:file-store.read-file", {
      bucket_id: this.bucket.id,
      file_id: this.id,
      offset,
      size,
    })) as Uint8Array;
  }

  async append(data: Uint8Array) {
    await this.#channel.call("kate:file-store.append-file", {
      bucket_id: this.bucket.id,
      file_id: this.id,
      data,
    });
  }
}
