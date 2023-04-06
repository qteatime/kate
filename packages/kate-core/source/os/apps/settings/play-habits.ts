import * as UI from "../../ui";

export class ScenePlayHabits extends UI.SimpleScene {
  icon = "gamepad";
  title = ["Play habits"];

  body() {
    const data = this.os.settings.get("play_habits");

    return [
      `Play habits data is stored only locally. It's used by Kate for
       filtering and sorting cartridges when displaying your library,
       and nothing else.
       You can still disable storing this data here.`,

      new UI.Space({ height: 32 }),

      UI.info_line(
        UI.text_panel({
          title: "Last played time",
          description: "Record the last time you played a cartridge.",
        }),
        [
          UI.toggle(data.recently_played, {
            on_changed: this.handle_last_played_change,
          }),
        ]
      ),
      UI.info_line(
        UI.text_panel({
          title: "Total play time",
          description: "Record how many minutes you've played a cartridge.",
        }),
        [
          UI.toggle(data.play_times, {
            on_changed: this.handle_play_time_change,
          }),
        ]
      ),

      new UI.Space({ height: 16 }),
      new UI.Button(["Delete all stored play habits"]).on_clicked(
        this.handle_delete
      ),
    ];
  }

  handle_delete = async () => {
    const should_delete = await this.os.dialog.confirm("kate:settings", {
      title: "Delete stored playing habits?",
      message: `Recorded total play times and last play time will be deleted
                for all cartridges. This is an irreversible operation.`,
      cancel: "Keep data",
      ok: "Delete all play habits",
      dangerous: true,
    });
    if (should_delete) {
      await this.os.cart_manager.delete_play_habits();
    }
  };

  handle_last_played_change = async (x: boolean) => {
    await this.os.settings.update("play_habits", (v) => ({
      ...v,
      recently_played: x,
    }));
    await this.os.notifications.log(
      `kate:settings`,
      "Updated play habits",
      `Store cartridge's last played time: ${x}`
    );
  };

  handle_play_time_change = async (x: boolean) => {
    await this.os.settings.update("play_habits", (v) => ({
      ...v,
      play_times: x,
    }));
    await this.os.notifications.log(
      `kate:settings`,
      "Updated play habits",
      `Store cartridge's total play time: ${x}`
    );
  };
}
