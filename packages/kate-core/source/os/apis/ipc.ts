import * as Cart from "../../../../schema/generated/cartridge";
import type { KateOS } from "../os";
import type { KateAudioServer } from "./audio";

type Process = {
  secret: string;
  cart: Cart.Cartridge;
  window: () => Window | null;
  audio: KateAudioServer;
};

type Message =
  | { type: "kate:cart.read-file"; payload: { path: string } }
  | { type: "kate:kv-store.read-all" }
  | {
      type: "kate:kv-store.update-all";
      payload: { value: { [key: string]: string } };
    }
  | { type: "kate:kv-store.get"; payload: { key: string } }
  | { type: "kate:kv-store.set"; payload: { key: string; value: string } }
  | { type: "kate:audio.create-channel"; payload: { max_tracks?: number } }
  | { type: "kate:audio.resume-channel"; payload: { id: string } }
  | { type: "kate:audio.pause-channel"; payload: { id: string } }
  | { type: "kate:audio.stop-all-sources"; payload: { id: string } }
  | {
      type: "kate:audio.change-volume";
      payload: { id: string; volume: number };
    }
  | { type: "kate:audio.load"; payload: { mime: string; bytes: Uint8Array } }
  | {
      type: "kate:audio.play";
      payload: { channel: string; source: string; loop: boolean };
    };

export class KateIPCServer {
  private _handlers = new Map<string, Process>();
  private _initialised = false;

  constructor(readonly os: KateOS) {}

  setup() {
    if (this._initialised) {
      throw new Error(`setup() called twice`);
    }

    this._initialised = true;
    window.addEventListener("message", this.handle_message);
  }

  add_process(
    secret: string,
    cart: Cart.Cartridge,
    window: () => Window | null,
    audio: KateAudioServer
  ) {
    if (this._handlers.has(secret)) {
      throw new Error(`Duplicated secret when constructing IPC channel`);
    }

    const process = { secret, cart, window, audio };
    this._handlers.set(secret, process);
    return new KateIPCChannel(this, process);
  }

  remove_process(process: Process) {
    this._handlers.delete(process.secret);
  }

  send(process: Process, message: { [key: string]: any }) {
    process.window()?.postMessage(message, "*");
  }

  handle_message = async (ev: MessageEvent<any>) => {
    const secret = ev.data.secret;
    const type = ev.data.type;
    const id = ev.data.id;
    const payload = ev.data.payload;
    if (
      typeof secret === "string" &&
      typeof type === "string" &&
      typeof id === "string" &&
      typeof payload === "object"
    ) {
      console.log("kate-ipc <==", { type, id, payload });
      const handler = this._handlers.get(secret);
      if (handler != null) {
        const { ok, value } = await this.process_message(handler, {
          type: type as any,
          payload,
        });
        console.log("kate-ipc ==>", { id, ok, value });
        handler.window()?.postMessage(
          {
            type: "kate:reply",
            id: id,
            ok: ok,
            value: value,
          },
          "*"
        );
      }
    }
  };

  async process_message(
    process: Process,
    message: Message
  ): Promise<{ ok: boolean; value: any }> {
    const err = (code: string) => ({ ok: false, value: { code } });
    const ok = (value: any) => ({ ok: true, value });

    switch (message.type) {
      // -- Cart FS
      case "kate:cart.read-file": {
        const file = process.cart.files.find(
          (x) => x.path === message.payload.path
        );
        if (file != null) {
          return ok({ mime: file.mime, bytes: file.data });
        } else {
          return err("kate.cart-fs.file-not-found");
        }
      }

      // -- KV store
      case "kate:kv-store.read-all": {
        const storage = this.os.kv_storage.get_store(process.cart.id);
        return ok(storage.contents());
      }

      case "kate:kv-store.update-all": {
        const storage = this.os.kv_storage.get_store(process.cart.id);
        try {
          await storage.write(message.payload.value);
          return ok(null);
        } catch (_) {
          return err("kate.kv-store.write-failed");
        }
      }

      case "kate:kv-store.get": {
        const storage = this.os.kv_storage.get_store(process.cart.id);
        const value = (await storage.contents())[message.payload.key] ?? null;
        return ok(value);
      }

      case "kate:kv-store.set": {
        const storage = this.os.kv_storage.get_store(process.cart.id);
        try {
          await storage.set_pair(message.payload.key, message.payload.value);
          return ok(null);
        } catch (_) {
          return err("kate:kv-store.write-failed");
        }
      }

      // -- Audio
      case "kate:audio.create-channel": {
        const channel = await process.audio.create_channel(
          message.payload.max_tracks ?? 1
        );
        await channel.resume();
        return ok({ id: channel.id, volume: channel.volume.gain.value });
      }

      case "kate:audio.resume-channel": {
        try {
          const channel = process.audio.get_channel(message.payload.id);
          await channel.resume();
          return ok(null);
        } catch (_) {
          return err("kate:audio.cannot-resume");
        }
      }

      case "kate:audio.pause-channel": {
        try {
          const channel = process.audio.get_channel(message.payload.id);
          await channel.suspend();
          return ok(null);
        } catch (_) {
          return err("kate:audio.cannot-pause");
        }
      }

      case "kate:audio.stop-all-sources": {
        try {
          const channel = process.audio.get_channel(message.payload.id);
          await channel.stop_all_sources();
          return ok(null);
        } catch (_) {
          return err("kate:audio.cannot-stop-sources");
        }
      }

      case "kate:audio.change-volume": {
        try {
          const channel = process.audio.get_channel(message.payload.id);
          await channel.set_volume(message.payload.volume);
          return ok(null);
        } catch (_) {
          return err("kate:audio.cannot-change-volume");
        }
      }

      case "kate:audio.load": {
        try {
          const source = await process.audio.load_sound(message.payload.bytes);
          return ok(source.id);
        } catch (_) {
          return err("kate:audio.cannot-load");
        }
      }

      case "kate:audio.play": {
        try {
          const channel = process.audio.get_channel(message.payload.channel);
          const source = process.audio.get_source(message.payload.source);
          await channel.play(source, message.payload.loop);
          return ok(null);
        } catch (_) {
          return err("kate:audio.cannot-play");
        }
      }

      default:
        return { ok: false, value: { code: "kate:ipc.unknown-message" } };
    }
  }
}

export class KateIPCChannel {
  constructor(readonly server: KateIPCServer, readonly process: Process) {}

  send(message: { [key: string]: any }) {
    this.server.send(this.process, message);
  }

  dispose() {
    this.server.remove_process(this.process);
  }
}
