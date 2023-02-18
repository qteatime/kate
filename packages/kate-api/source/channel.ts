import { EventStream } from "../../util/build/events";
import { defer, Deferred } from "../../util/build/promise";
import type { InputKey } from "./input";

type Payload = { [key: string]: any };

export class KateIPC {
  readonly #secret: string;
  readonly #pending: Map<string, Deferred<any>>;
  #initialised: boolean;
  #server: Window;
  readonly events = {
    input_state_changed: new EventStream<{ key: InputKey; is_down: boolean }>(),
    key_pressed: new EventStream<InputKey>(),
    paused: new EventStream<boolean>(),
  };

  constructor(secret: string, server: Window) {
    this.#secret = secret;
    this.#pending = new Map();
    this.#initialised = false;
    this.#server = server;
  }

  private make_id() {
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
    window.addEventListener("message", this.handle_message);
  }

  private do_send(id: string, type: string, payload: Payload) {
    this.#server.postMessage(
      {
        type: type,
        secret: this.#secret,
        id: id,
        payload: payload,
      },
      "*"
    );
  }

  async call<A>(type: string, payload: Payload) {
    const deferred = defer<A>();
    const id = this.make_id();
    this.#pending.set(id, deferred);
    this.do_send(id, type, payload);
    return deferred.promise;
  }

  async send_and_ignore_result(type: string, payload: Payload) {
    this.do_send(this.make_id(), type, payload);
  }

  private handle_message = (ev: MessageEvent<any>) => {
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
        this.events.input_state_changed.emit({
          key: ev.data.key,
          is_down: ev.data.is_down,
        });
        break;
      }

      case "kate:input-key-pressed": {
        this.events.key_pressed.emit(ev.data.key);
        break;
      }

      case "kate:paused": {
        this.events.paused.emit(ev.data.state);
        break;
      }
    }
  };
}
