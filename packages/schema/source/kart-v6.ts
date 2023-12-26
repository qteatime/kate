/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as LJT from "../../ljt-vm/build";
const source = require("./generated/kart-v6.json");
import * as Cart from "./generated/kart-v6";
import { concat_all } from "./util";
export * from "./generated/kart-v6";

const schema = LJT.parse(source);

export type File = { index: number; data: Uint8Array };

function size_of(id: number) {
  const size = schema.max_size_of(id);
  if (size == null) {
    throw new Error(`Cannot compute a size for variable sized entity ${id}`);
  }
  return size;
}

// == Decoding from blob
export async function decode_blob_header(blob: Blob): Promise<Cart.Header> {
  const magic_size = schema.magic.byteLength + 4;
  const magic_buffer = await blob.slice(0, magic_size).arrayBuffer();
  const magic_decoder = LJT.SchemaDecoder.from_bytes(new Uint8Array(magic_buffer), schema);
  magic_decoder.assert_magic();

  const header_size = size_of(Cart.Header.tag);
  const buffer = await blob.slice(blob.size - header_size).arrayBuffer();
  const header = decode_header_record(new Uint8Array(buffer));
  assert_safe_header(header);
  return header;
}

export async function decode_blob_metadata(
  blob: Blob,
  header: Cart.Header
): Promise<Cart.Metadata> {
  const loc = header["metadata-location"];
  const buffer = await blob.slice(Number(loc.offset), Number(loc.offset + loc.size)).arrayBuffer();
  return decode_metadata_record(new Uint8Array(buffer));
}

export async function* decode_blob_files(
  blob: Blob,
  header: Cart.Header,
  nodes: { path: string; mime: string; size: number }[]
): AsyncGenerator<File, void, void> {
  const loc = header["content-location"];
  const files = blob.slice(Number(loc.offset), Number(loc.offset + loc.size));
  const decoder = new BlobDecoder(0, files);
  const count = await decoder.uint32();
  if (count !== nodes.length) {
    throw new Error(`Invalid file section size ${count} (expected ${nodes.length})`);
  }

  for (let i = 0; i < count; ++i) {
    const size = await decoder.uint32();
    const data = await decoder.bytes(size);
    yield { index: i, data: data };
  }
}

// == Record decoding
export function decode_header_record(bytes: Uint8Array): Cart.Header {
  const decoder = LJT.SchemaDecoder.from_bytes(bytes, schema);
  const header = decoder.record(Cart.Header.tag) as Cart.Header;
  const meta_loc = header["metadata-location"];
  const file_loc = header["content-location"];
  if (slice_intersect(meta_loc, file_loc)) {
    throw new Error(`Invalid cartridge file: overlapping sections`);
  }
  return header;
}

function decode_metadata_record(bytes: Uint8Array): Cart.Metadata {
  const decoder = LJT.SchemaDecoder.from_bytes(bytes, schema);
  return decoder.record(Cart.Metadata.tag) as Cart.Metadata;
}

function slice_intersect(a: { offset: bigint; size: bigint }, b: { offset: bigint; size: bigint }) {
  if (a.offset + a.size <= b.offset) return false;
  if (a.offset >= b.offset + b.size) return false;
  return true;
}

// == Encoding
export function encode_magic() {
  return LJT.magic(schema);
}

export function encode_metadata(metadata: Cart.Metadata) {
  return LJT.encode_magicless(metadata, schema, Cart.Metadata.tag);
}

export function encode_header(header: Cart.Header) {
  return LJT.encode_magicless(header, schema, Cart.Header.tag);
}

export function encode_files(size: number) {
  let count = size;

  return {
    size: new LJT.Encoder().uint32(size).to_bytes(),
    encode_file(data: Uint8Array) {
      if (count <= 0) {
        throw new Error(`Trying to encode more files than size allows`);
      }
      count -= 1;
      return encode_file_data(data);
    },
    close() {
      if (count !== 0) {
        throw new Error(`Extraneous files ${count}`);
      }
      count = 0;
    },
  };
}

function encode_file_data(file: Uint8Array) {
  const encoder = new LJT.Encoder();
  return encoder.bytes(file).to_bytes();
}

class BlobDecoder {
  constructor(private offset: number, private blob: Blob) {}

  async uint32() {
    this.assert_size(4);
    const bytes = await this.blob.slice(this.offset, this.offset + 4).arrayBuffer();
    const view = new DataView(bytes);
    this.offset += 4;
    return view.getUint32(0, true);
  }

  async bytes(size: number) {
    this.assert_size(size);
    const data = await this.blob.slice(this.offset, this.offset + size).arrayBuffer();
    this.offset += size;
    return new Uint8Array(data);
  }

  private assert_size(size: number) {
    if (this.offset + size > this.blob.size) {
      throw new Error(`Size out of bounds at offset 0x${this.offset.toString(16)}: ${size}`);
    }
  }
}

function assert_safe_header(header: Cart.Header) {
  assert_safe_location(header["content-location"]);
  assert_safe_location(header["metadata-location"]);
}

function assert_safe_location(loc: Cart.Binary_location) {
  const offset = loc.offset;
  if (offset < 0n || offset >= BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`Unsafe 64-bit offset ${offset}`);
  }
  const size = loc.size;
  if (size < 0n || size >= BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`Unsafe 64-bit size ${size}`);
  }
  const total = offset + size;
  if (total < 0n || total >= BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`Unsafe 64-bit location ${offset},${size}`);
  }
}
