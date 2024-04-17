/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { App } from "../core/app";
import { generate, make_thumbnail, parse, pick_thumbnail } from "../core/project";
import { UI, UIScene, Widgetable } from "../deps/appui";
import { Observable, Pathname } from "../deps/utils";
import { SceneReview } from "./review";

type State = {
  developer: null | KateTypes.developer.DeveloperProfile;
  project: null | {
    files: KateTypes.DeviceFileHandle[];
    metadata: ReturnType<typeof parse>;
    thumbnail_url: string | null;
  };
};

export class SceneMain extends UIScene {
  readonly state = new Observable<State>({
    developer: null,
    project: null,
  });

  constructor(readonly app: App, ui: UI) {
    super(ui);
  }

  async render(): Promise<Widgetable> {
    return this.welcome();
  }

  welcome() {
    const ui = this.ui.dsl;
    return ui.two_panel_screen({
      left: ui.hero({
        title: "Kate Publisher",
        subtitle: "Create your own Kate cartridges.",
        content: ui.stack([
          ui.p([
            "The Publisher will help you create your own distributable ",
            "Kate cartridges. You'll need to provide it with a folder ",
            "containing your cartridge build configuration.",
          ]),
          ui.p([
            "Note that the Publisher only works on Chromium-based browsers ",
            "currently (Chrome, Edge, Kate's native app).",
          ]),
        ]),
      }),
      right: ui.app_screen({
        body: ui
          .container([
            ui.scroll_area({}, [
              ui
                .vbox({ gap: 0.5, align: "flex-start" }, [
                  ui
                    .section({
                      title: "Developer profile",
                      body: ui.stack([
                        ui.meta_text(["You cartridge will be signed with this account."]),
                        ui.update_panel({
                          on_click: () => {
                            this.select_developer_profile();
                          },
                          content: ui.dynamic(
                            this.state.map((x) => {
                              if (x.developer == null) {
                                return ui.meta_text(["(Not selected)"]);
                              } else {
                                return ui.stack([
                                  ui.strong([x.developer.name]),
                                  ui.meta_text([x.developer.domain]),
                                  ui.when(
                                    x.project != null &&
                                      !x.project.metadata.id.startsWith(x.developer.domain + "/"),
                                    [
                                      ui.alert({
                                        kind: "error",
                                        content: `Developer domain doesn't match the work's domain`,
                                      }),
                                    ]
                                  ),
                                ]);
                              }
                            })
                          ),
                        }),
                      ]),
                    })
                    .style({ width: "100%" }),

                  ui
                    .section({
                      title: "Your project",
                      body: ui.update_panel({
                        on_click: () => {
                          this.select_project();
                        },
                        content: ui.dynamic(
                          this.state.map((x) => {
                            if (x.project == null) {
                              return ui.meta_text([
                                "(Choose a directory containing a ",
                                ui.mono_text(["'kate.json'"]),
                                " build configuration file)",
                              ]);
                            } else {
                              return ui.cartridge_chip({
                                thumbnail_dataurl: x.project.thumbnail_url,
                                id: x.project.metadata.id,
                                title: x.project.metadata.metadata.presentation.title,
                              });
                            }
                          })
                        ),
                      }),
                    })
                    .style({ width: "100%" }),
                ])
                .style({ padding: "2rem" }),
            ]),
            ui.floating_button({
              label: "Create cartridge",
              on_click: () => {
                this.generate_cartridge();
              },
              enabled: this.state.map((x) => x.developer != null && x.project != null),
            }),
          ])
          .style({ height: "100%" }),
        status: ui.status_bar([ui.dynamic_status_icons()]),
      }),
    });
  }

  async select_developer_profile() {
    const profile = await KateAPI.developer.get_developer_profile();
    this.state.value = { ...this.state.value, developer: profile };
  }

  async generate_cartridge() {
    const { developer, project } = this.state.value;
    if (developer == null || project == null) {
      return;
    }

    try {
      const result = await this.ui.dialogs.progress({
        message: ["Generating cartridge..."],
        process: async (progress) => {
          return await generate(developer, project.metadata, project.files, (message) => {
            progress.set_message([message]);
          });
        },
      });
      this.ui.push_scene(new SceneReview(this.ui, result), async () => {
        await result.bucket.delete();
      });
    } catch (e) {
      console.error("Failed to generate cartridge:", e);
      await this.ui.dialogs.message({
        message: [`Failed to generate the cartridge: ${String(e)}`],
      });
    }
  }

  async select_project() {
    const ui = this.ui;

    const files = await KateAPI.device_files.request_directory();
    try {
      const meta_file = files.find((x) => x.relative_path.as_string() === "/kate.json");
      if (meta_file == null) {
        await ui.dialogs.message({
          title: ["No catridge build configuration"],
          message: [
            `The selected folder does not have a 'kate.json' build configuration file
             at its root. You need a build configuration to generate a cartridge.`,
          ],
        });
        return;
      }
      const source = new TextDecoder().decode(await meta_file.read());
      const json = parse(source);
      const thumbnail = await pick_thumbnail(files, json.metadata.presentation.thumbnail_path);
      this.state.value = {
        ...this.state.value,
        project: {
          metadata: json,
          thumbnail_url: thumbnail,
          files: files,
        },
      };
    } catch (error) {
      await ui.dialogs.message({
        title: ["Invalid build configuration"],
        message: [`Could not load the 'kate.json' build configuration: ${String(error)}`],
      });
    }
  }
}
