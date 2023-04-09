import type { KateIPC } from "./channel";

export class KateObjectStore {
  #channel: KateIPC;

  readonly special_keys = {
    local_storage: "kate:local-storage",
  };

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  get_bucket(id: string) {
    return new KateStoreBucket(this.#channel, id);
  }

  get_special_bucket() {
    return this.get_bucket("kate:special");
  }

  async usage() {
    return this.#channel.call("kate:store.usage", {});
  }
}

export class KateStoreBucket {
  #channel: KateIPC;
  constructor(channel: KateIPC, readonly bucket_id: string) {
    this.#channel = channel;
  }

  async list(count?: number) {
    return await this.#channel.call("kate:store.list", {
      bucket: this.bucket_id,
      count,
    });
  }

  async get(key: string) {
    return await this.#channel.call("kate:store.get", {
      bucket: this.bucket_id,
      key,
    });
  }

  async try_get(key: string) {
    return await this.#channel.call("kate:store.try-get", {
      bucket: this.bucket_id,
      key,
    });
  }

  async add(key: string, value: unknown) {
    await this.#channel.call("kate:store.add", {
      bucket: this.bucket_id,
      key,
      value,
    });
  }

  async put(key: string, value: unknown) {
    await this.#channel.call("kate:store.put", {
      bucket: this.bucket_id,
      key,
      value,
    });
  }

  async delete(key: string) {
    await this.#channel.call("kate:store.delete", {
      bucket: this.bucket_id,
      key,
    });
  }

  async clear() {
    await this.#channel.call("kate:store.clear", { bucket: this.bucket_id });
  }
}
