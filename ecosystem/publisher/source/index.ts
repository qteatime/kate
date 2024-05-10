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

import { App } from "./core/app";
import { UI } from "./deps/appui";
import { SceneMain } from "./scenes/main";

const root = document.querySelector("#canvas") as HTMLElement;
const ui = new UI(root, {
  on_key_pressed: KateAPI.input.on_key_pressed,
  on_pointer_click: KateAPI.pointer_input.on_clicked,
});

async function main() {
  const app = new App();
  ui.push_scene(new SceneMain(app, ui));
}

main();
