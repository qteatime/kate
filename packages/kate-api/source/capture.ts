/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { defer } from "./util";
import type { KateIPC } from "./channel";
import type { KateInput } from "./input";

export class KateCapture {
  readonly CAPTURE_FPS = 24;
  readonly CAPTURE_FORMAT = { mimeType: "video/webm; codecs=vp9" };
  readonly CAPTURE_MAX_LENGTH = 60000;
  #channel: KateIPC;
  #initialised: boolean = false;
  #capture_root: HTMLCanvasElement | null = null;
  #capture_monitor: RecorderMonitor | null = null;

  constructor(channel: KateIPC, private _input: KateInput) {
    this.#channel = channel;
  }

  setup() {
    if (this.#initialised) {
      throw new Error(`setup() called twice`);
    }
    this.#initialised = true;

    this.#channel.events.take_screenshot.listen(({ token }) => {
      if (this.will_capture()) {
        this.#save_screenshot(token);
      }
    });

    this.#channel.events.start_recording.listen(({ token }) => {
      if (this.#capture_monitor != null) {
        return;
      }

      if (this.will_capture()) {
        this.#capture_monitor = this.#record_video(token);
      }
    });

    this.#channel.events.stop_recording.listen(() => {
      if (this.#capture_monitor == null) {
        return;
      }

      if (this.will_capture()) {
        this.#capture_monitor.stop((blob, token) => this.#save_video(blob, token));
        this.#capture_monitor = null;
      }
    });
  }

  set_root(element: HTMLCanvasElement | null) {
    if (element != null && !(element instanceof HTMLCanvasElement)) {
      throw new Error(`Invalid root for captures. Kate captures only support <canvas>`);
    }

    this.#capture_root = element;
  }

  will_capture() {
    if (this.#capture_root == null) {
      this.#channel.send_and_ignore_result("kate:notify.transient", {
        title: "Capture unsupported",
        message: "Screen capture is not available right now.",
      });
      return false;
    }

    return true;
  }

  #record_video(token: string) {
    const data = defer<Blob>();

    const canvas = this.#capture_root!;
    const recorder = new MediaRecorder(canvas.captureStream(this.CAPTURE_FPS), this.CAPTURE_FORMAT);
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) {
        data.resolve(ev.data);
      }
    };
    recorder.start();
    this.#channel.send_and_ignore_result("kate:capture.start-recording", {});

    const monitor = new RecorderMonitor(recorder, data.promise, token);
    setTimeout(() => {
      monitor.stop((blob) => this.#save_video(blob, token));
    }, this.CAPTURE_MAX_LENGTH);

    return monitor;
  }

  async #save_video(blob: Blob, token: string) {
    const buffer = await blob.arrayBuffer();
    await this.#channel.call(
      "kate:capture.save-recording",
      {
        data: new Uint8Array(buffer),
        type: "video/webm",
        token: token,
      },
      [buffer]
    );
  }

  async #save_screenshot(token: string) {
    const blob = await this.#take_screenshot();
    const buffer = await blob.arrayBuffer();
    await this.#channel.call(
      "kate:capture.save-image",
      {
        data: new Uint8Array(buffer),
        type: "image/png",
        token: token,
      },
      [buffer]
    );
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
  constructor(
    private recorder: MediaRecorder,
    readonly data: Promise<Blob>,
    readonly token: string
  ) {}

  async stop(save: (blob: Blob, token: string) => void) {
    if (this._stopped) {
      return;
    }

    this._stopped = true;
    this.recorder.stop();
    const data = await this.data;
    save(data, this.token);
  }
}
