/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export function intersection<A>(a: Set<A>, b: Set<A>): Set<A> {
  const result = new Set<A>();
  for (const value of a) {
    if (b.has(value)) {
      result.add(value);
    }
  }
  return result;
}

export function union<A>(a: Set<A>, b: Set<A>): Set<A> {
  const result = new Set<A>();
  for (const value of a) {
    result.add(value);
  }
  for (const value of b) {
    result.add(value);
  }
  return result;
}

export function difference<A>(a: Set<A>, b: Set<A>): Set<A> {
  const result = new Set<A>();
  for (const value of a) {
    if (!b.has(value)) {
      result.add(value);
    }
  }
  return result;
}

export function same_set<A>(a: Set<A>, b: Set<A>): boolean {
  return a.size === b.size && difference(a, b).size === 0;
}
