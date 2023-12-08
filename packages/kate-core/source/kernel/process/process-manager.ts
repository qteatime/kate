import { EventStream, defer } from "../../utils";
import * as Cart from "../../cart";
import type { VirtualConsole } from "../virtual";
import { RuntimeEnvConfig, spawn } from "./runtimes";

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
  | { type: "too-much-buffering"; process: Process; buffer_length: number }
  | { type: "message-received"; process: Process; payload: unknown }
  | { type: "paused"; process: Process; state: boolean }
  | { type: "killed"; process: Process };

export interface IFileSystem {
  read(path: string): Promise<Cart.BasicFile>;
}

export class Process {
  readonly BUFFER_LIMIT = 256;
  private port: MessagePort | null = null;
  private state = PairingState.NEEDS_PAIRING;
  private _message_buffer: { data: unknown; transfer: Transferable[] }[] = [];
  private _paused: boolean = false;
  readonly capture_tokens = new Set<string>();
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
  async pair() {
    if (this.port !== null || this.state !== PairingState.NEEDS_PAIRING) {
      throw new Error(`[kate:process] pair() called on paired process ${this.id}`);
    }
    const result = defer<void>();
    this.state = PairingState.WAITING_PAIRING;
    this.on_system_event.emit({ type: "pairing", process: this });
    console.debug(`[kate:process] ${this.id} waiting for pairing`);

    const on_message = (ev: MessageEvent) => {
      if (
        ev.source !== this.frame.contentWindow ||
        this.port != null ||
        this.state !== PairingState.WAITING_PAIRING
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
    this.port = channel.port1;
    this.state = PairingState.PAIRED;
    port.onmessage = this.handle_port_message;
    port.postMessage(
      {
        type: "kate:paired",
        port: channel.port2,
      },
      [channel.port2]
    );
    this.on_system_event.emit({ type: "paired", process: this });

    const buffer = this._message_buffer.slice();
    this._message_buffer = [];
    for (const message of buffer) {
      this.send(message.data, message.transfer);
    }
  }

  // == Messaging
  send(message: unknown, transfer: Transferable[] = []) {
    if (this.port == null) {
      this._message_buffer.push({ data: message, transfer });
      if (this._message_buffer.length > this.BUFFER_LIMIT) {
        this.on_system_event.emit({
          type: "too-much-buffering",
          process: this,
          buffer_length: this._message_buffer.length,
        });
      }
      return;
    } else {
      this.port.postMessage(message, transfer);
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
    this.port?.close();
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
    const process = await spawn(this, env);
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
    this.on_system_event.emit(ev);
  };
}
