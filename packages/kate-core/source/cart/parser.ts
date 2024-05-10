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

import { ECartCorrupted, ECartFormatTooNew } from "../error";
import { CartChangeReason } from "../os";
import { SemVer } from "../utils";
import { DataCart, DataFile, UncommitedFile } from "./cart-type";
import * as v6 from "./v6/v6";

export type YieldFile = {
  index: number;
  data: Uint8Array;
};

export type Parser<T> = {
  detect(x: Blob): Promise<boolean>;
  minimum_version(header: T): SemVer;
  parse_header(x: Blob): Promise<T>;
  parse_meta(x: Blob, header: T): Promise<DataCart>;
  raw_meta(x: Blob, header: T): Promise<Uint8Array>;
  parse_files(x: Blob, header: T, metadata: DataCart): AsyncGenerator<YieldFile, void, void>;
  read_file_with_path(
    x: Blob,
    metadata: DataCart,
    path: string,
    max_size_bytes: number | null
  ): Promise<null | DataFile>;
};

const parsers: Parser<unknown>[] = [
  {
    detect: v6.detect,
    minimum_version: v6.minimum_version,
    parse_header: v6.decode_header,
    parse_meta: v6.decode_metadata,
    raw_meta: v6.read_raw_metadata,
    parse_files: v6.decode_files,
    read_file_with_path: v6.read_file_with_path,
  },
];

export async function choose_parser(data: Blob) {
  for (const parser of parsers) {
    if (await parser.detect(data)) {
      return parser;
    }
  }

  return null;
}

export async function parse_metadata(data: Blob, kate_ver: SemVer) {
  const parser = await choose_parser(data);
  if (parser == null) {
    throw new Error(`No suitable parser`);
  }

  const header = await parser.parse_header(data);
  const required_ver = parser.minimum_version(header);
  if (kate_ver.lt(required_ver)) {
    throw new ECartFormatTooNew(required_ver, "cartridge");
  }

  const metadata = await parser.parse_meta(data, header);
  const errors = await verify_pointers(metadata);
  if (errors.length !== 0) {
    console.error(`Missing cartridge files`, errors);
    throw new ECartCorrupted(metadata.id);
  }

  return metadata;
}

export async function parse_whole(data: Blob, kate_ver: SemVer) {
  const parser = await choose_parser(data);
  if (parser == null) {
    throw new Error(`No suitable parser`);
  }

  const header = await parser.parse_header(data);
  const required_ver = parser.minimum_version(header);
  if (required_ver.gt(kate_ver)) {
    throw new ECartFormatTooNew(required_ver, "cartridge");
  }

  const metadata = await parser.parse_meta(data, header);
  const errors = await verify_pointers(metadata);
  if (errors.length !== 0) {
    console.error(`Missing cartridge files`, errors);
    throw new ECartCorrupted(metadata.id);
  }

  const files = parser.parse_files(data, header, metadata);
  const file_map = new Map<string, DataFile>();

  for await (const entry of files) {
    const node = metadata.files[entry.index];
    if (node == null) {
      console.error(`Unexpected cartridge file ${entry.index}`);
      throw new ECartCorrupted(metadata.id);
    }
    if (!(await verify_file_integrity(node, entry.data))) {
      console.error(`Integrity check failed for ${node.path}`, node);
      throw new ECartCorrupted(metadata.id);
    }
    file_map.set(node.path, { ...node, data: entry.data });
  }

  return { metadata, file_map };
}

export async function verify_pointers(cart: DataCart) {
  const errors = [
    ...check_file_exists(cart.metadata.presentation.thumbnail_path, cart),
    ...check_file_exists(cart.metadata.presentation.banner_path, cart),
    ...check_file_exists(cart.metadata.legal.licence_path, cart),
    ...check_file_exists(cart.metadata.legal.privacy_policy_path, cart),
    ...check_file_exists(cart.runtime.html_path, cart),
  ];
  return errors;
}

export async function verify_file_integrity(file: UncommitedFile, data: Uint8Array) {
  const hash = await crypto.subtle.digest(file.integrity_hash_algorithm, data.buffer);
  return byte_equals(new Uint8Array(hash), file.integrity_hash);
}

function check_file_exists(path: string | null, cart: DataCart) {
  if (path == null) {
    return [];
  } else {
    const file = cart.files.find((x) => x.path === path);
    if (file == null) {
      return [`File not found: ${path}`];
    } else {
      return [];
    }
  }
}

function byte_equals(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
