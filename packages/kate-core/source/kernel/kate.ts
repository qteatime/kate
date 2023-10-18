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

  set_running_process(application_id: string, trusted: boolean) {
    this.console.body!.classList.toggle("trusted-mode", trusted);
    this.console.resources.set_running_process({ application_id, trusted });
  }
}
