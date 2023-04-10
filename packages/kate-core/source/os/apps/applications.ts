import { h } from "../ui/widget";
import * as UI from "../ui/widget";
import type { ExtendedInputKey } from "../../kernel";
import { SceneMedia } from "./media";
import { Scene, SimpleScene } from "../ui/scenes";
import { SceneAboutKate } from "./about-kate";
import { SceneSettings } from "./settings";

export class SceneApps extends SimpleScene {
  icon = "puzzle-piece";
  title = ["Applications"];

  readonly apps = [
    {
      name: "media",
      title: "Media gallery",
      icon: UI.fa_icon("images"),
      open: () => new SceneMedia(this.os, null),
    },
    {
      name: "about",
      title: "About Kate",
      icon: UI.fa_icon("cat"),
      open: () => new SceneAboutKate(this.os),
    },
    {
      name: "settings",
      title: "Settings",
      icon: UI.fa_icon("gear"),
      open: () => new SceneSettings(this.os),
    },
  ];

  body() {
    return [
      h("div", { class: "kate-os-applications" }, [
        ...this.apps.map((x) => this.render_app(x)),
      ]),
    ];
  }

  render_app(app: typeof this["apps"][0]) {
    return UI.interactive(
      this.os,
      UI.h("div", { class: "kate-os-app-button" }, [
        h("div", { class: "kate-os-app-button-icon" }, [app.icon]),
        h("div", { class: "kate-os-app-button-title" }, [app.title]),
      ]),
      [
        {
          key: ["o"],
          label: "Open",
          on_click: true,
          handler: () => {
            this.os.push_scene(app.open());
          },
        },
      ]
    );
  }
}
