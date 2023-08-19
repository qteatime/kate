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
  for (const media of Array.from(dom.querySelectorAll("img, audio, video"))) {
    const maybe_source =
      media instanceof HTMLMediaElement
        ? Array.from(media.querySelectorAll("source[src]"))
            .filter(
              (x) =>
                !x.getAttribute("type") ||
                media.canPlayType(x.getAttribute("type")!) !== ""
            )
            .map((x) => x.getAttribute("src"))
        : [];
    const maybe_path = media.getAttribute("src") ?? maybe_source[0] ?? null;
    if (
      maybe_path == null ||
      maybe_path.trim() === "" ||
      is_non_local(maybe_path)
    ) {
      continue;
    }
    const path = Pathname.from_string(maybe_path).normalise().make_absolute();
    const file = await try_get_file(path.as_string(), context);
    if (file == null) {
      continue;
    }
    if (file.data.length < 1024 * 1024) {
      // inline 1mb or less images
      media.setAttribute("src", await get_data_url(path.as_string(), context));
    } else {
      media.classList.add("kate-lazy-load");
      media.setAttribute("data-src", path.as_string());
      media.removeAttribute("src");
    }
  }

  const loader = dom.createElement("script");
  loader.textContent = `
  void async function() {
    for (const element of Array.from(document.querySelectorAll(".kate-lazy-load"))) {
      const path = element.getAttribute("data-src");
      if (path) {
        element.src = await KateAPI.cart_fs.get_file_url(path);
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

  const kase = context.console.case;
  const style = dom.createElement("style");
  style.textContent = `
    :root {
      --kate-screen-scale: ${Math.max(1, kase.screen_scale)};
      --kate-screen-width: ${kase.screen_width};
      --kate-screen-width-px: ${kase.screen_width}px;
      --kate-screen-height: ${kase.screen_height};
      --kate-screen-height-px: ${kase.screen_height}px;
    }
  `;
  dom.head.appendChild(style);

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

    case "pointer-input-proxy": {
      const code = bridges["pointer-input.js"];
      const full_source = `
        const SELECTOR = ${JSON.stringify(bridge.selector)};
        const HIDE_CURSOR = ${JSON.stringify(bridge.hide_cursor)};
        ${code}
      `;
      const script = document.createElement("script");
      script.textContent = wrap(full_source);
      dom.body.appendChild(script);
      break;
    }

    case "indexeddb-proxy": {
      const code = bridges["indexeddb.js"];
      const full_source = `
        const VERSIONED = ${JSON.stringify(bridge.versioned)};
        ${code}
      `;
      append_proxy(full_source);
      break;
    }

    case "renpy-web-tweaks": {
      const code = bridges["renpy-web-tweaks.js"];
      const full_source = `
        const VERSION = ${JSON.stringify(bridge.version)};
        ${code}
      `;
      const script = document.createElement("script");
      script.textContent = wrap(full_source);
      dom.body.appendChild(script);
      break;
    }

    case "external-url-handler": {
      append_proxy(bridges["external-url-handler.js"]);
      break;
    }

    default:
      throw unreachable(bridge, "kate bridge");
  }
}

function generate_proxied_key_mappings(map: Map<InputKey, Cart.KeyboardKey>) {
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
      const real_path = Pathname.from_string(src)
        .normalise()
        .make_absolute()
        .as_string();
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
    const path = Pathname.from_string(href).normalise().make_absolute();
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
  const source1 = await transform_css(root.dirname(), source0, context);
  const style = dom.createElement("style");
  style.textContent = source1;
  link.parentNode!.insertBefore(style, link);
  link.remove();
}

async function transform_css(
  base: Pathname,
  source: string,
  context: RuntimeEnv
) {
  const source1 = await transform_css_imports(base, source, context);
  const source2 = await transform_css_urls(base, source1, context);
  return source2;
}

async function transform_css_imports(
  base: Pathname,
  source: string,
  context: RuntimeEnv
) {
  const imports = Array.from(
    new Set(
      [...source.matchAll(/@import\s+url\(("[^"]+")\);/g)]
        .map((x) => x[1])
        .filter((x) => !is_non_local(JSON.parse(x)))
    )
  );
  const import_map = new Map(
    await Promise.all(
      imports.map(async (url_string) => {
        const url_path = Pathname.from_string(JSON.parse(url_string));
        const path = base.join(url_path);
        const style0 = await get_text_file(path.as_string(), context);
        const style = await transform_css(path.dirname(), style0, context);
        return [url_string, style] as const;
      })
    )
  );

  return source.replace(
    /@import\s+url\(("[^"]+")\);/g,
    (match, url_string: string) => {
      const source = import_map.get(url_string)!;
      return source == null ? match : source;
    }
  );
}

async function transform_css_urls(
  base: Pathname,
  source: string,
  context: RuntimeEnv
) {
  const imports = Array.from(
    new Set(
      [...source.matchAll(/\burl\(("[^"]+")\)/g)]
        .map((x) => x[1])
        .filter((x) => !is_non_local(JSON.parse(x)))
    )
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

  return source.replace(/\burl\(("[^"]+")\)/g, (match, url_string: string) => {
    const data_url = import_map.get(url_string)!;
    return data_url == null ? match : `url(${JSON.stringify(data_url)})`;
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

function is_non_local(url: string) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}
