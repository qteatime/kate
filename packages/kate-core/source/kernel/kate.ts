/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { SemVer } from "../utils";
import { ProcessManager } from "./process";
import { ConsoleOptions, VirtualConsole } from "./virtual";
const version = require("../../package.json").version;
const semver = SemVer.try_parse(version)!;

export class KateKernel {
  readonly processes;
  readonly version = semver;

  private constructor(readonly console: VirtualConsole) {
    this.processes = new ProcessManager();
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
