import { EMessageFailed, handler } from "./handlers";
import { TC } from "../../utils";

export default [
  handler(
    "kate:browser.open",
    TC.spec({ url: TC.url }),
    async (os, env, ipc, { url }) => {
      try {
        await os.browser.open(env.cart.id, url);
      } catch (error) {
        throw new EMessageFailed(
          "kate.browser.not-allowed",
          `Failed to open ${url}`
        );
      }
    }
  ),
];
