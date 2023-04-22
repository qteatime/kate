import type { KateIPC } from "./channel";

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
    return this.#channel.call("kate:store.list-buckets", {
      versioned: this.versioned,
      count: count,
    });
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

  async get_local_storage() {
    const bucket = await this.get_special_bucket();
    return bucket.try_read("kate:local-storage") ?? Object.create(null);
  }

  async update_local_storage(data: { [key: string]: string }) {
    const bucket = await this.get_special_bucket();
    await bucket.update("kate:local-storage", {
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

  async usage() {
    return this.#channel.call("kate:store.usage", {
      versioned: this.versioned,
    });
  }
}

class OSBucket {
  #channel: KateIPC;
  constructor(
    channel: KateIPC,
    readonly versioned: boolean,
    readonly name: string
  ) {
    this.#channel = channel;
  }

  async count() {
    return this.#channel.call("kate:store.count-entries", {
      versioned: this.versioned,
      bucket_name: this.name,
    });
  }

  async list(count?: number) {
    return this.#channel.call("kate:store.list-entries", {
      versioned: this.versioned,
      bucket_name: this.name,
      count: count,
    });
  }

  async read(key: string) {
    return this.#channel.call("kate:store.read", {
      versioned: this.versioned,
      bucket_name: this.name,
      key: key,
    });
  }

  async try_read(key: string) {
    return this.#channel.call("kate:store.try-read", {
      versioned: this.versioned,
      bucket_name: this.name,
      key: key,
    });
  }

  async update(
    key: string,
    entry: { type: string; metadata: { [key: string]: unknown }; data: unknown }
  ) {
    return this.#channel.call("kate:store.update", {
      versioned: this.versioned,
      bucket_name: this.name,
      key: key,
      type: entry.type,
      metadata: entry.metadata,
      data: entry.data,
    });
  }

  async create(
    key: string,
    entry: { type: string; metadata: { [key: string]: unknown }; data: unknown }
  ) {
    return this.#channel.call("kate:store.create", {
      versioned: this.versioned,
      bucket_name: this.name,
      key: key,
      type: entry.type,
      metadata: entry.metadata,
      data: entry.data,
    });
  }

  async delete(key: string) {
    return this.#channel.call("kate:store.delete", {
      versioned: this.versioned,
      bucket_name: this.name,
      key: key,
    });
  }
}
