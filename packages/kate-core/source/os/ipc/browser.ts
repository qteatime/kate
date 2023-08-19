import { EMessageFailed, handler } from "./handlers";
import { TC } from "../../utils";

export default [
  handler(
    "kate:browser.open",
    TC.spec({ url: TC.url }),
    async (os, env, ipc, { url }) => {
      if (
        !(await os.capability_supervisor.is_allowed(env.cart.id, "open-urls", {
          url,
        }))
      ) {
        console.error(
          `Blocked ${env.cart.id} from opening ${url}: capability not granted`
        );
        return null;
      }

      try {
        await os.browser.open(env.cart.id, url);
      } catch (error) {
        console.error(
          `Failed to open ${url} at the request of ${env.cart.id}:`,
          error
        );
      }

      return null;
    }
  ),

  handler(
    "kate:browser.download",
    TC.spec({ filename: TC.short_str(255), data: TC.bytearray }),
    async (os, env, ipc, { filename, data }) => {
      if (
        !(await os.capability_supervisor.is_allowed(
          env.cart.id,
          "download-files",
          {}
        ))
      ) {
        console.error(
          `Blocked ${env.cart.id} from downloading ${filename}: capability not granted`
        );
        return null;
      }

      try {
        await os.browser.download(env.cart.id, filename, data);
      } catch (error) {
        console.error(
          `Failed to download ${filename} at the request of ${env.cart.id}:`,
          error
        );
      }

      return null;
    }
  ),
];
