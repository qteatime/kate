import { CartRuntime, KateRuntimes } from "./cart-runtime";
import { GamepadInput } from "./gamepad";
import { KeyboardInput } from "./input";
import { KateLoader } from "./loader";
import { VirtualConsole } from "./virtual";

export class KateKernel {
  readonly loader = new KateLoader();
  readonly runtimes: KateRuntimes;

  private constructor(
    readonly console: VirtualConsole,
    readonly keyboard: KeyboardInput,
    readonly gamepad: GamepadInput
  ) {
    this.runtimes = new KateRuntimes(console);
  }

  static from_root(root: HTMLElement) {
    const console = new VirtualConsole(root);
    const keyboard = new KeyboardInput(console);
    const gamepad = new GamepadInput(console);
    console.listen();
    keyboard.listen(document.body);
    gamepad.setup();
    return new KateKernel(console, keyboard, gamepad);
  }
}
