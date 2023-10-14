/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export class KateAudioManager {
  readonly context = new AudioContext();

  open() {
    this.context.resume().catch((e) => {});
    if (this.context.state !== "running") {
      const open_audio_output = () => {
        this.context.resume().catch((e) => {});
        window.removeEventListener("touchstart", open_audio_output);
        window.removeEventListener("click", open_audio_output);
        window.removeEventListener("keydown", open_audio_output);
      };
      window.addEventListener("touchstart", open_audio_output);
      window.addEventListener("click", open_audio_output);
      window.addEventListener("keydown", open_audio_output);
    }
  }
}
