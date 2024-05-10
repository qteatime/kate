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

import { from_bytes } from "../../utils";
import type { KateOS } from "../os";
import * as UI from "../ui";

export class KateBrowser {
  readonly SUPPORTED_PROTOCOLS = ["http:", "https:"];

  constructor(readonly os: KateOS) {}

  async open(requestee: string, url: URL) {
    if (!this.SUPPORTED_PROTOCOLS.includes(url.protocol)) {
      console.error(`Blocked ${requestee} from opening URL with unsupported protocol ${url}`);
      return;
    }
    if (url.username !== "" || url.password !== "") {
      console.error(`Blocked ${requestee} from opening URL with authentication details ${url}`);
      return;
    }

    const ok = await this.os.dialog.confirm("kate:browser", {
      title: "Navigate outside of Kate?",
      message: UI.stack([
        UI.paragraph([UI.strong([UI.mono_text([requestee])]), " wants to open:"]),
        UI.h("div", { class: "kate-ui-highlight-url", title: url.toString() }, [shorten(url)]),
      ]),
      dangerous: true,
      cancel: "Cancel",
      ok: "Continue to website",
    });

    if (!ok) {
      return;
    }

    await this.os.audit_supervisor.log(requestee, {
      resources: ["navigate"],
      risk: "high",
      type: "kate.browse.navigate",
      message: `Navigated to an external URL on cartridge's request`,
      extra: { url: url.toString() },
    });

    window.open(url, "_blank", "noopener,noreferrer");
  }

  async download_from_blob(requestee: string, filename: string, blob: Blob) {
    const ok = await this.os.dialog.confirm("kate:browser", {
      title: "Save file to your device?",
      message: UI.stack([
        UI.paragraph([
          UI.strong([UI.mono_text([requestee])]),
          " wants to save a file to your device:",
        ]),
        UI.h("div", { class: "kate-ui-browse-save-chip" }, [
          UI.stack([
            UI.line_field("Suggested name:", filename),
            UI.line_field("File size:", from_bytes(blob.size)),
          ]),
        ]),
      ]),
      cancel: "Cancel",
      ok: "Save to device",
    });

    if (!ok) {
      return;
    }

    await this.os.audit_supervisor.log(requestee, {
      resources: ["device-fs"],
      risk: "high",
      type: "kate.browse.download",
      message: `Saved a file to the user's device.`,
      extra: { filename, size: blob.size },
    });

    const url = URL.createObjectURL(blob);
    const link = UI.h("a", { download: filename, href: url }, []);
    link.click();
  }

  async download_from_bytes(requestee: string, filename: string, data: Uint8Array) {
    return this.download_from_blob(requestee, filename, new Blob([data.buffer]));
  }
}

function shorten(url: URL) {
  const MAX_LENGTH = 100;
  const MAX_DOMAIN = 70;
  const MAX_REST = 10;

  switch (url.protocol) {
    case "http:":
    case "https:": {
      const domain = shorten_mid(url.hostname, MAX_DOMAIN);
      const port = url.port ? UI.mono_text([`:${url.port}`]) : null;
      const protocol = url.protocol === "http:" ? UI.mono_text(["http://"]) : "";
      return UI.flow([
        protocol,
        domain,
        port,
        shorten_end(url.pathname, MAX_REST),
        shorten_end(url.search, MAX_REST),
        shorten_end(url.hash, MAX_REST),
      ]);
    }

    case "mailto:": {
      return shorten_end(url.href, MAX_LENGTH);
    }

    default:
      throw new Error(`Unsupported protocol ${url.protocol}`);
  }
}

function shorten_end(text: string, max: number) {
  const chars = [...text];
  if (chars.length > max) {
    return UI.flow([
      UI.mono_text([chars.slice(0, max).join("")]),
      UI.chip([`...${chars.length - max} characters omitted`]),
    ]);
  } else {
    return UI.mono_text([text]);
  }
}

function shorten_mid(text: string, max: number) {
  const chars = [...text];
  if (chars.length > max) {
    const mid = Math.floor(max / 2);
    return UI.flow([
      UI.mono_text([chars.slice(0, mid).join("")]),
      UI.chip([`...${chars.length - max} characters omitted...`]),
      UI.mono_text([chars.slice(chars.length - mid).join("")]),
    ]);
  } else {
    return UI.mono_text([text]);
  }
}
