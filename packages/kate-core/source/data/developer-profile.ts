/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
