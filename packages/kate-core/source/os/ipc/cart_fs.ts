import { EMessageFailed, handler } from "./handlers";
import { TC } from "../../utils";

export default [
  handler(
    "kate:cart.read-file",
    TC.spec({ path: TC.str }),
    async (os, env, ipc, { path }) => {
      try {
        const file = await env.read_file(path);
        return { mime: file.mime, bytes: file.data };
      } catch (error) {
        console.error(
          `[Kate] failed to read file ${path} from ${env.cart.metadata.id}`
        );
        throw new EMessageFailed(
          "kate.cart-fs.file-not-found",
          `Failed to read file ${path}`
        );
      }
    }
  ),
];
