import type { kernel, os, cart, data } from "../../../kate-core";

declare var Kate: {
  kernel: typeof kernel;
  os: typeof os;
  cart: typeof cart;
  data: typeof data;
};

type Config = {
  case_mode?: kernel.ConsoleCase;
};

(window as any).KateNative = null;

const default_config: Config = {
  case_mode: {
    type: "handheld",
    resolution: 480,
    scale_to_fit: false,
  },
};

async function main() {
  try {
    const config0 = JSON.parse(
      document.querySelector("#kate-config")!.textContent!
    );
    const config: Config = Object.assign({}, default_config, config0);

    const kate = Kate.kernel.KateKernel.from_root(
      document.querySelector(".kate")!,
      {
        mode: "single",
        persistent_storage: false,
        case: config.case_mode,
      }
    );

    const cart_bytes = new Uint8Array(
      await (await fetch("game.kart")).arrayBuffer()
    );
    const cart = Kate.cart.parse(cart_bytes);

    const kate_os = await Kate.os.KateOS.boot(kate, {
      database: `kate/${cart.metadata.id}`,
      set_case_mode: false,
    });

    if (config.case_mode != null) {
      kate.console.set_case(config.case_mode);
    }

    await Kate.data.ObjectStorage.transaction(
      kate_os.db,
      "readwrite",
      async (storage) => {
        await storage.initialise(cart.metadata.id, cart.metadata.version_id);
      }
    );

    document.querySelector("#kate-loading")!.textContent =
      "Click, touch, or press a key to start...";

    async function start() {
      window.removeEventListener("click", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("touchstart", start);

      try {
        await kate_os.processes.run_from_cartridge(cart_bytes);
        document.querySelector("#kate-loading")?.remove();
      } catch (error) {
        alert(`Kate failed to run the cartridge: ${error}`);
        console.error("[Kate] failed to run the cartridge", error);
      }
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
