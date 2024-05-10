/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
 */

import * as Path from "path";
import * as FS from "fs";
import * as Crypto from "crypto";
import * as Stream from "stream";
import { kart_v6 as Cart, kart_v6 } from "./deps/schema";
import { Pathname, enumerate, from_bytes, unreachable } from "./deps/util";
import { Spec as T, bytes_to_hex } from "./deps/util";
import * as Glob from "glob";
import { Hash_algorithm } from "../../schema/build/kart-v6";
import {
  Accessibility,
  Bridge,
  Capability,
  CartDate,
  ContentRating,
  DerivativePolicy,
  Duration,
  Genre,
  InputMethod,
  Kart,
  KeyMapping,
  Language,
  ReleaseType,
  Version,
  apply_recipe,
  config,
  keymap,
  make_absolute,
  metadata,
  mime_table,
  spec_version,
} from "./kart-config";

class KartWriter {
  private offset = 0n;
  private web_stream: WritableStream<Uint8Array>;
  private writer;

  constructor(readonly stream: FS.WriteStream) {
    this.web_stream = Stream.Writable.toWeb(stream);
    this.writer = this.web_stream.getWriter();
  }

  async write(bytes: Uint8Array) {
    await this.writer.write(bytes);
    this.offset += BigInt(bytes.byteLength);
  }

  async close() {
    await this.writer.close();
    this.stream.close();
  }

  get current_offset() {
    return this.offset;
  }
}

function assert_base(path: string, root: string) {
  const file = FS.realpathSync(path);
  if (!file.startsWith(root)) {
    throw new Error(
      `Cannot load file '${file}' because it's outside of the base directory '${root}'`
    );
  }
  return file;
}

function load_file(path0: string, root: string, base_dir: string) {
  const path = Path.resolve(base_dir, path0);
  return new Uint8Array(FS.readFileSync(assert_base(path, root)));
}

async function files(patterns: Kart["files"], root: string, base_dir: string, writer: KartWriter) {
  const paths: string[] = [];
  const candidates = new Set(patterns.flatMap((x) => Glob.sync(x, { cwd: base_dir })));
  for (const candidate of candidates) {
    if (FS.statSync(Path.resolve(base_dir, candidate)).isFile()) {
      paths.push(candidate);
    }
  }

  const encoder = kart_v6.encode_files(paths.length);
  await writer.write(encoder.size);

  console.log(`:: Adding ${paths.length} files to the cartridge`);
  const result: Cart.Meta_file[] = [];
  for (const path of paths) {
    const ext = Path.extname(path);
    const mime = mime_table[ext] ?? "application/octet-stream";
    const data = load_file(path, root, base_dir);
    const integrity = await Crypto.subtle.digest("SHA-512", data.buffer);
    const offset = encoder.current_offset() + 4n;

    result.push(
      Cart.Meta_file({
        path: make_absolute(path),
        mime: mime,
        integrity: new Uint8Array(integrity),
        "hash-algorithm": Hash_algorithm.Sha_512({}),
        offset: offset,
        size: data.byteLength,
      })
    );

    await writer.write(encoder.encode_file(data));
    console.log(`> Added ${make_absolute(path)} (${from_bytes(data.byteLength)}`);
  }

  encoder.close();

  return result;
}

export async function make_cartridge(path: string, output: string) {
  let base_dir = Path.dirname(Path.resolve(path));
  const dir_root = base_dir;
  const json0: unknown = JSON.parse(FS.readFileSync(path, "utf-8"));
  const json1 = T.parse(config, json0);
  const json = apply_recipe(json1);
  show_details(json);

  const x = json.platform;
  if (json.root != null) {
    const new_base_dir = Path.resolve(base_dir, json.root);
    assert_base(new_base_dir, dir_root);
    base_dir = new_base_dir;
  }

  const writer = new KartWriter(FS.createWriteStream(output));
  try {
    await writer.write(kart_v6.encode_magic());
    const file_offset = writer.current_offset;
    const archive = await files(json.files, dir_root, base_dir, writer);
    const meta_offset = writer.current_offset;
    const meta = metadata(json, archive);
    await writer.write(kart_v6.encode_metadata(meta));
    const header_offset = writer.current_offset;
    await writer.write(
      kart_v6.encode_header(
        Cart.Header({
          "minimum-kate-version": spec_version,
          "content-location": Cart.Binary_location({
            offset: file_offset,
            size: meta_offset - file_offset,
          }),
          "metadata-location": Cart.Binary_location({
            offset: meta_offset,
            size: header_offset - meta_offset,
          }),
        })
      )
    );
    const total_size = writer.current_offset;
    await writer.close();

    console.log(`> Total size ${from_bytes(total_size)}`);
  } catch (e: any) {
    console.log(`> Packaging failed, removing corrupted file.`);
    try {
      await writer.close();
    } catch (_) {}
    if (FS.existsSync(output)) {
      FS.unlinkSync(output);
    }
    throw new Error(`Failed to generate cartridge: ${e?.stack ?? e}`);
  }
}

function show_details(json: unknown) {
  console.log(`> Cartridge build rules:\n${JSON.stringify(json, null, 2)}\n`);
}
