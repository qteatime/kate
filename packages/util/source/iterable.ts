export function* enumerate<A>(xs: Iterable<A>) {
  let index = 0;
  for (const x of xs) {
    yield [index, x] as const;
    index += 1;
  }
}

export function foldl<A, B>(
  xs: Iterable<A>,
  z: B,
  f: (acc: B, value: A) => B
): B {
  let result = z;
  for (const x of xs) {
    result = f(result, x);
  }
  return result;
}
