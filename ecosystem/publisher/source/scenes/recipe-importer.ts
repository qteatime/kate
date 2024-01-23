/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { App } from "../core/app";
import { UI, UIScene } from "../deps/appui";
import { Observable } from "../deps/utils";

type RecipeType = "renpy" | "bitsy" | "web";
type DeveloperProfile = { domain: string; name: string };

export class SceneRecipeImporter extends UIScene {
  readonly data = {
    recipe_type: new Observable<RecipeType | null>(null),
    account: new Observable<DeveloperProfile | null>(null),
  };

  constructor(readonly app: App, ui: UI) {
    super(ui);
  }

  render() {
    return this.ui.dsl.multistep(
      [
        {
          content: this.choose_recipe(),
          is_valid: this.data.recipe_type.map((x) => x !== null),
        },
        {
          content: this.choose_account(),
          is_valid: this.data.account.map((x) => x !== null),
        },
      ],
      { slot_for_actions: "actions" }
    );
  }

  choose_recipe() {
    const ui = this.ui.dsl;
    return ui.two_panel_screen({
      left: ui.hero({
        title: "Your game's engine",
        subtitle: "What did you use to make your game?",
        content: ui.stack([
          ui.p([
            "Kate has special support for a few game engines. If you've used ",
            "one of them we can handle most of the conversion from that engine to ",
            "Kate cartridges for you.",
          ]),
          ui.p([
            "Otherwise, most games exported for a web browser can be ",
            "converted to a Kate cartridge with some effort. This will require ",
            "some knowledge of web programming and some fiddling with different ",
            "strategies to let Kate emulate the web APIs your game uses.",
          ]),
        ]),
      }),
      right: ui.app_screen({
        body: ui
          .vbox({ gap: 2 }, [
            ui
              .scroll_area({}, [
                ui.action_selection({
                  value: this.data.recipe_type.value,
                  on_change: (x) => {
                    this.data.recipe_type.value = x;
                  },
                  options: [
                    {
                      title: "Ren'Py",
                      description: `Use the recipe for Ren'Py 7.x and newer`,
                      value: "renpy" as const,
                    },
                    {
                      title: "Bitsy",
                      description: `Use the recipe for Bitsy. Might not support Bitsy hacks.`,
                      value: "bitsy" as const,
                    },
                    {
                      title: "Web game",
                      description: `Use the basic recipe for web games. You'll need to handle 
                   specific features for your game later.
                  `,
                      value: "web" as const,
                    },
                  ],
                }),
              ])
              .style({ padding: "2rem 0", "flex-grow": "1" }),
            ui.slot("actions").style({ "flex-shrink": "0" }),
          ])
          .style({ "padding-bottom": "1rem", height: "100%" }),
        status: ui.status_bar([ui.dynamic_status_icons()]),
      }),
    });
  }

  choose_account() {
    return "";
  }
}
