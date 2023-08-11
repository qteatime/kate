import { RiskCategory } from "../../capabilities";
import { AuditResource, AuditStore } from "../../data";
import type { KateOS } from "../os";

type NewMessage = {
  resources?: AuditResource[];
  risk: RiskCategory;
  type: string;
  message?: string;
  extra?: unknown;
};

export class KateAuditSupervisor {
  constructor(readonly os: KateOS) {}

  async log(process_id: string, message: NewMessage) {
    await AuditStore.transaction(this.os.db, "readwrite", async (store) => {
      store.log({
        process_id: process_id,
        resources: new Set(message.resources ?? []),
        risk: message.risk,
        time: new Date(),
        type: message.type,
        message: message.message ?? "",
        extra: message.extra ?? null,
      });
    });
  }
}
