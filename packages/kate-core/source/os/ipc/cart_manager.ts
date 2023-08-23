import { TC } from "../../utils";
import { EMessageFailed, auth_handler, handler } from "./handlers";
import * as Cart from "../../cart";
import * as UI from "../ui";

export default [
  auth_handler(
    "kate:cart-manager.install",
    TC.spec({ cartridge: TC.bytearray }),
    { capabilities: [{ type: "install-cartridges" }] },
    async (os, env, ipc, { cartridge }) => {
      return await os.fairness_supervisor.with_resource(
        env.cart.id,
        "modal-dialog",
        async () => {
          const cart = Cart.parse(cartridge);
          const errors = await Cart.verify_integrity(cart);
          if (errors.length !== 0) {
            console.error(`Corrupted cartridge ${cart.id}`, errors);
            throw new EMessageFailed(
              "kate.cart-manager.corrupted",
              `Corrupted cartridge`
            );
          }

          const should_install = await os.dialog.confirm("kate:cart-manager", {
            title: "Install cartridge?",
            message: UI.stack([
              UI.paragraph([
                UI.strong([UI.mono_text([env.cart.id])]),
                " wants to install a cartridge:",
                UI.cartridge_chip(cart),
              ]),
            ]),
          });
          if (!should_install) {
            return null;
          }
          await os.cart_manager.install(cart);
          return null;
        }
      );
    }
  ),
];
