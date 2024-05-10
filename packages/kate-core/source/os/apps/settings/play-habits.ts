/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
 */

import { PlayHabits } from "../../../data";
import { coarse_time_from_minutes, relative_date } from "../../../utils";
import * as UI from "../../ui";

export class ScenePlayHabitsSettings extends UI.SimpleScene {
  readonly application_id = "kate:settings:play-habits";
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
        title: "Record last played time",
        description: "Track and store (locally) the last time you played a cartridge.",
        on_changed: this.handle_last_played_change,
      }),
      UI.toggle_cell(this.os, {
        value: data.play_times,
        title: "Record total play time",
        description: "Track and store (locally) how many minutes you've played a cartridge.",
        on_changed: this.handle_play_time_change,
      }),

      UI.vspace(16),
      UI.button_panel(this.os, {
        title: "Delete all stored play habits",
        description: "Remove habits of uninstalled games, reset habits of installed games.",
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
    const carts = new Map((await this.os.cart_manager.list_all()).map((x) => [x.id, x]));
    const all_habits = await this.os.play_habits.all_in_database();
    const history = all_habits.map((x) => {
      const cart = carts.get(x.id) ?? null;
      return {
        id: x.id,
        installed: cart != null,
        title: cart?.metadata.presentation.title ?? x.id,
        play_time: x.play_time,
        last_played: x.last_played,
      };
    });
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
                  : UI.h("em", { style: "margin-left: 8px" }, ["(not installed)"]),
              ]),
              description: UI.fragment([
                entry.play_time === 0
                  ? "No total play time recorded"
                  : `Played for ${coarse_time_from_minutes(entry.play_time)}`,
                UI.h("br", {}, []),
                entry.last_played === null
                  ? "No play date recorded"
                  : `Last played ${relative_date(entry.last_played)}`,
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
    UI.append(new UI.VBox(1, [...items]), container);
  }

  handle_play_entry_options = async (entry: PlayHabits & { title: string; installed: boolean }) => {
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
        await this.os.play_habits.remove_one(entry.id, !entry.installed);
        await this.os.audit_supervisor.log("kate:settings", {
          resources: ["kate:habits"],
          risk: "low",
          type: "kate.habits.deleted.one",
          message: `Play habits deleted for ${entry.id}`,
          extra: { cartridge: entry.id },
        });
        await this.load_history(this.canvas.querySelector(".play-habit-history")!);
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
      await this.os.play_habits.remove_all();
      await this.os.audit_supervisor.log("kate:settings", {
        resources: ["kate:habits"],
        risk: "low",
        type: "kate.habits.deleted.all",
        message: "Play habits deleted for all cartridges",
      });
      await this.load_history(this.canvas.querySelector(".play-habit-history")!);
    }
  };

  handle_last_played_change = async (x: boolean) => {
    await this.os.settings.update("play_habits", (v) => ({
      ...v,
      recently_played: x,
    }));
    await this.os.audit_supervisor.log("kate:settings", {
      resources: ["kate:settings"],
      risk: "low",
      type: "kate.settings.habits.updated",
      message: "Updated play habits tracking settings",
      extra: { track_recently_played: x },
    });
  };

  handle_play_time_change = async (x: boolean) => {
    await this.os.settings.update("play_habits", (v) => ({
      ...v,
      play_times: x,
    }));
    await this.os.audit_supervisor.log("kate:settings", {
      resources: ["kate:settings"],
      risk: "low",
      type: "kate.settings.habits.updated",
      message: "Updated play habits tracking settings",
      extra: { track_total_play_time: x },
    });
  };
}
