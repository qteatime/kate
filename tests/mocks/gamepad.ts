/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */
import type { Page } from "playwright/test";
import type { KateGamepadInputSource } from "../../packages/kate-core/source/kernel";

export type MockGamepad = Gamepad & {
  new (id: string): MockGamepad;
  buttons: (GamepadButton & { press(x: boolean): void })[];
  move_axis(index: number, value: number): void;
  connect(source: KateGamepadInputSource): void;
  disconnect(source: KateGamepadInputSource): void;
  tick(): void;
};

export async function mock_gamepad(page: Page) {
  await page.evaluate(() => {
    let gamepad_index = 0;
    let gamepad_list: (MockGamepad | null)[] = [null, null, null, null];

    window.navigator.getGamepads = () => gamepad_list as any;

    class MockGamepad {
      constructor(readonly id: string) {}

      public axes = [0, 0, 0, 0];
      public buttons: MockGamepadButton[] = Array.from({ length: 16 }).map(
        () => new MockGamepadButton()
      );
      public connected = true;
      readonly index = ++gamepad_index;
      public mapping = "standard";
      public timestamp = 0;

      move_axis(index: number, value: number) {
        this.axes[index] = value;
      }

      static disconnect_all(source: KateGamepadInputSource) {
        for (const gamepad of gamepad_list) {
          if (gamepad != null) {
            gamepad.disconnect(source);
          }
        }
      }

      static reset_slots() {
        gamepad_index = 0;
        gamepad_list = [null, null, null, null];
      }

      // unfortunately mocking gamepad events is tricky
      connect(source: KateGamepadInputSource) {
        this.connected = true;
        const first_slot = gamepad_list.findIndex((x) => x === null);
        if (first_slot === -1) {
          throw new Error(`[gamepad mock] No available slots`);
        }
        gamepad_list.splice(first_slot, 1, this);
        (source as any).connect(this);
      }

      disconnect(source: KateGamepadInputSource) {
        this.connected = false;
        gamepad_list = gamepad_list.map((x) => (x === this ? null : x));
        (source as any).disconnect(this);
      }

      tick() {
        this.timestamp += 1;
      }
    }

    class MockGamepadButton {
      private _pressed: boolean = false;

      get pressed() {
        return this._pressed;
      }

      get touched() {
        return false;
      }

      get value() {
        return this._pressed ? 1 : 0;
      }

      press(value: boolean) {
        this._pressed = value;
      }
    }

    (window as any).MockGamepad = MockGamepad;
  });
}
