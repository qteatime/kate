/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export {};

declare global {
  interface Navigator {
    keyboard?: {
      getLayoutMap(): Promise<KeyboardLayoutMap>;
      lock(): Promise<void>;
      lock(keyCodes: string[]): Promise<void>;
      unlock(): void;
    };

    virtualKeyboard?: {
      overlaysContent: boolean;
    };

    locks: {
      request<T>(name: string, callback: (lock: Lock) => Promise<T>): Promise<T>;
    };
  }

  interface KeyboardLayoutMap {
    get(key: string): string;
    has(key: string): boolean;
  }
}
