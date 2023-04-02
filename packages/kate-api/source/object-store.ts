import type { KateIPC } from "./channel";

export class KateObjectStore {
  #channel: KateIPC;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  readonly special_keys = {
    local_storage: "kate:local-storage",
  };

  async list(count?: number) {
    return await this.#channel.call("kate:store.list", { count });
  }

  async get(key: string) {
    return await this.#channel.call("kate:store.get", { key });
  }

  async try_get(key: string) {
    return await this.#channel.call("kate:store.try-get", { key });
  }

  async add(key: string, value: unknown) {
    await this.#channel.call("kate:store.add", { key, value });
  }

  async put(key: string, value: unknown) {
    await this.#channel.call("kate:store.put", { key, value });
  }

  async delete(key: string) {
    await this.#channel.call("kate:store.delete", { key });
  }

  async usage() {
    return this.#channel.call("kate:store.usage", {});
  }
}
