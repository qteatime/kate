import { EMessageFailed, auth_handler, handler } from "./handlers";
import { TC } from "../../utils";

export default [
  auth_handler(
    "kate:browser.open",
    TC.spec({ url: TC.url }),
    {
      fail_silently: true,
      capabilities: [{ type: "open-urls" }],
    },
    async (os, env, ipc, { url }) => {
      try {
        await os.fairness_supervisor.with_resource(
          env.cart.id,
          "modal-dialog",
          async () => {
            await os.browser.open(env.cart.id, url);
          }
        );
      } catch (error) {
        console.error(
          `Failed to open ${url} at the request of ${env.cart.id}:`,
          error
        );
      }

      return null;
    }
  ),

  auth_handler(
    "kate:browser.download",
    TC.spec({ filename: TC.short_str(255), data: TC.bytearray }),
    {
      fail_silently: true,
      capabilities: [{ type: "download-files" }],
    },
    async (os, env, ipc, { filename, data }) => {
      try {
        await os.fairness_supervisor.with_resource(
          env.cart.id,
          "modal-dialog",
          async () => {
            await os.browser.download(env.cart.id, filename, data);
          }
        );
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
