export const fingerprint = new Uint8Array(
  "KATE/v02".split("").map((x) => x.charCodeAt(0))
);

export function check_fingerprint(data: DataView) {
  if (data.byteLength - data.byteOffset < fingerprint.length) {
    throw new Error(`Invalid cartridge: unmatched fingerprint`);
  }
  for (let i = 0; i < fingerprint.length; ++i) {
    if (fingerprint[i] !== data.getUint8(i)) {
      throw new Error(`Invalid cartridge: unmatched fingerprint`);
    }
  }
}

export function add_fingerprint(data: Uint8Array) {
  const result = new Uint8Array(fingerprint.length + data.length);
  result.set(fingerprint, 0);
  result.set(data, fingerprint.length);
  return result;
}

export function remove_fingerprint(data: DataView) {
  check_fingerprint(data);
  return new DataView(data.buffer.slice(fingerprint.length));
}
