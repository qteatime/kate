import type { RuntimeEnv } from "../../kernel";
import type { KateOS } from "../os";
import { TC } from "../../utils";
import { CartridgeBucket } from "./object-store";
import { CartridgeQuota, OSEntry } from "../../data";

type CartFS_Message = {
  type: "kate:cart.read-file";
  payload: { path: string };
};

type ObjectStore_Message =
  | {
      type: "kate:store.list-buckets";
      payload: { versioned: boolean; count?: number };
    }
  | {
      type: "kate:store.add-bucket";
      payload: { versioned: boolean; name: string };
    }
  | {
      type: "kate:store.ensure-bucket";
      payload: { versioned: boolean; name: string };
    }
  | {
      type: "kate:store.delete-bucket";
      payload: { versioned: boolean; name: string };
    }
  | {
      type: "kate:store.count-entries";
      payload: { versioned: boolean; bucket: string };
    }
  | {
      type: "kate:store.list-entries";
      payload: { versioned: boolean; bucket: string; count?: number };
    }
  | {
      type: "kate:store.read";
      payload: { versioned: boolean; bucket: string; key: string };
    }
  | {
      type: "kate:store.try-read";
      payload: { versioned: boolean; bucket: string; key: string };
    }
  | {
      type: "kate:store.update";
      payload: {
        versioned: boolean;
        bucket: string;
        key: string;
        type: string;
        metadata: { [key: string]: unknown };
        data: unknown;
      };
    }
  | {
      type: "kate:store.create";
      payload: {
        versioned: boolean;
        bucket: string;
        key: string;
        type: string;
        metadata: { [key: string]: unknown };
        data: unknown;
      };
    }
  | {
      type: "kate:store.delete";
      payload: { versioned: boolean; bucket: string; key: string };
    }
  | { type: "kate:store.usage"; payload: { versioned: boolean } };

type Audio_Message =
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

type Special_Message = { type: "kate:special.focus" };

type Capture_Message =
  | {
      type: "kate:capture.save-image";
      payload: { data: Uint8Array; type: string; token: string };
    }
  | { type: "kate:capture.start-recording" }
  | {
      type: "kate:capture.save-recording";
      payload: { data: Uint8Array; type: string; token: string };
    };

type Notify_Message = {
  type: "kate:notify.transient";
  payload: { title: string; message: string };
};

type Message =
  | CartFS_Message
  | ObjectStore_Message
  | Audio_Message
  | Special_Message
  | Capture_Message
  | Notify_Message;

export class KateIPCServer {
  private _handlers = new Map<string, RuntimeEnv>();
  private _initialised = false;

  constructor(readonly os: KateOS) {}

  setup() {
    if (this._initialised) {
      throw new Error(`setup() called twice`);
    }

    this._initialised = true;
    window.addEventListener("message", this.handle_message);
  }

  add_process(env: RuntimeEnv) {
    if (this._handlers.has(env.secret)) {
      throw new Error(`Duplicated secret when constructing IPC channel`);
    }

    this._handlers.set(env.secret, env);
    return new KateIPCChannel(this, env);
  }

  remove_process(process: RuntimeEnv) {
    this._handlers.delete(process.secret);
  }

  send(process: RuntimeEnv, message: { [key: string]: any }) {
    process.frame.contentWindow?.postMessage(message, "*");
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
      console.debug("kate-ipc <==", { type, id, payload });
      const handler = this._handlers.get(secret);
      if (handler != null) {
        if (handler.frame.contentWindow !== ev.source) {
          const suspicious_handler = this.handler_for_window(ev.source);
          if (suspicious_handler != null) {
            this.mark_suspicious_activity(ev, suspicious_handler);
          }
          return;
        }
        try {
          const result = await this.process_message(handler, {
            type: type as any,
            payload,
          });
          if (result == null) {
            return;
          }
          const { ok, value } = result;
          console.debug("kate-ipc ==>", { id, ok, value });
          handler.frame.contentWindow?.postMessage(
            {
              type: "kate:reply",
              id: id,
              ok: ok,
              value: value,
            },
            "*"
          );
        } catch (error) {
          console.error(`[Kate] unknown error handling ${type}`, {
            payload,
            error,
          });
          handler.frame.contentWindow?.postMessage(
            {
              type: "kate:reply",
              id: id,
              ok: false,
              value: { code: "kate.unknown-error" },
            },
            "*"
          );
        }
      } else {
        const handler = this.handler_for_window(ev.source);
        if (handler != null) {
          this.mark_suspicious_activity(ev, handler);
        }
      }
    }
  };

  private async mark_suspicious_activity(
    ev: MessageEvent,
    handler: RuntimeEnv
  ) {
    if (handler != null) {
      console.debug(`[Kate] suspicious IPC activity`, {
        message: ev.data,
        source: ev.source,
        origin: ev.origin,
      });
      this._handlers.delete(handler.secret);
      await this.os.processes.terminate(
        handler.cart.metadata.id,
        "kate:ipc",
        "suspicious IPC activity"
      );
    }
  }

  private handler_for_window(window: unknown) {
    for (const [key, env] of this._handlers.entries()) {
      if (env.frame.contentWindow === window) {
        return env;
      }
    }
    return null;
  }

  async consume_capture_token(
    token: string,
    env: RuntimeEnv,
    message: Message
  ) {
    if (!env.capture_tokens.has(token)) {
      await this.mark_suspicious_activity(
        {
          data: message,
          source: env.frame.contentWindow,
        } as any,
        env
      );
      throw new Error(`Invalid capture token.`);
    }
    env.capture_tokens.delete(token);
  }

  async process_message(
    env: RuntimeEnv,
    message: Message
  ): Promise<{ ok: boolean; value: any } | null> {
    const err = (code: string) => ({ ok: false, value: { code } });
    const ok = (value: any) => ({ ok: true, value });

    switch (message.type) {
      // -- Special
      case "kate:special.focus": {
        window.focus();
        return null;
      }

      // -- Notification
      case "kate:notify.transient": {
        this.os.notifications.push_transient(
          env.cart.metadata.id,
          String(message.payload.title ?? ""),
          String(message.payload.message ?? "")
        );
        return null;
      }

      // -- Capture
      case "kate:capture.save-image": {
        await this.consume_capture_token(message.payload.token, env, message);

        try {
          this.os.sfx.play("shutter");
          await this.os.capture.save_screenshot(
            env.cart.metadata.id,
            message.payload.data,
            message.payload.type
          );
        } catch (error) {
          console.debug(`[Kate] failed to save screenshot`, error);
          this.os.notifications.push_transient(
            "kate:capture",
            "Failed to save screenshot",
            ""
          );
          return err(`kate.capture.failed`);
        }
        return null;
      }

      case "kate:capture.start-recording": {
        this.os.kernel.console.take_resource("screen-recording");
        await this.os.notifications.push(
          env.cart.metadata.id,
          "Screen recording started",
          ""
        );

        return null;
      }

      case "kate:capture.save-recording": {
        await this.consume_capture_token(message.payload.token, env, message);

        try {
          this.os.kernel.console.release_resource("screen-recording");
          await this.os.capture.save_video(
            env.cart.metadata.id,
            message.payload.data,
            message.payload.type
          );
        } catch (error) {
          console.debug(`[Kate] failed to save recording`, error);
          this.os.notifications.push_transient(
            "kate:capture",
            "Failed to save screen recording",
            ""
          );
          return err(`kate.capture.failed`);
        }
        return null;
      }

      // -- Cart FS
      case "kate:cart.read-file": {
        try {
          const file = await env.read_file(message.payload.path);
          return ok({ mime: file.mime, bytes: file.data });
        } catch (error) {
          console.error(
            `[Kate] failed to read file ${message.payload.path} from ${env.cart.metadata.id}`
          );
          return err("kate.cart-fs.file-not-found");
        }
      }

      // -- Object store
      case "kate:store.list-buckets": {
        const store = this.os.object_store.cartridge(
          env.cart,
          message.payload.versioned
        );
        const buckets = await store.list_buckets();
        return ok(buckets.map(public_repr.bucket));
      }

      case "kate:store.add-bucket": {
        const store = this.os.object_store.cartridge(
          env.cart,
          message.payload.versioned
        );
        await store.add_bucket(message.payload.name);
        return ok(null);
      }

      case "kate:store.ensure-bucket": {
        const store = this.os.object_store.cartridge(
          env.cart,
          message.payload.versioned
        );
        await store.ensure_bucket(message.payload.name);
        return ok(null);
      }

      case "kate:store.delete-bucket": {
        const store = this.os.object_store.cartridge(
          env.cart,
          message.payload.versioned
        );
        const bucket = await store.get_bucket(message.payload.name);
        await bucket.delete_bucket();
        return ok(null);
      }

      case "kate:store.count-entries": {
        const store = this.os.object_store.cartridge(
          env.cart,
          message.payload.versioned
        );
        const bucket = await store.get_bucket(message.payload.bucket);
        return ok(await bucket.count());
      }

      case "kate:store.list-entries": {
        const store = this.os.object_store.cartridge(
          env.cart,
          message.payload.versioned
        );
        const bucket = await store.get_bucket(message.payload.bucket);
        const entries = await bucket.list_metadata(message.payload.count);
        return ok(entries.map(public_repr.storage_entry));
      }

      case "kate:store.read": {
        const store = this.os.object_store.cartridge(
          env.cart,
          message.payload.versioned
        );
        const bucket = await store.get_bucket(message.payload.bucket);
        const entry = await bucket.read(message.payload.key);
        return ok(public_repr.storage_entry_with_data(entry));
      }

      case "kate:store.try-read": {
        const store = this.os.object_store.cartridge(
          env.cart,
          message.payload.versioned
        );
        const bucket = await store.get_bucket(message.payload.bucket);
        const entry = await bucket.try_read(message.payload.key);
        return entry == null
          ? ok(null)
          : ok(public_repr.storage_entry_with_data(entry));
      }

      case "kate:store.update": {
        const store = this.os.object_store.cartridge(
          env.cart,
          message.payload.versioned
        );
        const bucket = await store.get_bucket(message.payload.bucket);
        await bucket.update(message.payload.key, {
          type: message.payload.type,
          metadata: message.payload.metadata,
          data: message.payload.data,
        });
      }

      case "kate:store.create": {
        const store = this.os.object_store.cartridge(
          env.cart,
          message.payload.versioned
        );
        const bucket = await store.get_bucket(message.payload.bucket);
        await bucket.add(message.payload.key, {
          type: message.payload.type,
          metadata: message.payload.metadata,
          data: message.payload.data,
        });
      }

      case "kate:store.delete": {
        const store = this.os.object_store.cartridge(
          env.cart,
          message.payload.versioned
        );
        const bucket = await store.get_bucket(message.payload.bucket);
        await bucket.delete(message.payload.key);
      }

      case "kate:store.usage": {
        const store = this.os.object_store.cartridge(
          env.cart,
          message.payload.versioned
        );
        const usage = await store.usage();
        return ok(public_repr.storage_usage(usage));
      }

      // -- Audio
      case "kate:audio.create-channel": {
        try {
          const channel = await env.audio_server.create_channel(
            message.payload.max_tracks ?? 1
          );
          return ok({ id: channel.id, volume: channel.volume.gain.value });
        } catch (error) {
          return err(`kate:audio.cannot-create-channel`);
        }
      }

      case "kate:audio.stop-all-sources": {
        try {
          const channel = env.audio_server.get_channel(message.payload.id);
          await channel.stop_all_sources();
          return ok(null);
        } catch (_) {
          return err("kate:audio.cannot-stop-sources");
        }
      }

      case "kate:audio.change-volume": {
        try {
          const channel = env.audio_server.get_channel(message.payload.id);
          await channel.set_volume(message.payload.volume);
          return ok(null);
        } catch (_) {
          return err("kate:audio.cannot-change-volume");
        }
      }

      case "kate:audio.load": {
        try {
          const source = await env.audio_server.load_sound(
            message.payload.bytes
          );
          return ok(source.id);
        } catch (_) {
          return err("kate:audio.cannot-load");
        }
      }

      case "kate:audio.play": {
        try {
          const channel = env.audio_server.get_channel(message.payload.channel);
          const source = env.audio_server.get_source(message.payload.source);
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
  constructor(readonly server: KateIPCServer, readonly env: RuntimeEnv) {}

  send(message: { [key: string]: any }) {
    this.server.send(this.env, message);
  }

  dispose() {
    this.server.remove_process(this.env);
  }
}

export const public_repr = {
  bucket: (x: CartridgeBucket) => {
    return {
      name: x.bucket.bucket_name,
      created_at: x.bucket.created_at,
    };
  },

  storage_entry: (x: OSEntry) => {
    return {
      key: x.key,
      created_at: x.created_at,
      updated_at: x.updated_at,
      type: x.type,
      size: x.size,
      metadata: x.metadata,
    };
  },

  storage_entry_with_data: (x: OSEntry & { data: unknown }) => {
    return {
      key: x.key,
      created_at: x.created_at,
      updated_at: x.updated_at,
      type: x.type,
      size: x.size,
      metadata: x.metadata,
      data: x.data,
    };
  },

  storage_usage: (x: CartridgeQuota) => {
    return {
      limits: {
        size_in_bytes: x.maximum_size_in_bytes,
        buckets: x.maximum_buckets_in_storage,
        entries: x.maximum_items_in_storage,
      },
      usage: {
        size_in_bytes: x.current_size_in_bytes,
        buckets: x.current_buckets_in_storage,
        entries: x.current_items_in_storage,
      },
    };
  },
};
