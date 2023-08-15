import { UIScene, Widgetable } from "../deps/appui";
import { JSZip, _JSZip } from "../deps/jszip";
import { Pathname } from "../deps/utils";
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

          ui.icon_button("file-zipper", {
            label: "Import from Zip",
            size: "4x",
            on_click: () => this.import_from_zip(),
          }),
        ]),
      ]),
    });
  }

  async import_from_folder() {
    const files = await KateAPI.device_files.request_directory();
    const candidates = await Importers.candidates(files);
    if (candidates.length > 0) {
      this.ui.push_scene(new SceneReview(this.ui, candidates));
    }
  }

  async import_from_zip() {
    const [file] = await KateAPI.device_files.request_file({
      multiple: false,
      strict: false,
      types: [{ type: "application/zip", extensions: [".zip"] }],
    });
    if (file == null) {
      return;
    }
    const files = await unpack_zip(file);
    const candidates = await Importers.candidates(files);
    if (candidates.length > 0) {
      this.ui.push_scene(new SceneReview(this.ui, candidates));
    }
  }
}

async function unpack_zip(file: KateTypes.DeviceFileHandle) {
  const zip = await JSZip.loadAsync(await file.read(), { checkCRC32: true });
  return await zip_to_files(zip);
}

async function zip_to_files(zip: _JSZip) {
  const files: Promise<KateTypes.DeviceFileHandle>[] = [];
  zip.forEach((path, file) => {
    if (file.dir) {
      return;
    }

    files.push(
      (async () => {
        const data = await file.async("uint8array");
        return {
          relative_path: Pathname.from_string(path),
          read: () => Promise.resolve(data),
          __fake: true,
        } as any as KateTypes.DeviceFileHandle;
      })()
    );
  });

  const real_files: KateTypes.DeviceFileHandle[] = [];
  for (const file of files) {
    real_files.push(await file);
  }
  return real_files;
}
