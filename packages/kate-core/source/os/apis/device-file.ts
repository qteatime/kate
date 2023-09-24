/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateOS } from "../os";
import { h } from "../ui";

export type DeviceFileHandle = {
  path: string;
  handle: File;
};

export class KateDeviceFile {
  constructor(readonly os: KateOS) {}

  private single_file() {
    const single_file = h(
      "input",
      {
        type: "file",
        id: "kate-os-device-file-single",
        style: "display: none",
      },
      []
    );
    document.body.appendChild(single_file);
    return single_file as HTMLInputElement;
  }

  async open_file(
    requestee: string,
    options: {
      multiple?: boolean;
      strict?: boolean;
      types: { description: string; accept: { [mime: string]: string[] } }[];
    }
  ): Promise<DeviceFileHandle[]> {
    this.os.kernel.console.reset_all_keys();

    let handles: DeviceFileHandle[];
    if ("showOpenFilePicker" in window) {
      handles = await this.open_file_picker(options);
    } else {
      handles = await this.open_file_input(options);
    }

    await this.os.audit_supervisor.log(requestee, {
      resources: ["device-fs"],
      risk: "high",
      type: "kate.device-fs.grant.read-file",
      message: `Granted read access to ${handles.length} files.`,
      extra: { files: handles.map((x) => x.path) },
    });

    return handles;
  }

  private async open_file_input(options: {
    multiple?: boolean;
    strict?: boolean;
    types: { description: string; accept: { [mime: string]: string[] } }[];
  }): Promise<DeviceFileHandle[]> {
    const input = this.single_file();
    input.accept = options.types
      .flatMap((x) => Object.entries(x.accept).map(([k, v]) => [k, ...v]))
      .join(",");
    input.multiple = options.multiple ?? false;
    const result = new Promise<DeviceFileHandle[]>((resolve, reject) => {
      input.onchange = (ev) => {
        ev.preventDefault();
        if (input.files == null || input.files.length == 0) {
          reject(new Error(`Cancelled`));
        }

        const files: DeviceFileHandle[] = [];
        for (let i = 0; i < input.files!.length; ++i) {
          const file = input.files!.item(i)!;
          files.push({ path: file.name, handle: file });
        }
        resolve(files);
      };

      input.click();
    });
    result.finally(() => {
      input.remove();
    });
    return result;
  }

  private async open_file_picker(options: {
    multiple?: boolean;
    strict?: boolean;
    types: { description: string; accept: { [mime: string]: string[] } }[];
  }): Promise<DeviceFileHandle[]> {
    const handles = await window.showOpenFilePicker({
      multiple: options.multiple ?? false,
      excludeAcceptAllOption: options.strict ?? false,
      types: options.types,
    });
    return Promise.all(
      handles.map(async (x) => ({ path: x.name, handle: await x.getFile() }))
    );
  }

  async open_directory(requestee: string): Promise<DeviceFileHandle[]> {
    const handle = await window.showDirectoryPicker({ mode: "read" });
    const files = await directory_to_files(handle);
    await this.os.audit_supervisor.log(requestee, {
      resources: ["device-fs"],
      risk: "high",
      type: "kate.device-fs.grant.read-directory",
      message: `Granted read access to a directory containing ${files.length} files`,
      extra: { files: files.map((x) => x.path) },
    });
    return files;
  }
}

async function directory_to_files(
  directory: FileSystemDirectoryHandle
): Promise<DeviceFileHandle[]> {
  const files: DeviceFileHandle[] = [];
  const go = async (path: string, directory: FileSystemDirectoryHandle) => {
    for await (const [key, handle] of directory.entries()) {
      if (handle.kind === "file") {
        files.push({
          path: path + "/" + key,
          handle: await (handle as FileSystemFileHandle).getFile(),
        });
      }
      if (handle.kind === "directory") {
        await go(path + "/" + key, handle as FileSystemDirectoryHandle);
      }
    }
  };
  await go("", directory);
  return files;
}
