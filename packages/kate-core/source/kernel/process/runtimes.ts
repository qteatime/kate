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

export async function spawn(env: RuntimeEnvConfig) {
  const cart = env.cart;
  switch (cart.runtime.type) {
    case "web-archive": {
      return await spawn_web(env);
    }
  }
}

async function spawn_web(env: RuntimeEnvConfig) {
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
  const index = await sandbox_html(index_html, { ...env, secret });
  frame.src = URL.createObjectURL(new Blob([index], { type: "text/html" }));
  return process;
}

function make_sandboxed_iframe() {
  const frame = document.createElement("iframe");
  frame.className = "kate-game-frame kate-game-frame-defaults";
  (frame as any).sandbox = "allow-scripts";
  frame.allow = "autoplay";
  (frame as any).csp =
    "default-src data: blob: 'unsafe-inline' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'; navigate-to 'none'";
  frame.scrolling = "no";
  return frame;
}
