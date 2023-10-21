/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { UI } from "./deps/appui";
import { SceneMain } from "./scenes/main";

const root = document.querySelector("#canvas")! as HTMLElement;
const ui = new UI(root, {
  on_key_pressed: KateAPI.input.on_key_pressed,
  on_pointer_click: KateAPI.pointer_input.on_clicked,
});

async function main() {
  ui.push_scene(new SceneMain(ui));
}

main();
