/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
 */

import * as Cart from "../cart";
import type { Database, Transaction } from "../db-schema";
import type { KateOS, PersistentKey } from "../os";
import { make_id, unreachable } from "../utils";
import { kate } from "./db";

export type CartridgeStatus = "active" | "inactive" | "archived";

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
  signatures: Cart.Signature[];
  status: CartridgeStatus;
};
export const cart_meta_v3 = kate.table1<CartMeta_v3, "id">({
  since: 15,
  name: "cart_meta_v3",
  path: "id",
  auto_increment: false,
});
export const idx_cart_by_status = cart_meta_v3.index1({
  since: 15,
  name: "by_status",
  path: "status",
  multi_entry: false,
  unique: false,
});

type TransactionKind = "meta";

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

  static tables = [cart_meta_v3];

  static tables_by_kind(kind: TransactionKind) {
    switch (kind) {
      case "meta":
        return [cart_meta_v3];
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

  async archive(cart_id: string) {
    const meta = await this.meta.get(cart_id);
    await this.meta.put({
      ...meta,
      bucket_key: null,
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
      signatures: cart.signatures,
    });
  }

  async remove(cart_id: string) {
    await this.meta.delete(cart_id);
  }

  async list() {
    return this.meta.get_all();
  }

  async list_by_status(status?: CartridgeStatus) {
    return this.meta_by_status.get_all(status ? status : undefined);
  }
}
