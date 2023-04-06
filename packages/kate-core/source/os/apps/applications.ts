import { h } from "../ui/widget";
import * as UI from "../ui/widget";
import type { ExtendedInputKey } from "../../kernel";
import { SceneMedia } from "./media";
import { Scene } from "../ui/scenes";
import { SceneAboutKate } from "./about-kate";
import { SceneSettings } from "./settings";

export class SceneApps extends Scene {
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

  render() {
    return h("div", { class: "kate-os-simple-screen" }, [
      new UI.Title_bar({
        left: UI.fragment([
          UI.fa_icon("puzzle-piece", "lg"),
          new UI.Section_title(["Applications"]),
        ]),
      }),
      h("div", { class: "kate-os-scroll" }, [
        h("div", { class: "kate-os-applications" }, [
          ...this.apps.map((x) => this.render_app(x)),
        ]),
      ]),
      h("div", { class: "kate-os-statusbar" }, [
        UI.icon_button("x", "Return").on_clicked(this.handle_close),
        UI.icon_button("o", "Open").on_clicked(this.handle_open),
      ]),
    ]);
  }

  on_attached(): void {
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
  }

  on_detached(): void {
    this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
  }

  handle_key_pressed = (x: { key: ExtendedInputKey; is_repeat: boolean }) => {
    switch (x.key) {
      case "x": {
        if (!x.is_repeat) {
          this.handle_close();
          return true;
        }
      }
    }

    return false;
  };

  handle_close = () => {
    this.os.pop_scene();
  };

  handle_open = () => {
    const current = this.os.focus_handler.current_focus;
    if (current != null) {
      current.click();
    }
  };

  render_app(app: typeof this["apps"][0]) {
    return new UI.Button([
      h("div", { class: "kate-os-app-button" }, [
        h("div", { class: "kate-os-app-button-icon" }, [app.icon]),
        h("div", { class: "kate-os-app-button-title" }, [app.title]),
      ]),
    ]).on_clicked(() => this.open_app(app));
  }

  open_app(app: typeof this["apps"][0]) {
    const screen = app.open();
    this.os.push_scene(screen);
  }
}
