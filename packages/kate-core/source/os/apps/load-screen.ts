import { h } from "../ui/widget";
import { Scene } from "../ui/scenes";

export class HUD_LoadIndicator extends Scene {
  render() {
    return h("div", { class: "kate-hud-load-screen" }, ["Loading..."]);
  }
}
