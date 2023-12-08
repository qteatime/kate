/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EventStream, defer, Deferred } from "./util";
import type { InputKey } from "./input";

type Payload = { [key: string]: any };

type StateChangedEvent = { button: InputKey; is_pressed: boolean };
type KeyPressedEvent = {
  key: InputKey;
  is_repeat: boolean;
  is_long_press: boolean;
};

type PairingMessage = { type: "kate:pairing-ready" } | unknown;

type ProcessMessage =
  | { type: "kate:reply"; id: string; ok: boolean; value: unknown }
  | { type: "kate:input-state-changed"; payload: StateChangedEvent }
  | { type: "kate:input-key-pressed"; payload: KeyPressedEvent };

export class KateIPC {
  readonly #secret: string;
  readonly #pending: Map<string, Deferred<any>>;
  #paired: boolean;
  #initialised: boolean;
  #server: Window;
  #port: MessagePort | null = null;
  readonly events = {
    input_state_changed: new EventStream<StateChangedEvent>(),
    key_pressed: new EventStream<KeyPressedEvent>(),
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

  #do_send(id: string, type: string, payload: Payload, transfer: Transferable[] = []) {
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
    switch ((ev.data as any)?.type) {
      case "kate:pairing-ready":
        console.debug(`[kate:game] Kate is ready to pair the process`);
        this.#begin_pairing();
        break;

      default:
        console.warn(`[kate:game] Unhandled message type ${(ev.data as any)?.type}`, ev);
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

      default:
        console.warn(`[kate:game] Unhandled message type ${(ev.data as any)?.type}`, ev);

      // case "kate:paused": {
      //   this.events.paused.emit(ev.data.state);
      //   break;
      // }

      // case "kate:take-screenshot": {
      //   this.events.take_screenshot.emit({ token: ev.data.token });
      //   break;
      // }

      // case "kate:start-recording": {
      //   this.events.start_recording.emit({ token: ev.data.token });
      //   break;
      // }

      // case "kate:stop-recording": {
      //   this.events.stop_recording.emit();
      //   break;
      // }
    }
  };
}
