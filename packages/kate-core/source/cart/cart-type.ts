import * as Metadata from "./metadata";
import * as Runtime from "./runtime";
import * as Files from "./files";

export type Cart = {
  metadata: Metadata.Metadata;
  runtime: Runtime.Runtime;
  thumbnail: Files.File;
  files: Files.File[];
};

export type CartMeta = {
  metadata: Metadata.Metadata;
  runtime: Runtime.Runtime;
};
