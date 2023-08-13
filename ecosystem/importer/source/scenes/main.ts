import { UIScene, Widgetable } from "../deps/appui";
import * as Importers from "../importers";
import { SceneReview } from "./review";

export class SceneMain extends UIScene {
  render(): Widgetable {
    const ui = this.ui.dsl;

    return ui.app_screen({
      title: ui.title_bar({
        left: ui.title(["Kate Importer"]),
      }),
      body: ui.centered([
        ui.hbox({ gap: 2 }, [
          ui.icon_button("folder-open", {
            label: "Import from folder",
            size: "4x",
            on_click: () => this.import_from_folder(),
          }),
        ]),
      ]),
    });
  }

  async import_from_folder() {
    const files = await KateAPI.device_files.request_directory();
    const candidates = await Importers.candidates(files);
    this.ui.push_scene(new SceneReview(this.ui, candidates));
  }
}
