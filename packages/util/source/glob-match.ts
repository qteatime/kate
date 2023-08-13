import { Pathname } from "./pathname";

function compile(pattern: string) {
  const path = Pathname.from_string(pattern);
  return new RegExp(
    "^\\/?" + path.segments.map(compile_segment).join("\\/") + "$"
  );
}

function compile_segment(segment: string) {
  return segment
    .replace(/[^\*\w\d]/, (x) => `\\${x}`)
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
