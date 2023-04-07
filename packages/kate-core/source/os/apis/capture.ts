import { KateOS } from "../os";
import * as Db from "../../data";
import {
  make_id,
  unreachable,
  load_image,
  make_thumbnail,
  mb,
  from_bytes,
  kb,
} from "../../utils";

declare global {
  function showSaveFilePicker(options?: {
    execludeAcceptAllOption?: boolean;
    suggestedName?: string;
    types?: { description: string; accept: { [key: string]: string[] } }[];
  }): Promise<FileSystemFileHandle>;

  interface FileSystemWritableFileStream {
    close(): Promise<void>;
  }
}

export class KateCapture {
  readonly THUMBNAIL_WIDTH = 160;
  readonly THUMBNAIL_HEIGHT = 96;

  readonly MAX_SCREENSHOT_SIZE = mb(1);
  readonly MAX_VIDEO_SIZE = mb(16);

  constructor(readonly os: KateOS) {}

  private async store_file(
    game_id: string,
    data: Uint8Array,
    mime: string,
    kind: "image" | "video"
  ) {
    const file_id = make_id();
    const { thumbnail, length } = await this.make_thumbnail(data, mime, kind);
    await this.os.db.transaction(
      [Db.media_store, Db.media_files],
      "readwrite",
      async (t) => {
        const media = t.get_table1(Db.media_store);
        const files = t.get_table1(Db.media_files);

        await files.add({
          id: file_id,
          mime: mime,
          data: data,
        });
        await media.add({
          id: file_id,
          cart_id: game_id,
          kind: kind,
          time: new Date(),
          thumbnail_dataurl: thumbnail,
          video_length: length,
          size: data.length,
        });
      }
    );
    return file_id;
  }

  async save_screenshot(game_id: string, data: Uint8Array, type: string) {
    if (data.length > this.MAX_SCREENSHOT_SIZE) {
      await this.os.notifications.push(
        game_id,
        "Failed to save screenshot",
        `Size limit of ${from_bytes(this.MAX_SCREENSHOT_SIZE)} exceeded`
      );
      return null;
    }

    const id = await this.store_file(game_id, data, type, "image");
    await this.os.notifications.push(game_id, `Screenshot saved`, "");
    return id;
  }

  async save_video(game_id: string, data: Uint8Array, type: string) {
    if (data.length > this.MAX_VIDEO_SIZE) {
      await this.os.notifications.push(
        game_id,
        "Failed to save recording",
        `Size limit of ${from_bytes(this.MAX_VIDEO_SIZE)} exceeded`
      );
      return null;
    }

    const id = await this.store_file(game_id, data, type, "video");
    await this.os.notifications.push(game_id, `Recording saved`, "");
    return id;
  }

  async list() {
    const files = await this.os.db.transaction(
      [Db.media_store],
      "readonly",
      async (t) => {
        const media = t.get_table1(Db.media_store);
        return media.get_all();
      }
    );
    return files;
  }

  async list_by_game(id: string) {
    const files = await this.os.db.transaction(
      [Db.media_store],
      "readonly",
      async (t) => {
        const media = t.get_index1(Db.idx_media_store_by_cart);
        return media.get_all(id);
      }
    );
    return files;
  }

  async read_metadata(id: string) {
    return await this.os.db.transaction(
      [Db.media_store],
      "readonly",
      async (t) => {
        const media = t.get_table1(Db.media_store);
        return media.get(id);
      }
    );
  }

  async read_file(id: string) {
    return await this.os.db.transaction(
      [Db.media_files],
      "readonly",
      async (t) => {
        const media = t.get_table1(Db.media_files);
        return media.get(id);
      }
    );
  }

  async delete(file_id: string) {
    await this.os.db.transaction(
      [Db.media_store, Db.media_files],
      "readwrite",
      async (t) => {
        const media = t.get_table1(Db.media_store);
        const files = t.get_table1(Db.media_files);

        await media.delete(file_id);
        await files.delete(file_id);
      }
    );
  }

  private async make_thumbnail(
    data: Uint8Array,
    type: string,
    kind: "image" | "video"
  ) {
    const blob = new Blob([data], { type: type });
    const url = URL.createObjectURL(blob);
    try {
      switch (kind) {
        case "image": {
          const img = await load_image(url);
          return {
            thumbnail: make_thumbnail(
              this.THUMBNAIL_WIDTH,
              this.THUMBNAIL_HEIGHT,
              img
            ),
            length: null,
          };
        }

        case "video": {
          const [img, length] = await load_first_frame(
            url,
            this.THUMBNAIL_WIDTH,
            this.THUMBNAIL_HEIGHT
          );
          return {
            thumbnail: img,
            length: length,
          };
        }

        default:
          throw unreachable(kind);
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

async function load_first_frame(url: string, width: number, height: number) {
  return new Promise<[string, number]>((resolve, reject) => {
    let state: "loading" | "screenshot" | "duration" = "loading";
    let img: string = "";
    let duration;

    const video = document.createElement("video");
    video.oncanplaythrough = () => {
      if (state === "loading") {
        state = "screenshot";
        video.currentTime = 0.001;
      }
    };
    video.ontimeupdate = () => {
      switch (state) {
        case "loading":
          break;

        case "screenshot": {
          img = make_thumbnail(width, height, video);
          state = "duration";
          video.currentTime = 60 * 60 * 24;
          break;
        }

        case "duration": {
          duration = video.currentTime;
          video.src = "";
          resolve([img, duration]);
          break;
        }

        default:
          throw unreachable(state);
      }
    };

    video.onerror = () => {
      video.src = "";
      reject(new Error(`Failed to create thumbnail for the video`));
    };

    video.src = url;
    video.load();
  });
}
