import type { KateOS } from "../os";
import { h } from "../ui/widget";
import * as UI from "../ui/widget";
import type { ExtendedInputKey } from "../../kernel";
import * as Db from "../../data/db";
import { Scene } from "../ui/scenes";
import { SceneViewMedia } from "./view-media";

export class SceneMedia extends Scene {
  private media = new Map<HTMLElement, Db.Media>();

  constructor(
    os: KateOS,
    readonly filter: null | { id: string; title: string }
  ) {
    super(os);
  }

  render() {
    return h("div", { class: "kate-os-simple-screen" }, [
      new UI.Title_bar({
        left: UI.fragment([
          UI.fa_icon("images", "lg"),
          new UI.Section_title(["Media gallery"]),
        ]),
        right: h("div", { class: "kate-os-media-status" }, []),
      }),
      h("div", { class: "kate-os-scroll" }, [
        h("div", { class: "kate-os-media-items" }, []),
      ]),
      h("div", { class: "kate-os-statusbar" }, [
        UI.icon_button("x", "Return").on_clicked(this.handle_close),
        UI.icon_button("o", "View").on_clicked(this.handle_view),
      ]),
    ]);
  }

  on_attached(): void {
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    this.load_media();
  }

  on_detached(): void {
    this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
  }

  private async get_media_filtered() {
    const media0 = await this.os.capture.list();
    const filter = this.filter;
    if (filter == null) {
      return { title: "All", media: media0 };
    } else {
      return {
        title: filter.title,
        media: media0.filter((x) => x.cart_id === filter.id),
      };
    }
  }

  private async load_media() {
    const { title, media } = await this.get_media_filtered();
    this.update_status(`${title} (${media.length})`);
    const buttons = await Promise.all(
      media.map(async (x) => [x, await this.make_button(x)] as const)
    );
    const container = this.canvas.querySelector(".kate-os-media-items")!;
    container.textContent = "";
    for (const [meta, button] of buttons) {
      const child = UI.render(button)! as HTMLElement;
      container.append(child);
      this.media.set(child, meta);
    }
  }

  private async make_button(x: Db.Media) {
    const element = new UI.Button([
      h("div", { class: "kate-os-media-thumbnail" }, [
        h("img", { src: x.thumbnail_dataurl }, []),
        this.make_video_length(x.video_length),
      ]),
    ]).on_clicked(() => this.view(x));
    return element;
  }

  private make_video_length(duration: number | null) {
    if (duration == null) {
      return null;
    } else {
      return h("div", { class: "kate-os-video-duration" }, [
        this.format_duration(duration),
      ]);
    }
  }

  private format_duration(n0: number) {
    const units = [
      [60, "mins"],
      [60, "hours"],
    ] as const;
    let n = n0;
    let unit = "secs";
    for (const [span, new_unit] of units) {
      if (n >= span) {
        n = n / span;
        unit = new_unit;
      } else {
        break;
      }
    }
    return `${Math.round(n)} ${unit}`;
  }

  private update_status(text: string) {
    this.canvas.querySelector(".kate-os-media-status")!.textContent = text;
  }

  handle_close = () => {
    this.os.pop_scene();
  };

  handle_view = () => {
    const current = this.os.focus_handler.current_focus;
    if (current != null) {
      const data = this.media.get(current);
      if (data != null) {
        this.view(data);
      }
    }
  };

  handle_key_pressed = (key: ExtendedInputKey) => {
    switch (key) {
      case "x": {
        this.handle_close();
        return true;
      }

      case "o": {
        this.handle_view();
        return true;
      }
    }

    return false;
  };

  view = (x: Db.Media) => {
    const viewer = new SceneViewMedia(this.os, this, x);
    this.os.push_scene(viewer);
  };

  mark_deleted = (id: string) => {
    for (const [button, meta] of this.media) {
      if (meta.id === id) {
        if (button.classList.contains("focus")) {
          const new_focus =
            button.previousElementSibling ?? button.nextElementSibling ?? null;
          this.os.focus_handler.focus(new_focus as HTMLElement | null);
          button.remove();
          this.media.delete(button);
        }
        break;
      }
    }
  };
}
