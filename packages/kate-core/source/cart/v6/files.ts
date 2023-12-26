/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
