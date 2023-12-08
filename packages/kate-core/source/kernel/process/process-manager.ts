import { EventStream, defer } from "../../utils";
import * as Cart from "../../cart";
import type { VirtualConsole } from "../virtual";
import { RuntimeEnvConfig, spawn } from "./runtimes";
import { ButtonChangeEvent, ButtonPressedEvent } from "../input";

export enum PairingState {
  NEEDS_PAIRING,
  WAITING_PAIRING,
  PAIRED,
}

export type ProcessId = string & { __process_id: true };

export type SystemEvent =
  | { type: "pairing"; process: Process }
  | { type: "paired"; process: Process }
  | { type: "unexpected-message"; process: Process; message: unknown }
  | { type: "message-received"; process: Process; payload: unknown }
  | { type: "paused"; process: Process; state: boolean }
  | { type: "killed"; process: Process };

export type ProcessMessage =
  | { type: "kate:reply"; id: string; ok: boolean; value: unknown }
  | { type: "kate:input-state-changed"; payload: ButtonChangeEvent }
  | { type: "kate:input-key-pressed"; payload: ButtonPressedEvent }
  | { type: "kate:paused"; state: boolean }
  | { type: "kate:start-recording"; token: string }
  | { type: "kate:stop-recording" }
  | { type: "kate:take-screenshot"; token: string };

export interface IFileSystem {
  read(path: string): Promise<Cart.BasicFile>;
}

export class Process {
  private _port: MessagePort | null = null;
  private _state = PairingState.NEEDS_PAIRING;
  private _paused: boolean = false;
  on_system_event = new EventStream<SystemEvent>();

  constructor(
    readonly id: ProcessId,
    readonly secret: string,
    readonly frame: HTMLIFrameElement,
    readonly file_system: IFileSystem,
    readonly cartridge: Cart.CartMeta,
    readonly console: VirtualConsole
  ) {}

  // == Pairing
  get is_paired() {
    return this._state === PairingState.PAIRED;
  }

  async pair() {
    if (this._port !== null || this._state !== PairingState.NEEDS_PAIRING) {
      throw new Error(`[kate:process] pair() called on paired process ${this.id}`);
    }
    const result = defer<void>();
    this._state = PairingState.WAITING_PAIRING;
    this.on_system_event.emit({ type: "pairing", process: this });
    console.debug(`[kate:process] ${this.id} waiting for pairing`);

    const on_message = (ev: MessageEvent) => {
      if (
        ev.source !== this.frame.contentWindow ||
        this._port != null ||
        this._state !== PairingState.WAITING_PAIRING
      ) {
        return;
      }

      const type = ev.data.type as unknown;
      const secret = ev.data.secret as unknown;
      const port = ev.data.port as unknown;
      if (typeof type === "string" && typeof secret === "string" && port instanceof MessagePort) {
        if (type === "kate:pair" && secret === this.secret) {
          window.removeEventListener("message", on_message);
          this.do_pair(port);
          result.resolve();
        } else {
          this.on_system_event.emit({
            type: "unexpected-message",
            process: this,
            message: ev.data,
          });
        }
      }
    };

    window.addEventListener("message", on_message);
    this.frame.contentWindow?.postMessage({ type: "kate:pairing-ready" }, "*");
    return result.promise;
  }

  private do_pair(port: MessagePort) {
    console.debug(`[kate:process] paired ${this.id}`);
    const channel = new MessageChannel();
    this._port = channel.port1;
    this._state = PairingState.PAIRED;
    this._port.onmessage = this.handle_port_message;
    port.postMessage(
      {
        type: "kate:paired",
        port: channel.port2,
      },
      [channel.port2]
    );
    this.on_system_event.emit({ type: "paired", process: this });
  }

  // == Messaging
  send(message: ProcessMessage, transfer: Transferable[] = []) {
    if (this._port == null) {
      throw new Error(`[kate:process] send() called before process ${this.id} was paired`);
    } else {
      this._port.postMessage(message, transfer);
    }
  }

  // == Pauses
  get is_paused() {
    return this._paused;
  }

  pause() {
    if (this._paused) {
      return;
    }

    this._paused = true;
    this.send({ type: "kate:paused", state: true });
    this.on_system_event.emit({ type: "paused", process: this, state: true });
  }

  unpause() {
    if (!this._paused) {
      return;
    }

    this._paused = false;
    this.send({ type: "kate:paused", state: false });
    this.on_system_event.emit({ type: "paused", process: this, state: false });
  }

  // == Killing
  kill() {
    this.frame.src = "about:blank";
    this.frame.remove();
    this._port?.close();
    this.on_system_event.emit({ type: "killed", process: this });
  }

  // == Callbacks
  private handle_port_message = (ev: MessageEvent) => {
    this.on_system_event.emit({ type: "message-received", process: this, payload: ev.data });
  };
}

export class ProcessManager {
  private processes = new Map<ProcessId, Process>();
  readonly on_system_event = new EventStream<SystemEvent>();

  // == Spawning
  async spawn(env: RuntimeEnvConfig) {
    const process = await spawn(env);
    this.register(process);
    return process;
  }

  // == Process registration
  register(process: Process) {
    if (this.processes.has(process.id)) {
      throw new Error(`[kate:process] duplicate process registration ${process.id}`);
    }

    this.processes.set(process.id, process);
    process.on_system_event.listen(this.propagate_process_event);
  }

  unregister(id: ProcessId) {
    const existing = this.processes.get(id);
    if (existing == null) {
      throw new Error(`[kate:process] cannot unregister a non-existent process: ${id}`);
    }

    this.processes.delete(id);
    existing.on_system_event.remove(this.propagate_process_event);
  }

  // == Callbacks
  private propagate_process_event = (ev: SystemEvent) => {
    if (ev.type === "killed") {
      this.unregister(ev.process.id);
    }
    this.on_system_event.emit(ev);
  };
}
