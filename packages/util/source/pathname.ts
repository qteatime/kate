/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

type Segment = string & { __brand: "segment" };

export class Pathname {
  private constructor(
    readonly is_absolute: boolean,
    readonly segments: Segment[]
  ) {}

  static from_string(x: string) {
    if (x.startsWith("/")) {
      return new Pathname(true, get_segments(x.slice(1)));
    } else {
      return new Pathname(false, get_segments(x));
    }
  }

  as_string() {
    const prefix = this.is_absolute ? "/" : "";
    return prefix + this.normalise().segments.join("/");
  }

  make_absolute() {
    return new Pathname(true, this.segments);
  }

  make_relative() {
    return new Pathname(false, this.segments);
  }

  join(x: Pathname) {
    if (x.is_absolute) {
      return x;
    } else {
      return new Pathname(this.is_absolute, [...this.segments, ...x.segments]);
    }
  }

  to(x: string) {
    return this.join(Pathname.from_string(x));
  }

  drop_prefix(prefix: string[]) {
    const segments = this.segments.slice();
    for (const segment of prefix) {
      if (segments.length > 0 && segments[0] === segment) {
        segments.shift();
      } else {
        break;
      }
    }
    return new Pathname(false, [...segments]);
  }

  starts_with(path: Pathname) {
    if (path.segments.length > this.segments.length) {
      return false;
    }
    let i = 0;
    for (const segment of path.segments) {
      if (this.segments[i] !== segment) {
        return false;
      }
      i += 1;
    }
    return true;
  }

  normalise() {
    const stack: Segment[] = [];
    for (const segment of this.segments) {
      switch (segment) {
        case ".": {
          continue;
        }

        case "..": {
          stack.pop();
          continue;
        }

        default: {
          stack.push(segment);
          continue;
        }
      }
    }
    return new Pathname(this.is_absolute, stack);
  }

  basename() {
    if (this.segments.length > 0) {
      return this.segments[this.segments.length - 1];
    } else {
      return "";
    }
  }

  extname() {
    const match = this.basename().match(/(\.[^\.]+)$/);
    if (match != null) {
      return match[1];
    } else {
      return null;
    }
  }

  dirname() {
    return new Pathname(this.is_absolute, this.segments.slice(0, -1));
  }
}

function get_segments(x: string): Segment[] {
  return x
    .replace(/\/{2,}/g, "/")
    .split("/")
    .map(parse_segment);
}

function parse_segment(x: string): Segment {
  if (/^[^\/#\?]+$/.test(x)) {
    return x as Segment;
  } else {
    throw new Error(`invalid segment: ${x}`);
  }
}
