/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { zip } from "./iterable";

export function concat_all(bytearrays: Uint8Array[]) {
  const size = bytearrays.reduce((a, b) => a + b.byteLength, 0);
  const result = new Uint8Array(size);

  let offset = 0;
  for (const bytes of bytearrays) {
    result.set(bytes, offset);
    offset += bytes.byteLength;
  }

  return result;
}

export function byte_equals(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) {
    return false;
  }
  for (const [x, y] of zip(a, b)) {
    if (x !== y) {
      return false;
    }
  }
  return true;
}

export function bytes_to_hex(x: Uint8Array) {
  return Array.from(x)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join(" ");
}
