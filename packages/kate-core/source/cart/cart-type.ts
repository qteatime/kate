import * as Metadata from "./v2/metadata";
import * as Runtime from "./v2/runtime";
import * as Files from "./v2/files";

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
