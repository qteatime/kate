import { defer } from "../../util/build/promise";
import type { KateIPC } from "./channel";
import type { ExtendedInputKey } from "./input";

export class KateCapture {
  readonly CAPTURE_FPS = 24;
  readonly CAPTURE_FORMAT = { mimeType: "video/webm; codecs=vp9" };
  readonly CAPTURE_MAX_LENGTH = 60000;
  #channel: KateIPC;
  #initialised: boolean = false;
  #capture_root: HTMLCanvasElement | null = null;
  #capture_monitor: RecorderMonitor | null = null;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  setup() {
    if (this.#initialised) {
      throw new Error(`setup() called twice`);
    }
    this.#initialised = true;
    this.#channel.events.key_pressed.listen(this.#handle_key_press);
  }

  set_root(element: HTMLCanvasElement | null) {
    if (element != null && !(element instanceof HTMLCanvasElement)) {
      throw new Error(
        `Invalid root for captures. Kate captures only support <canvas>`
      );
    }

    this.#capture_root = element;
  }

  #handle_key_press = (key: ExtendedInputKey) => {
    if (this.#capture_root == null) {
      return;
    }

    switch (key) {
      case "capture": {
        this.#save_screenshot();
        break;
      }

      case "long_capture": {
        if (this.#capture_monitor != null) {
          this.#capture_monitor.stop((blob) => this.#save_video(blob));
          this.#capture_monitor = null;
        } else {
          this.#capture_monitor = this.#record_video();
        }
      }
    }
  };

  #record_video() {
    const data = defer<Blob>();

    const canvas = this.#capture_root!;
    const recorder = new MediaRecorder(
      canvas.captureStream(this.CAPTURE_FPS),
      this.CAPTURE_FORMAT
    );
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) {
        data.resolve(ev.data);
      }
    };
    recorder.start();
    this.#channel.send_and_ignore_result("kate:capture.start-recording", {});

    const monitor = new RecorderMonitor(recorder, data.promise);
    setTimeout(() => {
      monitor.stop((blob) => this.#save_video(blob));
    }, this.CAPTURE_MAX_LENGTH);

    return monitor;
  }

  async #save_video(blob: Blob) {
    const buffer = await blob.arrayBuffer();
    await this.#channel.call("kate:capture.save-recording", {
      data: new Uint8Array(buffer),
      type: "video/webm",
    });
  }

  async #save_screenshot() {
    const blob = await this.#take_screenshot();
    const buffer = await blob.arrayBuffer();
    await this.#channel.call("kate:capture.save-image", {
      data: new Uint8Array(buffer),
      type: "image/png",
    });
  }

  async #take_screenshot(): Promise<Blob> {
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

class RecorderMonitor {
  private _stopped: boolean = false;
  constructor(private recorder: MediaRecorder, readonly data: Promise<Blob>) {}

  async stop(save: (blob: Blob) => void) {
    if (this._stopped) {
      return;
    }

    this._stopped = true;
    this.recorder.stop();
    const data = await this.data;
    save(data);
  }
}
