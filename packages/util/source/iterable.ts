export function* enumerate<A>(xs: Iterable<A>) {
  let index = 0;
  for (const x of xs) {
    yield [index, x] as const;
    index += 1;
  }
}
