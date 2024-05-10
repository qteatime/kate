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
 *
 * This file is part of the cartridge linking exception as described
 * in COPYING.
 */

import type { KateIPC } from "./channel";

export class KateDialogs {
  #channel: KateIPC;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  async text_input(
    message: string,
    options: {
      type: "text" | "password";
      initial_value?: string;
      max_length?: number;
      placeholder?: string;
    }
  ): Promise<string | null> {
    return await this.#channel.call("kate:dialog.text-input", {
      message,
      initial_value: options.initial_value,
      max_length: options.max_length,
      type: options.type,
      placeholder: options.placeholder,
    });
  }

  async message(message: string): Promise<void> {
    await this.#channel.call("kate:dialog.message", { message });
  }
}
