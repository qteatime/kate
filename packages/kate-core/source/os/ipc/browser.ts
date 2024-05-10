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
    "kate:browser.download-from-bytes",
    TC.spec({ filename: TC.short_str(255), data: TC.bytearray }),
    {
      fail_silently: true,
      capabilities: [{ type: "download-files" }],
    },
    async (os, process, ipc, { filename, data }) => {
      try {
        await os.fairness_supervisor.with_resource(process, "modal-dialog", async () => {
          await os.browser.download_from_bytes(process.cartridge.id, filename, data);
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

  auth_handler(
    "kate:browser.download-from-file",
    TC.spec({ filename: TC.str, bucket_id: TC.str, file_id: TC.str }),
    { fail_silently: true, capabilities: [{ type: "download-files" }] },
    async (os, process, ipc, { filename, bucket_id, file_id }) => {
      const bucket_ref = await os.process_file_supervisor.get_ref(process.id, bucket_id);
      const kate_file = bucket_ref.bucket.file(file_id);
      const file = await kate_file.read();
      try {
        await os.fairness_supervisor.with_resource(process, "modal-dialog", async () => {
          await os.browser.download_from_blob(process.cartridge.id, filename, file);
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
