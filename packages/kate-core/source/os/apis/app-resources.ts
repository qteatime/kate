import { make_id, sleep } from "../../utils";
import type { KateOS } from "../os";

export class KateAppResources {
  constructor(readonly os: KateOS) {}

  get worker() {
    if (this.os.kernel.console.options.mode !== "web") {
      return null;
    } else {
      return navigator.serviceWorker.controller ?? null;
    }
  }

  async send<T extends { type: string }>(message0: T) {
    const worker = await this.worker;
    if (!worker) {
      return;
    }

    return new Promise((resolve, reject) => {
      const id = make_id();
      const message = { ...message0, id };
      const channel = new MessageChannel();

      channel.port1.onmessage = (ev: MessageEvent<any>) => {
        if (ev.data.type !== "reply" || ev.data.id !== id) {
          return;
        }
        if (ev.data.ok) {
          resolve(ev.data.value);
        } else {
          reject(ev.data.error);
        }
      };

      worker?.postMessage(message, [channel.port2]);
    });
  }

  async refresh_cache() {
    // ensure we are online by reading a non-cached resource
    const response = await fetch("/versions.json");
    if (!response.ok) {
      throw new Error(`Refreshing the cache requires network access`);
    }

    const version = JSON.parse(localStorage["kate-version"]);
    const refresh = this.send({
      type: "refresh-cache",
      version: version.version,
    });
    const timeout = sleep(5000).then((x) =>
      Promise.reject(new Error("timeout"))
    );
    await Promise.race([refresh, timeout]);
  }
}
