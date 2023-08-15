import { unpickle } from "./pickle";
import { Pathname } from "../deps/utils";

type AnyIndexEntry = [number, number] | [number, number, Uint8Array];
type IndexEntry = [number, number, Uint8Array];

export async function unpack_archive(path: Pathname, bytes: Uint8Array) {
  const formats = [RPAv3];
  for (const format of formats) {
    if (format.accepts(bytes)) {
      const archive = await format.from_file(path, bytes);
      return archive.get_all();
    }
  }
  throw new Error(`Unsupported archive version`);
}

export class RPAv3 {
  private constructor(
    readonly data: Uint8Array,
    readonly index: Map<string, IndexEntry[]>
  ) {}

  async get_file(path: string) {
    const entries = this.index.get(path);
    if (entries == null) {
      throw new Error(`File not found: ${path}`);
    }
    if (entries.length !== 1) {
      throw new Error(`Unsupported file entry: ${path}`);
    }
    const [[start, length, byte_start]] = entries;
    if (byte_start.length !== 0) {
      throw new Error(`Unsupported file entry: ${path}`);
    }

    if (length > 1024 * 1024 * 1024) {
      throw new Error(`File too big to read: ${path} ${length}`);
    }
    return this.data.slice(start, start + length);
  }

  async get_all() {
    const result: KateTypes.DeviceFileHandle[] = [];
    for (const path of this.index.keys()) {
      result.push({
        relative_path: Pathname.from_string(path),
        read: () => this.get_file(path),
        __fake: true,
      } as any as KateTypes.DeviceFileHandle);
    }
    return result;
  }

  static async from_file(path: Pathname, bytes: Uint8Array) {
    if (!has_header(this.header, bytes)) {
      throw new Error(`Invalid RPAv3 data`);
    }
    const index = await RPAv3.read_index(path.dirname(), bytes);
    return new RPAv3(bytes, index);
  }

  static get header() {
    return bytestring("RPA-3.0 ");
  }

  static accepts(data: Uint8Array) {
    return has_header(this.header, data);
  }

  private static async read_index(prefix: Pathname, data: Uint8Array) {
    const offset = read_int_string(data, 8, 16);
    const key = read_int_string(data, 25, 8);
    const serialised_index = await deflate(data.slice(offset));
    const index0: Map<string, AnyIndexEntry[]> = unpickle(
      serialised_index
    ) as any;
    if (!(index0 instanceof Map)) {
      throw new Error(`Invalid RPA index`);
    }

    // deobfuscate the index
    const index = new Map<string, IndexEntry[]>();
    for (const [k0, v] of index0.entries()) {
      const k = prefix.join(Pathname.from_string(k0)).as_string();
      if (!Array.isArray(v)) {
        console.error("Invalid entry: ", k, "=>", v);
        throw new Error(`Invalid RPA index`);
      }
      if (v[0].length === 2) {
        index.set(k, [
          ...v.map(
            ([offset, length]) =>
              [offset ^ key, length ^ key, new Uint8Array()] as IndexEntry
          ),
        ]);
      } else if (v[0].length === 3) {
        index.set(k, [
          ...v.map(
            ([offset, length, maybe_bytes]) =>
              [
                offset ^ key,
                length ^ key,
                ensure_uint8array(maybe_bytes),
              ] as IndexEntry
          ),
        ]);
      }
    }

    return index;
  }
}

function ensure_uint8array(x: unknown) {
  if (x instanceof Uint8Array) {
    return x;
  } else if (x == null || x === "") {
    return new Uint8Array();
  } else {
    throw new Error(`Unsupported start bytes`);
  }
}

async function deflate(data: Uint8Array): Promise<Uint8Array> {
  const decompressor = new DecompressionStream("deflate");
  const writer = decompressor.writable.getWriter();
  const reader = decompressor.readable.getReader();
  writer.write(data).then((x) => {
    writer.close().then((y) => {
      console.log("close: ", x);
    });
    console.log("write: ", x);
  });
  const decompressed = await reader.read();
  return decompressed.value!;
}

// import * as zlib from "zlib";
// async function deflate(data: Uint8Array): Promise<Uint8Array> {
//   const buffer = zlib.unzipSync(data);
//   return new Uint8Array(
//     buffer.buffer.slice(
//       buffer.byteOffset,
//       buffer.byteOffset + buffer.byteLength
//     )
//   );
// }

function has_header(header: Uint8Array, bytes: Uint8Array) {
  return byte_equals(header, bytes.slice(0, header.length));
}

function byte_equals(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) {
    return false;
  }
  for (const [x, y] of zip(a, b)) {
    if (x !== y) {
      return false;
    }
  }
  return true;
}

function* enumerate<A>(x: Iterable<A>) {
  let index = 0;
  for (const value of x) {
    yield [index, value] as [number, A];
    index += 1;
  }
}

function* zip<A, B>(a0: Iterable<A>, b0: Iterable<B>) {
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

function* iterator<A>(x: Iterable<A>) {
  yield* x;
}

function bytestring(x: string) {
  return new Uint8Array(x.split("").map((x) => byte(x.charCodeAt(0))));
}

function byte(x: number) {
  if (x < 0 || x > 255) {
    throw new Error(`Invalid byte: ${x}`);
  }
  return x;
}

function read_int_string(buffer: Uint8Array, offset: number, size: number) {
  const decoder = new TextDecoder();
  const int_string = decoder.decode(buffer.slice(offset, offset + size));
  return parseInt(int_string, 16);
}
