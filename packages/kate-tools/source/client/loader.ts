/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
 */

import type { kernel, os, cart, data, capabilities } from "../../../kate-core";

declare var Kate: {
  kernel: typeof kernel;
  os: typeof os;
  cart: typeof cart;
  data: typeof data;
  capabilities: typeof capabilities;
};

type Config = {
  case_mode?: kernel.ConsoleCaseConfig;
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
    const config0 = JSON.parse(document.querySelector("#kate-config")!.textContent!);
    const config: Config = Object.assign({}, default_config, config0);

    const kate = Kate.kernel.KateKernel.from_root(document.querySelector(".kate-case")!, {
      mode: "single",
      persistent_storage: false,
      case: config.case_mode,
    });

    const blob = await (await fetch("game.kart")).blob();
    const cart = await Kate.cart.parse_metadata(blob, kate.version);
    const capabilities = Kate.capabilities.grants_from_cartridge(cart);

    const kate_os = await Kate.os.KateOS.boot(kate, {
      database: `kate/${cart.id}`,
      set_case_mode: false,
    });

    if (config.case_mode != null) {
      kate.console.case.reconfigure(config.case_mode);
    }

    await kate_os.db.transaction(
      [...Kate.data.ObjectStorage.tables, ...Kate.data.CapabilityStore.tables],
      "readwrite",
      async (txn) => {
        const object_store = new Kate.data.ObjectStorage(txn);
        const capability_store = new Kate.data.CapabilityStore(txn);

        await object_store.initialise_partitions(cart.id, cart.version);
        await capability_store.initialise_grants(cart.id, capabilities);
      }
    );

    document.querySelector("#kate-loading")!.textContent =
      "Click, touch, or press a key to start...";

    async function start() {
      window.removeEventListener("click", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("touchstart", start);

      try {
        await kate_os.processes.run_from_cartridge(blob);
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
