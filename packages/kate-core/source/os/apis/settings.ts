import * as Db from "../../data";
import type { Database } from "../../db-schema";
import type { InputKey } from "../../kernel";
import { EventStream } from "../../utils";

export type PlayHabits = {
  recently_played: boolean;
  play_times: boolean;
};

export type KeyboardToKate = {
  key: string;
  buttons: InputKey[];
};

export type Input = {
  haptic_feedback_for_virtual_button: boolean;
  keyboard_mapping: KeyboardToKate[];
};

export type SettingsData = {
  play_habits: PlayHabits;
  input: Input;
};

export type AnySetting = SettingsData[keyof SettingsData];

const defaults: SettingsData = {
  play_habits: {
    recently_played: true,
    play_times: true,
  },
  input: {
    haptic_feedback_for_virtual_button: true,
    keyboard_mapping: [
      {
        key: "ArrowUp",
        buttons: ["up"],
      },
      {
        key: "ArrowRight",
        buttons: ["right"],
      },
      {
        key: "ArrowDown",
        buttons: ["down"],
      },
      {
        key: "ArrowLeft",
        buttons: ["left"],
      },
      {
        key: "ShiftLeft",
        buttons: ["menu"],
      },
      {
        key: "ControlLeft",
        buttons: ["capture"],
      },
      {
        key: "KeyX",
        buttons: ["x"],
      },
      {
        key: "KeyZ",
        buttons: ["o"],
      },
      {
        key: "KeyA",
        buttons: ["ltrigger"],
      },
      {
        key: "KeyS",
        buttons: ["rtrigger"],
      },
    ],
  },
};

export type ChangedSetting<K extends keyof SettingsData> = {
  key: K;
  value: SettingsData[K];
};

export class KateSettings {
  private _data: SettingsData | null = null;
  readonly on_settings_changed = new EventStream<
    ChangedSetting<keyof SettingsData>
  >();

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
          (await settings.try_get("play_habits"))?.data ?? {};
        const input: Input = (await settings.try_get("input"))?.data ?? {};

        return {
          play_habits: { ...defaults.play_habits, ...play_habits },
          input: { ...defaults.input, ...input },
        };
      }
    );
  }

  async update<K extends keyof SettingsData>(
    key: K,
    fn: (_: SettingsData[K]) => SettingsData[K]
  ): Promise<SettingsData[K]> {
    return await this.db.transaction([Db.settings], "readwrite", async (t) => {
      const settings = t.get_table1(Db.settings);
      const value = fn(this.get(key));
      settings.put({
        key: key,
        data: value,
        last_updated: new Date(),
      });
      this._data![key] = value;
      this.on_settings_changed.emit({ key, value });
      return value;
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
        this.on_settings_changed.emit({
          key: key as keyof SettingsData,
          value,
        });
      }
    });
  }
}
