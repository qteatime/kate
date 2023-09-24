/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { RuntimeEnv } from "../../kernel";
import type { KateOS } from "../os";
import { EMessageFailed, type Handler } from "./handlers";
import { TC } from "../../utils";
import CaptureMessages from "./capture";
import CartFSMessages from "./cart_fs";
import NotificationMessages from "./notification";
import ObjectStorageMessages from "./object-storage";
import SpecialMessages from "./special";
import BrowserMessages from "./browser";
import DeviceFileMessages from "./device-file";
import CartManagerMessages from "./cart-manager";
import DialogMessages from "./dialog";

type Message = {
  type: string;
  payload: unknown;
};

export class KateIPCServer {
  private _handlers = new Map<string, RuntimeEnv>();
  private _messages: Map<string, Handler<any, any>>;
  private _initialised = false;
  private TRACE_MESSAGES = false;

  constructor(readonly os: KateOS) {
    this._messages = new Map();
    this.add_handlers(CaptureMessages);
    this.add_handlers(CartFSMessages);
    this.add_handlers(NotificationMessages);
    this.add_handlers(ObjectStorageMessages);
    this.add_handlers(SpecialMessages);
    this.add_handlers(BrowserMessages);
    this.add_handlers(DeviceFileMessages);
    this.add_handlers(CartManagerMessages);
    this.add_handlers(DialogMessages);
  }

  private add_handlers(handlers: Handler<any, any>[]) {
    for (const handler of handlers) {
      this._messages.set(handler.type, handler);
    }
  }

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
      if (this.TRACE_MESSAGES) {
        console.debug("kate-ipc <==", { type, id, payload });
      }
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
          if (this.TRACE_MESSAGES) {
            console.debug("kate-ipc ==>", { id, ok: true, value: result });
          }
          handler.frame.contentWindow?.postMessage(
            {
              type: "kate:reply",
              id: id,
              ok: true,
              value: result,
            },
            "*"
          );
        } catch (error) {
          console.error(`[Kate] Error handling ${type}`, {
            payload,
            error,
          });
          handler.frame.contentWindow?.postMessage(
            {
              type: "kate:reply",
              id: id,
              ok: false,
              value: {
                code: "kate.unknown-error",
                type: type,
                payload: payload,
              },
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
        handler.cart.id,
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
    const handler = this._messages.get(message.type);
    if (handler == null) {
      throw new Error(`No handler for ${message.type}`);
    }

    const payload = TC.parse(handler.parser, message.payload);
    for (const capability of handler.auth.capabilities) {
      if (
        !(await this.os.capability_supervisor.is_allowed(
          env.cart.id,
          capability.type,
          capability.configuration ?? {}
        ))
      ) {
        console.error(
          `[kate:ipc] Denied ${env.cart.id} access to ${message.type}: missing ${capability.type}`,
          message
        );
        if (handler.auth.fail_silently) {
          return null;
        } else {
          throw new EMessageFailed(
            "kate.ipc.access-denied",
            `Operation not allowed`
          );
        }
      }
    }
    return await handler.handler(this.os, env, this, payload, message);
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
