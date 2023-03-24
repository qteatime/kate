import { KateOS } from "../os";
import * as Db from "../../data";
import { make_id } from "../../../../util/build";

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
  constructor(readonly os: KateOS) {}

  async bucket(game_id: string) {
    const root = await navigator.storage.getDirectory();
    const media = await root.getDirectoryHandle("kate-media", { create: true });
    return media.getDirectoryHandle(game_id, { create: true });
  }

  async save_screenshot(game_id: string, data: Uint8Array, type: string) {
    const bucket = await this.bucket(game_id);
    const file_id = make_id();
    const file = await bucket.getFileHandle(file_id, { create: true });
    const writer = await file.createWritable();
    await writer.write(data);
    await writer.close();
    const id = await this.os.db.transaction(
      [Db.media_store],
      "readwrite",
      async (t) => {
        const media = t.get_table(Db.media_store);
        const id = await media.write({
          cart_id: game_id,
          file: file,
          mime: type,
          time: new Date(),
        });
        return id as number;
      }
    );
    await this.os.notifications.push_transient(
      `kate:capture`,
      `Screenshot saved`,
      ""
    );
    return id;
  }

  async download(id: number) {
    const meta = await this.os.db.transaction(
      [Db.media_store],
      "readonly",
      async (t) => {
        const media = t.get_table(Db.media_store);
        return media.get(id as any);
      }
    );
    const file = await meta.file.getFile();
    const data = await file.arrayBuffer();

    const now = meta.time;
    const f = (x: number) => String(x).padStart(2, "0");
    const date = `${now.getFullYear()}-${f(now.getMonth() + 1)}-${f(
      now.getDate()
    )}_${f(now.getHours())}-${f(now.getMinutes())}-${f(now.getSeconds())}`;

    const handle = await window.showSaveFilePicker({
      suggestedName: `kate-screenshot-${date}.png`,
      types: [
        {
          description: "PNG Images",
          accept: { "image/png": [".png"] },
        },
      ],
    });
    const stream = await handle.createWritable();
    await stream.truncate(0);
    await stream.write(data);
    await stream.close();
  }

  async list() {
    const files = await this.os.db.transaction(
      [Db.media_store],
      "readonly",
      async (t) => {
        const media = t.get_table(Db.media_store);
        return media.get_all();
      }
    );
    return files;
  }
}
