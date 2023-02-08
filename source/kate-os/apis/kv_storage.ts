import * as Db from "./db";
import { KateOS } from "../os";

export class KateKVStorage {
  constructor(readonly os: KateOS) {}

  get_store(id: string) {
    return new KateKVStoragePartition(this, id);
  }
}

export class KateKVStoragePartition {
  constructor(readonly manager: KateKVStorage, readonly id: string) {}

  get db() {
    return this.manager.os.db;
  }

  async contents() {
    return this.db.transaction([Db.cart_kvstore], "readonly", async (t) => {
      const store = t.get_table(Db.cart_kvstore);
      return (await store.try_get(this.id))?.content ?? Object.create(null);
    })
  }

  async write(from: {[key: string]: string}) {
    const data = Object.create(null);
    for (const [key, value] of Object.entries(from)) {
      data[key] = String(value);
    }
    return this.db.transaction([Db.cart_kvstore], "readwrite", async (t) => {
      const store = t.get_table(Db.cart_kvstore);
      await store.write({ id: this.id, content: data });
    })
  }

  async set_pair(key: string, value: string) {
    return this.db.transaction([Db.cart_kvstore], "readwrite", async (t) => {
      const store = t.get_table(Db.cart_kvstore);
      const value = (await store.try_get(this.id))?.content ?? Object.create(null);
      value[key] = value;
      await store.write({ id: this.id, content: value });
    })
  }
}