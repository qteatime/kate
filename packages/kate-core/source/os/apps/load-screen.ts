import { h } from "../ui/widget";
import { Scene } from "../ui/scenes";
import type { KateOS } from "../os";

export class HUD_LoadIndicator extends Scene {
  constructor(os: KateOS) {
    super(os, true);
  }

  render() {
    return h("div", { class: "kate-hud-load-screen" }, ["Loading..."]);
  }
}
