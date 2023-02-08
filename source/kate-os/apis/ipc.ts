import * as Cart from "../../generated/cartridge";
import { KateOS } from "../os";

type Process = {
  secret: string;
  cart: Cart.Cartridge;
  window: () => Window | null;
}

type Message = 
  { type: "kate:cart.read-file", payload: { path: string }}
| { type: "kate:kv-store.read-all" }
| { type: "kate:kv-store.update-all", payload: { value: {[key: string]: string}}}
| { type: "kate:kv-store.get", payload: { key: string }}
| { type: "kate:kv-store.set", payload: { key: string, value: string }}

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

  add_process(secret: string, cart: Cart.Cartridge, window: () => Window | null) {
    if (this._handlers.has(secret)) {
      throw new Error(`Duplicated secret when constructing IPC channel`);
    }

    const process = { secret, cart, window };
    this._handlers.set(secret, process);
    return new KateIPCChannel(this, process);
  }

  remove_process(process: Process) {
    this._handlers.delete(process.secret);
  }

  send(process: Process, message: {[key: string]: any}) {
    process.window()?.postMessage(message, "*");
  }

  handle_message = async (ev: MessageEvent<any>) => {
    const secret = ev.data.secret;
    const type = ev.data.type;
    const id = ev.data.id;
    const payload = ev.data.payload;
    if (typeof secret === "string" && typeof type === "string" && typeof id === "string" && typeof payload === "object") {
      console.log("kate-ipc <==", { type, id, payload });
      const handler = this._handlers.get(secret);
      if (handler != null) {
        const { ok, value } = await this.process_message(handler, { type: type as any, payload });
        console.log("kate-ipc ==>", { id, ok, value })
        handler.window()?.postMessage({
          type: "kate:reply",
          id: id,
          ok: ok,
          value: value
        }, "*");
      }
    }
  }

  async process_message(process: Process, message: Message): Promise<{ ok: boolean, value: any }> {
    switch (message.type) {
      case "kate:cart.read-file": {
        const file = process.cart.files.find(x => x.path === message.payload.path);
        if (file != null) {
          return { ok: true, value: { mime: file.mime, bytes: file.data }};
        } else {
          return { ok: false, value: { code: "kate.cart-fs.file-not-found", path: message.payload.path }};
        }
      }

      case "kate:kv-store.read-all": {
        const storage = this.os.kv_storage.get_store(process.cart.id);
        return { ok: true, value: storage.contents() };
      }

      case "kate:kv-store.update-all": {
        const storage = this.os.kv_storage.get_store(process.cart.id);
        try {
          await storage.write(message.payload.value);
          return { ok: true, value: null };
        } catch (error) {
          return { ok: false, value: { code: "kate.kv-store.write-failed" }};
        }
      }

      case "kate:kv-store.get": {
        const storage = this.os.kv_storage.get_store(process.cart.id);
        const value = (await storage.contents())[message.payload.key] ?? null;
        return { ok: true, value };
      }

      case "kate:kv-store.set": {
        const storage = this.os.kv_storage.get_store(process.cart.id);
        try {
          await storage.set_pair(message.payload.key, message.payload.value);
          return { ok: true, value: null };
        } catch (_) {
          return { ok: false, value: { code: "kate:kv-store.write-failed", key: message.payload.key }};
        }
      }
      default:
        return { ok: false, value: { code: "kate:ipc.unknown-message" }};
    }
  }
}

export class KateIPCChannel {
  constructor(readonly server: KateIPCServer, readonly process: Process) {}

  send(message: {[key: string]: any}) {
    this.server.send(this.process, message);
  }

  dispose() {
    this.server.remove_process(this.process);
  }
}