import { GlobPattern } from "../deps/utils";

export class BitsyImporter {
  static async accepts(files: KateTypes.DeviceFileHandle[]) {
    const is_html = GlobPattern.from_pattern("*.html");
    const matches = files.filter((x) => is_html.test(x.relative_path));
    const candidates = (await Promise.all(matches.map(try_bitsy_page))).flat();
    return candidates.map(
      (x) => new BitsyImporter(files, x.title, x.version, x.file)
    );
  }

  constructor(
    readonly files: KateTypes.DeviceFileHandle[],
    readonly title: string,
    readonly version: string | null,
    readonly entry: KateTypes.DeviceFileHandle
  ) {}
}

async function try_bitsy_page(file: KateTypes.DeviceFileHandle) {
  const decoder = new TextDecoder();
  const html = decoder.decode(await file.read());
  const dom = new DOMParser().parseFromString(html, "text/html");
  const bitsy_scripts = dom.querySelectorAll(
    `script[type="text/bitsyGameData"], script[type="text/bitsyFontData"], script[type="bitsyGameData"]`
  );
  const version_match = html.match(/# BITSY VERSION (\d+(?:\.\d+)?)/);
  const version = version_match != null ? version_match[1] : null;
  const title = dom.querySelector("title")?.textContent ?? "Untitled";
  if (bitsy_scripts.length > 0 || version != null) {
    return [{ title, file, version }];
  } else {
    return [];
  }
}
