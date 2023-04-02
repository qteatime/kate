import { h } from "../ui/widget";
import * as UI from "../ui/widget";
import type { ConsoleOptions, ExtendedInputKey } from "../../kernel";
import * as Legal from "../../legal";
import { SceneTextFile } from "./licence";
import { Scene } from "../ui/scenes";
import { UAInfo, from_bytes, mhz_to_ghz, user_agent_info } from "../../utils";

const release_notes = require("../../../RELEASE-0.3.4.txt!text") as string;

function friendly_mode(mode: ConsoleOptions["mode"]) {
  switch (mode) {
    case "native":
      return "Native";
    case "single":
      return "Single Cartridge";
    case "web":
      return `Web App`;
  }
}

export class SceneAboutKate extends Scene {
  kate_info() {
    const console = this.os.kernel.console;
    return {
      mode: friendly_mode(console.options.mode),
      version: console.version,
    };
  }

  async native_info() {
    return await KateNative.get_system_information();
  }

  async system_info() {
    const mode = this.os.kernel.console.options.mode;
    const ua = await user_agent_info();
    const device = ua.device.mobile
      ? `(Mobile) ${ua.device.model ?? "unknown"}`
      : ua.device.model ?? "";

    if (mode === "native") {
      const info = await this.native_info();

      return {
        kate: this.kate_info(),
        host: {
          os: info.os.name,
          browser: info.engine.map((x: any) => `${x.name} ${x.version}`),
          device: device,
          arm64_translation: info.os.arm64_translation,
          architecture: info.os.architecture,
        },
        hardware: {
          cpu_model: info.cpu.model,
          cpu_logical_cores: info.cpu.logical_cores,
          cpu_frequency: mhz_to_ghz(info.cpu.speed),
          memory: `${from_bytes(info.memory.total)} (${from_bytes(
            info.memory.free
          )} free)`,
        },
      };
    } else {
      return {
        kate: this.kate_info(),
        host: {
          os: `${ua.os.name} ${ua.os.version ?? ""}`,
          browser: ua.browser.map((x) => `${x.name} ${x.version ?? ""}`),
          device: device,
          arm64_translation: ua.cpu.wow64,
          architecture: ua.cpu.architecture,
        },
        hardware: {
          cpu_model: "unknown",
          cpu_logical_cores: "unknown",
          cpu_frequency: "unknown",
          memory: "unknown",
        },
      };
    }
  }

  async render_sysinfo(canvas: HTMLElement) {
    const x = await this.system_info();

    canvas.textContent = "";
    canvas.append(
      UI.legible_bg([
        h("h2", {}, ["System"]),
        UI.info_line("Kate version", [x.kate.version]),
        UI.info_line("Kate mode", [x.kate.mode]),

        h("h2", {}, ["Host"]),
        UI.info_line("Browser", [
          new UI.VBox(5, [...x.host.browser.map((x) => UI.h("div", {}, [x]))]),
        ]),
        UI.info_line("OS", [x.host.os]),
        UI.info_line("Architecture", [x.host.architecture]),
        UI.info_line("x64/ARM64 translation?", [
          String(x.host.arm64_translation),
        ]),
        UI.info_line("Device", [x.host.device]),

        h("h2", {}, ["Hardware"]),
        UI.info_line("CPU model", [x.hardware.cpu_model]),
        UI.info_line("CPU logical cores", [
          String(x.hardware.cpu_logical_cores),
        ]),
        UI.info_line("CPU frequency", [x.hardware.cpu_frequency]),
        UI.info_line("Memory", [x.hardware.memory]),
      ])
    );
  }

  render() {
    const sysinfo = h("div", { class: "kate-os-system-information" }, []);
    this.render_sysinfo(sysinfo);

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
