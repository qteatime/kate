/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateOS } from "../os";
import { EMessageFailed, WithTransfer, type Handler } from "./handlers";
import { TC, make_id } from "../../utils";
import CaptureMessages from "./capture";
import CartFSMessages from "./cart_fs";
import NotificationMessages from "./notification";
import ObjectStorageMessages from "./object-storage";
import SpecialMessages from "./special";
import BrowserMessages from "./browser";
import DeviceFileMessages from "./device-file";
import CartManagerMessages from "./cart-manager";
import DialogMessages from "./dialog";
import { Process, SystemEvent } from "../../kernel";

type Message = {
  type: string;
  id: string;
  payload: unknown;
};

export class KateIPCServer {
  private _handlers = new WeakMap<Process, (_: SystemEvent) => void>();
  private _capture_tokens = new WeakMap<Process, Set<string>>();
  private _messages: Map<string, Handler<any, any>>;

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

  add_process(process: Process) {
    if (this._handlers.has(process)) {
      throw new Error(`Duplicated secret when constructing IPC channel`);
    }

    const handler = (ev: SystemEvent) => {
      this.handle_message(process, ev);
    };
    this._handlers.set(process, handler);
    process.on_system_event.listen(handler);
    console.debug(`[kate:ipc] Registered handlers for ${process.id}`);
  }

  remove_process(process: Process) {
    const handler = this._handlers.get(process);
    if (handler != null) {
      process.on_system_event.remove(handler);
      console.debug(`[kate:ipc] De-registered handlers for ${process.id}`);
    }
  }

  initiate_capture(process: Process) {
    const token = make_id();
    if (!this._capture_tokens.has(process)) {
      this._capture_tokens.set(process, new Set());
    }
    const tokens = this._capture_tokens.get(process)!;
    tokens.add(token);
    return token;
  }

  handle_message = async (process: Process, ev: SystemEvent) => {
    if (this.os.TRACE_ENABLED) {
      console.debug(`[kate:ipc] <=== ${process.id}`, ev);
    }

    switch (ev.type) {
      case "killed": {
        this.remove_process(process);
        break;
      }

      case "message-received": {
        if (ev.payload == null || typeof ev.payload !== "object") {
          console.warn(`[kate:ipc] malformed IPC message from ${process.id}`, ev);
          return;
        }
        const payload = ev.payload as Message;
        if (typeof payload.id !== "string" || typeof payload.type !== "string") {
          console.warn(`[kate:ipc] malformed IPC message from ${process.id}`, ev);
          return;
        }

        try {
          const result = await this.process_message(process, payload);
          if (this.os.TRACE_ENABLED) {
            console.debug(`[kate:ipc] ===> ${process.id}`, {
              id: payload.id,
              ok: true,
              value: result,
            });
          }
          const [value, transfer] = this.unpack_transfers(result);
          process.send(
            {
              type: "kate:reply",
              id: payload.id,
              ok: true,
              value: value,
            },
            transfer
          );
        } catch (error: unknown) {
          console.error(
            `[kate:ipc] Error handling ${payload.type} from ${process.id}`,
            payload,
            error
          );
          process.send({
            type: "kate:reply",
            id: payload.id,
            ok: false,
            value: {
              code: "kate.unknown-error",
              type: payload.type,
              payload: payload.payload,
            },
          });
        }
      }
    }
  };

  private unpack_transfers(x: unknown): [unknown, Transferable[]] {
    if (x instanceof WithTransfer) {
      return [x.value, x.transfer];
    } else {
      return [x, []];
    }
  }

  private async mark_suspicious_activity(ev: Message, process: Process) {
    console.debug(`[Kate] suspicious IPC activity from ${process.id}`, ev);
    this.remove_process(process);
    await this.os.processes.terminate(process.cartridge.id, "kate:ipc", "suspicious IPC activity");
  }

  async consume_capture_token(token: string, process: Process, message: Message) {
    const tokens = this._capture_tokens.get(process);
    if (tokens == null || !tokens.has(token)) {
      await this.mark_suspicious_activity(message, process);
      throw new Error(`Invalid capture token.`);
    }
    tokens.delete(token);
  }

  async process_message(
    process: Process,
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
          process.cartridge.id,
          capability.type,
          capability.configuration ?? {}
        ))
      ) {
        console.error(
          `[kate:ipc] Denied ${process.cartridge.id} access to ${message.type}: missing ${capability.type}`,
          message
        );
        if (handler.auth.fail_silently) {
          return null;
        } else {
          throw new EMessageFailed("kate.ipc.access-denied", `Operation not allowed`);
        }
      }
    }
    return await handler.handler(this.os, process, this, payload, message);
  }
}
