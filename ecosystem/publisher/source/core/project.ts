/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { GlobPatternList, Pathname, Spec as T, from_bytes } from "../deps/utils";
import { Version, apply_recipe, config, metadata, mime_table, spec_version } from "../deps/tools";
import { kart_v6 as Cart, kart_v6 } from "../deps/schema";

type BuildConfig = ReturnType<typeof config>;

export type CartridgeData = {
  filename: string;
  bucket: KateTypes.FileBucket;
  cart: KateTypes.KateFile;
  total_size: bigint;
  files: KateTypes.DeviceFileHandle[];
  archive: Cart.Meta_file[];
  config: BuildConfig;
};

class KartWriter {
  private offset = 0n;
  constructor(
    readonly writer: WritableStreamDefaultWriter<Uint8Array>,
    readonly progress: (_: string) => void
  ) {}

  async write(bytes: Uint8Array) {
    await this.writer.write(bytes);
    this.offset += BigInt(bytes.byteLength);
  }

  async close() {
    await this.writer.close();
  }

  get current_offset() {
    return this.offset;
  }
}

export function parse(source: string) {
  const json0 = JSON.parse(source);
  const json1 = T.parse(config, json0);
  const json = apply_recipe(json1);
  return json;
}

function make_file_name(id: string, version: Version) {
  const [_, name] = id.split("/");
  const name_part = name.replace(/[^\w\d\-]/g, "") || "game";
  const version_part = `${version.major}.${version.minor}`;
  return `${name_part}_v${version_part}.kart`;
}

async function write_files(
  build: BuildConfig,
  files: KateTypes.DeviceFileHandle[],
  writer: KartWriter
) {
  const selected: { path: Pathname; handle: KateTypes.DeviceFileHandle }[] = [];
  const root_paths = [
    build.metadata.presentation.thumbnail_path,
    build.metadata.presentation.banner_path,
    build.metadata.legal?.licence_path,
    build.metadata.legal?.privacy_policy_path,
  ]
    .filter((x) => x != null)
    .map((x) => Pathname.from_string(x!).make_absolute().as_string());
  const root_prefix = build.root == null ? [] : [build.root];
  const patterns = GlobPatternList.from_patterns(build.files);
  for (const candidate of files) {
    const is_candidate = patterns.test(candidate.relative_path.drop_prefix(root_prefix));
    const is_in_root =
      build.root == null || candidate.relative_path.starts_with(Pathname.from_string(build.root));
    const is_special = root_paths.includes(candidate.relative_path.make_absolute().as_string());
    if ((is_candidate && is_in_root) || is_special) {
      selected.push({
        path: candidate.relative_path.drop_prefix(root_prefix).make_absolute(),
        handle: candidate,
      });
    }
  }

  const encoder = kart_v6.encode_files(selected.length);
  await writer.write(encoder.size);
  const result: Cart.Meta_file[] = [];
  for (const file of selected) {
    writer.progress(`Adding files to the cartridge (${result.length}/${selected.length})`);
    const ext = file.path.extname();
    const mime = mime_table[ext!] ?? "application/octet-stream";
    const data = await file.handle.read();
    const integrity = await crypto.subtle.digest("SHA-512", data.buffer);
    const offset = encoder.current_offset() + 4n;
    result.push(
      Cart.Meta_file({
        path: file.path.make_absolute().as_string(),
        mime: mime,
        integrity: new Uint8Array(integrity),
        "hash-algorithm": kart_v6.Hash_algorithm.Sha_512({}),
        offset: offset,
        size: data.byteLength,
      })
    );
    await writer.write(encoder.encode_file(data));
    console.debug(
      `:: Added ${file.handle.relative_path.as_string()} (${from_bytes(data.byteLength)})`
    );
  }

  encoder.close();
  return result;
}

export async function generate(
  developer: KateTypes.developer.DeveloperProfile | null,
  build: BuildConfig,
  files: KateTypes.DeviceFileHandle[],
  progress: (_: string) => void
): Promise<CartridgeData> {
  const filename = make_file_name(build.id, build.version);

  // -- Start cartridge stream
  const bucket = await KateAPI.file_store.make_temporary();
  const cart_handler = await bucket.create_file(filename, new Uint8Array([]));
  const cart_stream = await cart_handler.create_write_stream({ keep_existing_data: false });
  const writer = new KartWriter(cart_stream.getWriter(), progress);

  try {
    // -- Encode cartridge data
    writer.progress("Creating cartridge file...");
    await writer.write(kart_v6.encode_magic());
    const file_offset = writer.current_offset;
    const archive = await write_files(build, files, writer);
    writer.progress("Building cartridge metadata...");
    const meta_offset = writer.current_offset;
    const meta = metadata(build, archive);
    const unsigned_meta_bytes = kart_v6.encode_metadata(meta);
    let signature: null | Uint8Array = null;
    if (developer != null) {
      const signature = await KateAPI.developer.sign(developer, unsigned_meta_bytes);
      if (signature == null) {
        throw new Error(`Could not sign the cartridge. Aborting.`);
      }
    }

    const signed_meta = Cart.Metadata({
      ...meta,
      signature: [
        ...(signature == null || developer == null
          ? []
          : [
              Cart.Signature({
                "signed-by": developer.domain,
                "key-id": developer.fingerprint,
                signature: signature,
              }),
            ]),
      ],
    });
    await writer.write(kart_v6.encode_metadata(signed_meta));
    const header_offset = writer.current_offset;
    await writer.write(
      kart_v6.encode_header(
        Cart.Header({
          "minimum-kate-version": spec_version,
          "content-location": Cart.Binary_location({
            offset: file_offset,
            size: meta_offset - file_offset,
          }),
          "metadata-location": Cart.Binary_location({
            offset: meta_offset,
            size: header_offset - meta_offset,
          }),
        })
      )
    );
    const total_size = writer.current_offset;
    await writer.close();

    return {
      filename,
      bucket: bucket,
      cart: cart_handler,
      total_size,
      archive,
      files,
      config: build,
    };
  } catch (error) {
    await writer.close();
    throw error;
  }
}

export async function pick_thumbnail(files: KateTypes.DeviceFileHandle[], path: string | null) {
  const thumbnail_path =
    path == null ? null : Pathname.from_string(path).make_absolute().as_string();
  return await make_thumbnail(
    files.find((x) => x.relative_path.make_absolute().as_string() === thumbnail_path) ?? null
  );
}

export async function make_thumbnail(x: null | KateTypes.DeviceFileHandle) {
  if (x == null) {
    return null;
  } else {
    const data = await x.read();
    const bitmap = await createImageBitmap(new Blob([data], { type: "application/octet-stream" }));
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    return canvas.toDataURL("image/png");
  }
}
