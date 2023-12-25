/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as Cart from "../cart";
import type { Database, Transaction } from "../db-schema";
import type { PersistentKey } from "../os";
import { make_id, unreachable } from "../utils";
import { kate } from "./db";

export type CartridgeStatus = "active" | "inactive" | "archived";

export type CartMeta_v2 = {
  id: string;
  version: string;
  release_date: Date;
  format_version: "v4";
  thumbnail_dataurl: string | null;
  banner_dataurl: string | null;
  metadata: Cart.Metadata;
  runtime: Cart.Runtime;
  security: Cart.Security;
  files: { path: string; id: string; size: number }[];
  installed_at: Date;
  updated_at: Date;
  status: CartridgeStatus;
};
export const cart_meta_v2 = kate.table1<CartMeta_v2, "id">({
  since: 3,
  deprecated_since: 16,
  name: "cart_meta_v2",
  path: "id",
  auto_increment: false,
});
export const idx_cart_by_status_v2 = cart_meta_v2.index1({
  since: 13,
  deprecated_since: 16,
  name: "by_status_v2",
  path: "status",
  multi_entry: false,
  unique: false,
});

export type CartMeta_v3 = {
  id: string;
  version: string;
  release_date: Date;
  minimum_kate_version: Cart.KateVersion;
  format_version: "v4";
  thumbnail_dataurl: string | null;
  banner_dataurl: string | null;
  metadata: Cart.Metadata;
  runtime: Cart.Runtime;
  security: Cart.Security;
  files: Cart.File[]; // empty for archived cartridges
  bucket_key: PersistentKey | null; // null for archived cartridges
  installed_at: Date;
  updated_at: Date;
  status: CartridgeStatus;
};
export const cart_meta_v3 = kate.table1<CartMeta_v3, "id">({
  since: 16,
  name: "cart_meta_v3",
  path: "id",
  auto_increment: false,
});
export const idx_cart_by_status = cart_meta_v3.index1({
  since: 16,
  name: "by_status",
  path: "status",
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
  deprecated_since: 16,
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
    return db.transaction(CartStore.tables_by_kind(kind), mode, async (txn) => {
      return await fn(new CartStore(txn));
    });
  }

  static tables = [cart_meta_v3, cart_files];

  static tables_by_kind(kind: TransactionKind) {
    switch (kind) {
      case "meta":
        return [cart_meta_v3];
      case "files":
        return [cart_files];
      case "all":
        return CartStore.tables;
      default:
        throw unreachable(kind, "transaction kind");
    }
  }

  get meta() {
    return this.transaction.get_table1(cart_meta_v3);
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

  async insert(cart: Cart.BucketCart, thumbnail_url: string | null, banner_url: string | null) {
    const now = new Date();
    const old_meta = await this.meta.try_get(cart.id);
    await this.meta.put({
      id: cart.id,
      version: cart.version,
      release_date: cart.release_date,
      minimum_kate_version: cart.minimum_kate_version,
      format_version: "v4",
      thumbnail_dataurl: thumbnail_url,
      banner_dataurl: banner_url,
      metadata: cart.metadata,
      runtime: cart.runtime,
      security: cart.security,
      files: cart.files.nodes,
      bucket_key: cart.files.location,
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
    return this.meta_by_status.get_all(status ? status : undefined);
  }
}
