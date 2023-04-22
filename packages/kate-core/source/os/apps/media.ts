import type { KateOS } from "../os";
import { h } from "../ui/widget";
import * as UI from "../ui/widget";
import * as Db from "../../data";
import { SimpleScene } from "../ui/scenes";
import { SceneViewMedia } from "./view-media";

export class SceneMedia extends SimpleScene {
  icon = "images";
  title = ["Media gallery"];
  subtitle = h("div", { class: "kate-os-media-status" }, []);

  private media = new Map<HTMLElement, Db.Media>();

  constructor(
    os: KateOS,
    readonly filter: null | { id: string; title: string }
  ) {
    super(os);
  }

  body_container(body: UI.Widgetable[]): HTMLElement {
    return h("div", { class: "kate-os-scroll" }, [
      h("div", { class: "kate-os-media-items" }, [...body]),
    ]);
  }

  body() {
    return [];
  }

  on_attached(): void {
    super.on_attached();
    this.load_media();
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
      container.append(button);
      this.media.set(button, meta);
    }
  }

  private async make_button(x: Db.Media) {
    return UI.interactive(
      this.os,
      h("div", { class: "kate-os-media-thumbnail" }, [
        h("img", { src: x.thumbnail_dataurl }, []),
        this.make_video_length(x.video_length),
      ]),
      [
        {
          key: ["o"],
          label: "View",
          on_click: true,
          handler: () => this.view(x),
        },
      ]
    );
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
