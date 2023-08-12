import type { KateOS } from "../os";

export type DeviceFileHandle = {
  path: string;
  handle: FileSystemFileHandle;
};

export class KateDeviceFile {
  constructor(readonly os: KateOS) {}

  async open_file(
    requestee: string,
    options: {
      multiple?: boolean;
      strict?: boolean;
      types: { description: string; accept: { [mime: string]: string[] } }[];
    }
  ): Promise<DeviceFileHandle[]> {
    const handles = await window.showOpenFilePicker({
      multiple: options.multiple ?? false,
      excludeAcceptAllOption: options.strict ?? false,
      types: options.types,
    });
    await this.os.audit_supervisor.log(requestee, {
      resources: ["device-fs"],
      risk: "high",
      type: "kate.device-fs.grant.read-file",
      message: `Granted read access to ${handles.length} files.`,
      extra: { files: handles.map((x) => x.name) },
    });
    return handles.map((x) => ({ path: x.name, handle: x }));
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
          handle: handle as FileSystemFileHandle,
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
