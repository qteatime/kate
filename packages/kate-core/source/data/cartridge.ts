import * as CartMetadata from "../cart/v3/metadata";
import * as CartRuntime from "../cart/v3/runtime";
import type { Database, Transaction } from "../db-schema";
import { kate } from "./db";

export type CartridgeStatus = "active" | "inactive" | "archived";

export type CartMeta = {
  id: string;
  thumbnail_dataurl: string;
  metadata: CartMetadata.Metadata;
  runtime: CartRuntime.Runtime;
  files: { path: string; id: string; size: number }[];
  installed_at: Date;
  updated_at: Date;
  status: CartridgeStatus;
};
export const cart_meta = kate.table1<CartMeta, "id">({
  since: 3,
  name: "cart_meta_v2",
  path: "id",
  auto_increment: false,
});

export type CartFile = {
  id: string;
  file_id: string;
  mime: string;
  data: Uint8Array;
};
export const cart_files = kate.table2<CartFile, "id", "file_id">({
  since: 3,
  name: "cart_files_v2",
  path: ["id", "file_id"],
  auto_increment: false,
});

export class CartStore {
  constructor(readonly transaction: Transaction) {}

  static transaction<A>(
    db: Database,
    mode: IDBTransactionMode,
    fn: (store: CartStore) => Promise<A>
  ) {
    return db.transaction(CartStore.tables, mode, async (txn) => {
      return await fn(new CartStore(txn));
    });
  }

  static tables = [cart_meta, cart_files];

  get meta() {
    return this.transaction.get_table1(cart_meta);
  }

  get files() {
    return this.transaction.get_table2(cart_files);
  }

  async archive(cart_id: string) {
    const meta = await this.meta.get(cart_id);
    for (const file of meta.files) {
      await this.files.delete([cart_id, file.id]);
    }
    await this.meta.put({
      ...meta,
      files: [],
      updated_at: new Date(),
      status: "archived",
    });
  }

  async remove(cart_id: string) {
    await this.archive(cart_id);
    await this.meta.delete(cart_id);
  }
}
