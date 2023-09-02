import * as LJT from "../../ljt-vm/build";
const source = require("./generated/kart-v5.json");
import * as Cart from "./generated/kart-v5";
export * from "./generated/kart-v5";
import { concat_all } from "./util";

const schema = LJT.parse(source);

// == Cartridge decoder
export function decode_header(bytes: Uint8Array): Cart.Header {
  const decoder = LJT.SchemaDecoder.from_bytes(bytes, schema);
  decoder.assert_magic();
  const header = decoder.record(Cart.Header.tag) as Cart.Header;
  const meta_loc = header["metadata-location"];
  const file_loc = header["content-location"];
  if (slice_intersect(meta_loc, file_loc)) {
    throw new Error(`Invalid cartridge file: overlapping sections`);
  }
  return header;
}

function decode_metadata_record(bytes: Uint8Array): Cart.Metadata {
  const decoder = LJT.SchemaDecoder.from_bytes(bytes, schema);
  return decoder.record(Cart.Metadata.tag) as Cart.Metadata;
}

function decode_files_record(bytes: Uint8Array): Cart.File[] {
  const decoder = LJT.SchemaDecoder.from_bytes(bytes, schema);
  const result: Cart.File[] = [];
  const size = decoder.decoder.uint32();
  for (let i = 0; i < size; ++i) {
    result.push(decoder.record(Cart.File.tag) as Cart.File);
  }
  return result;
}

export function decode_metadata(
  bytes: Uint8Array,
  header: Cart.Header
): Cart.Metadata {
  const meta_loc = header["metadata-location"];
  const metadata_bytes = bytes.slice(
    meta_loc.offset,
    meta_loc.offset + meta_loc.size
  );
  return decode_metadata_record(metadata_bytes);
}

export function decode_files(
  bytes: Uint8Array,
  header: Cart.Header
): Cart.File[] {
  const file_loc = header["content-location"];
  return decode_files_record(
    bytes.slice(file_loc.offset, file_loc.offset + file_loc.size)
  );
}

export function decode(bytes: Uint8Array): Cart.Cartridge {
  const header = decode_header(bytes);
  const metadata = decode_metadata(bytes, header);
  const files = decode_files(bytes, header);
  return Cart.Cartridge({ header, metadata, files });
}

type EncodeOptions = {
  kate_version: Cart.Kate_version;
  metadata: Cart.Metadata;
  files: Cart.File[];
};

export function encode(options: EncodeOptions) {
  const meta_bytes = LJT.encode_magicless(
    options.metadata,
    schema,
    Cart.Metadata.tag
  );

  const file_list = options.files.map((x) =>
    LJT.encode_magicless(x, schema, Cart.File.tag)
  );
  const file_size = new Uint8Array(4);
  new DataView(file_size.buffer).setUint32(0, file_list.length);
  const file_bytes = concat_all([file_size, ...file_list]);

  const header = Cart.Header({
    "minimum-kate-version": options.kate_version,
    "metadata-location": Cart.Binary_location({
      offset: 0,
      size: meta_bytes.length,
    }),
    "content-location": Cart.Binary_location({
      offset: 0,
      size: file_bytes.length,
    }),
  });
  const header_size = LJT.encode(header, schema, Cart.Header.tag).length;
  (header["metadata-location"] as any).offset =
    header_size + LJT.magic_size(schema);
  (header["content-location"] as any).offset =
    header_size + LJT.magic_size(schema) + meta_bytes.length;

  const header_bytes = LJT.encode(header, schema, Cart.Header.tag);
  return concat_all([header_bytes, meta_bytes, file_bytes]);
}

function slice_intersect(
  a: { offset: number; size: number },
  b: { offset: number; size: number }
) {
  if (a.offset + a.size < b.offset) return false;
  if (a.offset > b.offset + b.size) return false;
  return true;
}
