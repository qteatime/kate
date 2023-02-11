import { KateOS } from "../os";
import { Scene } from "../ui/scenes";
import * as UI from "../ui";
import * as Db from "./db";
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
    await this.os.db.transaction([Db.notifications], "readwrite", async (t) => {
      const notifications = t.get_table(Db.notifications);
      await notifications.write({
        type: "basic",
        process_id,
        time: new Date(),
        title,
        message,
      });
    });
    this.hud.show(title, message);
  }
}

export class HUD_Toaster extends Scene {
  readonly NOTIFICATION_WAIT_TIME_MS = 5000;
  readonly FADE_OUT_TIME_MS = 250;

  constructor(readonly manager: KateNotification) {
    super(manager.os);
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
