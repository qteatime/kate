import type { KateIPC } from "./channel";
import type { ExtendedInputKey } from "./input";

export class KateCapture {
  #channel: KateIPC;
  #initialised: boolean = false;
  #capture_root: HTMLCanvasElement | null = null;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  setup() {
    if (this.#initialised) {
      throw new Error(`setup() called twice`);
    }
    this.#initialised = true;
    this.#channel.events.key_pressed.listen(this.handle_key_press);
  }

  set_root(element: HTMLCanvasElement | null) {
    if (element != null && !(element instanceof HTMLCanvasElement)) {
      throw new Error(
        `Invalid root for captures. Kate captures only support <canvas>`
      );
    }
    this.#capture_root = element;
  }

  handle_key_press = (key: ExtendedInputKey) => {
    if (this.#capture_root == null) {
      return;
    }

    switch (key) {
      case "capture": {
        this.save_screenshot();
        break;
      }
    }
  };

  private async save_screenshot() {
    const blob = await this.take_screenshot();
    const buffer = await blob.arrayBuffer();
    await this.#channel.call("kate:capture.save-image", {
      data: new Uint8Array(buffer),
      type: blob.type,
    });
  }

  private async take_screenshot(): Promise<Blob> {
    const canvas = this.#capture_root;
    if (canvas == null) {
      throw new Error(`screenshot() called without a canvas`);
    }
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (blob == null) {
          reject(new Error(`Failed to capture a screenshot`));
        } else {
          resolve(blob);
        }
      });
    });
  }
}
