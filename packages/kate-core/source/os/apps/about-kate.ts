import { h } from "../ui/widget";
import * as UI from "../ui/widget";
import type { ConsoleOptions, ExtendedInputKey } from "../../kernel";
import * as Legal from "../../legal";
import { SceneTextFile } from "./text-file";
import { Scene, SimpleScene } from "../ui/scenes";
import {
  UAInfo,
  basic_ua_details,
  from_bytes,
  mhz_to_ghz,
  user_agent_info,
} from "../../utils";

const release_notes = require("../../../RELEASE.txt!text") as string;

type Version = {
  version: string;
  main: string;
  breaking_change: boolean;
  migration_needed: boolean;
  release_notes: string;
  channels: string[];
};
type VersionMeta = {
  versions: Version[];
  channels: { [key: string]: string };
};

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

  body_container(body: UI.Widgetable[]): HTMLElement {
    return h("div", { class: "kate-os-scroll kate-os-content kate-about-bg" }, [
      ...body,
    ]);
  }

  body() {
    const sysinfo = h("div", { class: "kate-os-system-information" }, []);
    this.render_sysinfo(sysinfo);

    const update_button = h("div", { class: "kate-os-update-button" }, [
      h("h2", {}, ["Updates"]),
      "Checking for updates...",
    ]);
    this.check_for_updates(update_button);

    return [
      h("div", { class: "kate-os-about-box" }, [
        h("div", { class: "kate-os-about-content" }, [
          h("h2", {}, ["Kate", UI.hspace(10), this.os.kernel.console.version]),
          h("div", { class: "kt-meta" }, [
            "Copyright (c) 2023 Q. (MIT licensed)",
          ]),
          UI.vspace(32),
          UI.vbox(0.5, [
            UI.text_button(this.os, "Third-party notices", {
              status_label: "Open",
              on_click: this.handle_third_party,
            }),
            UI.text_button(this.os, "Release notes", {
              status_label: "Open",
              on_click: this.handle_release_notes,
            }),
          ]),
          UI.vspace(24),
          update_button,
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
              info.os.extended_version === info.os.version
                ? ""
                : info.os.extended_version
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
            memory: `${from_bytes(info.memory.total)} (${from_bytes(
              info.memory.free
            )} free)`,
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
          new UI.VBox(0.5, [
            ...x.host.browser.map((x) => UI.h("div", {}, [x])),
          ]),
        ]),
        UI.info_line("OS", [x.host.os]),
        UI.info_line("Architecture", [x.host.architecture]),
        UI.info_line("x64/ARM64 translation?", [
          bool_text(x.host.arm64_translation),
        ]),
        UI.info_line("Device", [x.host.device]),

        h("h3", {}, ["Hardware"]),
        UI.info_line("CPU model", [x.hardware.cpu_model]),
        UI.info_line("CPU logical cores", [
          String(x.hardware.cpu_logical_cores),
        ]),
        UI.info_line("CPU frequency", [x.hardware.cpu_frequency]),
        UI.info_line("Memory", [x.hardware.memory]),
      ])
    );
  }

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

  async check_for_updates(container: HTMLElement) {
    if (this.os.kernel.console.options.mode !== "web") {
      container.textContent = "";
      return;
    }

    const versions = (await fetch("/versions.json").then((x) =>
      x.json()
    )) as VersionMeta;
    const channel = localStorage["kate-channel"];
    const current = JSON.parse(localStorage["kate-version"]) as Version;
    const available = versions.versions.filter((x) =>
      x.channels.includes(channel)
    );

    const channel_button = UI.when(
      this.os.kernel.console.options.mode === "web",
      [
        UI.link_card(this.os, {
          arrow: "pencil",
          title: "Release channel",
          description: UI.vbox(0.3, [
            "Frequency and stability of Kate's updates",
            UI.meta_text(["(the emulator will reload when changing this)"]),
          ]),
          value: channel,
          click_label: "Change",
          on_click: () => this.handle_change_channel(container, versions),
        }),
      ]
    );

    if (available.length > 0) {
      const current_index =
        available.findIndex((x) => x.version === current.version) ?? 0;
      if (current_index < available.length - 1) {
        const latest = available.at(-1)!;
        container.textContent = "";
        container.append(
          h("div", {}, [
            UI.vbox(0.5, [
              channel_button,
              UI.hbox(0.5, [
                `Version ${latest.version} is available!`,
                UI.link(this.os, "(Release Notes)", {
                  status_label: "Open",
                  on_click: () => this.handle_release_notes_for_version(latest),
                }),
              ]),
              UI.text_button(this.os, `Update to ${latest.version}`, {
                status_label: "Update",
                on_click: () => this.handle_update_to_version(latest),
              }),
            ]),
          ])
        );
        return;
      }
    }

    container.textContent = "";
    container.append(
      h("div", {}, [UI.vbox(0.5, [channel_button, "You're up to date!"])])
    );
  }

  async handle_change_channel(container: HTMLElement, versions: VersionMeta) {
    const channel = await this.os.dialog.pop_menu(
      "kate:about",
      "Kate release channel",
      [
        { label: "Preview (updates monthly)", value: "preview" },
        { label: "Nightly (untested releases)", value: "nightly" },
      ],
      null
    );
    if (channel != null) {
      const current_channel = localStorage["kate-channel"];
      if (current_channel === channel) {
        return;
      }

      const current_version = JSON.parse(
        localStorage["kate-version"]
      ) as Version;
      const available_versions = versions.versions.filter((x) =>
        x.channels.includes(channel)
      );
      const version =
        available_versions.find((x) => x.version === current_version.version) ??
        available_versions.at(-1);
      if (available_versions.length === 0 || version == null) {
        await this.os.dialog.message("kate:about", {
          title: "Failed to update channel",
          message: `No releases available for channel ${channel}`,
        });
        return;
      }
      const old_version_index = versions.versions.findIndex(
        (x) => x.version === current_version.version
      );
      const new_version_index = versions.versions.findIndex(
        (x) => x.version === version.version
      );
      if (
        old_version_index === -1 ||
        new_version_index === -1 ||
        new_version_index < old_version_index
      ) {
        const ok = await this.os.dialog.confirm("kate:about", {
          title: `Downgrade to ${version.version}?`,
          message: `Kate does not support graceful downgrades. Proceeding will erase all Kate data
                    and then switch to the new version.`,
          cancel: "Cancel",
          ok: "Erase all data and downgrade",
          dangerous: true,
        });
        if (!ok) {
          return;
        } else {
          await this.os.db.delete_database();
        }
      }

      localStorage["kate-channel"] = channel;
      localStorage["kate-version"] = JSON.stringify(version);
      location.reload();
    }
  }

  async handle_release_notes_for_version(version: Version) {
    const text = await fetch(version.release_notes).then((x) => x.text());
    this.os.push_scene(
      new SceneTextFile(
        this.os,
        `Release notes v${version.version}`,
        "Kate",
        text
      )
    );
  }

  async handle_update_to_version(version: Version) {
    const suffix = version.migration_needed
      ? "We'll need to update your storage to a new format, this may take a few minutes."
      : "";

    const should_update = await this.os.dialog.confirm("kate:update", {
      title: `Update to v${version.version}`,
      message: `The application will reload to complete the update. ${suffix}`,
      cancel: "Cancel",
      ok: "Update now",
    });

    if (should_update) {
      await this.os.notifications.log(
        "kate:update",
        `Updated to v${version.version}`,
        ""
      );
      localStorage["kate-version"] = JSON.stringify(version);
      window.location.reload();
    }
  }
}
