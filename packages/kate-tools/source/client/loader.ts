import type { kernel, os, cart } from "../../../kate-core";

declare var Kate: {
  kernel: typeof kernel;
  os: typeof os;
  cart: typeof cart;
};

async function main() {
  try {
    const kate = Kate.kernel.KateKernel.from_root(
      document.querySelector(".kate")!,
      {
        mode: "single",
      }
    );

    const cart_bytes = new Uint8Array(
      await (await fetch("game.kart")).arrayBuffer()
    );
    const cart = Kate.cart.parse(cart_bytes);

    const kate_os = await Kate.os.KateOS.boot(kate, {
      database: `kate/${cart.metadata.id}`,
    });

    document.querySelector("#kate-loading")!.textContent =
      "Click, touch, or press a key to start...";

    async function start() {
      window.removeEventListener("click", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("touchstart", start);

      await kate_os.processes.run_from_cartridge(cart_bytes);
      document.querySelector("#kate-loading")?.remove();
    }
    window.addEventListener("touchstart", start);
    window.addEventListener("click", start);
    window.addEventListener("keydown", start);
  } catch (error) {
    alert(`Kate failed to start: ${error}`);
    console.error("[Kate] failed to start", error);
  }
}

main();
