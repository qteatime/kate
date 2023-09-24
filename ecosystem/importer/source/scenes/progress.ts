/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
    this.progress.value = this.ui.dsl.fa_icon(
      "spinner",
      "4x",
      "solid",
      "spin-pulse"
    );
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
