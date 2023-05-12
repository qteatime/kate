import type { KateOS } from "../os";
import { append, h, render, Widgetable } from "../ui";
import { Scene } from "../ui/scenes";

export class KateStatusBar {
  readonly hud: HUD_StatusBar;
  constructor(readonly os: KateOS) {
    this.hud = new HUD_StatusBar(this);
  }

  setup() {
    this.os.show_hud(this.hud);
  }

  show(content: Widgetable) {
    return this.hud.show(content);
  }
}

export class HUD_StatusBar extends Scene {
  private _timer: any = null;
  readonly STATUS_LINE_TIME_MS = 5000;

  constructor(readonly manager: KateStatusBar) {
    super(manager.os, true);
    (this as any).canvas = h("div", { class: "kate-hud-status-bar" }, []);
  }

  render() {
    return null;
  }

  show(content: Widgetable) {
    const status = new KateStatus(
      this,
      h("div", { class: "kate-hud-status-item" }, [content])
    );
    this.canvas.appendChild(status.canvas);
    this.tick();
    return status;
  }

  refresh() {
    const items = Array.from(
      this.canvas.querySelectorAll(".kate-hud-status-item")
    );
    if (items.length === 0) {
      this.canvas.classList.remove("active");
    } else {
      this.canvas.classList.add("active");
    }
  }

  private tick() {
    clearTimeout(this._timer);
    const items = Array.from(
      this.canvas.querySelectorAll(".kate-hud-status-item")
    );
    if (items.length > 0) {
      this.canvas.classList.add("active");
      const current = items.findIndex((x) => x.classList.contains("active"));
      for (const item of items) {
        item.classList.remove("active");
      }
      items[(current + 1) % items.length]?.classList.add("active");
    }
    if (items.length > 1) {
      this._timer = setTimeout(() => this.tick(), this.STATUS_LINE_TIME_MS);
    }
  }
}

export class KateStatus {
  constructor(readonly display: HUD_StatusBar, readonly canvas: HTMLElement) {}

  hide() {
    this.canvas.remove();
    this.display.refresh();
  }

  update(content: Widgetable) {
    this.canvas.textContent = "";
    append(content, this.canvas);
  }
}
