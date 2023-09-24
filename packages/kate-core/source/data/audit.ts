/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { RiskCategory } from "../capabilities";
import { Database, Transaction } from "../db-schema";
import { CartStore } from "./cartridge";
import { kate } from "./db";

export type AuditResource =
  | "navigate"
  | "device-fs"
  | "kate:version"
  | "kate:settings"
  | "kate:permissions"
  | "kate:habits"
  | "kate:storage"
  | "kate:capture"
  | "kate:cartridge"
  | "kate:ui"
  | "kate:audit"
  | "error";

export type AuditMessage = {
  id: number;
  resources: Set<AuditResource>;
  risk: RiskCategory;
  process_id: string;
  time: Date;
  type: string;
  message: string;
  extra: unknown;
};

export const audit = kate.table1<AuditMessage, "id">({
  since: 14,
  name: "audit",
  path: "id",
  auto_increment: true,
});

export const idx_by_process = audit.index1<"process_id">({
  since: 14,
  name: "by_process",
  path: "process_id",
  unique: false,
  multi_entry: false,
});

export class AuditStore {
  constructor(readonly transaction: Transaction) {}

  static transaction<A>(
    db: Database,
    mode: IDBTransactionMode,
    fn: (store: AuditStore) => Promise<A>
  ) {
    return db.transaction(AuditStore.tables, mode, async (txn) => {
      return await fn(new AuditStore(txn));
    });
  }

  static tables = [audit];

  get logs() {
    return this.transaction.get_table1(audit);
  }

  get logs_by_process() {
    return this.transaction.get_index1(idx_by_process);
  }

  async log(message: Omit<AuditMessage, "id">) {
    return this.logs.add(message as AuditMessage);
  }

  async count_all() {
    return await this.logs.count();
  }

  async read_recent(limit: number) {
    return (await this.logs.get_all()).reverse().slice(0, limit);
  }

  async remove(id: number) {
    const log = await this.logs.get(id);
    await this.logs.put({
      ...log,
      message: "*deleted*",
      extra: null,
    });
  }

  async garbage_collect_logs(retention: number, pressure_mark: number) {
    if (!Number.isFinite(retention)) {
      return 0;
    }

    const now = new Date();
    const min_diff = retention * 24 * 60 * 60 * 1000;
    const candidates0 = await this.logs.get_all();
    if (candidates0.length < pressure_mark) {
      return 0;
    }

    const candidates = candidates0.filter(
      (x) => now.getTime() - x.time.getTime() > min_diff
    );
    for (const entry of candidates) {
      await this.logs.delete(entry.id);
    }
    return candidates.length;
  }
}
