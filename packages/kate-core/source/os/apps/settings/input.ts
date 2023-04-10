import * as UI from "../../ui";

export class SceneInputSettings extends UI.SimpleScene {
  icon = "gamepad";
  title = ["Controller & Sensors"];

  body() {
    const data = this.os.settings.get("input");

    return [
      UI.h("h3", {}, ["Virtual buttons"]),
      UI.info_cell(
        UI.text_panel({
          title: "Haptic feedback",
          description: "Vibrate the console when a virtual button is touched",
        }),
        [
          UI.toggle(data.haptic_feedback_for_virtual_button, {
            on_changed: this.handle_haptics_change,
          }),
        ]
      ),
    ];
  }

  handle_haptics_change = async (x: boolean) => {
    await this.os.settings.update("input", (v) => ({
      ...v,
      haptic_feedback_for_virtual_button: x,
    }));
    await this.os.notifications.log(
      "kate:settings",
      "Updated input settings",
      `Haptic feedback on virtual input: ${x}`
    );
  };
}
