/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { CartRuntime, KateRuntimes } from "./cart-runtime";
import { GamepadInput } from "./gamepad";
import { KeyboardInput } from "./input";
import { ConsoleOptions, VirtualConsole } from "./virtual";

export class KateKernel {
  readonly runtimes: KateRuntimes;

  private constructor(
    readonly console: VirtualConsole,
    readonly keyboard: KeyboardInput,
    readonly gamepad: GamepadInput
  ) {
    this.runtimes = new KateRuntimes(console);
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
    const keyboard = new KeyboardInput(console);
    const gamepad = new GamepadInput(console);
    console.listen();
    keyboard.listen(document.body);
    gamepad.setup();
    return new KateKernel(console, keyboard, gamepad);
  }

  enter_trusted_mode() {
    this.console.body.classList.add("trusted-mode");
    this.console.take_resource("trusted-mode");
  }

  exit_trusted_mode() {
    this.console.body.classList.remove("trusted-mode");
    this.console.release_resource("trusted-mode");
  }
}
