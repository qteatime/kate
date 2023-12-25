/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export function* enumerate<A>(xs: Iterable<A>) {
  let index = 0;
  for (const x of xs) {
    yield [index, x] as const;
    index += 1;
  }
}

export function foldl<A, B>(xs: Iterable<A>, z: B, f: (acc: B, value: A) => B): B {
  let result = z;
  for (const x of xs) {
    result = f(result, x);
  }
  return result;
}

export function* iterator<A>(x: Iterable<A>) {
  yield* x;
}

export function* map<A, B>(a: Iterable<A>, f: (_: A) => B): Iterable<B> {
  for (const x of a) {
    yield f(x);
  }
}

export function* zip<A, B>(a0: Iterable<A>, b0: Iterable<B>) {
  const a = iterator(a0);
  const b = iterator(b0);
  while (true) {
    const va = a.next();
    const vb = b.next();
    if (va.done && vb.done) {
      break;
    }
    if (!va.done && !vb.done) {
      yield [va.value, vb.value] as const;
      continue;
    }
    throw new Error(`Mismatched iterable lengths`);
  }
}

export async function* iterate_stream<T>(stream: ReadableStream<T>) {
  const reader = stream.getReader();
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) {
        return;
      } else {
        yield result.value;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function readable_stream_from_iterable<T>(x0: Iterable<T>): ReadableStream<T> {
  const x = iterator(x0);
  return new ReadableStream<T>({
    pull(controller) {
      const next = x.next();
      if (next.done) {
        controller.close();
      } else {
        controller.enqueue(next.value);
      }
    },
  });
}
