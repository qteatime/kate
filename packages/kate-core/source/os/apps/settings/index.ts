import * as UI from "../../ui";
import { ScenePlayHabits } from "./play-habits";
import { SceneRecovery } from "./recovery";

export class SceneSettings extends UI.SimpleScene {
  icon = "gear";
  title = ["Settings"];

  body() {
    return [
      UI.link_card({
        icon: "gamepad",
        title: "Play habits",
        description: "Recently played and play time",
        on_click: () => {
          this.os.push_scene(new ScenePlayHabits(this.os));
        },
      }),

      UI.link_card({
        icon: "stethoscope",
        title: "Diagnostics & Recovery",
        description: "Troubleshoot and reset parts of the console",
        on_click: () => {
          this.os.push_scene(new SceneRecovery(this.os));
        },
      }),
    ];
  }
}
