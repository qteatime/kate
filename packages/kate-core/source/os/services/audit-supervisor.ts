/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { RiskCategory } from "../../capabilities";
import { AuditResource, AuditStore } from "../../data";
import { serialise_error } from "../../utils";
import type { KateOS } from "../os";

type NewMessage = {
  resources?: AuditResource[];
  risk: RiskCategory;
  type: string;
  message?: string;
  extra?: unknown;
};

export class KateAuditSupervisor {
  readonly RECENT_LOG_LIMIT = 1000;
  readonly PRESSURE_MARK = 10000;

  constructor(readonly os: KateOS) {}

  async start() {
    this.gc();
  }

  private async gc() {
    try {
      console.debug(`[kate:audit] Garbage-collecting old audit entries...`);
      const config = this.os.settings.get("audit");
      const removed = await AuditStore.transaction(this.os.db, "readwrite", async (store) => {
        return await store.garbage_collect_logs(config.log_retention_days, this.PRESSURE_MARK);
      });
      if (removed > 0) {
        await this.log("kate:audit", {
          resources: ["kate:audit"],
          risk: "high",
          type: "kate.audit.gc.removed-logs",
          message: `Removed ${removed} audit log entries`,
          extra: { removed },
        });
      }
    } catch (error) {
      console.error(`Failed to GC audit logs:`, error);
      await this.log("kate:audit", {
        resources: ["kate:audit", "error"],
        risk: "high",
        type: "kate.audit.gc.error",
        message: `Failed to remove older log entries`,
        extra: { error: serialise_error(error) },
      });
    }
  }

  async log(process_id: string, message: NewMessage) {
    const entry = {
      process_id: process_id,
      resources: new Set(message.resources ?? []),
      risk: message.risk,
      time: new Date(),
      type: message.type,
      message: message.message ?? "",
      extra: message.extra ?? null,
    };
    if (entry.resources.has("error")) {
      console.error(`[Kate Audit]`, process_id, message.message ?? "", entry);
    } else {
      console.log(`[Kate Audit]`, process_id, message.message ?? "", entry);
    }
    await AuditStore.transaction(this.os.db, "readwrite", async (store) => {
      store.log(entry);
    });
  }

  async read_recent() {
    return AuditStore.transaction(this.os.db, "readonly", async (store) => {
      const total = await store.count_all();
      const logs = await store.read_recent(this.RECENT_LOG_LIMIT);
      return { total, logs };
    });
  }

  async remove(id: number) {
    return AuditStore.transaction(this.os.db, "readwrite", async (store) => {
      await store.remove(id);
    });
  }
}
