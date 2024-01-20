/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as LJT from "../../ljt-vm/build";
import * as FS from "fs/promises";
import * as Cart from "./generated/kart-v6";
import { decode_header_record, decode_metadata_record, schema, size_of } from "./kart-v6";

export async function decode_header(handle: FS.FileHandle): Promise<Cart.Header> {
  const file_size = (await handle.stat()).size;
  const magic_size = schema.magic.byteLength + 4;
  const magic_buffer = await read(handle, 0, magic_size);
  const magic_decoder = LJT.SchemaDecoder.from_bytes(magic_buffer, schema);
  magic_decoder.assert_magic();

  const header_size = size_of(Cart.Header.tag);
  const buffer = await read(handle, file_size - header_size, header_size);
  return decode_header_record(buffer);
}

export async function decode_metadata(
  handle: FS.FileHandle,
  header: Cart.Header
): Promise<Cart.Metadata> {
  const loc = header["metadata-location"];
  const buffer = await read(handle, Number(loc.offset), Number(loc.offset + loc.size));
  return decode_metadata_record(buffer);
}

async function read(handle: FS.FileHandle, offset: number, size: number) {
  const buffer = new Uint8Array(size);
  const result = await handle.read({ buffer, position: offset, length: size });
  return result.buffer;
}
