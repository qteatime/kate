import * as Db from "../../data";
import { Database } from "../../db-schema";

export type PlayHabits = {
  recently_played: boolean;
  play_times: boolean;
};

export type Input = {
  haptic_feedback_for_virtual_button: boolean;
};

export type SettingsData = {
  play_habits: PlayHabits;
  input: Input;
};

const defaults: SettingsData = {
  play_habits: {
    recently_played: true,
    play_times: true,
  },
  input: {
    haptic_feedback_for_virtual_button: true,
  },
};

export class KateSettings {
  private _data: SettingsData | null = null;

  constructor(readonly db: Database) {}

  get defaults() {
    return defaults;
  }

  static async load(db: Database) {
    const settings = new KateSettings(db);
    await settings.load();
    return settings;
  }

  get<K extends keyof SettingsData>(key: K): SettingsData[K] {
    if (this._data == null) {
      throw new Error(`get() called without settings being loaded`);
    }
    return this._data[key];
  }

  async load() {
    this._data = await this.db.transaction(
      [Db.settings],
      "readonly",
      async (t) => {
        const settings = t.get_table1(Db.settings);

        const play_habits: PlayHabits =
          (await settings.try_get("play_habits"))?.data ?? defaults.play_habits;
        const input: Input =
          (await settings.try_get("input"))?.data ?? defaults.input;

        return {
          play_habits,
          input,
        };
      }
    );
  }

  async update<K extends keyof SettingsData>(
    key: K,
    fn: (_: SettingsData[K]) => SettingsData[K]
  ) {
    await this.db.transaction([Db.settings], "readwrite", async (t) => {
      const settings = t.get_table1(Db.settings);
      const value = fn(this.get(key));
      settings.put({
        key: key,
        data: value,
        last_updated: new Date(),
      });
      this._data![key] = value;
    });
  }

  async reset_to_defaults() {
    await this.db.transaction([Db.settings], "readwrite", async (t) => {
      const settings = t.get_table1(Db.settings);
      for (const [key, value] of Object.entries(defaults)) {
        settings.put({
          key: key,
          data: value,
          last_updated: new Date(),
        });
        (this._data as any)[key] = value;
      }
    });
  }
}
