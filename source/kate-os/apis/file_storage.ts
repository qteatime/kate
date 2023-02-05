import * as Cart from "../../generated/cartridge";
import type { KateOS } from "../os";

type WritableData =  ArrayBuffer | Uint8Array | DataView | Blob | string;

declare global {
  interface FileSystemDirectoryHandle {
    values(): AsyncIterable<FileSystemHandle>;
    keys(): AsyncIterable<string>;
    entries(): AsyncIterable<[string, FileSystemHandle]>;
  }

  interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemWritableFileStream {
    write(data: WritableData): Promise<void>;
    write(options: {
      type: "write",
      data: WritableData,
      position?: number,
      size?: number
    } | {
      type: "truncate",
      position?: number,
      size: number
    }): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
  }
}
  

export class KateStorage {
  constructor(readonly os: KateOS) {}

  private get backend() {
    return navigator.storage;
  }

  async usage() {
    const estimate = await this.backend.estimate();
    return {
      total: estimate.quota ?? 0,
      used: estimate.usage ?? 0
    }
  }

  private async get_real_bucket(name: string) {
    const root = await this.backend.getDirectory();
    const dir = await root.getDirectoryHandle(name, {create: true});
    return new StorageBucket(this, dir);
  }

  async get_bucket(name: string) {
    return this.get_real_bucket(`user.${name}`);
  }

  async get_carts() {
    return this.get_real_bucket("kate.carts");
  }

  async get_cart_bucket(cart: Cart.Cartridge) {
    return this.get_real_bucket(`cart.${cart.id}`);
  }

  async install_cart(cart: Cart.Cartridge) {
    const encoder = new Cart._Encoder();
    cart.encode(encoder);
    const bytes = encoder.to_bytes();
    const bucket = await this.get_carts();
    const file = await bucket.file_at(cart.id, true);
    await file.write(bytes.buffer);
    this.os.events.on_cart_inserted.emit(cart);
  }
}

export class StorageBucket {
  constructor(readonly storage: KateStorage, readonly handle: FileSystemDirectoryHandle) {}

  async list() {
    const result = [];
    for await (const file of this.handle.values()) {
      if (file.kind === "file" && !file.name.endsWith(".crswap")) {
        result.push(file);
      }
    }
    return result;
  }

  async file_at(name: string, create: boolean) {
    return new StorageFile(this, await this.handle.getFileHandle(name, { create }));
  }
}

export class StorageFile {
  constructor(readonly bucket: StorageBucket, readonly handle: FileSystemFileHandle) {}

  async read() {
    return await this.handle.getFile();
  }

  async write(data: WritableData) {
    const stream = await this.handle.createWritable();
    stream.write(data);
  }

  async get_write_stream() {
    return await this.handle.createWritable();
  }
}