/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
