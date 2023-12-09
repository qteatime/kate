/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EventStream, defer, sleep } from "../../utils";
import * as Cart from "../../cart";
import type { VirtualConsole } from "../virtual";
import { RuntimeEnvConfig, spawn } from "./runtimes";
import { ButtonChangeEvent, ButtonPressedEvent } from "../input";

const trace_messages = new URL(document.URL).searchParams.get("trace") === "true";

export enum ProcessState {
  NEEDS_PAIRING,
  WAITING_PAIRING,
  PAIRED,
  KILLED,
}

export type ProcessId = string & { __process_id: true };

export type SystemEvent =
  | { type: "pairing"; process: Process }
  | { type: "paired"; process: Process }
  | { type: "unexpected-message"; process: Process; message: unknown }
  | { type: "message-received"; process: Process; payload: unknown }
  | { type: "paused"; process: Process; state: boolean }
  | { type: "killed"; process: Process }
  | { type: "heartbeat"; process: Process };

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
  private _started: number;
  private _port: MessagePort | null = null;
  private _state = ProcessState.NEEDS_PAIRING;
  private _paused: boolean = false;
  readonly MAX_PAIRING_WAIT = 1000; // 1 second
  on_system_event = new EventStream<SystemEvent>();

  constructor(
    readonly id: ProcessId,
    readonly secret: string,
    readonly frame: HTMLIFrameElement,
    readonly file_system: IFileSystem,
    readonly cartridge: Cart.CartMeta,
    readonly console: VirtualConsole
  ) {
    this._started = performance.now();
  }

  get runtime() {
    return performance.now() - this._started;
  }

  // == Pairing
  get is_paired() {
    return this._state === ProcessState.PAIRED;
  }

  async pair() {
    if (this._port !== null || this._state !== ProcessState.NEEDS_PAIRING) {
      throw new Error(`[kate:process] pair() called on paired process ${this.id}`);
    }
    const result = defer<void>();
    sleep(this.MAX_PAIRING_WAIT).then(() =>
      result.reject(new Error(`[kate] Process ${this.id} took too long to pair`))
    );

    this._state = ProcessState.WAITING_PAIRING;
    this.on_system_event.emit({ type: "pairing", process: this });
    console.debug(`[kate:process] ${this.id} waiting for pairing`);

    const on_message = (ev: MessageEvent) => {
      if (
        ev.source !== this.frame.contentWindow ||
        this._port != null ||
        this._state !== ProcessState.WAITING_PAIRING
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
          console.warn(`[kate:process] Got unexpected message from ${this.id} frame`);
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
    this._state = ProcessState.PAIRED;
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
      if (trace_messages) {
        console.debug(`[kate:process:ipc] ${this.id} => frame:`, message);
      }
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
    console.debug(`[kate:process] Paused ${this.id}`);
  }

  unpause() {
    if (!this._paused) {
      return;
    }

    this._paused = false;
    this.send({ type: "kate:paused", state: false });
    this.on_system_event.emit({ type: "paused", process: this, state: false });
    console.debug(`[kate:process] Unpaused ${this.id}`);
  }

  // == Killing
  get is_killed() {
    return this._state === ProcessState.KILLED;
  }

  kill() {
    this._state = ProcessState.KILLED;
    this.frame.src = "about:blank";
    this.frame.remove();
    this._port?.close();
    this.on_system_event.emit({ type: "killed", process: this });
    console.debug(`[kate:process] Killed process ${this.id}`);
  }

  // == Callbacks
  private handle_port_message = (ev: MessageEvent) => {
    if (ev.data?.type === "heartbeat") {
      this.on_system_event.emit({ type: "heartbeat", process: this });
    } else {
      this.on_system_event.emit({ type: "message-received", process: this, payload: ev.data });
    }
  };
}

export class ProcessManager {
  private processes = new Map<ProcessId, Process>();
  readonly on_system_event = new EventStream<SystemEvent>();

  // == Spawning
  async spawn(env: RuntimeEnvConfig) {
    const process = await spawn(env, trace_messages);
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
    console.debug(`[kate:process] Registered process ${process.id}`);
  }

  unregister(id: ProcessId) {
    const existing = this.processes.get(id);
    if (existing == null) {
      throw new Error(`[kate:process] cannot unregister a non-existent process: ${id}`);
    }

    this.processes.delete(id);
    existing.on_system_event.remove(this.propagate_process_event);
    console.debug(`[kate:process] De-registered process ${id}`);
  }

  // == Callbacks
  private propagate_process_event = (ev: SystemEvent) => {
    if (ev.type === "killed") {
      this.unregister(ev.process.id);
    }
    this.on_system_event.emit(ev);
  };
}
