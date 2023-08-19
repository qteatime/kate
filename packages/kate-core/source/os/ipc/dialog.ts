import { TC } from "../../utils";
import { EMessageFailed, handler } from "./handlers";

export default [
  handler(
    "kate:dialog.text-input",
    TC.spec({
      type: TC.one_of(["text", "password"] as const),
      initial_value: TC.optional("", TC.str),
      message: TC.short_str(255),
      placeholder: TC.optional("", TC.str),
      max_length: TC.optional(undefined, TC.int),
    }),
    async (os, env, ipc, { type, message, placeholder, max_length }) => {
      if (
        !(await os.capability_supervisor.is_allowed(
          env.cart.id,
          "show-dialogs",
          { type: "text-input" }
        ))
      ) {
        console.error(
          `Blocked ${env.cart.id} from showing text-input dialog: capability not granted`
        );
        return null;
      }
      const result = await os.dialog.text_input(env.cart.id, message, {
        max_length: max_length ?? undefined,
        type: type,
        placeholder,
      });
      return result;
    }
  ),
];
