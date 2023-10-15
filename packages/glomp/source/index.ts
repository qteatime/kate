/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { unreachable } from "./deps/util";
import * as Path from "path";
import * as FS from "fs";
import * as Util from "util";

type Context = {
  entry_path: string;
  root_path: string;
  var_name: string;
};

type Resource =
  | JsResource
  | JsonResource
  | TextResource
  | CssResource
  | BinaryResource;

type JsResource = { type: "js"; path: string; content: string };
type JsonResource = { type: "json"; path: string; content: unknown };
type TextResource = { type: "text"; path: string; content: string };
type BinaryResource = {
  type: "binary";
  path: string;
  content: Buffer;
  mime_type: string;
};
type CssResource = { type: "css"; path: string; content: string };

type Mapping = { reference_mapping: Map<string, string> };
type Numbering = { id: number };
type Resolution = { __resolved: true };

type MappedResource = Resource & Mapping;
type NumberedResource = MappedResource & Numbering;
type ResolvedResource = NumberedResource & Resolution;

type NumberedJsResource = JsResource & Mapping & Numbering;
type NumberedCssResource = CssResource & Mapping & Numbering;

type ResolvedJsResource = NumberedJsResource & Resolution;
type ResolvedCssResource = NumberedCssResource & Resolution;

const mime_table = Object.assign(Object.create(null), {
  // Text/code
  ".html": "text/html",
  ".xml": "application/xml",
  ".js": "text/javascript",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  // Packaging
  ".zip": "application/zip",
  // Audio
  ".wav": "audio/wav",
  ".oga": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".flac": "audio/x-flac",
  ".opus": "audio/opus",
  ".weba": "audio/webm",
  // Video
  ".mp4": "video/mp4",
  ".mpeg": "video/mpeg",
  ".ogv": "video/ogg",
  ".webm": "video/webm",
  // Image
  ".png": "image/png",
  ".bmp": "image/bmp",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  // Fonts
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".otf": "font/otf",
});

export function pack(entry_path: string, root_path: string, var_name: string) {
  const resources0 = collect(entry_path);
  const resources1 = number_resources(resources0);
  const resources2 = resolve_requires(resources1);
  const code = generate(resources2, {
    entry_path: Path.resolve(entry_path),
    root_path,
    var_name,
  });
  return code;
}

export function collect(entry_path: string) {
  const resources = new Map<string, MappedResource>();

  function discover(path: string) {
    if (resources.has(path)) {
      return;
    }

    const resource = parse(path);
    const references = find_references(resource);
    resources.set(path, { ...resource, reference_mapping: references.mapping });
    for (const ref of references.references) {
      discover(ref);
    }
  }

  discover(Path.resolve(entry_path));
  return resources;
}

export function number_resources(resources: Map<string, MappedResource>) {
  const result = new Map<string, NumberedResource>();
  let id = 0;
  for (const [path, resource] of resources.entries()) {
    result.set(path, { ...resource, id: ++id });
  }
  return result;
}

export function resolve_requires(resources: Map<string, NumberedResource>) {
  const result: ResolvedResource[] = [];
  for (const resource of resources.values()) {
    result.push(resolve_references(resource, resources) as ResolvedResource);
  }
  return result;
}

export function generate(resources: ResolvedResource[], context: Context) {
  const entry = resources.find((x) => x.path === context.entry_path);
  if (entry == null) {
    throw new Error(
      `Entrry path ${context.entry_path} does not match any paths`
    );
  }

  switch (entry.type) {
    case "js":
      return generate_js(resources, context, entry);

    case "css":
      return generate_css(resources, context, entry);

    default:
      throw new Error(`Unsupported entry type ${entry.type}`);
  }
}

export function generate_css(
  resources0: ResolvedResource[],
  context: Context,
  entry: ResolvedCssResource
) {
  const { resources, references: inlined_references } =
    inline_css_fonts(resources0);
  const binary_refs = resources.flatMap((x) =>
    x.type === "binary" && !inlined_references.has(x.id) ? [x] : []
  );
  const reference_defs = binary_refs.map((x) => {
    const url = `data:${x.mime_type};base64,${x.content.toString("base64")}`;
    return `  --glomp-ref-${x.id}: url(${JSON.stringify(url)});`;
  });

  const main_css = inline_css(resources, entry);

  return `
:root {
${reference_defs.join("\n")}
}

${main_css}
`;
}

export function inline_css_fonts(resources: ResolvedResource[]) {
  const mapping = new Map(resources.map((x) => [x.id, x]));
  const css_resources = resources.flatMap((x) => (x.type === "css" ? [x] : []));
  const results = css_resources.map((x) => {
    const font_faces = Array.from(
      x.content.matchAll(/@font-face\s*\{[^\}]*\}/g)
    );
    const references = new Set(
      font_faces.flatMap(([match]) => {
        return Array.from(match.matchAll(/\bvar\(--glomp-ref-(\d+)\)/g)).map(
          ([_, x]) => Number(x)
        );
      })
    );
    const content = x.content.replace(
      /\bvar\(--glomp-ref-(\d+)\)/g,
      (match, ref0) => {
        const ref = Number(ref0);
        if (references.has(ref)) {
          const ref_resource = mapping.get(ref);
          if (ref_resource == null || ref_resource.type !== "binary") {
            throw new Error(`Internal: invalid reference ${ref} in ${x.path}`);
          }
          const url = `data:${
            ref_resource.mime_type
          };base64,${ref_resource.content.toString("base64")}`;
          return `url(${JSON.stringify(url)})`;
        } else {
          return match;
        }
      }
    );
    return { resource: { ...x, content }, references };
  });

  return {
    resources: resources
      .filter((x) => x.type !== "css")
      .concat(results.map((x) => x.resource)),
    references: new Set(results.flatMap((x) => [...x.references])),
  };
}

export function inline_css(
  resources: ResolvedResource[],
  entry: ResolvedCssResource
) {
  const mapping = new Map(resources.map((x) => [x.id, x]));

  function go(resource: ResolvedCssResource): string {
    return resource.content.replace(
      /@import\s+var\(--glomp-ref-(\d+)\);/g,
      (_, ref0) => {
        const ref = Number(ref0);
        const ref_resource = mapping.get(ref);
        if (ref_resource == null) {
          const ref_table = Object.fromEntries(
            resources.map((x) => [x.id, x.path])
          );
          const ref_table_str = JSON.stringify(ref_table, null, 2);
          throw new Error(
            `Unknown reference ${ref} from ${resource.path}. Known refs:\n${ref_table_str}`
          );
        }
        if (ref_resource.type !== "css") {
          throw new Error(
            `Trying to import non-css ref ${ref_resource.path} from ${resource.path}`
          );
        }
        return go(ref_resource);
      }
    );
  }

  return go(entry);
}

export function generate_js(
  resources: ResolvedResource[],
  context: Context,
  entry: ResolvedJsResource
) {
  const definitions = resources.map((x) => generate_js_resource(x, context));
  const sid = JSON.stringify(context.var_name);

  return `void function([module, exports, node_require]) {
  const require = (id) => {
    if (typeof id === "string") {
      return node_require(id);
    }

    const module = require.mapping.get(id);
    if (module == null) {
      throw new Error("Undefined module " + id);
    }
    if (!module.initialised) {
      module.initialised = true;
      module.load.call(null,
        module.module,
        module.module.exports,
        module.dirname,
        module.filename
      );
    }
    return module.module.exports;
  };
  
  require.mapping = new Map();
  require.define = (id, dirname, filename, fn) => {
    const module = Object.create(null);
    module.exports = Object.create(null);
    require.mapping.set(id, {
      module: module,
      dirname,
      filename,
      initialised: false,
      load: fn
    });
  };

${definitions.join("\n\n")}

module.exports = require(${entry.id});
}((() => {
  if (typeof require !== "undefined" && typeof module !== "undefined") {
    return [module, module.exports, require];
  } else if (typeof window !== "undefined") {
    const module = Object.create(null);
    module.exports = Object.create(null);
    Object.defineProperty(window, ${sid}, {
      get() { return module.exports },
      set(v) { module.exports = v }
    });
    return [module, module.exports, (id) => {
      throw new Error("Cannot load " + JSON.stringify(id) + " because node modules are not supported.");
    }];
  } else {
    throw new Error("Unsupported environment");
  }
})());`;
}

export function generate_js_resource(
  resource: ResolvedResource,
  context: Context
) {
  const filename = relative_filename(context.root_path, resource.path);
  const type = resource.type;
  switch (type) {
    case "js": {
      const dirname = Path.dirname(filename);
      const sdir = JSON.stringify(dirname);
      const sfile = JSON.stringify(filename);
      return [
        `// ${filename}`,
        `require.define(${resource.id}, ${sdir}, ${sfile}, (module, exports, __dirname, __filename) => {`,
        resource.content,
        `});`,
      ].join("\n");
    }

    case "json": {
      return [
        `// ${filename}`,
        `require.define(${resource.id}, "", "", (module, exports, __dirname, __filename) => {`,
        `  module.exports = ${JSON.stringify(resource.content)};`,
        `})`,
      ].join("\n");
    }

    case "text":
    case "css": {
      return [
        `// ${filename}`,
        `require.define(${resource.id}, "", "", (module, exports, __dirname, __filename) => {`,
        `  module.exports = ${JSON.stringify(String(resource.content))}`,
        `})`,
      ].join("\n");
    }

    case "binary": {
      const bytes = Array.from(resource.content);
      return [
        `// ${filename}`,
        `require.define(${resource.id}, "", "", (module, exports, __dirname, __filename) => {`,
        `  module.exports = new Uint8Array([${bytes.join(",")}])`,
        `})`,
      ];
    }

    default:
      throw unreachable(type);
  }
}

function relative_filename(root: string, path: string) {
  const relative = Path.relative(root, path);
  return relative;
}

function resolve_references(
  resource: NumberedResource,
  mapping: Map<string, NumberedResource>
) {
  const type = resource.type;
  switch (type) {
    case "js": {
      return resolve_js_references(resource, mapping);
    }

    case "json": {
      return resource;
    }

    case "text":
      return resource;

    case "binary":
      return resource;

    case "css":
      return resolve_css_references(resource, mapping);

    default:
      throw unreachable(type);
  }
}

function resolve_js_references(
  resource: NumberedJsResource,
  mapping: Map<string, NumberedResource>
) {
  const content = resource.content.replace(
    /\brequire\(("[^"]+")\)/g,
    (_, ref) => {
      const ref_resource = resolve_mapped_reference(
        JSON.parse(ref),
        resource,
        mapping
      );
      return `require(${ref_resource.id})`;
    }
  );
  return { ...resource, content };
}

function resolve_css_references(
  resource: NumberedCssResource,
  mapping: Map<string, NumberedResource>
) {
  const content = resource.content.replace(
    /\burl\(("[^"]+")\)/g,
    (match, ref) => {
      const url = JSON.parse(ref) as string;
      if (url.startsWith("data:")) {
        return match;
      } else {
        const ref_resource = resolve_mapped_reference(url, resource, mapping);
        return `var(--glomp-ref-${ref_resource.id})`;
      }
    }
  );

  return { ...resource, content };
}

function parse(path: string): Resource {
  if (path.endsWith("!text")) {
    const real_path = path.replace(/!text$/, "");
    return {
      type: "text",
      path: real_path,
      content: FS.readFileSync(real_path, "utf-8"),
    };
  } else if (path.endsWith("!binary")) {
    const real_path = path.replace(/!binary$/, "");
    return {
      type: "binary",
      path: real_path,
      content: FS.readFileSync(real_path),
      mime_type:
        mime_table[Path.extname(real_path)] ?? "application/octet-stream",
    };
  }

  switch (Path.extname(path)) {
    case ".js": {
      return {
        type: "js",
        path,
        content: FS.readFileSync(path, "utf8"),
      };
    }

    case ".json": {
      return {
        type: "json",
        path,
        content: JSON.parse(FS.readFileSync(path, "utf8")),
      };
    }

    case ".css": {
      return {
        type: "css",
        path,
        content: FS.readFileSync(path, "utf-8"),
      };
    }

    case ".png":
    case ".bmp":
    case ".gif":
    case ".jpeg":
    case ".jpg":
    case ".svg":
    case ".webp":
    case ".ttf":
    case ".woff":
    case ".woff2":
    case ".otf":
      return {
        type: "binary",
        path,
        content: FS.readFileSync(path),
        mime_type: mime_table[Path.extname(path)] ?? "application/octet-stream",
      };

    default:
      throw new Error("unsupported " + path);
  }
}

function find_references(resource: Resource) {
  const type = resource.type;
  switch (type) {
    case "js": {
      return find_js_references(resource);
    }

    case "json": {
      return {
        mapping: new Map<string, string>(),
        references: new Set<string>(),
      };
    }

    case "text": {
      return {
        mapping: new Map<string, string>(),
        references: new Set<string>(),
      };
    }

    case "binary": {
      return {
        mapping: new Map<string, string>(),
        references: new Set<string>(),
      };
    }

    case "css": {
      return find_css_references(resource);
    }

    default:
      throw unreachable(type);
  }
}

function find_css_references(resource: CssResource) {
  const root = Path.dirname(resource.path);
  const references = [
    ...resource.content.matchAll(/\burl\(("[^"]+")\)/g),
  ].filter(([_, x]) => !JSON.parse(x).startsWith("data:"));
  const paths = references.map(
    ([_, x]) => [JSON.parse(x), Path.resolve(root, JSON.parse(x))] as const
  );
  const path_mapping = new Map(paths);
  const unique_refs = new Set(path_mapping.values());
  return { mapping: path_mapping, references: unique_refs };
}

function find_js_references(resource: JsResource) {
  const root = Path.dirname(resource.path);
  const requires = [...resource.content.matchAll(/\brequire\(("[^"]+")\)/g)];
  const paths = requires.map(
    ([_, x]) =>
      [JSON.parse(x), resolve_js_path(root, JSON.parse(x), resource)] as const
  );
  const path_mapping = new Map(paths);
  const unique_refs = new Set(path_mapping.values());
  return { mapping: path_mapping, references: unique_refs };
}

function resolve_js_path(root: string, to: string, resource: Resource) {
  if (to.startsWith("./") || to.startsWith("../")) {
    return resolve_js_destination(Path.resolve(root, to), resource);
  } else if (Path.isAbsolute(to)) {
    return resolve_js_destination(to, resource);
  } else {
    console.warn(
      `Skipping node module ${to} in ${resource.path}: will be loaded by Node's require at runtime.`
    );
    return to;
  }
}

function without_file_filter(path: string) {
  return path.replace(/!text$/, "");
}

function resolve_js_destination(target0: string, resource: Resource): string {
  const target = without_file_filter(target0);

  const stat = maybe_stat(target);
  if (stat == null) {
    if (Path.extname(target) === "") {
      return resolve_js_destination(target + ".js", resource);
    } else {
      throw new Error(
        `File not found: ${target} while evaluating: ${resource.path}`
      );
    }
  }

  const index = Path.resolve(target, "index.js");
  if (stat.isFile()) {
    return target0;
  } else if (stat.isDirectory() && maybe_stat(index)?.isFile()) {
    return index;
  } else {
    throw new Error(
      `File not found: ${target} while evaluating: ${resource.path}`
    );
  }
}

function maybe_stat(path: string) {
  try {
    return FS.statSync(path);
  } catch (_) {
    return null;
  }
}

function unmapped_reference_error(ref: string, resource: NumberedResource) {
  return new Error(
    `Unexpected unmapped reference: ${ref} when evaluating ${
      resource.path
    }\n\nMappings: ${Util.inspect(
      resource.reference_mapping,
      false,
      null,
      false
    )}`
  );
}

function unknown_reference_error(
  full_path: string,
  resource: NumberedResource,
  mapping: Map<string, NumberedResource>
) {
  return new Error(
    `Unknown module: ${full_path} when evaluating ${
      resource.path
    }\n\Paths: ${Util.inspect([...mapping.values()], false, null, false)}`
  );
}

function resolve_mapped_reference(
  ref: string,
  resource: NumberedResource,
  mapping: Map<string, NumberedResource>
) {
  const full_path = resource.reference_mapping.get(ref);
  if (full_path == null) {
    throw unmapped_reference_error(ref, resource);
  }
  const ref_resource = mapping.get(full_path);
  if (ref_resource == null) {
    throw unknown_reference_error(full_path, resource, mapping);
  }
  return ref_resource;
}
