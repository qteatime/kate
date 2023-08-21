export function concat_all(bytearrays: Uint8Array[]) {
  const size = bytearrays.reduce((a, b) => a + b.byteLength, 0);
  const result = new Uint8Array(size);

  let offset = 0;
  for (const bytes of bytearrays) {
    result.set(bytes, offset);
    offset += bytes.byteLength;
  }

  return result;
}
