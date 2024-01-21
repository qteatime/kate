/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { UIScene, Widgetable } from "../deps/appui";
import { JSZip, ZipObject, _JSZip } from "../deps/jszip";
import { Pathname, gb } from "../deps/utils";
import * as Importers from "../importers";
import { SceneReview } from "./review";

export class SceneMain extends UIScene {
  render(): Widgetable {
    const ui = this.ui.dsl;

    return ui.two_panel_screen({
      left: ui.hero({
        title: "Kate Importer",
        subtitle: "Emulate non-Kate games in Kate.",
        content: ui.stack([
          ui.p([
            "Choose a game released for another platform. The importer will ",
            "convert it to a (emulated) Kate cartridge that you can install ",
            "and play like any other Kate game.",
          ]),
          ui.p(["Supported engines:"]),
          ui.ul([
            ui.flow([ui.strong(["Ren'Py"]), " ", ui.meta_text(["(7.x, 8.x — PC releases)"])]),
            ui.flow([ui.strong(["Bitsy"]), " ", ui.meta_text(["(HTML)"])]),
          ]),
        ]),
      }),
      right: ui.app_screen({
        body: ui
          .vbox({ gap: 2 }, [
            ui.title(["Import"], "h2"),
            ui.action_list([
              {
                icon: ui.fa_icon("folder-open", "2x"),
                title: "From folder",
                description: "Choose a folder directly containing your game",
                on_select: () => this.import_from_folder(),
              },
              {
                icon: ui.fa_icon("file-zipper", "2x"),
                title: "From ZIP",
                description: "Choose a ZIP distribution of your game",
                on_select: () => this.import_from_zip(),
              },
            ]),
          ])
          .style({ padding: "2rem 0" }),
        status: ui.status_bar([ui.status_icon(["ok"], "Import")]),
      }),
    });
  }

  async import_from_folder() {
    const files = await KateAPI.device_files.request_directory();
    try {
      const candidates = await this.ui.dialogs.progress({
        message: ["Analysing game files..."],
        process: async (_) => {
          return await Importers.candidates(files);
        },
      });
      if (candidates.length > 0) {
        this.ui.push_scene(new SceneReview(this.ui, candidates));
      } else {
        await this.ui.dialogs.message({
          message: [`No importable game found in the selected folder.`],
        });
      }
    } catch (e) {
      console.error(`Failed to prepare candidates:`, e);
      await this.ui.dialogs.message({
        message: [`Failed to import: an unknown internal error occurred while importing.`],
      });
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

    try {
      const candidates = await this.ui.dialogs.progress({
        message: ["Unpacking zip file..."],
        process: async (progress) => {
          const files = await unpack_zip(file);
          progress.set_message(["Analysing game files..."]);
          return await Importers.candidates(files);
        },
      });
      if (candidates.length > 0) {
        this.ui.push_scene(new SceneReview(this.ui, candidates));
      } else {
        await this.ui.dialogs.message({
          message: [`No importable game found in the selected ZIP file.`],
        });
      }
    } catch (e) {
      console.error(`Failed to prepare candidates:`, e);
      await this.ui.dialogs.message({
        message: [`Failed to import the zip file: file might be corrupted.`],
      });
    }
  }
}

async function unpack_zip(file: KateTypes.DeviceFileHandle) {
  const zip = await JSZip.loadAsync(await file.read(), { checkCRC32: true });
  return await zip_to_files(zip);
}

async function zip_to_files(zip: _JSZip) {
  const bucket = await KateAPI.file_store.make_temporary(gb(8));
  const file_list: { path: string; file: ZipObject }[] = [];
  zip.forEach((path, file) => {
    if (file.dir) {
      return;
    } else {
      file_list.push({ path, file });
    }
  });

  const files: KateTypes.DeviceFileHandle[] = [];
  for (const { path, file } of file_list) {
    const data = await file.async("uint8array");
    const file_handle = await bucket.create_file(path, data);
    files.push({
      relative_path: Pathname.from_string(path),
      read: async () => {
        return file_handle.read_slice(0);
      },
      __fake: true,
    } as any as KateTypes.DeviceFileHandle);
  }

  return files;
}
