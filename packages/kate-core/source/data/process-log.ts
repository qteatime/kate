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

export type ProcessLog = {
  process_id: string;
  size: number;
  last_update: Date;
  entries: ProcessLogEntry[];
};

export type ProcessLogMeta = Omit<ProcessLog, "entries">;

export type LogLevel = "debug" | "trace" | "info" | "warn" | "error";

export type ProcessLogEntry = {
  time: Date;
  level: LogLevel;
  message: string;
};

export const process_log = kate.table1<ProcessLog, "process_id">({
  since: 21,
  name: "process-log",
  path: "process_id",
  auto_increment: false,
});

export class ProcessLogStore {
  constructor(readonly transaction: Transaction) {}

  static transaction<A>(
    db: Database,
    mode: IDBTransactionMode,
    fn: (store: ProcessLogStore) => Promise<A>
  ) {
    return db.transaction(ProcessLogStore.tables, mode, async (txn) => {
      return await fn(new ProcessLogStore(txn));
    });
  }

  static tables = [process_log];

  get t_logs() {
    return this.transaction.get_table1(process_log);
  }

  async read_logs(process_id: string): Promise<ProcessLog> {
    const data = await this.t_logs.try_get(process_id);
    if (data == null) {
      return {
        process_id,
        last_update: new Date(),
        size: 0,
        entries: [],
      };
    } else {
      return data;
    }
  }

  async write_logs(logs: ProcessLog) {
    await this.t_logs.put(logs);
  }

  async list_processes(): Promise<ProcessLogMeta[]> {
    const processes: ProcessLogMeta[] = [];
    const all_logs = await this.t_logs.get_all();
    for (const process of all_logs) {
      processes.push({
        process_id: process.process_id,
        size: process.size,
        last_update: process.last_update,
      });
    }
    return processes;
  }
}
