import { h } from "../ui/widget";
import * as UI from "../ui/widget";
import type { ExtendedInputKey } from "../../kernel";
import * as Legal from "../../legal";
import { SceneTextFile } from "./licence";
import { Scene } from "../ui/scenes";
import { UAInfo, user_agent_info } from "../../utils";

const release_notes = require("../../../RELEASE-0.3.4.txt!text") as string;

export class SceneAboutKate extends Scene {
  render_sysinfo(canvas: HTMLElement, ua: UAInfo) {
    canvas.textContent = "";
    canvas.append(
      UI.legible_bg([
        UI.info_line("Kate build", [this.os.kernel.console.version]),
        UI.info_line("Browser", [
          new UI.VBox(5, [
            ...ua.browser.map((x) => {
              return UI.h("div", {}, [x.name, " ", x.version ?? null]);
            }),
          ]),
        ]),
        UI.info_line("OS", [ua.os.name, " ", ua.os.version ?? null]),
        UI.info_line("CPU architecture", [
          ua.cpu.architecture,
          " ",
          ua.cpu.bitness ? `${ua.cpu.bitness} bits` : null,
          ua.cpu.wow64 ? " (32-bit binary)" : null,
        ]),
        UI.info_line("Device", [
          ua.device.mobile ? "mobile" : "standard",
          " ",
          ua.device.model ?? null,
        ]),
      ])
    );
  }

  render() {
    const sysinfo = h("div", { class: "kate-os-system-information" }, []);
    user_agent_info().then((ua) => this.render_sysinfo(sysinfo, ua));

    return h("div", { class: "kate-os-simple-screen" }, [
      new UI.Title_bar({
        left: UI.fragment([
          UI.fa_icon("cat", "lg"),
          new UI.Section_title(["About Kate"]),
        ]),
      }),
      h("div", { class: "kate-os-scroll kate-os-content kate-about-bg" }, [
        h("div", { class: "kate-os-about-box" }, [
          h("div", { class: "kate-os-about-content" }, [
            h("h2", {}, [
              "Kate",
              new UI.Space({ width: 10 }),
              this.os.kernel.console.version,
            ]),
            h("div", { class: "kt-meta" }, [
              "Copyright (c) 2023 Q. (MIT licensed)",
            ]),
            new UI.Space({ height: 32 }),
            new UI.VBox(10, [
              new UI.Button(["Third-party notices"]).on_clicked(
                this.handle_third_party
              ),

              new UI.Button(["Release notes"]).on_clicked(
                this.handle_release_notes
              ),
            ]),
            new UI.Space({ height: 32 }),
            h("h2", {}, ["System information"]),
            sysinfo,
          ]),
        ]),
      ]),
      h("div", { class: "kate-os-statusbar" }, [
        UI.icon_button("x", "Return").on_clicked(this.handle_close),
      ]),
    ]);
  }

  on_attached(): void {
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
  }

  on_detached(): void {
    this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
  }

  handle_key_pressed = (key: ExtendedInputKey) => {
    switch (key) {
      case "x": {
        this.handle_close();
        return true;
      }
    }

    return false;
  };

  handle_close = () => {
    this.os.pop_scene();
  };

  handle_third_party = () => {
    this.os.push_scene(
      new SceneTextFile(this.os, "Legal Notices", "Kate", Legal.notice)
    );
  };

  handle_release_notes = () => {
    this.os.push_scene(
      new SceneTextFile(this.os, "Release Notes", "Kate", release_notes)
    );
  };
}
