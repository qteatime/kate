import { KateOS } from "../os";
import * as Db from "../../data";
import { make_id, unreachable, load_image, make_thumbnail } from "../../utils";

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

  constructor(readonly os: KateOS) {}

  async bucket(game_id: string) {
    const root = await navigator.storage.getDirectory();
    const media = await root.getDirectoryHandle("kate-media", { create: true });
    return media.getDirectoryHandle(game_id, { create: true });
  }

  private async store_file_inode(
    game_id: string,
    file: FileSystemFileHandle,
    type: string,
    thumbnail: string,
    length: number | null
  ) {
    const id = await this.os.db.transaction(
      [Db.media_store],
      "readwrite",
      async (t) => {
        const media = t.get_table1(Db.media_store);
        const id = await media.add({
          cart_id: game_id,
          file: file,
          mime: type,
          time: new Date(),
          thumbnail: thumbnail,
          video_length: length,
        });
        return id;
      }
    );
    return id;
  }

  private async store_file(game_id: string, data: Uint8Array, type: string) {
    const bucket = await this.bucket(game_id);
    const file_id = make_id();
    const file = await bucket.getFileHandle(file_id, { create: true });
    const writer = await file.createWritable();
    await writer.write(data);
    await writer.close();
    const { thumbnail, length } = await this.make_thumbnail(data, type);
    return await this.store_file_inode(game_id, file, type, thumbnail, length);
  }

  async save_screenshot(game_id: string, data: Uint8Array, type: string) {
    const id = await this.store_file(game_id, data, type);
    await this.os.notifications.push(game_id, `Screenshot saved`, "");
    return id;
  }

  async save_video(game_id: string, data: Uint8Array, type: string) {
    const id = await this.store_file(game_id, data, type);
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

  async read(id: number) {
    return await this.os.db.transaction(
      [Db.media_store],
      "readonly",
      async (t) => {
        const media = t.get_table1(Db.media_store);
        return media.get(id as any);
      }
    );
  }

  async delete(id: number) {
    const meta = await this.read(id);
    const bucket = await this.bucket(meta.cart_id);
    await bucket.removeEntry(meta.file.name);
    await this.os.db.transaction([Db.media_store], "readwrite", async (t) => {
      const media = t.get_table1(Db.media_store);
      await media.delete(id as any);
    });
  }

  private async make_thumbnail(data: Uint8Array, type: string) {
    const blob = new Blob([data], { type: type });
    const url = URL.createObjectURL(blob);
    try {
      switch (type) {
        case "image/png": {
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

        case "video/webm": {
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
          throw new Error(`Not supported: ${type}`);
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
