import { PlayHabits } from "../../../data";
import * as UI from "../../ui";

export class ScenePlayHabitsSettings extends UI.SimpleScene {
  icon = "calendar";
  title = ["Play habits"];

  body() {
    const data = this.os.settings.get("play_habits");
    const play_habit_list = UI.h("div", { class: "play-habit-history" }, []);
    this.load_history(play_habit_list);

    return [
      UI.p([
        `Kate stores data about the cartridges you play. This allows
         you to sort and filter cartridges by recency and usage time in
         your library.`,
      ]),
      UI.p([
        `The data is only stored in your device, but you can still disable
         any collection of this data here. You can also remove any previously
         stored data.`,
      ]),

      UI.vspace(32),

      UI.toggle_cell(this.os, {
        value: data.recently_played,
        title: "Last played time",
        description: "Record the last time you played a cartridge.",
        on_changed: this.handle_last_played_change,
      }),
      UI.toggle_cell(this.os, {
        value: data.play_times,
        title: "Total play time",
        description: "Record how many minutes you've played a cartridge.",
        on_changed: this.handle_play_time_change,
      }),

      UI.vspace(16),
      UI.button_panel(this.os, {
        title: "Delete all stored play habits",
        description:
          "Remove habits of uninstalled games, reset habits of installed games.",
        on_click: this.handle_delete,
        dangerous: true,
      }),

      UI.vspace(32),
      UI.h("h3", {}, ["Stored play habits"]),
      play_habit_list,
    ];
  }

  async load_history(container: HTMLElement) {
    container.textContent = "";
    const items = [];
    const history = await this.os.cart_manager.habit_history();
    for (const entry of history) {
      items.push(
        UI.interactive(
          this.os,
          UI.padded_container("s", [
            UI.text_panel({
              title: UI.fragment([
                entry.title,
                entry.installed
                  ? null
                  : UI.h("em", { style: "margin-left: 8px" }, [
                      "(not installed)",
                    ]),
              ]),
              description: UI.fragment([
                entry.play_time === 0
                  ? "No total play time recorded"
                  : `Played for ${coarse_play_time(entry.play_time)}`,
                UI.h("br", {}, []),
                entry.last_played === null
                  ? "No play date recorded"
                  : `Last played ${relative_play_date(entry.last_played)}`,
              ]),
            }),
          ]),
          [
            {
              key: ["menu"],
              label: "Options",
              on_menu: true,
              handler: () => {
                this.handle_play_entry_options(entry);
              },
            },
          ]
        )
      );
    }
    UI.append(new UI.VBox(20, [...items]), container);
  }

  handle_play_entry_options = async (
    entry: PlayHabits & { title: string; installed: boolean }
  ) => {
    const result = await this.os.dialog.pop_menu(
      "kate:settings",
      `${entry.title}`,
      [
        {
          label: "Delete play habits",
          value: "delete" as const,
        },
      ],
      null
    );
    switch (result) {
      case "delete": {
        await this.os.cart_manager.delete_single_play_habits(
          entry.id,
          !entry.installed
        );
        await this.os.notifications.log(
          "kate:settings",
          "Play habits deleted",
          `Deleted for ${entry.id}`
        );
        await this.load_history(
          this.canvas.querySelector(".play-habit-history")!
        );
        return;
      }
    }
  };

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
      await this.os.notifications.log(
        "kate:settings",
        "Play habits deleted",
        `Deleted for all cartridges`
      );
      await this.load_history(
        this.canvas.querySelector(".play-habit-history")!
      );
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

function coarse_play_time(x: number) {
  const second_threshold = 1_000 * 60; // 1 minute
  const minute_threshold = 1_000 * 60 * 15; // 15 minutes
  const hour_threshold = 1_000 * 60 * 60; // 1 hour

  if (x < second_threshold) {
    return "a little while";
  } else if (x < minute_threshold) {
    return "a few minutes";
  } else if (x < hour_threshold) {
    return `${Math.round(x / (1_000 * 60))} minutes`;
  } else {
    return plural(
      Math.round(x / hour_threshold),
      (_) => "1 hour",
      (n) => `${n} hours`
    );
  }
}

function relative_play_date(x: Date | null) {
  if (x == null) {
    return "never";
  } else {
    const year = x.getFullYear();
    const month = x.getMonth();
    const date = x.getDate();
    const now = new Date();

    if (year < now.getFullYear()) {
      return plural(
        now.getFullYear() - year,
        (_) => "last year",
        (n) => `${n} years ago`
      );
    } else if (year === now.getFullYear() && month < now.getMonth()) {
      return plural(
        now.getMonth() - month,
        (_) => "last month",
        (n) => `${n} months ago`
      );
    } else if (
      year === now.getFullYear() &&
      month === now.getMonth() &&
      date === now.getDate()
    ) {
      const d = now.getDate() - date;
      switch (d) {
        case 0:
          return "today";
        case 1:
          return "yesterday";
        default:
          return `${d} days ago`;
      }
    }
    return `during ${year}`;
  }
}

function plural(
  n: number,
  single: (_: string) => string,
  plural: (_: string) => string
) {
  if (n === 0) {
    return single(String(n));
  } else {
    return plural(String(n));
  }
}
