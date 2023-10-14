/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

type RecPartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? RecPartial<U>[]
    : T[K] extends object | undefined
    ? RecPartial<T[K]>
    : T[K];
};

class Ok {
  toJSON() {
    return "<ok>";
  }
}
const ok = new Ok();

abstract class MatchError {
  abstract toJSON(): unknown;
}

class Mismatch extends MatchError {
  constructor(readonly left: unknown, readonly right: unknown) {
    super();
  }

  toJSON() {
    return {
      "@expected": pprint(this.left),
      "@actual": pprint(this.right),
    };
  }
}

class Missing {
  constructor(readonly value: unknown) {}

  toJSON() {
    return {
      "@missing": pprint(this.value),
    };
  }
}

class Extraneous {
  constructor(readonly value: unknown) {}

  toJSON() {
    return {
      "@extraneous": pprint(this.value),
    };
  }
}

function pprint(x: unknown): string {
  if (is_primitive(x)) {
    return String(x);
  } else if (Array.isArray(x)) {
    return `(${x.length})[${x.map(pprint).join(", ")}]`;
  } else if (is_record(x)) {
    return `{${Object.entries(x)
      .map(([k, v]) => `${JSON.stringify(k)}: ${pprint(v)}`)
      .join(", ")}}`;
  } else {
    return String(x);
  }
}

export function assert_match<A>(value: A, pattern: RecPartial<A>, tag: string = "") {
  if (!match(pattern, value)) {
    throw new Error(`[${tag}] Match failed: ${JSON.stringify(diff(pattern, value), null, 2)}`);
  }
}

function match(pattern: unknown, actual: unknown): boolean {
  if (pattern === null && actual === null) {
    return true;
  }
  if (is_primitive(pattern) && is_primitive(actual)) {
    if (pattern === actual) {
      return true;
    } else {
      return false;
    }
  }
  if (typeof pattern !== typeof actual) {
    return false;
  }
  if (Array.isArray(pattern) && Array.isArray(actual)) {
    if (pattern.length !== actual.length) {
      return false;
    }
    return pattern.every((x, i) => match(x, actual[i]));
  }
  if (is_record(pattern) && is_record(actual)) {
    return Object.entries(pattern).every(([key, value]) => {
      if (key in actual) {
        return match(value, actual[key]);
      } else {
        return false;
      }
    });
  }
  if (pattern === actual) {
    return true;
  }
  return false;
}

function diff(left: unknown, right: unknown): unknown {
  if (left === null && right === null) {
    return ok;
  }
  if (is_primitive(left) && is_primitive(right)) {
    if (left === right) {
      return ok;
    } else {
      return new Mismatch(left, right);
    }
  }
  if (typeof left !== typeof right) {
    return new Mismatch(left, right);
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    let mismatches: unknown[] = left.map((x, i) => {
      if (i < right.length) {
        return diff(x, right[i]);
      } else {
        return new Missing(x);
      }
    });
    if (left.length < right.length) {
      mismatches = mismatches.concat(right.slice(left.length).map((x) => new Extraneous(x)));
    }
    if (mismatches.every((x) => x === ok)) {
      return ok;
    } else {
      return mismatches;
    }
  }
  if (is_record(left) && is_record(right)) {
    const result = Object.entries(left).flatMap(([key, value]) => {
      if (key in right) {
        const result = diff(value, right[key]);
        if (result === ok) {
          return [];
        } else {
          return [[key, result]];
        }
      } else {
        return [[key, new Missing(value)]];
      }
    });
    if (result.every(([_, v]) => v === ok)) {
      return ok;
    } else {
      return Object.fromEntries(result);
    }
  }
  if (left === right) {
    return ok;
  }
  return new Mismatch(left, right);
}

function is_record(x: unknown): x is { [key: string | symbol]: unknown } {
  return (
    x !== null &&
    typeof x === "object" &&
    (Object.getPrototypeOf(x) == null || Object.getPrototypeOf(x) === Object.prototype)
  );
}

function is_primitive(x: unknown) {
  return x == null || ["string", "number", "bigint", "boolean", "symbol"].includes(typeof x);
}
