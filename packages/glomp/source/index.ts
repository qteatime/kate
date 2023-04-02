import { unreachable } from "./deps/util";
import * as Path from "path";
import * as FS from "fs";

type Context = {
  entry_path: string;
  root_path: string;
  var_name: string;
};

type Resource = JsResource | JsonResource | TextResource;
type JsResource = { type: "js"; path: string; content: string };
type JsonResource = { type: "json"; path: string; content: unknown };
type TextResource = { type: "text"; path: string; content: string };

type Mapping = { reference_mapping: Map<string, string> };
type Numbering = { id: number };
type Resolution = { __resolved: true };

type MappedResource = Resource & Mapping;
type NumberedResource = MappedResource & Numbering;
type ResolvedResource = NumberedResource & Resolution;

type NumberedJsResource = JsResource & Mapping & Numbering;

export function pack(entry_path: string, root_path: string, var_name: string) {
  const resources0 = collect(entry_path);
  const resources1 = number_resources(resources0);
  const resources2 = resolve_requires(resources1);
  const code = generate_js(resources2, {
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

export function generate_js(resources: ResolvedResource[], context: Context) {
  const definitions = resources.map((x) => generate_js_resource(x, context));
  const entry = resources.find((x) => x.path === context.entry_path);
  if (entry == null) {
    throw new Error(
      `Entry path ${context.entry_path} does not match any paths`
    );
  }
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

    case "text": {
      return [
        `// ${filename}`,
        `require.define(${resource.id}, "", "", (module, exports, __dirname, __filename) => {`,
        `  module.exports = ${JSON.stringify(String(resource.content))}`,
        `})`,
      ].join("\n");
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

    default:
      throw unreachable(type);
  }
}

import * as Util from "util";
function resolve_js_references(
  resource: NumberedJsResource,
  mapping: Map<string, NumberedResource>
) {
  const content = resource.content.replace(
    /\brequire\(("[^"]+")\)/g,
    (_, ref) => {
      const full_path = resource.reference_mapping.get(JSON.parse(ref));
      if (full_path == null) {
        throw new Error(
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
      const ref_resource = mapping.get(full_path);
      if (ref_resource == null) {
        throw new Error(
          `Unknown module: ${full_path} when evaluating ${
            resource.path
          }\n\Paths: ${Util.inspect([...mapping.values()], false, null, false)}`
        );
      }
      return `require(${ref_resource.id})`;
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
  }

  switch (Path.extname(path)) {
    case ".js": {
      return { type: "js", path, content: FS.readFileSync(path, "utf8") };
    }

    case ".json": {
      return {
        type: "json",
        path,
        content: JSON.parse(FS.readFileSync(path, "utf8")),
      };
    }

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

    default:
      throw unreachable(type);
  }
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
