import { UIScene, Widgetable } from "../deps/appui";

export class SceneMain extends UIScene {
  render(): Widgetable {
    const ui = this.ui.dsl;

    return ui.app_screen({
      title: ui.title_bar({
        left: ui.title(["Kate Importer"]),
      }),
      body: ui.class("imp-choice", []),
    });
  }
}
