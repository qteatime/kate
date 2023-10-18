/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateOS } from "../os";
import { Scene } from "../ui/scenes";
import * as UI from "../ui";
import * as Db from "../../data";
import { wait } from "../time";

export type NotificationType = "basic";

export class KateNotification {
  readonly hud: HUD_Toaster;
  constructor(readonly os: KateOS) {
    this.hud = new HUD_Toaster(this);
  }

  setup() {
    this.hud.setup();
  }

  async push(process_id: string, title: string, message: string) {
    this.hud.show(title, message);
  }

  async log(process_id: string, title: string, message: string, allow_failures: boolean = false) {
    try {
      await this.os.db.transaction([Db.notifications], "readwrite", async (t) => {
        const notifications = t.get_table1(Db.notifications);
        await notifications.put({
          type: "basic",
          process_id,
          time: new Date(),
          title,
          message,
        });
      });
    } catch (error) {
      console.error(`[Kate] failed to store audit log:`, error, {
        process_id,
        title,
        message,
      });
      if (!allow_failures) {
        throw error;
      }
    }
  }

  async push_transient(process_id: string, title: string, message: string) {
    this.hud.show(title, message);
  }
}

export class HUD_Toaster extends Scene {
  readonly application_id = "kate:notifications";

  readonly NOTIFICATION_WAIT_TIME_MS = 5000;
  readonly FADE_OUT_TIME_MS = 250;

  constructor(readonly manager: KateNotification) {
    super(manager.os, true);
    (this as any).canvas = UI.h("div", { class: "kate-hud-notifications" }, []);
  }

  setup() {
    this.manager.os.show_hud(this);
  }

  teardown() {
    this.manager.os.hide_hud(this);
  }

  render() {
    return null;
  }

  async show(title: string, message: string) {
    const element = UI.h("div", { class: "kate-hud-notification-item" }, [
      UI.h("div", { class: "kate-hud-notification-title" }, [title]),
      UI.h("div", { class: "kate-hud-notification-message" }, [message]),
    ]);
    this.canvas.appendChild(element);
    await wait(this.NOTIFICATION_WAIT_TIME_MS);
    element.classList.add("leaving");
    await wait(this.FADE_OUT_TIME_MS);
    element.remove();
  }
}
