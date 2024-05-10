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

export * from "../../util/build/assert";
export * from "../../util/build/pathname";
export * from "../../util/build/random";
export * from "../../util/build/promise";
export * from "../../util/build/events";
export * from "../../util/build/url";
export * from "../../util/build/graphics";
export * from "../../util/build/mime";
export * from "../../util/build/ua-parser";
export * as TC from "../../util/build/object-spec";
export * from "../../util/build/unit";
export * as Sets from "../../util/build/sets";
export * from "../../util/build/observable";
export * from "../../util/build/iterable";
export * from "../../util/build/math";
export * from "../../util/build/time";
export * from "../../util/build/serialise";
export * from "../../util/build/semver";
export * from "../../util/build/binary";
export * from "../../util/build/glob-match";
export * from "../../util/build/log-serialise";

export function lock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return navigator.locks.request(name, fn);
}

export function mut<T extends { [key: string]: any }>(
  x: T
): { -readonly [key in keyof T]: T[key] } {
  return x as any;
}

export type OptionalRec<T> = T extends {} ? { [k in keyof T]?: OptionalRec<T[k]> } : T;
