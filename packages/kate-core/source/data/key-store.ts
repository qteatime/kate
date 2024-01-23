/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Database, Transaction } from "../db-schema";
import { kate } from "./db";

export type KeyKind = "private" | "public";
export type TrustStore = "trusted" | "publisher" | "personal";
export type KeyAlgorithm = EcKeyImportParams;

export type InvalidationReason = {
  reason: "domain-compromised" | "key-compromised" | "other";
  invalidated_at: Date;
};

export type KeyStore_v1 = {
  id: string;
  kind: KeyKind;
  store: TrustStore;
  algorithm: KeyAlgorithm;
  comment: string;
  domain: string;
  fingerprint: string;
  key: Uint8Array;
  encryption_meta: null | {
    iv: Uint8Array;
    key_hash: Uint8Array;
    pair_id: string | null;
  };
  usage: KeyUsage[];
  invalidated: null | InvalidationReason;
  added_at: Date;
  updated_at: Date;
  last_used_at: Date | null;
};

export const key_store_v1 = kate.table1<KeyStore_v1, "id">({
  since: 18,
  name: "key_store_v1",
  path: "id",
  auto_increment: false,
});

export const idx_key_by_hash = key_store_v1.index3({
  since: 20,
  name: "by_hash",
  path: ["domain", "store", "fingerprint"],
  multi_entry: false,
  unique: true,
});

export const idx_key_by_store = key_store_v1.index2({
  since: 18,
  name: "by_store",
  path: ["store", "kind"],
  multi_entry: false,
  unique: false,
});

export const idx_key_by_domain = key_store_v1.index2({
  since: 18,
  name: "by_domain",
  path: ["domain", "kind"],
  multi_entry: false,
  unique: false,
});

export const idx_key_by_kind = key_store_v1.index1({
  since: 19,
  name: "by_kind",
  path: "kind",
  multi_entry: false,
  unique: false,
});

export class KeyStore {
  constructor(readonly transaction: Transaction) {}

  static async transaction<A>(
    db: Database,
    mode: IDBTransactionMode,
    fn: (store: KeyStore) => Promise<A>
  ) {
    return await db.transaction(KeyStore.tables, mode, async (txn) => {
      return await fn(new KeyStore(txn));
    });
  }

  static tables = [key_store_v1];

  get store() {
    return this.transaction.get_table1(key_store_v1);
  }

  async public_keys_for_domain(domain: string) {
    const by_domain = this.transaction.get_index2(idx_key_by_domain);
    return by_domain.get_all([domain, "public"]);
  }

  async private_keys_for_domain(domain: string) {
    const by_domain = this.transaction.get_index2(idx_key_by_domain);
    return by_domain.get_all([domain, "private"]);
  }

  async public_keys_in_store(store: TrustStore) {
    const by_store = this.transaction.get_index2(idx_key_by_store);
    return by_store.get_all([store, "public"]);
  }

  async all_private_keys() {
    const by_kind = this.transaction.get_index1(idx_key_by_kind);
    return by_kind.get_all("private");
  }

  async add_key(key: KeyStore_v1) {
    const store = this.transaction.get_table1(key_store_v1);
    await store.add(key);
    return key.id;
  }

  async update_key(key: KeyStore_v1) {
    const store = this.transaction.get_table1(key_store_v1);
    await store.put(key);
    return key.id;
  }

  async delete_key(key: KeyStore_v1) {
    const store = this.transaction.get_table1(key_store_v1);
    await store.delete(key.id);
  }

  async get_by_id(id: string) {
    return this.transaction.get_table1(key_store_v1).try_get(id);
  }

  async get_by_fingerprint(domain: string, store: TrustStore, fp: string) {
    const keys = await this.transaction.get_index3(idx_key_by_hash).get_all([domain, store, fp]);
    if (keys.length === 1) {
      return keys[0];
    } else {
      return null;
    }
  }
}
