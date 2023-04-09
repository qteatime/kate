import { h } from "../ui/widget";
import { Scene } from "../ui/scenes";

export class SceneBoot extends Scene {
  render() {
    return h("div", { class: "kate-os-logo" }, [
      h("div", { class: "kate-os-logo-image" }, [
        h("div", { class: "kate-os-logo-name" }, ["Kate"]),
        h("div", { class: "kate-os-boot-message" }, []),
      ]),
    ]);
  }

  set_message(message: string) {
    this.canvas.querySelector(".kate-os-boot-message")!.textContent = message;
  }
}
