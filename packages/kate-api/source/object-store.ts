/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateIPC } from "./channel";

export type ObjectMetadata = {
  key: string;
  created_at: Date;
  updated_at: Date;
  type: string;
  size: string;
  metadata: { [key: string]: unknown };
};

export type Object<T = unknown> = ObjectMetadata & { data: T };

export type Usage = {
  limits: {
    size_in_bytes: number;
    buckets: number;
    entries: number;
  };
  usage: {
    size_in_bytes: number;
    buckets: number;
    entries: number;
  };
};

export class KateObjectStore {
  #channel: KateIPC;

  readonly special_keys = {
    local_storage: "kate:local-storage",
  };

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  versioned() {
    return new OSCartridge(this.#channel, true);
  }

  unversioned() {
    return new OSCartridge(this.#channel, false);
  }
}

class OSCartridge {
  #channel: KateIPC;
  constructor(channel: KateIPC, readonly versioned: boolean) {
    this.#channel = channel;
  }

  async list_buckets(count?: number) {
    const buckets = (await this.#channel.call("kate:store.list-buckets", {
      versioned: this.versioned,
      count: count,
    })) as { name: string; created_at: Date }[];
    return buckets.map((x) => new OSBucket(this.#channel, this.versioned, x.name));
  }

  async add_bucket(name: string) {
    await this.#channel.call("kate:store.add-bucket", {
      versioned: this.versioned,
      name,
    });
    return new OSBucket(this.#channel, this.versioned, name);
  }

  async ensure_bucket(name: string) {
    await this.#channel.call("kate:store.ensure-bucket", {
      versioned: this.versioned,
      name,
    });
    return new OSBucket(this.#channel, this.versioned, name);
  }

  async get_bucket(name: string) {
    return new OSBucket(this.#channel, this.versioned, name);
  }

  async get_special_bucket() {
    return new OSBucket(this.#channel, this.versioned, "kate:special");
  }

  async get_local_storage(): Promise<{ [key: string]: string }> {
    const bucket = await this.get_special_bucket();
    return (bucket.try_read("kate:local-storage") as any) ?? Object.create(null);
  }

  async update_local_storage(data: { [key: string]: string }) {
    const bucket = await this.get_special_bucket();
    await bucket.write("kate:local-storage", {
      type: "kate::structured",
      metadata: {},
      data: data,
    });
  }

  async delete_bucket(name: string) {
    await this.#channel.call("kate:store.delete-bucket", {
      versioned: this.versioned,
      name,
    });
  }

  async usage(): Promise<Usage> {
    return this.#channel.call("kate:store.usage", {
      versioned: this.versioned,
    });
  }
}

class OSBucket {
  #channel: KateIPC;
  constructor(channel: KateIPC, readonly versioned: boolean, readonly name: string) {
    this.#channel = channel;
  }

  async count(): Promise<number> {
    return this.#channel.call("kate:store.count-entries", {
      versioned: this.versioned,
      bucket_name: this.name,
    });
  }

  async list(count?: number): Promise<ObjectMetadata[]> {
    return this.#channel.call("kate:store.list-entries", {
      versioned: this.versioned,
      bucket_name: this.name,
      count: count,
    });
  }

  async read<T>(key: string): Promise<Object<T>> {
    return this.#channel.call("kate:store.read", {
      versioned: this.versioned,
      bucket_name: this.name,
      key: key,
    });
  }

  async read_data<T>(key: string) {
    return (await this.read<T>(key)).data;
  }

  async try_read<T>(key: string): Promise<Object<T> | null> {
    return this.#channel.call("kate:store.try-read", {
      versioned: this.versioned,
      bucket_name: this.name,
      key: key,
    });
  }

  async try_read_data<T>(key: string): Promise<T | null> {
    return (await this.try_read<T>(key))?.data ?? null;
  }

  async write<T>(
    key: string,
    entry: { type: string; metadata: { [key: string]: unknown }; data: T }
  ) {
    return this.#channel.call("kate:store.write", {
      versioned: this.versioned,
      bucket_name: this.name,
      key: key,
      type: entry.type,
      metadata: entry.metadata,
      data: entry.data,
    });
  }

  async write_structured<T>(key: string, data: T, metadata: { [key: string]: unknown } = {}) {
    await this.write(key, { type: "kate::structured", metadata, data });
  }

  async create<T>(
    key: string,
    entry: { type: string; metadata: { [key: string]: unknown }; data: T }
  ): Promise<Object> {
    return this.#channel.call("kate:store.create", {
      versioned: this.versioned,
      bucket_name: this.name,
      key: key,
      type: entry.type,
      metadata: entry.metadata,
      data: entry.data,
    });
  }

  async create_structured<T>(key: string, data: T, metadata: { [key: string]: unknown } = {}) {
    return await this.create(key, { type: "kate::structured", metadata, data });
  }

  async delete(key: string) {
    return this.#channel.call("kate:store.delete", {
      versioned: this.versioned,
      bucket_name: this.name,
      key: key,
    });
  }
}
