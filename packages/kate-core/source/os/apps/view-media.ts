/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateOS } from "../os";
import { h } from "../ui/widget";
import * as UI from "../ui/widget";
import type { ExtendedInputKey } from "../../kernel";
import * as Db from "../../data";
import { unreachable } from "../../utils";
import { SceneMedia } from "./media";
import { Scene } from "../ui/scenes";

export class SceneViewMedia extends Scene {
  private url: string | null = null;

  constructor(
    os: KateOS,
    readonly media_list: SceneMedia,
    readonly media: Db.Media
  ) {
    super(os, true);
  }

  render() {
    return h("div", { class: "kate-os-media-fullscreen" }, [
      h("div", { class: "kate-os-media-container" }, []),
      h("div", { class: "kate-os-statusbar visible" }, [
        UI.icon_button("menu", "Options").on_clicked(this.handle_options),
        UI.icon_button("x", "Return").on_clicked(this.handle_close),
        this.media.kind === "video"
          ? UI.icon_button("o", "Play/Pause").on_clicked(this.handle_play_pause)
          : null,
      ]),
    ]);
  }

  async on_attached(): Promise<void> {
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    const file = await this.os.capture.read_file(this.media.id);
    const blob = new Blob([file.data], { type: file.mime });
    this.url = URL.createObjectURL(blob);
    this.render_media(this.url);
  }

  render_media(url: string) {
    switch (this.media.kind) {
      case "image": {
        this.render_image(url);
        break;
      }

      case "video": {
        this.render_video(url);
        break;
      }

      default:
        return null;
    }
  }

  private get container(): HTMLElement {
    return this.canvas.querySelector(".kate-os-media-container")!;
  }

  render_image(url: string) {
    const img = h("img", { src: url, class: "kate-os-media-image" }, []);
    this.container.append(img);
  }

  render_video(url: string) {
    const player = h(
      "video",
      {
        src: url,
        class: "kate-os-media-video",
        autoplay: "autoplay",
        loop: "loop",
      },
      []
    );
    this.container.append(player);
  }

  on_detached(): void {
    this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
    if (this.url != null) {
      URL.revokeObjectURL(this.url);
    }
  }

  handle_key_pressed = (x: { key: ExtendedInputKey; is_repeat: boolean }) => {
    if (x.is_repeat) {
      return false;
    }
    switch (x.key) {
      case "x": {
        this.handle_close();
        return true;
      }

      case "o": {
        this.handle_play_pause();
        return true;
      }

      case "menu": {
        this.handle_options();
        return true;
      }
    }

    return false;
  };

  handle_play_pause = () => {
    const video = this.canvas.querySelector("video");
    if (video != null) {
      if (video.paused || video.ended) {
        video.play();
      } else {
        video.pause();
      }
    }
  };

  handle_toggle_ui = () => {
    const status = this.canvas.querySelector(".kate-os-statusbar")!;
    status.classList.toggle("visible");
  };

  handle_options = async () => {
    const ui = this.canvas.querySelector(".kate-os-statusbar")!;
    const ui_visible = ui.classList.contains("visible");
    const result = await this.os.dialog.pop_menu(
      "kate:media",
      "",
      [
        { label: "Delete", value: "delete" as const },
        {
          label: `${ui_visible ? "Hide" : "Show"} UI`,
          value: "toggle-ui" as const,
        },
        { label: "Download", value: "download" as const },
      ],
      "close"
    );
    switch (result) {
      case "toggle-ui": {
        this.handle_toggle_ui();
        break;
      }

      case "close": {
        break;
      }

      case "delete": {
        this.handle_delete();
        break;
      }

      case "download": {
        this.handle_download();
        break;
      }

      default:
        throw unreachable(result);
    }
  };

  handle_delete = async () => {
    const should_delete = await this.os.dialog.confirm("kate:media", {
      title: "",
      message: "Delete this file? This is an irreversible operation.",
      ok: "Delete",
      cancel: "Keep file",
      dangerous: true,
    });
    if (should_delete) {
      await this.os.capture.delete(this.media.id!);
      await this.os.audit_supervisor.log("kate:media", {
        resources: ["kate:capture"],
        risk: "low",
        type: "kate.capture.deleted",
        message: `Media deleted`,
        extra: { id: this.media.id },
      });
      await this.os.notifications.push_transient(
        "kate:media",
        `Media deleted`,
        ""
      );
      this.media_list.mark_deleted(this.media.id!);
      this.close();
    }
  };

  handle_close = () => {
    this.close();
  };

  handle_download = () => {
    if (this.url == null) {
      return;
    }

    const extension = this.media.kind === "image" ? ".png" : ".webm";
    this.download_url(this.url, "kate-capture", extension);
  };

  async download_url(url: string, name: string, extension: string) {
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = `${name}${this.timestamp_string()}${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }

  private timestamp_string() {
    const d = new Date();
    const f = (a: number) => String(a).padStart(2, "0");
    const date = `${d.getFullYear()}-${f(d.getMonth() + 1)}-${f(d.getDate())}`;
    const time = `${f(d.getHours())}-${f(d.getMinutes())}-${f(d.getSeconds())}`;
    return `${date}_${time}`;
  }
}
