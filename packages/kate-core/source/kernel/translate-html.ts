import { bridges } from "../bridges";
import * as Cart from "../cart";
import { make_id, unreachable, file_to_dataurl, Pathname } from "../utils";
import type { InputKey } from "./virtual";
import { RuntimeEnv } from "./cart-runtime";

export async function translate_html(html: string, context: RuntimeEnv) {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const preamble = add_preamble(dom, context);
  add_bridges(preamble, dom, context);
  await inline_all_scripts(dom, context);
  await inline_all_links(dom, context);
  await load_all_media(dom, context);
  return dom.documentElement.outerHTML;
}

async function load_all_media(dom: Document, context: RuntimeEnv) {
  for (const img of Array.from(dom.querySelectorAll("img"))) {
    const path = img.getAttribute("src")!;
    const file = await try_get_file(path, context);
    if (file == null) {
      continue;
    }
    if (file.data.length < 1024 * 1024) {
      // inline 1mb or less images
      img.setAttribute("src", await get_data_url(path, context));
    } else {
      img.classList.add("kate-lazy-load");
    }
  }

  const loader = dom.createElement("script");
  loader.textContent = `
  void async function() {
    for (const element of Array.from(document.querySelectorAll(".kate-lazy-load"))) {
      const path = element.getAttribute("src");
      if (path) {
        element.setAttribute("src", await KateAPI.cart_fs.get_file_url(path));
      }
    }
  }();
  `;
  dom.body.appendChild(loader);
}

function add_preamble(dom: Document, context: RuntimeEnv) {
  const script = dom.createElement("script");
  const id = `preamble_${make_id()}`;
  script.id = id;
  script.textContent = `
  void function() {
    var KATE_SECRET = ${JSON.stringify(context.secret)};
    ${bridges["kate-api.js"]};
    
    let script = document.getElementById(${JSON.stringify(id)});
    script.remove();
    script = null;
  }();
  `;
  dom.head.insertBefore(script, dom.head.firstChild);
  const all_scripts = Array.from(dom.querySelectorAll("script"));
  if (all_scripts[0] !== script) {
    throw new Error(
      `Cannot sandbox HTML: aborting insecure cartridge instantiation`
    );
  }
  return script;
}

function add_bridges(reference: Element, dom: Document, context: RuntimeEnv) {
  for (const bridge of context.cart.runtime.bridges) {
    apply_bridge(bridge, reference, dom, context);
  }
}

function apply_bridge(
  bridge: Cart.Bridge,
  reference: Element,
  dom: Document,
  context: RuntimeEnv
): void {
  const wrap = (source: string) => {
    return `void function(exports) {
      "use strict";
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

  switch (bridge.type) {
    case "network-proxy": {
      append_proxy(bridges["standard-network.js"]);
      break;
    }

    case "input-proxy": {
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

    case "local-storage-proxy": {
      const full_source = `
        var KATE_LOCAL_STORAGE = ${JSON.stringify(context.local_storage ?? {})};
        ${bridges["local-storage.js"]}
      `;
      append_proxy(full_source);
      break;
    }

    case "preserve-render": {
      append_proxy(bridges["preserve-render.js"]);
      break;
    }

    case "capture-canvas": {
      const code = bridges["capture-canvas.js"];
      const full_source = `const SELECTOR = ${JSON.stringify(
        bridge.selector
      )};\n${code}`;
      const script = document.createElement("script");
      script.textContent = wrap(full_source);
      dom.body.appendChild(script);
      break;
    }

    default:
      throw unreachable(bridge, "kate bridge");
  }
}

function generate_proxied_key_mappings(map: Map<InputKey, Cart.Key>) {
  const pairs = [...map.entries()].map(([k, v]) => [
    k,
    [v.key, v.code, Number(v.key_code)],
  ]);
  return Object.fromEntries(pairs);
}

async function inline_all_scripts(dom: Document, context: RuntimeEnv) {
  for (const script of Array.from(dom.querySelectorAll("script"))) {
    const src = script.getAttribute("src");
    if (src != null && src.trim() !== "") {
      const real_path = Pathname.from_string(src).make_absolute().as_string();
      const contents = await get_text_file(real_path, context);
      script.removeAttribute("src");
      script.removeAttribute("type");
      script.textContent = contents;
    }
  }
}

async function inline_all_links(dom: Document, context: RuntimeEnv) {
  for (const link of Array.from(dom.querySelectorAll("link"))) {
    const href = link.getAttribute("href") ?? "";
    const path = Pathname.from_string(href).make_absolute();
    if (link.rel === "stylesheet") {
      await inline_css(link, path, dom, context);
    } else {
      link.setAttribute("href", await get_data_url(path.as_string(), context));
    }
  }
}

async function inline_css(
  link: HTMLLinkElement,
  root: Pathname,
  dom: Document,
  context: RuntimeEnv
) {
  const source0 = await get_text_file(root.as_string(), context);
  const source1 = await transform_css_urls(root.dirname(), source0, context);
  // TODO: inline imports
  const style = dom.createElement("style");
  style.textContent = source1;
  link.parentNode!.insertBefore(style, link);
  link.remove();
}

async function transform_css_urls(
  base: Pathname,
  source: string,
  context: RuntimeEnv
) {
  const imports = Array.from(
    new Set([...source.matchAll(/\burl\(("[^"]+")\)/g)].map((x) => x[1]))
  );
  const import_map = new Map(
    await Promise.all(
      imports.map(async (url_string) => {
        const url_path = Pathname.from_string(JSON.parse(url_string));
        const path = base.join(url_path).as_string();
        const data_url = await get_data_url(path, context);
        return [url_string, data_url] as const;
      })
    )
  );

  return source.replace(/\burl\(("[^"]+")\)/g, (_, url_string: string) => {
    const data_url = import_map.get(url_string)!;
    return `url(${JSON.stringify(data_url)})`;
  });
}

async function try_get_file(path: string, env: RuntimeEnv) {
  return await env.read_file(path);
}

async function try_get_text_file(path: string, env: RuntimeEnv) {
  const file = await try_get_file(path, env);
  if (file != null) {
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(file.data);
  } else {
    return null;
  }
}

async function get_text_file(real_path: string, env: RuntimeEnv) {
  const contents = await try_get_text_file(real_path, env);
  if (contents != null) {
    return contents;
  } else {
    throw new Error(`File not found: ${real_path}`);
  }
}

async function get_data_url(real_path: string, env: RuntimeEnv) {
  const file = await try_get_file(real_path, env);
  if (file != null) {
    return file_to_dataurl(file);
  } else {
    throw new Error(`File not found: ${real_path}`);
  }
}
