import * as CartMetadata from "../cart/v3/metadata";
import * as CartRuntime from "../cart/v3/runtime";
import * as Cart from "../cart";
import type { Database, Transaction } from "../db-schema";
import { make_id, unreachable } from "../utils";
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
export const idx_cart_by_status = cart_meta.index1({
  since: 10,
  name: "by_status",
  path: ["status"],
  multi_entry: false,
  unique: false,
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

type TransactionKind = "meta" | "files" | "all";

export class CartStore {
  constructor(readonly transaction: Transaction) {}

  static transaction<A>(
    db: Database,
    kind: TransactionKind,
    mode: IDBTransactionMode,
    fn: (store: CartStore) => Promise<A>
  ) {
    return db.transaction(CartStore.tables, mode, async (txn) => {
      return await fn(new CartStore(txn));
    });
  }

  static tables = [cart_meta, cart_files];

  tables_by_kind(kind: TransactionKind) {
    switch (kind) {
      case "meta":
        return [cart_meta];
      case "files":
        return [cart_files];
      case "all":
        return CartStore.tables;
      default:
        throw unreachable(kind, "transaction kind");
    }
  }

  get meta() {
    return this.transaction.get_table1(cart_meta);
  }

  get meta_by_status() {
    return this.transaction.get_index1(idx_cart_by_status);
  }

  get files() {
    return this.transaction.get_table2(cart_files);
  }

  private async remove_files(cart_id: string) {
    const meta = await this.meta.get(cart_id);
    for (const file of meta.files) {
      await this.files.delete([cart_id, file.id]);
    }
    return meta;
  }

  async archive(cart_id: string) {
    const meta = await this.remove_files(cart_id);
    await this.meta.put({
      ...meta,
      files: [],
      updated_at: new Date(),
      status: "archived",
    });
  }

  async install_files(cart: Cart.Cart) {
    let nodes: CartMeta["files"] = [];
    for (const node of cart.files) {
      const id = make_id();
      await this.files.put({
        id: cart.metadata.id,
        file_id: id,
        mime: node.mime,
        data: node.data,
      });
      nodes.push({
        id: id,
        path: node.path,
        size: node.data.byteLength,
      });
    }
    return nodes;
  }

  async insert(cart: Cart.Cart, thumbnail_url: string) {
    const now = new Date();
    const files = await this.install_files(cart);
    const old_meta = await this.meta.try_get(cart.metadata.id);
    await this.meta.put({
      id: cart.metadata.id,
      metadata: cart.metadata,
      runtime: cart.runtime,
      thumbnail_dataurl: thumbnail_url,
      files: files,
      installed_at: old_meta?.installed_at ?? now,
      updated_at: now,
      status: "active",
    });
  }

  async remove(cart_id: string) {
    await this.remove_files(cart_id);
    await this.meta.delete(cart_id);
  }

  async list() {
    return this.meta.get_all();
  }

  async list_by_status(status?: CartridgeStatus) {
    return this.meta_by_status.get_all(status ? [status] : undefined);
  }
}
