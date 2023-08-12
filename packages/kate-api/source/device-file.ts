import type { KateIPC } from "./channel";
import { Pathname } from "./util";

type HandleId = string & { __handle_id: true };

export class KateDeviceFileAccess {
  #channel: KateIPC;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  async request_file(options: {
    multiple?: boolean;
    strict?: boolean;
    types: { type: string; extensions: string[] }[];
  }) {
    const handles = (await this.#channel.call(
      "kate:device-fs.request-file",
      options
    )) as HandleId[];
    return handles.map((x) => {
      return new DeviceFileHandle(this.#channel, x);
    });
  }

  async request_directory() {
    const handles = (await this.#channel.call(
      "kate:device-fs.request-directory",
      {}
    )) as HandleId[];
    return handles.map((x) => new DeviceFileHandle(this.#channel, x));
  }
}

export class DeviceFileHandle {
  #channel: KateIPC;

  constructor(channel: KateIPC, private _id: string) {
    this.#channel = channel;
  }

  async relative_path(): Promise<Pathname> {
    return Pathname.from_string(
      await this.#channel.call("kate:device-fs.relative-path", { id: this._id })
    );
  }

  async read(): Promise<Uint8Array> {
    return await this.#channel.call("kate:device-fs.read-file", {
      id: this._id,
    });
  }
}
