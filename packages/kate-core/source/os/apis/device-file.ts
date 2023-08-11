import type { KateOS } from "../os";

export class KateDeviceFile {
  constructor(readonly os: KateOS) {}

  async open_file(
    requestee: string,
    id: string,
    options: {
      multiple?: boolean;
      strict?: boolean;
      types: { description: string; accept: { [mime: string]: string[] } }[];
    }
  ) {
    const [file_handle] = await window.showOpenFilePicker({
      id: id,
      multiple: options.multiple ?? false,
      excludeAcceptAllOption: options.strict ?? false,
      types: options.types,
    });
  }
}
