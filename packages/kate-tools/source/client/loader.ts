import type { kernel, os } from "../../../kate-core";

declare var Kate: {
  kernel: typeof kernel;
  os: typeof os;
};

async function main() {
  try {
    const kate = Kate.kernel.KateKernel.from_root(
      document.querySelector(".kate")!,
      {
        mode: "single",
      }
    );
    const kate_os = await Kate.os.KateOS.boot(kate);
    const loading = new Kate.os.apps.HUD_LoadIndicator(kate_os);
    kate_os.show_hud(loading);

    const cart_bytes = new Uint8Array(
      await (await fetch("game.kart")).arrayBuffer()
    );

    document.querySelector(".kate-hud-load-screen")!.textContent =
      "Click, touch, or press a key to start...";

    async function start() {
      window.removeEventListener("click", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("touchstart", start);

      await kate_os.processes.run_from_cartridge(cart_bytes);
      kate_os.hide_hud(loading);
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
