import * as UI from "../../ui";

export class ScenePlayHabits extends UI.SimpleScene {
  icon = "gamepad";
  title = ["Play habits"];

  body() {
    const data = this.os.settings.get("play_habits");
    const play_habit_list = UI.h("div", { class: "play-habit-history" }, []);
    this.load_history(play_habit_list);

    return [
      UI.p([
        `Kate stores, locally, data about the cartridges you play to
        support filtering and sorting them in the library by recency
        and usage.`,
      ]),
      UI.p([
        `You can disable collection of this data here, and also remove
         any previously collected data.`,
      ]),

      new UI.Space({ height: 32 }),

      UI.info_cell(
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
      UI.info_cell(
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

      new UI.Space({ height: 32 }),
      UI.h("h2", {}, ["Stored play habits"]),
      play_habit_list,
    ];
  }

  async load_history(container: HTMLElement) {
    container.textContent = "";
    const items = [];
    const history = await this.os.cart_manager.habit_history();
    for (const entry of history) {
      items.push(
        UI.focusable_container([
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
        ])
      );
    }
    UI.append(new UI.VBox(20, [...items]), container);
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
