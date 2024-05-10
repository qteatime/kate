/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
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
