import { EventStream, defer } from "../../utils";
import * as Cart from "../../cart";
import type { VirtualConsole } from "../virtual";

export enum PairingState {
  UNPAIRED,
  WAITING,
  PAIRED,
}

export type SystemEvent =
  | { type: "pairing"; process: Process }
  | { type: "paired"; process: Process }
  | { type: "unexpected-message"; process: Process; message: unknown }
  | { type: "too-much-buffering"; process: Process; buffer_length: number }
  | { type: "message-received"; process: Process; payload: unknown };

export interface IFileSystem {
  read(path: string): Promise<Cart.BasicFile>;
}

export class Process {
  readonly BUFFER_LIMIT = 256;
  private port: MessagePort | null = null;
  private state = PairingState.UNPAIRED;
  private _message_buffer: { data: unknown; transfer: Transferable[] }[] = [];
  on_system_event = new EventStream<SystemEvent>();

  constructor(
    readonly id: string,
    readonly secret: string,
    readonly frame: HTMLIFrameElement,
    readonly file_system: IFileSystem,
    readonly cartridge: Cart.CartMeta,
    readonly console: VirtualConsole
  ) {}

  async pair() {
    if (this.port !== null || this.state !== PairingState.UNPAIRED) {
      throw new Error(`[kate:process] pair() called on paired process ${this.id}`);
    }
    const result = defer<void>();
    this.state = PairingState.WAITING;
    this.on_system_event.emit({ type: "pairing", process: this });
    console.debug(`[kate:process] ${this.id} waiting for pairing`);

    const on_message = (ev: MessageEvent) => {
      if (
        ev.source !== this.frame.contentWindow ||
        this.port != null ||
        this.state !== PairingState.WAITING
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

  send(message: unknown, transfer: Transferable[]) {
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

  private handle_port_message = (ev: MessageEvent) => {
    this.on_system_event.emit({ type: "message-received", process: this, payload: ev.data });
  };
}

export class ProcessManager {
  private processes: Process[] = [];
}
