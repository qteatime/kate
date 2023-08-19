export declare class _JSZip {
  public constructor();

  file(path: string): ZipObject;
  file(path: string, data: Uint8Array, options?: FileOptions): this;

  forEach(fn: (relativePath: string, file: ZipObject) => void): void;

  generateAsync(options: GenerateOptions): Promise<Uint8Array>;
  static loadAsync(data: Uint8Array, options?: LoadOptions): Promise<_JSZip>;
}

declare class LoadOptions {
  checkCRC32?: boolean;
  createFolders?: boolean;
}

declare class GenerateOptions {
  type: "uint8array";
  compression?: "STORE" | "DEFLATE";
  compressionOptions?: { level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 };
  comment?: string;
  mimeType?: string;
  platform?: "DOS" | "UNIX";
  streamFiles?: boolean;
}

declare class FileOptions {
  binary?: boolean;
  date?: Date;
  compression?: "STORE" | "DEFLATE";
  compressionOptions?: { level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 };
  comment?: string;
  createFolders?: boolean;
  unixPermissions?: number;
  dosPermissions?: number;
}

export declare class ZipObject {
  name: string;
  dir: boolean;
  date: Date;
  comment: string;
  unixPermissions: number;
  dosPermissions: number;

  async(type: "uint8array"): Promise<Uint8Array>;
}

export const JSZip: typeof _JSZip = (window as any).JSZip;
