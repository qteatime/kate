import { CartRuntime, KateRuntimes } from "./cart-runtime";
import { GamepadInput } from "./gamepad";
import { KeyboardInput } from "./input";
import { ConsoleOptions, VirtualConsole } from "./virtual";

export class KateKernel {
  readonly runtimes: KateRuntimes;

  private constructor(
    readonly console: VirtualConsole,
    readonly keyboard: KeyboardInput,
    readonly gamepad: GamepadInput
  ) {
    this.runtimes = new KateRuntimes(console);
  }

  static from_root(root: HTMLElement, options: Partial<ConsoleOptions>) {
    const console = new VirtualConsole(root, {
      mode: options.mode ?? "web",
      persistent_storage: options.persistent_storage ?? false,
    });
    const keyboard = new KeyboardInput(console);
    const gamepad = new GamepadInput(console);
    console.listen();
    keyboard.listen(document.body);
    gamepad.setup();
    return new KateKernel(console, keyboard, gamepad);
  }
}
