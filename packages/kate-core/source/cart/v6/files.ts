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

import { Cart_v6 } from "./v6";
import type { UncommitedFile } from "../cart-type";
import { str } from "../parser-utils";

export function parse_files(files: Cart_v6.Meta_file[]) {
  return files.map(parse_file);
}

export function parse_file(file: Cart_v6.Meta_file): UncommitedFile {
  return {
    path: str(file.path, 1_024),
    mime: str(file.mime, 255),
    integrity_hash: file.integrity,
    integrity_hash_algorithm: hash_algorithm(file["hash-algorithm"]),
    offset: file.offset === 0n ? null : ensure_safe_integer(file.offset),
    size: file.size,
  };
}

function hash_algorithm(x: Cart_v6.Hash_algorithm) {
  const t = Cart_v6.Hash_algorithm;
  switch (x["@variant"]) {
    case t.$Tags.Sha_512:
      return "SHA-512" as const;
  }
}

function ensure_safe_integer(x: bigint) {
  if (x < 0 || x >= BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`Unsafe offset ${x}`);
  }
  return Number(x);
}
