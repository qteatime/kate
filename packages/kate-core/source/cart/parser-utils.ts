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

export function str(x: unknown, size: number = Infinity): string {
  if (typeof x !== "string") {
    throw new Error(`Expected string`);
  }
  if (x.length > size) {
    throw new Error(`String is too long (maximum: ${size})`);
  }
  return x;
}

export function bytes(x: unknown, size: number = Infinity): Uint8Array {
  if (!(x instanceof Uint8Array)) {
    throw new Error(`Expected bytes`);
  }
  if (x.length > size) {
    throw new Error(`Too many bytes (maximum: ${size})`);
  }
  return x;
}

export function regex(name: string, re: RegExp) {
  return (x: unknown) => {
    if (!re.test(str(x))) {
      throw new Error(`Expected ${name}`);
    }
    return x as string;
  };
}

export function list<T>(x: T[], size: number) {
  if (!Array.isArray(x)) {
    throw new Error(`Expected a list`);
  }
  if (x.length > size) {
    throw new Error(`List too long. (maximum: ${size})`);
  }
  return x;
}

export function chars_in_mb(n: number) {
  return 2 * 1024 * 1024 * n;
}
