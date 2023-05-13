import * as Db from "../../data";
import type { Database } from "../../db-schema";
import type { ConsoleCase, GamepadMapping, InputKey } from "../../kernel";
import { EventStream } from "../../utils";

export type PlayHabits = {
  recently_played: boolean;
  play_times: boolean;
};

export type KeyboardToKate = {
  key: string;
  button: InputKey;
};

export type Input = {
  haptic_feedback_for_virtual_button: boolean;
  keyboard_mapping: KeyboardToKate[];
  gamepad_mapping: {
    standard: GamepadMapping[];
  };
  paired_gamepad: string | null;
};

export type UI = {
  sound_feedback: boolean;
  animation_effects: boolean;
  case_type: ConsoleCase;
};

export type SettingsData = {
  play_habits: PlayHabits;
  input: Input;
  ui: UI;
};

export type AnySetting = SettingsData[keyof SettingsData];

const defaults: SettingsData = {
  ui: {
    sound_feedback: true,
    animation_effects: true,
    case_type: {
      type: "handheld",
      resolution: 480,
      scale_to_fit: false,
    },
  },
  play_habits: {
    recently_played: true,
    play_times: true,
  },
  input: {
    haptic_feedback_for_virtual_button: true,
    keyboard_mapping: [
      {
        key: "ArrowUp",
        button: "up",
      },
      {
        key: "ArrowRight",
        button: "right",
      },
      {
        key: "ArrowDown",
        button: "down",
      },
      {
        key: "ArrowLeft",
        button: "left",
      },
      {
        key: "ShiftLeft",
        button: "menu",
      },
      {
        key: "ControlLeft",
        button: "capture",
      },
      {
        key: "KeyX",
        button: "x",
      },
      {
        key: "KeyZ",
        button: "o",
      },
      {
        key: "KeyA",
        button: "ltrigger",
      },
      {
        key: "KeyS",
        button: "rtrigger",
      },
    ],
    gamepad_mapping: {
      standard: [
        {
          type: "button",
          index: 12,
          pressed: "up",
        },
        {
          type: "button",
          index: 15,
          pressed: "right",
        },
        {
          type: "button",
          index: 13,
          pressed: "down",
        },
        {
          type: "button",
          index: 14,
          pressed: "left",
        },
        {
          type: "button",
          index: 9,
          pressed: "menu",
        },
        {
          type: "button",
          index: 8,
          pressed: "capture",
        },
        {
          type: "button",
          index: 0,
          pressed: "x",
        },
        {
          type: "button",
          index: 1,
          pressed: "o",
        },
        {
          type: "button",
          index: 4,
          pressed: "ltrigger",
        },
        {
          type: "button",
          index: 5,
          pressed: "rtrigger",
        },
        {
          type: "axis",
          index: 0,
          negative: "left",
          positive: "right",
        },
        {
          type: "axis",
          index: 1,
          negative: "up",
          positive: "down",
        },
      ],
    },
    paired_gamepad: null,
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

        const result: SettingsData = Object.create(null);
        for (const [key, default_value] of Object.entries(defaults)) {
          const stored = await settings.try_get(key);
          const value = { ...default_value, ...(stored?.data ?? {}) };
          result[key as keyof SettingsData] = value;
        }

        return result;
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
