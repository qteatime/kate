/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EMessageFailed, handler } from "./handlers";
import { TC } from "../../utils";

export default [
  handler(
    "kate:capture.save-image",
    TC.spec({
      data: TC.instance_of(Uint8Array),
      type: TC.str,
      token: TC.str,
    }),
    async (os, process, ipc, payload, message) => {
      await ipc.consume_capture_token(payload.token, process, message as any);

      try {
        os.sfx.play("shutter");
        await os.capture.save_screenshot(process.cartridge.id, payload.data, payload.type);
      } catch (error) {
        console.debug(`[Kate] failed to save screenshot`, error);
        os.notifications.push_transient("kate:capture", "Failed to save screenshot", "");
        throw new EMessageFailed("kate.capture.failed", "Failed to save screenshot");
      }
      return null;
    }
  ),

  handler("kate:capture.start-recording", TC.spec({}), async (os, process) => {
    os.kernel.console.resources.take("screen-recording");
    await os.audit_supervisor.log(process.cartridge.id, {
      resources: ["kate:capture"],
      risk: "low",
      type: "kate.capture.recording-started",
      message: `Screen recording started`,
    });
    await os.notifications.push_transient(process.cartridge.id, "Screen recording started", "");

    return null;
  }),

  handler(
    "kate:capture.save-recording",
    TC.spec({
      data: TC.instance_of(Uint8Array),
      type: TC.str,
      token: TC.str,
    }),
    async (os, process, ipc, payload, message) => {
      await ipc.consume_capture_token(payload.token, process, message as any);

      try {
        os.kernel.console.resources.release("screen-recording");
        await os.capture.save_video(process.cartridge.id, payload.data, payload.type);
      } catch (error) {
        console.debug(`[Kate] failed to save recording`, error);
        os.notifications.push_transient("kate:capture", "Failed to save screen recording", "");
        throw new EMessageFailed(`kate.capture.failed`, "Failed to save recording");
      }
      return null;
    }
  ),
];
