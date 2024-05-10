/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
 *
 * This file is part of the cartridge linking exception as described
 * in COPYING.
 */

import { EventStream, defer, Deferred } from "./util";
import type { InputKey } from "./input";

type Payload = { [key: string]: any };

type ButtonChangedEvent = { button: InputKey; is_pressed: boolean };
type ButtonPressedEvent = {
  key: InputKey;
  is_repeat: boolean;
  is_long_press: boolean;
};

type PairingMessage = { type: "kate:pairing-ready" } | unknown;

type ProcessMessage =
  | { type: "kate:reply"; id: string; ok: boolean; value: unknown }
  | { type: "kate:input-state-changed"; payload: ButtonChangedEvent }
  | { type: "kate:input-key-pressed"; payload: ButtonPressedEvent }
  | { type: "kate:paused"; state: boolean }
  | { type: "kate:start-recording"; token: string }
  | { type: "kate:stop-recording" }
  | { type: "kate:take-screenshot"; token: string };

const MAX_BUFFER = 1024;
const HEARTBEAT_DELAY = 1000 * 10; // 10 seconds

export class KateIPC {
  readonly #secret: string;
  readonly #pending: Map<string, Deferred<any>>;
  #paired: boolean;
  #initialised: boolean;
  #server: Window;
  #port: MessagePort | null = null;
  #pairing_waiter: Deferred<void>;
  #buffered: number = 0;
  readonly events = {
    input_state_changed: new EventStream<ButtonChangedEvent>(),
    key_pressed: new EventStream<ButtonPressedEvent>(),
    take_screenshot: new EventStream<{ token: string }>(),
    start_recording: new EventStream<{ token: string }>(),
    stop_recording: new EventStream<void>(),
    paused: new EventStream<boolean>(),
  };

  constructor(secret: string, server: Window) {
    this.#secret = secret;
    this.#pending = new Map();
    this.#initialised = false;
    this.#server = server;
    this.#paired = false;
    this.#pairing_waiter = defer();
  }

  #make_id() {
    let id = new Uint8Array(16);
    crypto.getRandomValues(id);
    return Array.from(id)
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
  }

  setup() {
    if (this.#initialised) {
      throw new Error(`setup() called twice`);
    }
    this.#initialised = true;
    this.#begin_pairing();
    window.addEventListener("message", this.handle_pairing_message);
    this.#heartbeat();
  }

  #heartbeat() {
    if (this.#paired) {
      this.send_and_ignore_result("heartbeat", {}, []);
    }
    setTimeout(() => this.#heartbeat(), HEARTBEAT_DELAY);
  }

  #begin_pairing() {
    if (this.#paired) {
      return;
    }

    console.debug(`[kate:game] Starting pairing attempt`);
    const channel = new MessageChannel();
    channel.port1.onmessage = (ev) => {
      if (this.#paired) {
        return;
      }

      if (ev.data?.type === "kate:paired" && ev.data?.port instanceof MessagePort) {
        console.debug(`[kate:game] Paired`);
        this.#paired = true;
        this.#port = ev.data.port;
        this.#port!.onmessage = this.handle_message;
        this.#pairing_waiter.resolve();
      }
    };

    this.#server.postMessage(
      {
        type: "kate:pair",
        secret: this.#secret,
        port: channel.port2,
      },
      "*",
      [channel.port2]
    );
  }

  async #do_send(id: string, type: string, payload: Payload, transfer: Transferable[] = []) {
    this.#buffered += 1;
    if (this.#buffered > MAX_BUFFER) {
      throw new Error(`Too many messages buffered`);
    }
    await this.#pairing_waiter.promise;
    this.#buffered -= 1;
    this.#port!.postMessage(
      {
        type: type,
        secret: this.#secret,
        id: id,
        payload: payload,
      },
      transfer
    );
  }

  async call<A>(type: string, payload: Payload, transfer: Transferable[] = []) {
    const deferred = defer<A>();
    const id = this.#make_id();
    this.#pending.set(id, deferred);
    this.#do_send(id, type, payload, transfer);
    return deferred.promise;
  }

  async send_and_ignore_result(type: string, payload: Payload, transfer: Transferable[] = []) {
    this.#do_send(this.#make_id(), type, payload, transfer);
  }

  private handle_pairing_message = (ev: MessageEvent<PairingMessage>) => {
    if (ev.data == null || typeof ev.data !== "object") {
      return;
    }
    const data = ev.data as { type: string };

    switch (data.type) {
      case "kate:pairing-ready":
        console.debug(`[kate:game] Kate is ready to pair the process`);
        this.#begin_pairing();
        break;

      default:
        console.warn(`[kate:game] Unhandled top-level message type ${data.type}`, ev);
    }
  };

  private handle_message = (ev: MessageEvent<ProcessMessage>) => {
    switch (ev.data.type) {
      case "kate:reply": {
        const pending = this.#pending.get(ev.data.id);
        if (pending != null) {
          this.#pending.delete(ev.data.id);
          if (ev.data.ok) {
            pending.resolve(ev.data.value);
          } else {
            pending.reject(ev.data.value);
          }
        }
        break;
      }

      case "kate:input-state-changed": {
        this.events.input_state_changed.emit(ev.data.payload);
        break;
      }

      case "kate:input-key-pressed": {
        this.events.key_pressed.emit(ev.data.payload);
        break;
      }

      case "kate:paused": {
        this.events.paused.emit(ev.data.state);
        break;
      }

      case "kate:take-screenshot": {
        this.events.take_screenshot.emit({ token: ev.data.token });
        break;
      }

      case "kate:start-recording": {
        this.events.start_recording.emit({ token: ev.data.token });
        break;
      }

      case "kate:stop-recording": {
        this.events.stop_recording.emit();
        break;
      }

      default:
        console.warn(`[kate:game] Unhandled message type ${(ev.data as any)?.type}`, ev);
    }
  };
}
