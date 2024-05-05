export class SemVer {
  constructor(
    readonly major: number,
    readonly minor: number,
    readonly patch: number,
    readonly build: string | null
  ) {}

  static try_parse(version: string, default_build: string | null): SemVer | null {
    const re = /^(\d+)\.(\d+)(?:\.(\d+))?(?:\-(.*))?/;
    const matches = version.match(re);
    if (matches == null) {
      return null;
    } else {
      const [_, major, minor, patch, build] = matches;
      return new SemVer(
        Number(major),
        Number(minor),
        Number(patch ?? "0"),
        build?.trim() || default_build
      );
    }
  }

  equals(that: SemVer) {
    return that.major === this.major && that.minor === this.minor && that.patch === this.patch;
  }

  gt(that: SemVer) {
    return (
      this.major > that.major ||
      (this.major === that.major && this.minor > that.minor) ||
      (this.major === that.major && this.minor === that.minor && this.patch > that.patch)
    );
  }

  gte(that: SemVer) {
    return this.gt(that) || this.equals(that);
  }

  lt(that: SemVer) {
    return !this.gt(that) && !this.equals(that);
  }

  lte(that: SemVer) {
    return !this.gt(that);
  }

  toString() {
    const suffix = this.build ? `-${this.build}` : "";
    return `v${this.major}.${this.minor}.${this.patch}${suffix}`;
  }
}
