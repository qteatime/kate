import { bridges } from "../../../kate-bridges/build";
import * as Cart from "../../../schema/generated/cartridge";
import { unreachable } from "../../../util/build";
import { Pathname } from "../../../util/build/pathname";
import type { InputKey } from "./virtual";

interface Context {
  local_storage?: { [key: string]: string };
  zoom?: number;
  secret: string;
  cart: Cart.Cartridge;
  bridges: Cart.Bridge[];
}

export function translate_html(html: string, context: Context) {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const preamble = add_preamble(dom, context);
  add_zoom(dom, context);
  add_bridges(preamble, dom, context);
  inline_all_scripts(dom, context);
  inline_all_links(dom, context);
  return dom.documentElement.outerHTML;
}

function add_preamble(dom: Document, context: Context) {
  const script = dom.createElement("script");
  script.textContent = `
  void function() {
    var KATE_SECRET = ${JSON.stringify(context.secret)};
    var KATE_LOCAL_STORAGE = ${JSON.stringify(context.local_storage ?? {})};
    ${bridges["kate-api.js"]};
  }();
  `;
  dom.head.insertBefore(script, dom.head.firstChild);
  return script;
}

function add_zoom(dom: Document, context: Context) {
  const style = dom.createElement("style");
  style.textContent = `
    :root {
      --kate-zoom: ${context.zoom ?? "0"};
      zoom: var(--kate-zoom);
    }
  `;
  dom.head.appendChild(style);
  return style;
}

function add_bridges(reference: Element, dom: Document, context: Context) {
  for (const bridge of context.bridges) {
    apply_bridge(bridge, reference, dom, context);
  }
}

function apply_bridge(
  bridge: Cart.Bridge,
  reference: Element,
  dom: Document,
  context: Context
): void {
  const wrap = (source: string) => {
    return `void function(exports) {
      ${source};
    }({});`;
  };

  const append_proxy = (source: string, before: Element = reference) => {
    const script = dom.createElement("script");
    script.textContent = wrap(source);
    if (before.nextSibling != null && before.parentNode != null) {
      before.parentNode!.insertBefore(script, before.nextSibling);
    } else {
      before.parentNode!.appendChild(script);
    }
  };

  switch (bridge.$tag) {
    case Cart.Bridge.$Tags.Network_proxy: {
      append_proxy(bridges["standard-network.js"]);
      break;
    }

    case Cart.Bridge.$Tags.Input_proxy: {
      const code = bridges["input.js"];
      const keys = JSON.stringify(
        generate_proxied_key_mappings(bridge.mapping),
        null,
        2
      );
      const full_source = `const key_mapping = ${keys};\n${code}`;
      append_proxy(full_source);
      break;
    }

    case Cart.Bridge.$Tags.Local_storage_proxy: {
      append_proxy(bridges["local-storage.js"]);
      break;
    }

    default:
      throw unreachable(bridge, "kate bridge");
  }
}

function virtual_key_to_code(key: Cart.VirtualKey): InputKey {
  switch (key.$tag) {
    case Cart.VirtualKey.$Tags.Up:
      return "up";
    case Cart.VirtualKey.$Tags.Right:
      return "right";
    case Cart.VirtualKey.$Tags.Down:
      return "down";
    case Cart.VirtualKey.$Tags.Left:
      return "left";
    case Cart.VirtualKey.$Tags.O:
      return "o";
    case Cart.VirtualKey.$Tags.X:
      return "x";
    case Cart.VirtualKey.$Tags.L_trigger:
      return "ltrigger";
    case Cart.VirtualKey.$Tags.R_trigger:
      return "rtrigger";
    case Cart.VirtualKey.$Tags.Menu:
      return "menu";
    case Cart.VirtualKey.$Tags.Capture:
      return "capture";
    default:
      throw unreachable(key, "virtual key");
  }
}

function generate_proxied_key_mappings(
  map: Map<Cart.VirtualKey, Cart.KeyboardKey>
) {
  const pairs = [...map.entries()].map(([k, v]) => [
    virtual_key_to_code(k),
    [v.key, v.code, Number(v.key_code)],
  ]);
  return Object.fromEntries(pairs);
}

function inline_all_scripts(dom: Document, context: Context) {
  for (const script of Array.from(dom.querySelectorAll("script"))) {
    const src = script.getAttribute("src");
    if (src != null && src.trim() !== "") {
      const real_path = Pathname.from_string(src).make_absolute().as_string();
      const contents = get_text_file(real_path, context.cart);
      script.removeAttribute("src");
      script.removeAttribute("type");
      script.textContent = contents;
    }
  }
}

function inline_all_links(dom: Document, context: Context) {
  for (const link of Array.from(dom.querySelectorAll("link"))) {
    const href = link.getAttribute("href") ?? "";
    const path = Pathname.from_string(href).make_absolute();
    if (link.rel === "stylesheet") {
      inline_css(link, path, dom, context);
    } else {
      link.setAttribute("href", get_data_url(path.as_string(), context.cart));
    }
  }
}

function inline_css(
  link: HTMLLinkElement,
  root: Pathname,
  dom: Document,
  context: Context
) {
  const source0 = get_text_file(root.as_string(), context.cart);
  const source1 = transform_css_urls(root.dirname(), source0, context);
  // TODO: inline imports
  const style = dom.createElement("style");
  style.textContent = source1;
  link.parentNode!.insertBefore(style, link);
  link.remove();
}

function transform_css_urls(base: Pathname, source: string, context: Context) {
  return source.replace(/\burl\(("[^"]+")\)/g, (_, url_string) => {
    const path = base.join(url_string).as_string();
    const data_url = get_data_url(path, context.cart);
    return `url(${JSON.stringify(data_url)})`;
  });
}

function try_get_file(path: string, cart: Cart.Cartridge) {
  return cart.files.find((x) => x.path === path);
}

function try_get_text_file(path: string, cart: Cart.Cartridge) {
  const file = try_get_file(path, cart);
  if (file != null) {
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(file.data);
  } else {
    return null;
  }
}

function get_text_file(real_path: string, cart: Cart.Cartridge) {
  const contents = try_get_text_file(real_path, cart);
  if (contents != null) {
    return contents;
  } else {
    throw new Error(`File not found: ${real_path}`);
  }
}

function get_data_url(real_path: string, cart: Cart.Cartridge) {
  const file = try_get_file(real_path, cart);
  if (file != null) {
    const content = Array.from(file.data)
      .map((x) => String.fromCharCode(x))
      .join("");
    return `data:${file.mime};base64,${btoa(content)}`;
  } else {
    throw new Error(`File not found: ${real_path}`);
  }
}
