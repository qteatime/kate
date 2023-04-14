export {};

declare global {
  interface Navigator {
    keyboard?: {
      getLayoutMap(): Promise<KeyboardLayoutMap>;
      lock(): Promise<void>;
      lock(keyCodes: string[]): Promise<void>;
      unlock(): void;
    };
  }

  interface KeyboardLayoutMap {
    get(key: string): string;
    has(key: string): boolean;
  }
}
