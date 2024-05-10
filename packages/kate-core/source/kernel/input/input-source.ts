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

// An input source is anything that can provide a stream of input changes
// to the console. E.g.: an externally connected gamepad may listen to
// arbitrary user input, translate it into Kate-specific input keys, then
// emit events about those.
//
// This allows the console to converge all of these to the single source
// of truth about Kate's current input state, and also reflect that truth
// everywhere else.

import type { EventStream } from "../../utils";
import type { KateButton } from "./hardware-buttons";

// ## Digital input sources
//
// A digital input source is anything that translate to one of the Kate
// digital buttons (see `buttons.ts`). These buttons have exactly two
// states: `pressed` and `not pressed`. Such sources will provide a
// stream of `ButtonChangeEvent`s every time the state of a particular
// button changes.

export type ButtonChangeEvent = {
  button: KateButton;
  is_pressed: boolean;
};

export interface KateButtonInputSource {
  on_button_changed: EventStream<ButtonChangeEvent>;
}
