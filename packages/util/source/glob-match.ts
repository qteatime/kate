/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Pathname } from "./pathname";

function compile(pattern: string) {
  const path = Pathname.from_string(pattern);
  return new RegExp(
    "^\\/?" + handle_greedy_match(path.segments.map(compile_segment).join("\\/")) + "$"
  );
}

function handle_greedy_match(pattern: string) {
  return pattern.replace(/\.\*\?\\\//g, ".*?\\/?");
}

function compile_segment(segment: string) {
  return segment
    .replace(/[^\*\w\d]/g, (x) => `\\${x}`)
    .replace(/\*\*?/g, (m) => {
      switch (m) {
        case "**":
          return ".*?";
        case "*":
          return "[^\\/]*?";
        default:
          return m;
      }
    });
}

export class GlobPattern {
  private constructor(private _test: RegExp) {}

  static from_pattern(pattern: string) {
    return new GlobPattern(compile(pattern));
  }

  test(path: Pathname | string) {
    if (typeof path === "string") {
      return this._test.test(path);
    } else {
      return this._test.test(path.as_string());
    }
  }
}

export class GlobPatternList {
  private constructor(private _patterns: GlobPattern[]) {}

  static from_patterns(patterns: string[]) {
    return new GlobPatternList(patterns.map((x) => GlobPattern.from_pattern(x)));
  }

  test(path: Pathname | string) {
    return this._patterns.some((x) => x.test(path));
  }

  join(that: GlobPatternList) {
    return new GlobPatternList([...this._patterns, ...that._patterns]);
  }

  add(that: GlobPattern) {
    return new GlobPatternList([...this._patterns, that]);
  }
}
