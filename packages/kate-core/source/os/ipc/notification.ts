import { TC } from "../../utils";
import { handler } from "./handlers";

export default [
  handler(
    "kate:notify.transient",
    TC.spec({
      title: TC.str,
      message: TC.str,
    }),
    async (os, env, ipc, { title, message }) => {
      await os.notifications.push_transient(env.cart.id, title, message);
      return null;
    }
  ),
];
