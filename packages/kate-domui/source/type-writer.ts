import { unreachable } from "../../util/build/assert";
import { defer, sleep } from "../../util/build/promise";
import { Widget } from "./widget";

export class TypeWriterText extends Widget {
  private _timer: any = null;
  private _state: "idle" | "playing" | "waiting" | "done" = "idle";
  private _next: MarkedText[] = [];
  private _current: MarkedText | null = null;

  constructor(readonly text: MarkedText[], readonly speed_ms: number) {
    super();
    this._next = this.text.slice();
    this._current = null;
  }

  get state() {
    return this._state;
  }

  on_attached(): void {
    if (this.state !== "done") {
      this.play();
    }
  }

  on_detached(): void {
    this._state = "idle";
    clearTimeout(this._timer);
    this._timer = null;
  }

  on_done() {}

  play() {
    this._state = "playing";
    clearTimeout(this._timer);
    this._timer = setTimeout(this.handle_update, this.speed_ms);
  }

  reset() {
    this._next = this.text.slice();
    this._current = null;
    if (this.raw_node != null) {
      this.raw_node.textContent = "";
    }
  }

  render() {
    const element = document.createElement("div");
    element.className = "kate-type-writer-text";
    return element;
  }

  handle_update = async () => {
    if (this.state === "waiting" || this.state === "idle") {
      this._timer = setTimeout(this.handle_update, this.speed_ms);
      return;
    }
    if (this._state === "playing" && this._current == null) {
      const next = this._next.shift();
      if (next != null) {
        next.render(this.raw_node as HTMLElement);
        this._current = next;
      }
    }
    if (this._current != null) {
      this._state = "waiting";
      const new_state = await this._current.advance();
      switch (new_state) {
        case "continue": {
          this._state = "playing";
          break;
        }
        case "done": {
          this._state = "playing";
          this._current = this._next.shift() ?? null;
          break;
        }
        case "wait": {
          const result = defer<void>();
          KateAPI.input.on_key_pressed.once((key) => {
            if (key === "o") {
              result.resolve();
            }
          });
          const ctc = document.createElement("span");
          ctc.className = "kate-type-writer-text-ctc";
          this.raw_node?.appendChild(ctc);
          await result.promise;
          ctc.remove();
          this._state = "playing";
          break;
        }
        default:
          throw unreachable(new_state, "unhandled state");
      }
    }
    if (this._current == null && this._next.length === 0) {
      this._state = "done";
      clearTimeout(this._timer);
      this._timer = null;
      this.on_done();
    } else {
      this._timer = setTimeout(this.handle_update, this.speed_ms);
    }
  };
}

export abstract class MarkedText {
  abstract advance(): Promise<"continue" | "wait" | "done">;
  abstract render(parent: HTMLElement): void;
}

export class MT_Text extends MarkedText {
  private _position: number = 0;
  private _node: HTMLElement | null = null;
  // TODO: handle full graphemes, or leave slicing to user
  readonly characters: string[];

  constructor(readonly full_content: string) {
    super();
    this.characters = [...full_content];
  }

  render(node: HTMLElement) {
    const canvas = document.createElement("span");
    canvas.className = "kate-type-writer-text-node";
    node.appendChild(canvas);
    this._node = canvas;
  }

  async advance() {
    if (this._node == null) {
      console.log("=> not rendered");
      return "continue";
    }

    this._position += 1;
    this._node.textContent = this.characters.slice(0, this._position).join("");
    if (this._position >= this.characters.length) {
      return "done";
    } else {
      return "continue";
    }
  }
}

export class MT_Emphasis extends MarkedText {
  constructor(readonly child: MarkedText) {
    super();
  }

  render(node: HTMLElement) {
    const canvas = document.createElement("span");
    canvas.className = "kate-type-writer-text-emphasis";
    this.child.render(canvas);
    node.appendChild(canvas);
  }

  async advance() {
    return await this.child.advance();
  }
}

export class MT_Sleep extends MarkedText {
  constructor(readonly time_ms: number) {
    super();
  }

  render(parent: HTMLElement): void {}

  async advance() {
    await sleep(this.time_ms);
    return "done" as const;
  }
}

export class MT_Wait extends MarkedText {
  private _state: "wait" | "done" = "wait";

  render(parent: HTMLElement) {}

  async advance() {
    switch (this._state) {
      case "wait": {
        this._state = "done";
        return "wait";
      }
      case "done": {
        return "done";
      }
      default:
        throw unreachable(this._state, "unhandled state");
    }
  }
}
