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

import { SemVer } from "../utils";
import { ProcessManager } from "./process";
import { ConsoleOptions, VirtualConsole } from "./virtual";
const version = require("../../package.json").version;
const build = require("../../../../kate-buildinfo.json").build;
const semver = SemVer.try_parse(version, build)!;

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
