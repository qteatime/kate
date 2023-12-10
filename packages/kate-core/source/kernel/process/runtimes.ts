/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as Cart from "../../cart";
import { make_id } from "../../utils";
import { VirtualConsole } from "../virtual";
import { Process, type IFileSystem, ProcessId, ProcessManager } from "./process-manager";
import { sandbox_html } from "./sandbox-html";

export type RuntimeEnvConfig = {
  console: VirtualConsole;
  cart: Cart.CartMeta;
  filesystem: IFileSystem;
  local_storage: unknown;
};

export async function spawn(env: RuntimeEnvConfig, trace: boolean) {
  const cart = env.cart;
  switch (cart.runtime.type) {
    case "web-archive": {
      return await spawn_web(env, trace);
    }
  }
}

async function spawn_web(env: RuntimeEnvConfig, trace: boolean) {
  const secret = make_id();
  const frame = make_sandboxed_iframe();
  const process = new Process(
    env.cart.id as ProcessId,
    secret,
    frame,
    env.filesystem,
    env.cart,
    env.console
  );
  const index_file = await env.filesystem.read(env.cart.runtime.html_path);
  const decoder = new TextDecoder();
  const index_html = decoder.decode(index_file.data);
  const index = await sandbox_html(index_html, { ...env, secret, trace });
  frame.srcdoc = index;
  return process;
}

function make_sandboxed_iframe() {
  const frame = document.createElement("iframe");
  frame.className = "kate-game-frame kate-game-frame-defaults";
  (frame as any).sandbox = "allow-scripts";
  frame.allow =
    "autoplay *; ch-save-data 'none'; ch-ua 'none'; ch-ua-mobile 'none'; ch-ua-platform 'none'; " +
    "gamepad 'none'; picture-in-picture 'none'; storage-access 'none'; sync-xhr 'none'; unload 'none'";
  (frame as any).csp =
    "default-src data: blob: 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; navigate-to 'none'; " +
    "object-src 'none'";
  frame.scrolling = "no";
  return frame;
}
