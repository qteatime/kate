/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EMessageFailed, auth_handler, handler } from "./handlers";
import { TC } from "../../utils";

export default [
  auth_handler(
    "kate:browser.open",
    TC.spec({ url: TC.url }),
    {
      fail_silently: true,
      capabilities: [{ type: "open-urls" }],
    },
    async (os, process, ipc, { url }) => {
      try {
        await os.fairness_supervisor.with_resource(process, "modal-dialog", async () => {
          await os.browser.open(process.cartridge.id, url);
        });
      } catch (error) {
        console.error(`Failed to open ${url} at the request of ${process.cartridge.id}:`, error);
      }

      return null;
    }
  ),

  auth_handler(
    "kate:browser.download",
    TC.spec({ filename: TC.short_str(255), data: TC.bytearray }),
    {
      fail_silently: true,
      capabilities: [{ type: "download-files" }],
    },
    async (os, process, ipc, { filename, data }) => {
      try {
        await os.fairness_supervisor.with_resource(process, "modal-dialog", async () => {
          await os.browser.download(process.cartridge.id, filename, data);
        });
      } catch (error) {
        console.error(
          `Failed to download ${filename} at the request of ${process.cartridge.id}:`,
          error
        );
      }

      return null;
    }
  ),
];
