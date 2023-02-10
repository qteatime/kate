import { CartRuntime, KateRuntimes } from "./cart-runtime";
import { KeyboardInput } from "./input";
import { KateLoader } from "./loader";
import { VirtualConsole } from "./virtual";

export class Kate {
  readonly loader = new KateLoader();
  readonly runtimes: KateRuntimes;

  private constructor(
    readonly console: VirtualConsole,
    readonly keyboard: KeyboardInput
  ) {
    this.runtimes = new KateRuntimes(console);
  }

  static from_root(root: HTMLElement) {
    const console = new VirtualConsole(root);
    const keyboard = new KeyboardInput(console);
    console.listen();
    keyboard.listen(document.body);
    return new Kate(console, keyboard);
  }
}
