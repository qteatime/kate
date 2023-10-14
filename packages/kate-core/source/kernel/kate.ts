/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { KateRuntimes } from "./cart-runtime";
import { ConsoleOptions, VirtualConsole } from "./virtual";

export class KateKernel {
  readonly runtimes: KateRuntimes;

  private constructor(readonly console: VirtualConsole) {
    this.runtimes = new KateRuntimes(console);
  }

  get gamepad_source() {
    return this.console.button_input.gamepad_source;
  }

  get keyboard_source() {
    return this.console.button_input.keyboard_source;
  }

  static from_root(root: HTMLElement, options: Partial<ConsoleOptions>) {
    const console = new VirtualConsole(root, {
      mode: options.mode ?? "web",
      persistent_storage: options.persistent_storage ?? false,
      case: options.case ?? {
        type: "handheld",
        resolution: 480,
        scale_to_fit: false,
      },
    });
    console.listen();
    return new KateKernel(console);
  }

  enter_trusted_mode() {
    this.console.body!.classList.add("trusted-mode");
    this.console.resources.take("trusted-mode");
  }

  exit_trusted_mode() {
    this.console.body!.classList.remove("trusted-mode");
    this.console.resources.release("trusted-mode");
  }
}
