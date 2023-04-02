export function string(x: any) {
  if (typeof x !== "string") {
    throw new Error(`Expected string`);
  }
  return x;
}

export function number(x: any) {
  if (typeof x !== "number") {
    throw new Error(`Expected number`);
  }
  return x;
}

export function boolean(x: any) {
  if (typeof x !== "boolean") {
    throw new Error(`Expected boolean`);
  }
  return x;
}

export function integer(x: any) {
  const x1 = number(x);
  if (Math.floor(x1) !== x1) {
    throw new Error(`Expected integer`);
  }
  return x;
}

export function nullable<A>(f: (_: any) => A, value: any): A | null {
  if (value == null) {
    return null;
  } else {
    return f(value);
  }
}
