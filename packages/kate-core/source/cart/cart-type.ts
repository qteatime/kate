import * as Metadata from "./v3/metadata";
import * as Runtime from "./v3/runtime";
import * as Files from "./v3/files";

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
