/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
