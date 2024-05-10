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

import { Database, Transaction } from "../db-schema";
import { kate } from "./db";

export type DeveloperProfile = {
  name: string;
  domain: string;
  icon: Uint8Array | null;
  created_at: Date;
  key_id: string;
  fingerprint: string;
};

export const developer_profiles_v1 = kate.table1<DeveloperProfile, "domain">({
  since: 20,
  name: "developer_profiles",
  path: "domain",
  auto_increment: false,
});

export class DeveloperProfileStore {
  constructor(readonly transaction: Transaction) {}

  static async transaction<A>(
    db: Database,
    mode: IDBTransactionMode,
    fn: (store: DeveloperProfileStore) => Promise<A>
  ) {
    return await db.transaction(DeveloperProfileStore.tables, mode, async (txn) => {
      return await fn(new DeveloperProfileStore(txn));
    });
  }

  static tables = [developer_profiles_v1];

  get profiles() {
    return this.transaction.get_table1(developer_profiles_v1);
  }

  async list() {
    return await this.profiles.get_all();
  }

  async try_get_by_domain(domain: string) {
    return await this.profiles.try_get(domain);
  }

  async add(profile: DeveloperProfile) {
    return this.profiles.add(profile);
  }

  async delete(profile: DeveloperProfile) {
    await this.profiles.delete(profile.domain);
  }
}
