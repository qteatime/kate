/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { App } from "../core/app";
import { Project } from "../core/projects";
import { UI, UIScene, Widgetable } from "../deps/appui";
import { relative_date } from "../deps/utils";
import { SceneRecipeImporter } from "./recipe-importer";

export class SceneMain extends UIScene {
  constructor(readonly app: App, ui: UI) {
    super(ui);
  }

  async render(): Promise<Widgetable> {
    const projects = await this.app.projects.list();

    if (projects.length === 0) {
      return this.welcome();
    } else {
      return this.project_list(projects);
    }
  }

  welcome() {
    const ui = this.ui.dsl;
    return ui.two_panel_screen({
      left: ui.hero({
        title: "Kate Publisher",
        subtitle: "Create your own Kate cartridges.",
        content: ui.stack([
          ui.p([
            "The Publisher allows you to convert games from supported ",
            "engines into proper Kate cartridges. It also lets you export ",
            "cartridges for other platforms.",
          ]),
          ui.p([
            "You can start by creating a new project, or importing an ",
            "existing Publisher project you have on disk.",
          ]),
          ui.p([
            "The Publisher has special support for Bitsy and Ren'Py currently, ",
            "but most web games can be converted to Kate cartridges with some effort.",
          ]),
        ]),
      }),
      right: ui.app_screen({
        body: ui
          .vbox({ gap: 2 }, [
            ui.title(["New project..."], "h2"),
            ui.action_list([
              {
                icon: ui.fa_icon("wand-magic-sparkles", "2x"),
                title: "From a recipe",
                description: `
                If you have a game in a supported engine, the Publisher
                can handle most of the conversion to Kate for you.
              `,
                on_select: () => {
                  this.ui.push_scene(new SceneRecipeImporter(this.app, this.ui));
                },
              },
            ]),
          ])
          .style({ padding: "2rem 0" }),
        status: ui.status_bar([ui.dynamic_status_icons()]),
      }),
    });
  }

  project_list(projects: KateTypes.object_store.Object<Project>[]) {
    const ui = this.ui.dsl;

    return ui.app_screen({
      title: "Your projects",
      body: ui.scroll_area({}, [
        ui.action_list(
          projects.map((x) => {
            return {
              icon: ui.fa_icon("diamond", "2x"),
              title: x.data.meta.title,
              description: `${x.data.domain}/${x.data.id} | Last updated ${relative_date(
                x.updated_at
              )}`,
              on_select() {},
            };
          })
        ),
      ]),
      status: ui.status_bar([ui.dynamic_status_icons()]),
    });
  }
}
