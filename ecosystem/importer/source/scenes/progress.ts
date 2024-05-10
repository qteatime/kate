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

import { UI, UIScene, Widgetable } from "../deps/appui";
import { Observable } from "../deps/utils";

export class SceneProgress extends UIScene {
  readonly title = new Observable<Widgetable>("");
  readonly message = new Observable<Widgetable>("");
  readonly progress = new Observable<Widgetable>(null);
  private _closed: boolean = false;

  static show(ui: UI) {
    const result = new SceneProgress(ui);
    ui.push_scene(result);
    return result;
  }

  render(): Widgetable {
    const ui = this.ui.dsl;

    return ui.app_screen({
      body: ui.hero({
        title: ui.dynamic(this.title),
        subtitle: ui.dynamic(this.message),
        content: ui.centered([ui.dynamic(this.progress)]),
      }),
    });
  }

  set_message(title: string, subtitle: string = "") {
    this.title.value = title;
    this.message.value = subtitle;
    return this;
  }

  remove_progress() {
    this.progress.value = null;
    return this;
  }

  set_unknown_progress() {
    this.progress.value = this.ui.dsl.fa_icon("spinner", "4x", "solid", "spin-pulse");
    return this;
  }

  close() {
    if (this._closed) {
      return;
    }

    this._closed = true;
    this.ui.pop_scene(this);
  }
}
