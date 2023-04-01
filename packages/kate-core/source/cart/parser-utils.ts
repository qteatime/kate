export function str(x: unknown, size: number = Infinity): string {
  if (typeof x !== "string") {
    throw new Error(`Expected string`);
  }
  if (x.length > size) {
    throw new Error(`String is too long (maximum: ${size})`);
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
