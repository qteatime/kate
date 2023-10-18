/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { h } from "../ui/widget";
import * as UI from "../ui/widget";
import type { ConsoleOptions } from "../../kernel";
import * as Legal from "../../legal";
import { SceneTextFile } from "./text-file";
import { Scene, SimpleScene } from "../ui/scenes";
import { UAInfo, basic_ua_details, from_bytes, mhz_to_ghz, user_agent_info } from "../../utils";

const release_notes = require("../../../RELEASE.txt!text") as string;

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

export function bool_text(x: boolean | null) {
  switch (x) {
    case null:
      return "unknown";
    case true:
      return "Yes";
    case false:
      return "No";
  }
}

export class SceneAboutKate extends SimpleScene {
  icon = "cat";
  title = ["About Kate"];
  readonly application_id = "kate:about";

  body_container(body: UI.Widgetable[]): HTMLElement {
    return h("div", { class: "kate-os-scroll kate-os-content kate-about-bg" }, [...body]);
  }

  body() {
    const sysinfo = h("div", { class: "kate-os-system-information" }, []);
    this.render_sysinfo(sysinfo);

    return [
      h("div", { class: "kate-os-about-box" }, [
        h("div", { class: "kate-os-about-content" }, [
          h("h2", {}, ["Kate", UI.hspace(10), this.os.kernel.console.version]),
          h("div", { class: "kt-meta" }, ["Copyright (c) 2023 Q."]),
          UI.vspace(32),
          UI.vbox(0.5, [
            UI.text_button(this.os, "Licensing information", {
              status_label: "Open",
              on_click: this.handle_licence,
            }),
            UI.text_button(this.os, "Release notes", {
              status_label: "Open",
              on_click: this.handle_release_notes,
            }),
          ]),
          UI.vspace(32),
          sysinfo,
        ]),
      ]),
    ];
  }

  kate_info() {
    const console = this.os.kernel.console;
    return {
      mode: friendly_mode(console.options.mode),
      version: console.version,
    };
  }

  async native_info() {
    return await KateNative!.get_system_information();
  }

  async system_info() {
    const mode = this.os.kernel.console.options.mode;

    switch (mode) {
      case "native": {
        const info = await this.native_info();
        const ua = await user_agent_info();
        const device = ua.mobile ? "Mobile" : "Other";

        return {
          kate: this.kate_info(),
          host: {
            os: `${info.os.name} ${info.os.version}\n(${
              info.os.extended_version === info.os.version ? "" : info.os.extended_version
            })`,
            browser: info.engine.map((x) => `${x.name} ${x.version}`),
            device: device,
            arm64_translation: info.os.arm64_translation,
            architecture: info.os.architecture,
          },
          hardware: {
            cpu_model: info.cpu.model,
            cpu_logical_cores: info.cpu.logical_cores,
            cpu_frequency: mhz_to_ghz(info.cpu.speed),
            memory: `${from_bytes(info.memory.total)} (${from_bytes(info.memory.free)} free)`,
          },
        };
      }

      case "web": {
        const ua = await user_agent_info();
        const device = ua.mobile ? "Mobile" : "Other";
        return {
          kate: this.kate_info(),
          host: {
            os: `${ua.os.name} ${ua.os.version ?? ""}`,
            browser: ua.engine.map((x) => `${x.name} ${x.version ?? ""}`),
            device: device,
            arm64_translation: ua.cpu.wow64 ?? null,
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
      case "single": {
        const ua = basic_ua_details();

        return {
          kate: this.kate_info(),
          host: {
            os: ua.os.name ?? "unknown",
            browser: ua.engine.map((x) => `${x.name} ${x.version ?? ""}`),
            device: ua.mobile ? "Mobile" : "Other",
            arm64_translation: null,
            architecture: "unknown",
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
  }

  async render_sysinfo(canvas: HTMLElement) {
    const x = await this.system_info();

    canvas.textContent = "";
    canvas.append(
      UI.legible_bg([
        h("h3", {}, ["System"]),
        UI.info_line("Kate version", [x.kate.version]),
        UI.info_line("Kate mode", [x.kate.mode]),

        h("h3", {}, ["Host"]),
        UI.info_line("Browser", [
          new UI.VBox(0.5, [...x.host.browser.map((x) => UI.h("div", {}, [x]))]),
        ]),
        UI.info_line("OS", [x.host.os]),
        UI.info_line("Architecture", [x.host.architecture]),
        UI.info_line("x64/ARM64 translation?", [bool_text(x.host.arm64_translation)]),
        UI.info_line("Device", [x.host.device]),

        h("h3", {}, ["Hardware"]),
        UI.info_line("CPU model", [x.hardware.cpu_model]),
        UI.info_line("CPU logical cores", [String(x.hardware.cpu_logical_cores)]),
        UI.info_line("CPU frequency", [x.hardware.cpu_frequency]),
        UI.info_line("Memory", [x.hardware.memory]),
      ])
    );
  }

  handle_licence = () => {
    this.os.push_scene(new SceneTextFile(this.os, "Legal Notices", "Kate", Legal.notice));
  };

  handle_release_notes = () => {
    this.os.push_scene(new SceneTextFile(this.os, "Release Notes", "Kate", release_notes));
  };
}
