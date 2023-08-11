import { RiskCategory } from "../capabilities";
import { Database, Transaction } from "../db-schema";
import { CartStore } from "./cartridge";
import { kate } from "./db";

export type AuditResource =
  | "navigate"
  | "kate:version"
  | "kate:settings"
  | "kate:permissions"
  | "kate:habits"
  | "kate:storage"
  | "kate:capture"
  | "kate:cartridge"
  | "error";

export type AuditMessage = {
  id?: number;
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

  async log(message: Exclude<AuditMessage, { id: number }>) {
    this.logs.add(message);
  }

  async count_all() {
    return await this.logs.count();
  }

  async read_recent(limit: number) {
    return (await this.logs.get_all()).reverse().slice(0, limit);
  }
}
