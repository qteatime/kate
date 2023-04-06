import * as Db from "../../data";
import { Database } from "../../db-schema";

export type PlayHabits = {
  recently_played: boolean;
  play_times: boolean;
};

export type SettingsData = {
  play_habits: PlayHabits;
};

export class KateSettings {
  private _data: SettingsData | null = null;

  constructor(readonly db: Database) {}

  static async load(db: Database) {
    const settings = new KateSettings(db);
    await settings.load();
    return settings;
  }

  get(key: keyof SettingsData) {
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

        const play_habits: PlayHabits = (await settings.try_get("play_habits"))
          ?.data ?? {
          play_times: true,
          recently_played: true,
        };

        return {
          play_habits,
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
}
