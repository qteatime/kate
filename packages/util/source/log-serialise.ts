/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const MAX_BYTES = 16;
const MAX_SEQUENCE = 32;
const MAX_DEPTH = 3;

export function serialise(xs: unknown[]) {
  const all_string = xs.every((x) => typeof x === "string");
  if (all_string) {
    return xs.join(" ");
  } else {
    const visited = new Set();
    return xs.map((x) => serialise_one(x, false, MAX_DEPTH, visited)).join(" ");
  }
}

function serialise_one(
  x: unknown,
  quote_strings: boolean,
  depth: number,
  visited: Set<unknown>
): string {
  if (visited.has(x)) {
    return `(circular)`;
  }
  if (depth <= 0) {
    return `(...)`;
  }

  if (x === null) {
    return `null`;
  } else if (x === undefined) {
    return `undefined`;
  } else if (typeof x === "bigint") {
    return `${x}n`;
  } else if (typeof x === "boolean" || typeof x === "number") {
    return String(x);
  } else if (typeof x === "string") {
    return quote_strings ? JSON.stringify(x) : x;
  } else if (Array.isArray(x)) {
    visited.add(x);
    const items = x.slice(0, MAX_SEQUENCE).map((v) => serialise_one(v, true, depth - 1, visited));
    return `[${items.join(", ")}... (${x.length} items)]`;
  } else if (x instanceof Uint8Array) {
    return `Uint8Array(${x.slice(0, MAX_BYTES)}... (${x.byteLength} bytes))`;
  } else if (x instanceof Error) {
    return x.stack ?? String(x);
  } else {
    visited.add(x);
    const proto = Object.getPrototypeOf(x);
    if (proto === Object.prototype || proto == null) {
      const entries = Object.entries(x);
      const pairs = entries
        .slice(0, MAX_SEQUENCE)
        .map(
          ([k, v]) =>
            `${serialise_one(k, true, depth - 1, visited)}: ${serialise_one(
              v,
              true,
              depth - 1,
              visited
            )}`
        );
      return `{${pairs.join(", ")}... (${entries.length} pairs)}`;
    } else {
      return String(x);
    }
  }
}
