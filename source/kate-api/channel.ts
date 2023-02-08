import { defer, Deferred } from "../util/promise";

type Payload = {[key: string]: any};

export class KateIPC {
  readonly #secret: string;
  readonly #pending: Map<string, Deferred<any>>;
  #initialised: boolean;
  #server: Window;

  constructor(secret: string, server: Window) {
    this.#secret = secret;
    this.#pending = new Map();
    this.#initialised = false;
    this.#server = server;
  }

  private make_id() {
    let id = new Uint8Array(16);
    crypto.getRandomValues(id);
    return Array.from(id).map(x => x.toString(16).padStart(2, "0")).join("");
  }

  setup() {
    if (this.#initialised) {
      throw new Error(`setup() called twice`);
    }
    this.#initialised = true;
    window.addEventListener("message", this.handle_message);
  }

  private do_send(id: string, type: string, payload: Payload) {
    this.#server.postMessage({
      type: type,
      secret: this.#secret,
      id: id,
      payload: payload
    }, "*");
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
    if (ev.data.type === "kate:reply") {
      const pending = this.#pending.get(ev.data.id);
      if (pending != null) {
        this.#pending.delete(ev.data.id);
        if (ev.data.ok) {
          pending.resolve(ev.data.value);
        } else {
          pending.reject(ev.data.value);
        }
      }
    }
  }
}