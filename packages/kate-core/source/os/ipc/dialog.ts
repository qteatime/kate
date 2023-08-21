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
    async (
      os,
      env,
      ipc,
      { type, message, initial_value, placeholder, max_length }
    ) => {
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
        initial_value,
        placeholder,
      });
      return result;
    }
  ),

  handler(
    "kate:dialog.message",
    TC.spec({ message: TC.str }),
    async (os, env, ipc, { message }) => {
      if (
        !(await os.capability_supervisor.is_allowed(
          env.cart.id,
          "show-dialogs",
          { type: "message" }
        ))
      ) {
        console.error(
          `Blocked ${env.cart.id} from showing message dialog: capability not granted`
        );
        return null;
      }
      await os.dialog.message(env.cart.id, { title: "", message });
      return null;
    }
  ),
];
