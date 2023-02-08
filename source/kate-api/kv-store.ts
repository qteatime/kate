import { KateIPC } from "./channel";

type kv = {[key: string]: string};

export class KateKVStore {
  #channel: KateIPC;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  async read_all(): Promise<kv> {
    return await this.#channel.call("kate:kv-store.read-all", {});
  }

  async replace_all(value: kv) {
    await this.#channel.call("kate:kv-store.update-all", { value });
  }

  async get(key: string): Promise<string | null> {
    return await this.#channel.call("kate:kv-store.get", { key });
  }

  async set(key: string, value: string) {
    await this.#channel.call("kate:kv-store.set", { key, value });
  }

  async delete(key: string) {
    await this.#channel.call("kate:kv-store.delete", { key });
  }

  async delete_all() {
    await this.replace_all({});
  }
}