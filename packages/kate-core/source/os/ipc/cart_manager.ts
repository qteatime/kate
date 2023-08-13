import { TC } from "../../utils";
import { EMessageFailed, handler } from "./handlers";
import * as Cart from "../../cart";
import * as UI from "../ui";

export default [
  handler(
    "kate:cart-manager.install",
    TC.spec({ cartridge: TC.bytearray }),
    async (os, env, ipc, { cartridge }) => {
      const cart = Cart.parse(cartridge);
      const errors = await Cart.verify_integrity(cart);
      if (errors.length !== 0) {
        console.error(`Corrupted cartridge ${cart.id}`, errors);
        throw new EMessageFailed(
          "kate.cart-manager.corrupted",
          `Corrupted cartridge`
        );
      }

      if (
        !(await os.capability_supervisor.is_allowed(
          env.cart.id,
          "install-cartridges",
          { id: cart.id }
        ))
      ) {
        console.error(
          `Blocked ${env.cart.id} from installing a cartridge: capability not granted`
        );
        throw new EMessageFailed("kate.cart-manager.no-access", "No access");
      }

      const should_install = await os.dialog.confirm("kate:cart-manager", {
        title: "Install cartridge?",
        message: UI.stack([
          UI.paragraph([
            UI.strong([UI.mono_text([env.cart.id])]),
            " wants to install ",
            UI.strong([UI.mono_text([cart.id])]),
            " (",
            UI.mono_text([cart.metadata.presentation.title]),
            ")",
            " at version ",
            UI.strong([UI.mono_text([cart.version])]),
          ]),
        ]),
      });
      if (!should_install) {
        return null;
      }
      await os.cart_manager.install(cart);
      return null;
    }
  ),
];
