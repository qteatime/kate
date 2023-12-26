export class SemVer {
  constructor(readonly major: number, readonly minor: number, readonly patch: number) {}

  static try_parse(version: string): SemVer | null {
    const re = /^(\d+)\.(\d+)\.(\d+)/;
    const matches = version.match(re);
    if (matches == null) {
      return null;
    } else {
      const [_, major, minor, patch] = matches;
      return new SemVer(Number(major), Number(minor), Number(patch));
    }
  }

  equals(that: SemVer) {
    return that.major === this.major && that.minor === this.minor && that.patch === this.patch;
  }

  gt(that: SemVer) {
    return (
      that.major > this.major ||
      (that.major === this.major && that.minor > this.minor) ||
      (that.major === this.major && that.minor === this.minor && that.patch > this.patch)
    );
  }

  gte(that: SemVer) {
    return that.gt(this) || that.equals(this);
  }

  lt(that: SemVer) {
    return !that.gt(this) && !that.equals(this);
  }

  lte(that: SemVer) {
    return !that.gt(this);
  }

  toString() {
    return `v${this.major}.${this.minor}.${this.patch}`;
  }
}
