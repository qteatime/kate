void function([module, exports, node_require]) {
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

// ecosystem/publisher/build/index.js
require.define(1, "ecosystem/publisher/build", "ecosystem/publisher/build/index.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
const app_1 = require(2);
const appui_1 = require(16);
const main_1 = require(22);
const root = document.querySelector("#canvas");
const ui = new appui_1.UI(root, {
    on_key_pressed: KateAPI.input.on_key_pressed,
    on_pointer_click: KateAPI.pointer_input.on_clicked,
});
async function main() {
    const app = new app_1.App();
    ui.push_scene(new main_1.SceneMain(app, ui));
}
main();

});

// ecosystem/publisher/build/core/app.js
require.define(2, "ecosystem/publisher/build/core", "ecosystem/publisher/build/core/app.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const projects_1 = require(3);
class App {
    projects = new projects_1.Projects();
}
exports.App = App;

});

// ecosystem/publisher/build/core/projects.js
require.define(3, "ecosystem/publisher/build/core", "ecosystem/publisher/build/core/projects.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Projects = void 0;
const utils_1 = require(4);
class Projects {
    async get_projects() {
        return await KateAPI.store.unversioned().ensure_bucket("projects");
    }
    async list() {
        const store = await this.get_projects();
        const projects = await store.list();
        return (0, utils_1.map_async)(projects, async (meta) => {
            return await store.read(meta.key);
        });
    }
    async read(domain, id) {
        const store = await this.get_projects();
        return await store.read(this.key(domain, id));
    }
    async create(project) {
        const store = await this.get_projects();
        await store.create_structured(this.project_key(project), project, { domain: project.domain });
    }
    async update(project) {
        const store = await this.get_projects();
        await store.write_structured(this.project_key(project), project, { domain: project.domain });
    }
    async delete(domain, id) {
        const store = await this.get_projects();
        await store.delete(this.key(domain, id));
    }
    key(domain, id) {
        return `${domain}/${id}`;
    }
    project_key(project) {
        return this.key(project.domain, project.id);
    }
}
exports.Projects = Projects;

});

// ecosystem/publisher/build/deps/utils.js
require.define(4, "ecosystem/publisher/build/deps", "ecosystem/publisher/build/deps/utils.js", (module, exports, __dirname, __filename) => {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.binary = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
__exportStar(require(5), exports);
__exportStar(require(7), exports);
__exportStar(require(8), exports);
__exportStar(require(6), exports);
__exportStar(require(9), exports);
__exportStar(require(10), exports);
__exportStar(require(12), exports);
__exportStar(require(13), exports);
exports.binary = require(14);
__exportStar(require(15), exports);

});

// packages/util/build/glob-match.js
require.define(5, "packages/util/build", "packages/util/build/glob-match.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobPatternList = exports.GlobPattern = void 0;
const pathname_1 = require(6);
function compile(pattern) {
    const path = pathname_1.Pathname.from_string(pattern);
    return new RegExp("^\\/?" + path.segments.map(compile_segment).join("\\/") + "$");
}
function compile_segment(segment) {
    return segment
        .replace(/[^\*\w\d]/, (x) => `\\${x}`)
        .replace(/\*\*?/g, (m) => {
        switch (m) {
            case "**":
                return ".*?";
            case "*":
                return "[^\\/]*?";
            default:
                return m;
        }
    });
}
class GlobPattern {
    _test;
    constructor(_test) {
        this._test = _test;
    }
    static from_pattern(pattern) {
        return new GlobPattern(compile(pattern));
    }
    test(path) {
        if (typeof path === "string") {
            return this._test.test(path);
        }
        else {
            return this._test.test(path.as_string());
        }
    }
}
exports.GlobPattern = GlobPattern;
class GlobPatternList {
    _patterns;
    constructor(_patterns) {
        this._patterns = _patterns;
    }
    static from_patterns(patterns) {
        return new GlobPatternList(patterns.map((x) => GlobPattern.from_pattern(x)));
    }
    test(path) {
        return this._patterns.some((x) => x.test(path));
    }
    join(that) {
        return new GlobPatternList([...this._patterns, ...that._patterns]);
    }
    add(that) {
        return new GlobPatternList([...this._patterns, that]);
    }
}
exports.GlobPatternList = GlobPatternList;

});

// packages/util/build/pathname.js
require.define(6, "packages/util/build", "packages/util/build/pathname.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pathname = void 0;
class Pathname {
    is_absolute;
    segments;
    constructor(is_absolute, segments) {
        this.is_absolute = is_absolute;
        this.segments = segments;
    }
    static from_string(x) {
        if (x.startsWith("/")) {
            return new Pathname(true, get_segments(x.slice(1)));
        }
        else {
            return new Pathname(false, get_segments(x));
        }
    }
    as_string() {
        const prefix = this.is_absolute ? "/" : "";
        return prefix + this.normalise().segments.join("/");
    }
    make_absolute() {
        return new Pathname(true, this.segments);
    }
    make_relative() {
        return new Pathname(false, this.segments);
    }
    join(x) {
        if (x.is_absolute) {
            return x;
        }
        else {
            return new Pathname(this.is_absolute, [...this.segments, ...x.segments]);
        }
    }
    to(x) {
        return this.join(Pathname.from_string(x));
    }
    drop_prefix(prefix) {
        const segments = this.segments.slice();
        for (const segment of prefix) {
            if (segments.length > 0 && segments[0] === segment) {
                segments.shift();
            }
            else {
                break;
            }
        }
        return new Pathname(false, [...segments]);
    }
    starts_with(path) {
        if (path.segments.length > this.segments.length) {
            return false;
        }
        let i = 0;
        for (const segment of path.segments) {
            if (this.segments[i] !== segment) {
                return false;
            }
            i += 1;
        }
        return true;
    }
    normalise() {
        const stack = [];
        for (const segment of this.segments) {
            switch (segment) {
                case ".": {
                    continue;
                }
                case "..": {
                    stack.pop();
                    continue;
                }
                default: {
                    stack.push(segment);
                    continue;
                }
            }
        }
        return new Pathname(this.is_absolute, stack);
    }
    basename() {
        if (this.segments.length > 0) {
            return this.segments[this.segments.length - 1];
        }
        else {
            return "";
        }
    }
    extname() {
        const match = this.basename().match(/(\.[^\.]+)$/);
        if (match != null) {
            return match[1];
        }
        else {
            return null;
        }
    }
    dirname() {
        return new Pathname(this.is_absolute, this.segments.slice(0, -1));
    }
}
exports.Pathname = Pathname;
function get_segments(x) {
    return x
        .replace(/\/{2,}/g, "/")
        .split("/")
        .map(parse_segment);
}
function parse_segment(x) {
    if (/^[^\/#\?]+$/.test(x)) {
        return x;
    }
    else {
        throw new Error(`invalid segment: ${x}`);
    }
}

});

// packages/util/build/random.js
require.define(7, "packages/util/build", "packages/util/build/random.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.make_id = void 0;
function make_id() {
    let id = new Uint8Array(16);
    crypto.getRandomValues(id);
    return Array.from(id)
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
}
exports.make_id = make_id;

});

// packages/util/build/graphics.js
require.define(8, "packages/util/build", "packages/util/build/graphics.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.make_thumbnail = exports.make_thumbnail_from_bytes = exports.make_empty_thumbnail = exports.load_image_from_bytes = exports.load_image = void 0;
function load_image(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Loading image from ${url} failed`));
        img.src = url;
    });
}
exports.load_image = load_image;
function load_image_from_bytes(mime, bytes) {
    const blob = new Blob([bytes.buffer], { type: mime });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    return img;
}
exports.load_image_from_bytes = load_image_from_bytes;
async function make_empty_thumbnail(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas.toDataURL();
}
exports.make_empty_thumbnail = make_empty_thumbnail;
async function make_thumbnail_from_bytes(width, height, mime, data) {
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    try {
        const image = await load_image(url);
        return make_thumbnail(width, height, image);
    }
    finally {
        URL.revokeObjectURL(url);
    }
}
exports.make_thumbnail_from_bytes = make_thumbnail_from_bytes;
function make_thumbnail(width, height, image) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    const rect = fit_media(image, { width, height });
    context.fillStyle = "#2f2f2f";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
    return canvas.toDataURL("image/png");
}
exports.make_thumbnail = make_thumbnail;
function fit_media(media, canvas) {
    if (media instanceof HTMLImageElement) {
        return fit_image(media, canvas);
    }
    else if (media instanceof HTMLVideoElement) {
        return fit_video(media, canvas);
    }
    else {
        throw new Error(`Unsupported media`);
    }
}
function fit_image(img, canvas) {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    return fit({ width, height }, canvas);
}
function fit_video(video, canvas) {
    const width = video.videoWidth;
    const height = video.videoHeight;
    return fit({ width, height }, canvas);
}
function fit(box, target) {
    const wscale = target.width / box.width;
    const hscale = target.height / box.height;
    const scale = Math.min(wscale, hscale);
    const width = Math.floor(scale * box.width);
    const height = Math.floor(scale * box.height);
    return {
        width,
        height,
        x: Math.floor((target.width - width) / 2),
        y: Math.floor((target.height - height) / 2),
    };
}

});

// packages/util/build/assert.js
require.define(9, "packages/util/build", "packages/util/build/assert.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unreachable = void 0;
function unreachable(x, message = "") {
    throw new Error(`Unhandled value(${message}): ${x}`);
}
exports.unreachable = unreachable;

});

// packages/util/build/observable.js
require.define(10, "packages/util/build", "packages/util/build/observable.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Observable = void 0;
const events_1 = require(11);
class Observable {
    _value;
    _on_disponse;
    stream = new events_1.EventStream();
    constructor(_value, _on_disponse = () => { }) {
        this._value = _value;
        this._on_disponse = _on_disponse;
    }
    static from(value, _on_dispose) {
        if (value instanceof Observable) {
            return value;
        }
        else {
            return new Observable(value, _on_dispose);
        }
    }
    static from_stream(stream, initial) {
        let subscriber;
        const observable = new Observable(initial, () => {
            stream.remove(subscriber);
        });
        subscriber = (value) => {
            observable.value = value;
        };
        stream.listen(subscriber);
        return observable;
    }
    static is(x) {
        if (x instanceof Observable) {
            return true;
        }
        else {
            return false;
        }
    }
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
        this.stream.emit(value);
    }
    dispose() {
        this.stream.dispose();
        this._on_disponse?.();
    }
    map(fn) {
        const result = new Observable(fn(this.value));
        const handler = this.stream.listen((value) => {
            result.value = fn(value);
        });
        result.dispose = () => {
            this.stream.remove(handler);
        };
        return result;
    }
    filter(fn, initial_value) {
        const initial = fn(this.value) ? this.value : initial_value;
        const result = new Observable(initial);
        const handler = this.stream.listen((value) => {
            if (fn(value)) {
                this.value = value;
            }
        });
        result.dispose = () => {
            this.stream.remove(handler);
        };
        return result;
    }
    fold(fn, initial) {
        let current = initial;
        const result = new Observable(initial);
        const handler = this.stream.listen((value) => {
            result.value = current = fn(current, value);
        });
        result.dispose = () => {
            this.stream.remove(handler);
        };
        return result;
    }
    zip_with(that, combine) {
        const result = new Observable(combine(this.value, that.value));
        const update = () => {
            result.value = combine(this.value, that.value);
        };
        const h1 = this.stream.listen(update);
        const h2 = that.stream.listen(update);
        result.dispose = () => {
            this.stream.remove(h1);
            that.stream.remove(h2);
        };
        return result;
    }
    zip_with2(b, c, combine) {
        return this.zip_with(b, (va, vb) => c.map((vc) => combine(va, vb, vc)));
    }
    zip_with3(b, c, d, combine) {
        return this.zip_with2(b, c, (va, vb, vc) => d.map((vd) => combine(va, vb, vc, vd)));
    }
    static zip_with(items, combine) {
        const apply = () => {
            const a = Object.entries(items);
            const b = a.map(([k, v]) => [k, v.value]);
            const c = Object.fromEntries(b);
            return combine(c);
        };
        const result = new Observable(apply());
        const handlers = Object.entries(items).map(([_, v]) => {
            return [
                v,
                v.stream.listen(() => {
                    result.value = apply();
                }),
            ];
        });
        result.dispose = () => {
            for (const [observable, handler] of handlers) {
                observable.stream.remove(handler);
            }
        };
        return result;
    }
}
exports.Observable = Observable;

});

// packages/util/build/events.js
require.define(11, "packages/util/build", "packages/util/build/events.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStream = void 0;
class EventStream {
    is_active = true;
    subscribers = [];
    on_dispose = () => { };
    listen(fn) {
        if (!this.is_active) {
            throw new Error(`listen() on a closed stream.`);
        }
        this.remove(fn);
        this.subscribers.push(fn);
        return fn;
    }
    remove(fn) {
        this.subscribers = this.subscribers.filter((x) => x !== fn);
        return this;
    }
    once(fn) {
        const handler = this.listen((x) => {
            this.remove(handler);
            fn(x);
        });
        return handler;
    }
    emit(ev) {
        if (!this.is_active) {
            throw new Error(`emit() on a closed stream`);
        }
        for (const fn of this.subscribers) {
            fn(ev);
        }
    }
    dispose() {
        this.is_active = false;
        this.subscribers = [];
        this.on_dispose();
    }
    filter(fn) {
        const stream = new EventStream();
        const subscriber = this.listen((ev) => {
            if (fn(ev)) {
                stream.emit(ev);
            }
        });
        stream.on_dispose = () => {
            this.remove(subscriber);
        };
        return stream;
    }
    map(fn) {
        const stream = new EventStream();
        const subscriber = this.listen((ev) => {
            stream.emit(fn(ev));
        });
        stream.on_dispose = () => {
            this.remove(subscriber);
        };
        return stream;
    }
    record() {
        let trace = [];
        const subscriber = this.listen((ev) => trace.push(ev));
        const stream = this;
        return {
            get trace() {
                return trace.slice();
            },
            clear() {
                trace = [];
            },
            stop() {
                stream.remove(subscriber);
            },
        };
    }
}
exports.EventStream = EventStream;

});

// packages/util/build/unit.js
require.define(12, "packages/util/build", "packages/util/build/unit.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gb = exports.mb = exports.kb = exports.bytes = exports.from_bytes = exports.mhz_to_ghz = void 0;
function mhz_to_ghz(n) {
    return `${(n / 1000).toFixed(3)} GHz`;
}
exports.mhz_to_ghz = mhz_to_ghz;
function from_bytes(n0, decimals = 2) {
    const units = [
        ["KB", 1024],
        ["MB", 1024],
        ["GB", 1024],
        ["TB", 1024],
    ];
    let n = Number(n0);
    let use_unit = "B";
    for (const [unit, bucket] of units) {
        if (n >= bucket) {
            n /= bucket;
            use_unit = unit;
        }
        else {
            break;
        }
    }
    return `${n.toFixed(decimals)} ${use_unit}`;
}
exports.from_bytes = from_bytes;
function bytes(n) {
    return n;
}
exports.bytes = bytes;
function kb(n) {
    return 1_024 * bytes(n);
}
exports.kb = kb;
function mb(n) {
    return 1_024 * kb(n);
}
exports.mb = mb;
function gb(n) {
    return 1_024 * mb(n);
}
exports.gb = gb;

});

// packages/util/build/iterable.js
require.define(13, "packages/util/build", "packages/util/build/iterable.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.readable_stream_from_iterable = exports.iterate_stream = exports.zip = exports.map_async = exports.map = exports.iterator = exports.foldl = exports.enumerate = void 0;
function* enumerate(xs) {
    let index = 0;
    for (const x of xs) {
        yield [index, x];
        index += 1;
    }
}
exports.enumerate = enumerate;
function foldl(xs, z, f) {
    let result = z;
    for (const x of xs) {
        result = f(result, x);
    }
    return result;
}
exports.foldl = foldl;
function* iterator(x) {
    yield* x;
}
exports.iterator = iterator;
function* map(a, f) {
    for (const x of a) {
        yield f(x);
    }
}
exports.map = map;
async function map_async(a, fn) {
    const result = [];
    for (const x of a) {
        result.push(await fn(x));
    }
    return result;
}
exports.map_async = map_async;
function* zip(a0, b0) {
    const a = iterator(a0);
    const b = iterator(b0);
    while (true) {
        const va = a.next();
        const vb = b.next();
        if (va.done && vb.done) {
            break;
        }
        if (!va.done && !vb.done) {
            yield [va.value, vb.value];
            continue;
        }
        throw new Error(`Mismatched iterable lengths`);
    }
}
exports.zip = zip;
async function* iterate_stream(stream) {
    const reader = stream.getReader();
    try {
        while (true) {
            const result = await reader.read();
            if (result.done) {
                return;
            }
            else {
                yield result.value;
            }
        }
    }
    finally {
        reader.releaseLock();
    }
}
exports.iterate_stream = iterate_stream;
function readable_stream_from_iterable(x0) {
    const x = iterator(x0);
    return new ReadableStream({
        pull(controller) {
            const next = x.next();
            if (next.done) {
                controller.close();
            }
            else {
                controller.enqueue(next.value);
            }
        },
    });
}
exports.readable_stream_from_iterable = readable_stream_from_iterable;

});

// packages/util/build/binary.js
require.define(14, "packages/util/build", "packages/util/build/binary.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.base64_to_bytes = exports.bytes_to_base64 = exports.bytes_to_hex = exports.byte_equals = exports.concat_all = void 0;
const iterable_1 = require(13);
function concat_all(bytearrays) {
    const size = bytearrays.reduce((a, b) => a + b.byteLength, 0);
    const result = new Uint8Array(size);
    let offset = 0;
    for (const bytes of bytearrays) {
        result.set(bytes, offset);
        offset += bytes.byteLength;
    }
    return result;
}
exports.concat_all = concat_all;
function byte_equals(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    for (const [x, y] of (0, iterable_1.zip)(a, b)) {
        if (x !== y) {
            return false;
        }
    }
    return true;
}
exports.byte_equals = byte_equals;
function bytes_to_hex(x) {
    return Array.from(x)
        .map((x) => x.toString(16).padStart(2, "0"))
        .join(" ");
}
exports.bytes_to_hex = bytes_to_hex;
function bytes_to_base64(x) {
    return btoa(Array.from(x)
        .map((x) => String.fromCharCode(x))
        .join(""));
}
exports.bytes_to_base64 = bytes_to_base64;
function base64_to_bytes(x) {
    return new Uint8Array(atob(x)
        .split("")
        .map((x) => x.charCodeAt(0)));
}
exports.base64_to_bytes = base64_to_bytes;

});

// packages/util/build/time.js
require.define(15, "packages/util/build", "packages/util/build/time.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.relative_date = exports.fine_grained_relative_date = exports.relative_time = exports.date_time_string = exports.days_diff = exports.coarse_time_from_minutes = exports.fine_grained_time_seconds = void 0;
function fine_grained_time_seconds(x) {
    const units = [
        { unit: "minute", limit: 60 },
        { unit: "hour", limit: 60 },
    ];
    let current = "second";
    let value = x;
    for (const { unit, limit } of units) {
        if (value >= limit) {
            value = value / limit;
            current = unit;
        }
        else {
            break;
        }
    }
    const suffix = Math.round(value) === 1 ? current : current + "s";
    return `${Math.round(value)} ${suffix}`;
}
exports.fine_grained_time_seconds = fine_grained_time_seconds;
function coarse_time_from_minutes(x) {
    const minute_threshold = 15;
    const hour_threshold = 60;
    if (x <= 0) {
        return "(not recorded)";
    }
    else if (x < minute_threshold) {
        return "a few minutes";
    }
    else if (x < hour_threshold) {
        return `${x} minutes`;
    }
    else {
        return plural(Math.round(x / hour_threshold), (_) => "1 hour", (n) => `${n} hours`);
    }
}
exports.coarse_time_from_minutes = coarse_time_from_minutes;
function days_diff(x, y) {
    const OneDay = 1000 * 60 * 60 * 24;
    const toDays = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime() / OneDay;
    return Math.floor(toDays(x) - toDays(y));
}
exports.days_diff = days_diff;
function date_time_string(x) {
    return `${x.getFullYear()}-${(x.getMonth() + 1).toString().padStart(2, "0")}-${x
        .getDate()
        .toString()
        .padStart(2, "0")} ${x.getHours().toString().padStart(2, "0")}:${x
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${x.getSeconds().toString().padStart(2, "0")}`;
}
exports.date_time_string = date_time_string;
function relative_time(x) {
    const units = [
        { unit: "second", limit: 1000 },
        { unit: "minute", limit: 60 },
        { unit: "hour", limit: 60 },
    ];
    let current = "millisecond";
    let diff = new Date().getTime() - x.getTime();
    for (const { unit, limit } of units) {
        if (diff >= limit) {
            diff = diff / limit;
            current = unit;
        }
        else {
            break;
        }
    }
    const suffix = Math.round(diff) === 1 ? current : current + "s";
    return `${Math.round(diff)} ${suffix} ago`;
}
exports.relative_time = relative_time;
function fine_grained_relative_date(x) {
    const days = days_diff(x, new Date());
    if (days < 0) {
        return date_time_string(x);
    }
    else if (days === 0) {
        return relative_time(x);
    }
    else if (days > 20) {
        return date_time_string(x);
    }
    else {
        return String(days);
    }
}
exports.fine_grained_relative_date = fine_grained_relative_date;
function relative_date(x) {
    if (x == null) {
        return "never";
    }
    else {
        const year = x.getFullYear();
        const month = x.getMonth();
        const date = x.getDate();
        const now = new Date();
        if (year < now.getFullYear()) {
            return plural(now.getFullYear() - year, (_) => "last year", (n) => `${n} years ago`);
        }
        else if (year === now.getFullYear() && month < now.getMonth()) {
            return plural(now.getMonth() - month, (_) => "last month", (n) => `${n} months ago`);
        }
        else if (year === now.getFullYear() && month === now.getMonth() && date <= now.getDate()) {
            const d = now.getDate() - date;
            switch (d) {
                case 0:
                    return "today";
                case 1:
                    return "yesterday";
                default:
                    return `${d} days ago`;
            }
        }
        return `during ${year}`;
    }
}
exports.relative_date = relative_date;
function plural(n, single, plural) {
    if (n === 1) {
        return single(String(n));
    }
    else {
        return plural(String(n));
    }
}

});

// ecosystem/publisher/build/deps/appui.js
require.define(16, "ecosystem/publisher/build/deps", "ecosystem/publisher/build/deps/appui.js", (module, exports, __dirname, __filename) => {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
__exportStar(require(17), exports);

});

// packages/kate-appui/build/index.js
require.define(17, "packages/kate-appui/build", "packages/kate-appui/build/index.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require(18), exports);
__exportStar(require(21), exports);

});

// packages/kate-appui/build/core.js
require.define(18, "packages/kate-appui/build", "packages/kate-appui/build/core.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopMenuDialog = exports.ProgressDialog = exports.ConfirmDialog = exports.MessageDialog = exports.BaseDialog = exports.UIFocus = exports.UIScene = exports.ProgressHandler = exports.UIDialogs = exports.UI = void 0;
const utils_1 = require(19);
const widget_1 = require(21);
class UI {
    root;
    _current = null;
    _stack = [];
    _focus;
    _dialogs;
    on_scene_changed = new utils_1.EventStream();
    dsl = new widget_1.WidgetDSL(this);
    constructor(root, env) {
        this.root = root;
        this._focus = new UIFocus(this, env);
        this._dialogs = new UIDialogs(this);
    }
    get current() {
        return this._current;
    }
    get focus() {
        return this._focus;
    }
    get dialogs() {
        return this._dialogs;
    }
    get is_last_scene() {
        return this._stack.length === 0;
    }
    push_scene(scene) {
        if (this._current != null) {
            const current = this._current;
            current.on_deactivated();
            this._stack.push(current);
        }
        this._current = scene;
        this.root.appendChild(scene.canvas);
        scene.on_attached();
        scene.on_activated();
        this.on_scene_changed.emit(scene);
    }
    pop_scene(scene) {
        if (this._current !== scene) {
            throw new Error(`pop_scene(): unexpected scene`);
        }
        scene.on_deactivated();
        scene.on_detached();
        scene.canvas.remove();
        const next = this._stack.pop() ?? null;
        this._current = next;
        if (next != null) {
            next.on_activated();
        }
        this.on_scene_changed.emit(next);
    }
    replace_scene(expected, scene) {
        this.pop_scene(expected);
        this.push_scene(scene);
    }
    pop_current_scene() {
        if (this._current != null) {
            this.pop_scene(this._current);
        }
        else {
            throw new Error(`pop_current_scene(): no current scene`);
        }
    }
}
exports.UI = UI;
class UIDialogs {
    ui;
    constructor(ui) {
        this.ui = ui;
    }
    async message(x) {
        const ui = this.ui;
        const deferred = (0, utils_1.defer)();
        const screen = new MessageDialog(ui, x.title ?? [], x.message, () => {
            deferred.resolve();
        }, x.events);
        ui.push_scene(screen);
        deferred.promise.finally(() => ui.pop_scene(screen));
        return deferred.promise;
    }
    async confirm(x) {
        const ui = this.ui;
        const deferred = (0, utils_1.defer)();
        const screen = new ConfirmDialog(ui, x.title ?? [], x.message, {
            on_confirm: () => deferred.resolve(true),
            on_cancel: () => deferred.resolve(false),
            cancel_label: x.cancel_label,
            confirm_label: x.confirm_label,
            dangerous: x.dangerous,
        }, x.events);
        ui.push_scene(screen);
        deferred.promise.finally(() => ui.pop_scene(screen));
        return deferred.promise;
    }
    async progress(x) {
        const ui = this.ui;
        const screen = new ProgressDialog(ui, x.title ?? [], x.message);
        ui.push_scene(screen);
        try {
            return await x.process(new ProgressHandler(screen));
        }
        finally {
            ui.pop_scene(screen);
        }
    }
    async pop_menu(x) {
        const ui = this.ui;
        const deferred = (0, utils_1.defer)();
        const screen = new PopMenuDialog(ui, {
            title: x.title,
            cancel_label: x.cancel_label,
            on_cancel: () => deferred.resolve(x.cancel_value),
            items: x.items.map((a) => ({
                icon: a.icon,
                title: a.title,
                is_visible: a.is_visible,
                on_select: () => deferred.resolve(a.value),
            })),
        });
        ui.push_scene(screen);
        deferred.promise.finally(() => ui.pop_scene(screen));
        return deferred.promise;
    }
}
exports.UIDialogs = UIDialogs;
class ProgressHandler {
    _scene;
    constructor(_scene) {
        this._scene = _scene;
    }
    set_message(message) {
        this._scene.set_message(message);
    }
}
exports.ProgressHandler = ProgressHandler;
class UIScene {
    ui;
    canvas;
    constructor(ui) {
        this.ui = ui;
        this.canvas = document.createElement("div");
        this.canvas.className = "kate-ui-scene";
    }
    async refresh() {
        try {
            (0, widget_1.replace)(this.canvas, this.ui.dsl.class("kate-ui-loading", ["Loading..."]));
            const body = await this.render();
            (0, widget_1.replace)(this.canvas, body);
            this.ui.focus.ensure_focus();
        }
        catch (e) {
            console.error(`Failed to render screen`, e);
            (0, widget_1.replace)(this.canvas, this.ui.dsl.class("kate-ui-error", ["Failed to render the screen"]));
        }
    }
    on_attached() {
        this.refresh();
    }
    on_detached() { }
    on_activated() { }
    on_deactivated() { }
}
exports.UIScene = UIScene;
class UIFocus {
    ui;
    env;
    _interactive = new WeakMap();
    _scene_handlers = new WeakMap();
    on_focus_changed = new utils_1.EventStream();
    on_handlers_changed = new utils_1.EventStream();
    constructor(ui, env) {
        this.ui = ui;
        this.env = env;
        this.ui.on_scene_changed.listen(this.handle_scene_changed);
        env.on_key_pressed.listen((x) => this.handle_key(x.key, x.is_repeat));
        env.on_pointer_click.listen(this.handle_pointer_click);
    }
    get root() {
        return this.ui.current?.canvas ?? null;
    }
    get current() {
        const root = this.root;
        if (root == null) {
            return null;
        }
        else {
            return (root.querySelector(".focus") ?? null);
        }
    }
    get current_interactions() {
        const current = this.current;
        if (current != null) {
            return (this._interactive.get(current) ?? []).filter((x) => x.enabled ?? true);
        }
        else {
            return [];
        }
    }
    get scene_interactions() {
        const current = this.ui.current;
        if (current != null) {
            return (this._scene_handlers.get(current) ?? []).filter((x) => x.enabled ?? true);
        }
        else {
            return [];
        }
    }
    register_interactions(element, interactions) {
        this._interactive.set(element, interactions);
        this.on_handlers_changed.emit({
            focus: this.current_interactions,
            scene: this.scene_interactions,
        });
    }
    register_scene_handlers(scene, interactions) {
        const handlers0 = this._scene_handlers.get(scene) ?? [];
        const handlers = handlers0.concat(interactions.filter((x) => !handlers0.includes(x)));
        this._scene_handlers.set(scene, handlers);
        this.on_handlers_changed.emit({
            focus: this.current_interactions,
            scene: this.scene_interactions,
        });
    }
    deregister_scene_handlers(scene, interactions) {
        const handlers0 = this._scene_handlers.get(scene) ?? [];
        const handlers = handlers0.filter((x) => !interactions.includes(x));
        this._scene_handlers.set(scene, handlers);
        this.on_handlers_changed.emit({
            focus: this.current_interactions,
            scene: this.scene_interactions,
        });
    }
    focus(element) {
        const root = this.root;
        if (root == null) {
            return;
        }
        const focused = Array.from(root.querySelectorAll(".focus"));
        for (const item of focused) {
            item.classList.toggle("focus", item === element);
        }
        if (element != null) {
            element.classList.add("focus");
            this.scroll_into_view(element);
        }
        this.on_focus_changed.emit(element);
        this.on_handlers_changed.emit({
            focus: this.current_interactions,
            scene: this.scene_interactions,
        });
    }
    ensure_focus() {
        const root = this.root;
        if (root == null) {
            return;
        }
        const current_focus = root.querySelector(".focus") ?? root.querySelector(".kate-ui-focus-target") ?? null;
        if (current_focus instanceof HTMLElement || current_focus == null) {
            this.focus(current_focus);
        }
    }
    handle_key = (key, repeat) => {
        const current = this.current;
        if (current != null) {
            if (this.handle_current_interaction(current, key, repeat)) {
                return;
            }
        }
        if (this.handle_scene_interaction(key, repeat)) {
            return;
        }
        if (key === "up" || key === "right" || key === "down" || key === "left") {
            this.handle_focus_change(key);
        }
    };
    handle_pointer_click = (ev) => {
        const [target] = Array.from(document.elementsFromPoint(ev.location.x, ev.location.y)).filter((x) => x.classList.contains("kate-ui-focus-target"));
        if (target != null) {
            switch (ev.button) {
                case "primary": {
                    target.dispatchEvent(new MouseEvent("click"));
                    break;
                }
                case "alternate": {
                    target.dispatchEvent(new MouseEvent("contextmenu"));
                    break;
                }
                default:
                    throw (0, utils_1.unreachable)(ev.button);
            }
        }
    };
    handle_focus_change(direction) {
        const root = this.root;
        if (root == null) {
            return;
        }
        const current = this.current;
        const bounds = current?.getBoundingClientRect() ?? {
            left: 0,
            top: 0,
            right: 2 ** 32,
            bottom: 2 ** 32,
        };
        const focusable = Array.from(root.querySelectorAll(".kate-ui-focus-target"))
            .map((x) => ({
            element: x,
            bounds: x.getBoundingClientRect(),
        }))
            .filter((x) => x.element !== current);
        function vertical_distance(x) {
            if (x.top > bounds.bottom) {
                return x.top - bounds.bottom;
            }
            else if (x.bottom < bounds.top) {
                return x.bottom - bounds.top;
            }
            else {
                return 0;
            }
        }
        function horizontal_distance(x) {
            if (x.left > bounds.right) {
                return x.left - bounds.right;
            }
            else if (x.right < bounds.left) {
                return x.right - bounds.left;
            }
            else {
                return 0;
            }
        }
        function overlap([a, b], [x, y]) {
            if (b < x || b > y) {
                return false;
            }
            else {
                return true;
            }
        }
        function horizontal_penalty(x) {
            if (overlap([x.left, x.right], [bounds.left, bounds.right])) {
                return 0;
            }
            else {
                const distance = Math.min(Math.abs(x.right - bounds.left), Math.abs(x.left - bounds.right));
                return distance + 1_000_000;
            }
        }
        function vertical_penalty(x) {
            if (overlap([x.top, x.bottom], [bounds.top, bounds.bottom])) {
                return 0;
            }
            else {
                const distance = Math.min(Math.abs(x.bottom - bounds.top), Math.abs(x.top - bounds.bottom));
                return distance + 1_000_000;
            }
        }
        function vx(x) {
            return vertical_distance(x) + horizontal_penalty(x);
        }
        function hx(x) {
            return horizontal_distance(x) + vertical_penalty(x);
        }
        let new_focus = null;
        switch (direction) {
            case "left": {
                const candidates = focusable
                    .filter((x) => current == null || x.bounds.right <= bounds.left)
                    .sort((a, b) => hx(b.bounds) - hx(a.bounds));
                new_focus = candidates[0]?.element ?? null;
                break;
            }
            case "right": {
                const candidates = focusable
                    .filter((x) => current == null || x.bounds.left >= bounds.right)
                    .sort((a, b) => hx(a.bounds) - hx(b.bounds));
                new_focus = candidates[0]?.element ?? null;
                break;
            }
            case "up": {
                const candidates = focusable
                    .filter((x) => current == null || x.bounds.bottom <= bounds.top)
                    .sort((a, b) => vx(b.bounds) - vx(a.bounds));
                new_focus = candidates[0]?.element ?? null;
                break;
            }
            case "down": {
                const candidates = focusable
                    .filter((x) => current == null || x.bounds.top >= bounds.bottom)
                    .sort((a, b) => vx(a.bounds) - vx(b.bounds));
                new_focus = candidates[0]?.element ?? null;
                break;
            }
        }
        if (new_focus != null) {
            this.focus(new_focus);
        }
    }
    handle_current_interaction(current, key, repeat) {
        const interactions = this.current_interactions;
        const interaction = interactions.find((x) => x.key.includes(key) && (x.allow_repeat || !repeat));
        if (interaction == null) {
            return false;
        }
        else {
            interaction.handler(key, repeat);
            return true;
        }
    }
    handle_scene_interaction(key, repeat) {
        if (this.ui.current == null) {
            return;
        }
        const scene_keys = this.scene_interactions;
        const scene_key = scene_keys.find((x) => x.key.includes(key) && (x.allow_repeat || !repeat));
        if (scene_key == null) {
            return false;
        }
        else {
            scene_key?.handler(key, repeat);
            return true;
        }
    }
    handle_scene_changed = () => {
        this.ensure_focus();
    };
    scroll_into_view(element) {
        let origin = { x: element.offsetLeft, y: element.offsetTop };
        let current = element.offsetParent;
        while (current != null) {
            if (current.classList.contains("kate-ui-scroll-area")) {
                current.scrollTo({
                    left: origin.x - current.clientWidth / 2 + element.offsetWidth / 2,
                    top: origin.y - current.clientHeight / 2 + element.offsetHeight / 2,
                });
                break;
            }
            else {
                origin.x += current.offsetLeft;
                origin.y += current.offsetTop;
                current = current.offsetParent;
            }
        }
    }
}
exports.UIFocus = UIFocus;
class BaseDialog extends UIScene {
    constructor(ui) {
        super(ui);
        this.canvas.classList.add("kate-ui-translucent");
    }
}
exports.BaseDialog = BaseDialog;
class MessageDialog extends BaseDialog {
    title;
    message;
    on_action;
    events;
    constructor(ui, title, message, on_action, events = {}) {
        super(ui);
        this.title = title;
        this.message = message;
        this.on_action = on_action;
        this.events = events;
    }
    render() {
        const ui = this.ui.dsl;
        return ui.class("kate-ui-dialog-root", [
            ui.class("kate-ui-dialog-container kate-ui-dialog-message-box", [
                ui.class("kate-ui-dialog-title", [...this.title]),
                ui.class("kate-ui-dialog-message", [...this.message]),
                ui.class("kate-ui-dialog-actions", [ui.text_button("Ok", () => this.on_action())]),
            ]),
            ui.keymap(this, {
                x: {
                    label: "Cancel",
                    action: () => this.on_action(),
                },
            }),
        ]);
    }
    on_activated() {
        super.on_activated();
        this.events.on_shown?.();
    }
    on_deactivated() {
        this.events.on_hidden?.();
        super.on_deactivated();
    }
}
exports.MessageDialog = MessageDialog;
class ConfirmDialog extends BaseDialog {
    title;
    message;
    options;
    events;
    constructor(ui, title, message, options, events = {}) {
        super(ui);
        this.title = title;
        this.message = message;
        this.options = options;
        this.events = events;
    }
    render() {
        const ui = this.ui.dsl;
        return ui.class("kate-ui-dialog-root", [
            ui.class("kate-ui-dialog-container kate-ui-dialog-confirm", [
                ui.class("kate-ui-dialog-title", [...this.title]),
                ui.class("kate-ui-dialog-message", [...this.message]),
                ui
                    .class("kate-ui-dialog-actions", [
                    ui.text_button(this.options.cancel_label ?? "Cancel", () => this.options.on_cancel()),
                    ui.text_button(this.options.confirm_label ?? "Ok", () => this.options.on_confirm()),
                ])
                    .attr({ "data-dangerous": this.options.dangerous ?? false }),
            ]),
            ui.keymap(this, {
                x: {
                    label: this.options.cancel_label ?? "Cancel",
                    action: () => this.options.on_cancel(),
                },
            }),
        ]);
    }
    on_activated() {
        super.on_activated();
        this.events.on_shown?.();
    }
    on_deactivated() {
        this.events.on_hidden?.();
        super.on_deactivated();
    }
}
exports.ConfirmDialog = ConfirmDialog;
class ProgressDialog extends BaseDialog {
    title;
    _message;
    constructor(ui, title, message) {
        super(ui);
        this.title = title;
        this._message = new utils_1.Observable(ui.dsl.fragment(message));
    }
    render() {
        const ui = this.ui.dsl;
        return ui.class("kate-ui-dialog-root", [
            ui.class("kate-ui-dialog-container kate-ui-dialog-progress", [
                ui.class("kate-ui-dialog-title", [...this.title]),
                ui.class("kate-ui-dialog-message", [ui.dynamic(this._message)]),
                ui.class("kate-ui-dialog-progress-indicator", [
                    ui.fa_icon("circle-notch", "2x", "solid", "spin"),
                ]),
            ]),
        ]);
    }
    set_message(message) {
        this._message.value = this.ui.dsl.fragment(message);
    }
}
exports.ProgressDialog = ProgressDialog;
class PopMenuDialog extends BaseDialog {
    options;
    constructor(ui, options) {
        super(ui);
        this.options = options;
    }
    render() {
        const ui = this.ui.dsl;
        return ui.class("kate-ui-dialog-absolute-root", [
            ui.class("kate-ui-dialog-pop-menu", [
                ui.class("kate-ui-dialog-title", this.options.title ?? []),
                ui.class("kate-ui-dialog-pop-menu-items", [ui.menu_list(this.options.items)]),
            ]),
            ui.keymap(this, {
                x: {
                    label: this.options.cancel_label ?? "Cancel",
                    action: () => this.options.on_cancel(),
                },
            }),
        ]);
    }
}
exports.PopMenuDialog = PopMenuDialog;

});

// packages/kate-appui/build/utils.js
require.define(19, "packages/kate-appui/build", "packages/kate-appui/build/utils.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require(10), exports);
__exportStar(require(11), exports);
__exportStar(require(20), exports);
__exportStar(require(9), exports);

});

// packages/util/build/promise.js
require.define(20, "packages/util/build", "packages/util/build/promise.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.defer = void 0;
function defer() {
    const p = Object.create(null);
    p.promise = new Promise((resolve, reject) => {
        p.resolve = resolve;
        p.reject = reject;
    });
    return p;
}
exports.defer = defer;
function sleep(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), ms);
    });
}
exports.sleep = sleep;

});

// packages/kate-appui/build/widget.js
require.define(21, "packages/kate-appui/build", "packages/kate-appui/build/widget.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidgetDSL = exports.Widget = exports.from_observable = exports.KateUIDynamic = exports.dynamic = exports.h = exports.replace = exports.append = exports.set_attribute = void 0;
const utils_1 = require(19);
function set_attribute(element, key, value) {
    if (typeof value === "string") {
        element.setAttribute(key, value);
    }
    else if (typeof value === "boolean") {
        if (value) {
            element.setAttribute(key, key);
        }
        else {
            element.removeAttribute(key);
        }
    }
    else {
        throw new Error(`Unsupported attribute type ${typeof value}`);
    }
}
exports.set_attribute = set_attribute;
function append(parent, child) {
    if (child == null) {
        return;
    }
    if (child instanceof Widget) {
        parent.appendChild(child.canvas);
        return;
    }
    if (typeof child === "string") {
        parent.appendChild(document.createTextNode(child));
        return;
    }
    parent.appendChild(child);
}
exports.append = append;
function replace(parent, child) {
    parent.textContent = "";
    append(parent, child);
}
exports.replace = replace;
function h(tag, attributes, children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
        set_attribute(element, key, value);
    }
    for (const child of children) {
        append(element, child);
    }
    return element;
}
exports.h = h;
function dynamic(x) {
    const element = document.createElement("kate-ui-dynamic");
    element.addEventListener("change", (ev) => {
        if (element.isConnected) {
            x.on_attached(element);
        }
        else {
            x.on_detached(element);
        }
    });
    return element;
}
exports.dynamic = dynamic;
class KateUIDynamic extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.dispatchEvent(new Event("change"));
    }
    disconnectedCallback() {
        this.dispatchEvent(new Event("change"));
    }
}
exports.KateUIDynamic = KateUIDynamic;
customElements.define("kate-ui-dynamic", KateUIDynamic);
function handle_observable_change(canvas, value) {
    replace(canvas, value);
}
function from_observable(input, x) {
    let subscription = null;
    const on_attached = x?.on_attached ?? handle_observable_change;
    const on_changed = x?.on_changed ?? handle_observable_change;
    return dynamic({
        on_attached: (canvas) => {
            on_attached(canvas, input.value);
            if (subscription != null) {
                input.stream.remove(subscription);
            }
            subscription = input.stream.listen((widget) => on_changed(canvas, widget));
        },
        on_detached: (canvas) => {
            if (subscription != null) {
                input.stream.remove(subscription);
            }
            x?.on_detached?.(canvas);
        },
    });
}
exports.from_observable = from_observable;
class Widget {
    ui;
    canvas;
    constructor(ui, canvas) {
        this.ui = ui;
        this.canvas = canvas;
    }
    attr(attributes) {
        for (const [key, value] of Object.entries(attributes)) {
            if (value != null) {
                set_attribute(this.canvas, key, value);
            }
        }
        return this;
    }
    add_classes(classes) {
        this.canvas.classList.add(...classes);
        return this;
    }
    style(rules) {
        for (const [key, value] of Object.entries(rules)) {
            if (value != null) {
                this.canvas.style[key] = value;
            }
        }
        return this;
    }
    replace(content) {
        replace(this.canvas, content);
        return this;
    }
    dynamic(x, update) {
        return new Widget(this.ui, from_observable(x, {
            on_attached: (canvas, value) => {
                replace(canvas, this.canvas);
                update(this, value);
            },
            on_changed: (canvas, value) => {
                update(this, value);
            },
        }));
    }
    interactive(interactions, x) {
        this.ui.focus.register_interactions(this.canvas, interactions);
        this.canvas.classList.add("kate-ui-focus-target");
        if (x?.custom_focus === true) {
            this.canvas.setAttribute("data-custom-focus", "true");
        }
        const click_handler = interactions.find((x) => x.on_click);
        if (click_handler != null) {
            this.canvas.addEventListener("click", (ev) => {
                ev.preventDefault();
                click_handler.handler(click_handler.key[0], false);
            });
        }
        const menu_handler = interactions.find((x) => x.on_menu);
        if (menu_handler != null) {
            this.canvas.addEventListener("contextmenu", (ev) => {
                ev.preventDefault();
                menu_handler.handler(menu_handler.key[0], false);
            });
        }
        if (x?.enabled != null) {
            const enabled = x.enabled;
            const update = (v) => {
                if (v) {
                    this.canvas.classList.remove("disabled");
                    this.ui.focus.register_interactions(this.canvas, interactions);
                }
                else {
                    this.canvas.classList.add("disabled");
                    this.ui.focus.register_interactions(this.canvas, []);
                }
            };
            enabled.stream.listen((v) => update(v));
            update(enabled.value);
        }
        return this;
    }
}
exports.Widget = Widget;
class WidgetDSL {
    ui;
    constructor(ui) {
        this.ui = ui;
    }
    h(tag, attributes, children) {
        return new Widget(this.ui, h(tag, attributes, children));
    }
    container(children) {
        return this.h("div", { class: `kate-ui-container` }, children);
    }
    class(classes, children) {
        return this.h("div", { class: classes }, children);
    }
    dynamic(observable, x) {
        return from_observable(observable, x);
    }
    subscription_manager(fn) {
        const subscriptions = [];
        const subscribe = (observable, fn) => {
            subscriptions.push({
                stream: observable.stream,
                subscription: observable.stream.listen(fn),
            });
        };
        return dynamic({
            on_attached: (canvas) => {
                replace(canvas, fn(subscribe));
            },
            on_detached: (canvas) => {
                for (const { stream, subscription } of subscriptions) {
                    stream.remove(subscription);
                }
            },
        });
    }
    title_bar(x) {
        return this.class("kate-ui-title-bar", [
            this.class("kate-ui-title-bar-left", [x.left ?? null]),
            this.class("kate-ui-title-bar-middle", [x.middle ?? null]),
            this.class("kate-ui-title-bar-right", [x.right ?? null]),
        ]);
    }
    status_bar(children) {
        return this.class("kate-ui-statusbar", children);
    }
    button_icon(x) {
        return h("div", { class: "kate-ui-button-icon", "data-icon": x }, []);
    }
    key_icon(x) {
        return this.button_icon(key_to_button(x));
    }
    status_icon(xs, label) {
        return this.class("kate-ui-status-icon", [
            this.class("kate-ui-status-icon-list", [...xs.map((x) => this.button_icon(x))]),
            label,
        ]);
    }
    dynamic_status_icons() {
        const render = (x) => {
            return this.status_icon(x.key.map(key_to_button), x.label);
        };
        const handlers = utils_1.Observable.from_stream(this.ui.focus.on_handlers_changed, {
            focus: [],
            scene: [],
        });
        return this.dynamic(handlers.map((x) => {
            return this.class("kate-ui-dynamic-status-icons", [
                ...x.focus.map((x) => render(x)),
                ...x.scene.map((x) => render(x)),
            ]);
        }));
    }
    app_screen(x) {
        return this.class("kate-ui-app-screen", [
            this.class("kate-ui-app-screen-title", [x.title ?? null]),
            this.class("kate-ui-app-screen-body", [x.body]),
            this.class("kate-ui-app-screen-status", [x.status ?? null]),
        ]);
    }
    two_panel_screen(x) {
        return this.class("kate-ui-bold-screen", [
            this.class("kate-ui-bold-screen-left", [x.left]),
            this.class("kate-ui-bold-screen-right", [x.right]),
        ]);
    }
    hero(x) {
        return this.class("kate-ui-hero", [
            this.class("kate-ui-hero-title", [x.title ?? null]),
            this.class("kate-ui-hero-subtitle", [x.subtitle ?? null]),
            this.class("kate-ui-hero-content", [x.content ?? null]),
        ]);
    }
    floating_button(x) {
        return this.h("button", { class: "kate-ui-floating-button kate-ui-text-button" }, [
            this.class("kate-ui-floating-button-icon", [x.icon ?? null]),
            this.class("kate-ui-floating-button-label", [x.label ?? null]),
        ]).interactive([
            {
                key: ["o"],
                label: "Ok",
                allow_repeat: false,
                on_click: true,
                handler: async () => {
                    x.on_click?.();
                },
            },
        ]);
    }
    text_button(label, on_click, enabled) {
        return this.h("button", { class: "kate-ui-text-button" }, [label]).interactive([
            {
                key: ["o"],
                label: "Ok",
                allow_repeat: false,
                on_click: true,
                handler: async () => {
                    on_click?.();
                },
            },
        ], { enabled });
    }
    page_bullet(current, x) {
        function chunk(index) {
            if (x.max_size == null) {
                return {
                    before: index,
                    after: Math.max(0, x.total - index - 1),
                    hidden_before: 0,
                    hidden_after: 0,
                };
            }
            else {
                const size = Math.floor(x.max_size / 2);
                let before = size;
                let after = x.max_size - size;
                if (index < before) {
                    after += before - index;
                    before = index;
                }
                else if (index + 1 + after > x.total) {
                    before += index + 1 + after - x.total;
                    after = x.total - index - 1;
                }
                const before1 = Math.max(0, Math.min(before, Math.min(index, x.max_size)));
                const after1 = Math.max(0, Math.min(after, Math.min(x.total - 1, x.max_size)));
                return {
                    before: before1,
                    after: after1,
                    hidden_before: Math.max(0, index - before1),
                    hidden_after: Math.max(0, x.total - after1 - index - 1),
                };
            }
        }
        return this.dynamic(current.map((a) => {
            const chunks = chunk(a);
            const before_banner = chunks.hidden_before > 0
                ? this.class("kate-ui-page-banner", ["+" + String(chunks.hidden_before)])
                : null;
            const after_banner = chunks.hidden_after > 0
                ? this.class("kate-ui-page-banner", ["+" + String(chunks.hidden_after)])
                : null;
            const pages_before = Array.from({ length: chunks.before }, (_) => this.class("kate-ui-page-bullet", []));
            const pages_after = Array.from({ length: chunks.after }, (_) => this.class("kate-ui-page-bullet", []));
            return this.class("kate-ui-page-bullets", [
                before_banner,
                ...pages_before,
                this.class("kate-ui-page-bullet kate-ui-current-page", [String(a)]),
                ...pages_after,
                after_banner,
            ]);
        }));
    }
    action_list(items) {
        return this.class("kate-ui-action-list", [
            ...items
                .filter((x) => x.is_visible !== false)
                .map((x) => this.class("kate-ui-action-list-item", [
                this.class("kate-ui-action-list-icon", [x.icon ?? null]),
                this.class("kate-ui-action-list-title", [x.title ?? null]),
                this.class("kate-ui-action-list-description", [x.description ?? null]),
                this.class("kate-ui-action-list-value", [x.value ?? null]),
                this.class("kate-ui-action-list-side-icon", [x.side_icon ?? null]),
            ])
                .attr({ "data-dangerous": x.dangerous })
                .interactive([
                {
                    key: ["o"],
                    label: "Ok",
                    on_click: true,
                    handler: async () => {
                        x.on_select();
                    },
                },
            ])),
        ]);
    }
    select_panel(x) {
        const current = new utils_1.Observable(x.value);
        return this.action_list([
            {
                icon: x.icon,
                title: x.title,
                description: x.description,
                side_icon: this.fa_icon("pencil"),
                value: this.dynamic(current.map((v) => x.options.find((o) => o.value === v)?.label ?? x.unknown_value ?? "(Unknown)")),
                on_select: async () => {
                    const items = x.options.map((x) => ({
                        title: x.label,
                        icon: x.icon,
                        is_visible: x.is_visible?.() ?? true,
                        value: x.value,
                    }));
                    const result = await this.ui.dialogs.pop_menu({
                        title: [x.title],
                        cancel_value: null,
                        items: items,
                    });
                    if (result != null) {
                        current.value = result;
                        x.on_change(result);
                    }
                },
            },
        ]).add_classes(["kate-ui-select-panel"]);
    }
    menu_list(items) {
        return this.class("kate-ui-menu-list", [
            ...items
                .filter((x) => x.is_visible !== false)
                .map((x) => this.class("kate-ui-menu-list-item", [
                this.class("kate-ui-menu-list-icon", [x.icon ?? null]),
                this.class("kate-ui-menu-list-title", [x.title ?? null]),
            ]).interactive([
                {
                    key: ["o"],
                    label: "Ok",
                    on_click: true,
                    handler: async () => {
                        x.on_select();
                    },
                },
            ])),
        ]);
    }
    action_selection(x) {
        const selected = new utils_1.Observable(x.value);
        return this.dynamic(selected.map((value) => {
            return this.action_list(x.options.map((opt) => {
                return {
                    title: opt.title,
                    description: opt.description,
                    icon: opt.value === value ? this.fa_icon("circle-check") : undefined,
                    is_visible: opt.is_visible?.value,
                    on_select: () => {
                        selected.value = opt.value;
                        x.on_change?.(opt.value);
                    },
                };
            })).add_classes(["kate-ui-action-selection"]);
        }));
    }
    horizontal_selection(x) {
        const current = new utils_1.Observable(x.value);
        return this.class("kate-ui-horizontal-selection", [
            this.class("kate-ui-horizontal-selection-title", [x.title]),
            this.class("kate-ui-horizontal-selection-description", [x.description ?? null]),
            this.class("kate-ui-horizontal-selection-options", [
                this.dynamic(current.map((v) => {
                    return this.fragment([
                        ...x.options
                            .filter((x) => x.is_visible ?? true)
                            .map((option) => {
                            return this.class("kate-ui-horizontal-selection-option", [
                                this.class("kate-ui-horizontal-selection-option-icon", [option.icon]),
                                this.class("kate-ui-horizontal-selection-option-title", [option.title ?? null]),
                            ])
                                .attr({ "data-selected": v === option.value })
                                .interactive([
                                {
                                    key: ["o"],
                                    label: "Select",
                                    on_click: true,
                                    handler: async () => {
                                        current.value = option.value;
                                        x.on_change(option.value);
                                    },
                                },
                            ]);
                        }),
                    ]);
                })),
            ]),
        ]);
    }
    icon_button(icon, options) {
        return this.h("button", { class: "kate-ui-icon-button" }, [
            this.class("kate-ui-icon-button-icon", [
                this.fa_icon(icon, options.size, options.style, options.animation),
            ]),
            this.class("kate-ui-icon-button-label", [options.label ?? null]),
        ]).interactive([
            {
                key: ["o"],
                label: "Ok",
                allow_repeat: false,
                on_click: true,
                handler: async () => {
                    options.on_click?.();
                },
            },
        ]);
    }
    fragment(children) {
        const fragment = document.createDocumentFragment();
        for (const child of children) {
            append(fragment, child);
        }
        return fragment;
    }
    p(children) {
        return this.h("p", {}, children);
    }
    img(src) {
        return this.h("img", { src, class: "kate-ui-image" }, []);
    }
    when(x, children) {
        if (x) {
            return this.fragment(children);
        }
        else {
            return null;
        }
    }
    lazy(entry, error_widget = "Failed to load") {
        const x = typeof entry === "function" ? entry() : entry;
        const widget = this.class("kate-ui-lazy", []);
        x.then((value) => {
            widget.replace(value);
            this.ui.focus.ensure_focus();
        }, (error) => {
            console.error(`Failed to load widget:`, error);
            widget.replace(error_widget);
        });
        return widget;
    }
    keymap(scene, mapping) {
        const handlers = Object.entries(mapping).map(([key, handler]) => ({
            key: [key],
            label: handler.label,
            allow_repeat: false,
            handler: async () => handler.action(),
            enabled: handler.enabled,
        }));
        return dynamic({
            on_attached: (canvas) => {
                this.ui.focus.register_scene_handlers(scene, handlers);
            },
            on_detached: (canvas) => {
                this.ui.focus.deregister_scene_handlers(scene, handlers);
            },
        });
    }
    slot(name) {
        return this.h("kate-slot", { name }, []);
    }
    get_slot(parent, name) {
        const query = `kate-slot[name=${JSON.stringify(name)}]`;
        if (parent instanceof HTMLElement) {
            return parent.querySelector(query) ?? null;
        }
        else if (parent instanceof Widget) {
            return this.get_slot(parent.canvas, name);
        }
        else {
            return null;
        }
    }
    fill_slot(parent, name, value) {
        const slot = this.get_slot(parent, name);
        if (slot != null) {
            append(slot, value);
        }
        return parent;
    }
    multistep(steps, options) {
        const current = new utils_1.Observable(0);
        const actions = current.map((x) => {
            const step = steps[x];
            return this.class("kate-ui-step-actions", [
                this.class("kate-ui-step-previous", [
                    this.when(x > 0, [
                        this.text_button(step.previous_label ?? "Back", async () => {
                            if (step.on_previous)
                                await step.on_previous();
                            current.value = Math.max(0, x - 1);
                        }),
                    ]),
                ]),
                this.class("kate-ui-step-view", [
                    ...steps.map((_, i) => {
                        return this.class(`kate-ui-step-icon ${i === x ? "active" : ""}`, []);
                    }),
                ]),
                this.class("kate-ui-step-next", [
                    this.when(x < steps.length - 1, [
                        this.text_button(step.next_label ?? "Continue", async () => {
                            if (step.on_next)
                                await step.on_next();
                            current.value = Math.min(steps.length - 1, x + 1);
                        }, step.is_valid),
                    ]),
                ]),
            ]);
        });
        const action_widget = this.dynamic(actions);
        const content = current.map((x) => {
            if (options?.slot_for_actions != null) {
                return this.fill_slot(steps[x].content, options.slot_for_actions, action_widget);
            }
            else {
                return steps[x].content;
            }
        });
        return this.class("kate-ui-steps", [
            this.class("kate-ui-steps-content", [this.dynamic(content)]),
            options?.slot_for_actions == null ? action_widget : null,
        ]).add_classes(options?.slot_for_actions == null ? [] : ["with-action-slot"]);
    }
    meta_text(children) {
        return this.h("span", { class: "kate-ui-meta-text" }, children);
    }
    mono_text(children) {
        return this.h("span", { class: "kate-ui-mono-text" }, children);
    }
    hspace(size) {
        return this.class("kate-ui-space", []).attr({ style: `width: ${size}rem` });
    }
    vspace(size) {
        return this.class("kate-ui-space", []).attr({
            style: `height: ${size}rem`,
        });
    }
    field(label, children) {
        return this.class("kate-ui-field", [
            this.h("label", { class: "kate-ui-field-label" }, [label]),
            this.class("kate-ui-field-content", children),
        ]);
    }
    text_input(initial_value, x) {
        const value = new utils_1.Observable(initial_value);
        return this.class("kate-ui-text-input", [
            this.dynamic(value),
            this.fa_icon("pen"),
        ]).interactive([
            {
                key: ["o"],
                label: "Edit",
                on_click: true,
                handler: async () => {
                    const new_value = await KateAPI.dialogs.text_input(x.query ?? "", {
                        type: "text",
                        initial_value: initial_value,
                        max_length: 255,
                    });
                    if (new_value != null) {
                        value.value = new_value;
                        x.on_change?.(new_value);
                    }
                },
            },
        ]);
    }
    stack(children) {
        return this.class("kate-ui-stack", children.map((x) => this.class("kate-ui-stack-item", [x])));
    }
    flow(children) {
        return this.class("kate-ui-flow", children.map((x) => this.h("span", { class: "kate-ui-flow-item" }, [x])));
    }
    strong(children) {
        return this.h("strong", { class: "kate-ui-strong" }, children);
    }
    ul(items) {
        return this.h("ul", { class: "kate-ui-ul" }, items.map((x) => this.h("li", { class: "kate-ui-li" }, [x])));
    }
    vbox(options, children) {
        return this.class("kate-ui-vbox", children).attr({
            style: style({
                gap: rem(options.gap),
                "justify-content": options.justify,
                "align-items": options.align,
            }),
        });
    }
    hbox(options, children) {
        return this.class("kate-ui-hbox", children).attr({
            style: style({
                gap: rem(options.gap),
                "justify-content": options.justify,
                "align-items": options.align,
            }),
        });
    }
    centered(children) {
        return this.class("kate-ui-centered", children);
    }
    title(x, level = "h1") {
        return this.h(level, { class: "kate-ui-title" }, x);
    }
    subtitle(x, level = "h2") {
        return this.h(level, { class: "kate-ui-subtitle" }, x);
    }
    fa_icon(name, size = "1x", style = "solid", animation) {
        const anim = animation == null ? "" : `fa-${animation}`;
        return this.h("i", { class: `fa-${style} fa-${size} fa-${name} ${anim}` }, []);
    }
    action_buttons(buttons) {
        return this.class("kate-ui-action-buttons", buttons);
    }
    scroll_area(x, children) {
        return this.class("kate-ui-scroll-area", children).style({
            "overflow-y": x.track_visible ? "scroll" : null,
        });
    }
    no_thumbnail(text = "") {
        return this.class("kate-ui-no-thumbnail", [this.class("kate-ui-no-thumbnail-title", [text])]);
    }
    cartridge_chip(x) {
        return this.class("kate-ui-cartridge-chip", [
            this.class("kate-ui-cartridge-chip-thumbnail", [
                x.thumbnail_dataurl == null
                    ? this.no_thumbnail()
                    : this.h("img", {
                        src: x.thumbnail_dataurl,
                        class: "kate-ui-cartridge-image-thumb",
                    }, []),
            ]),
            this.class("kate-ui-cartridge-chip-info", [
                this.class("kate-ui-cartridge-chip-title", [x.title]),
                this.class("kate-ui-cartridge-chip-id", [x.id]),
                this.class("kate-ui-cartridge-chip-meta", [
                    ...Object.entries(x.metadata ?? {}).map(([key, value]) => {
                        return this.class("kate-ui-cartridge-chip-meta-field", [
                            this.class("kate-ui-cartridge-chip-meta-label", [key, ":"]),
                            this.class("kate-ui-cartridge-chip-meta-value", [value]),
                        ]);
                    }),
                ]),
            ]),
        ]);
    }
    cartridge_button(x) {
        return this.class("kate-ui-cartridge-box", [
            this.class("kate-ui-cartridge-image", [
                // thumbnail
                x.thumbnail_dataurl
                    ? this.h("img", {
                        src: x.thumbnail_dataurl,
                        class: "kate-ui-cartridge-image-thumb",
                    }, [])
                    : this.no_thumbnail(x.title),
                // release type
                this.class("kate-ui-cartridge-release-type", [
                    pretty_release_type(x.release_type ?? null),
                ]).attr({ "data-release-type": x.release_type ?? null }),
                // content rating
                this.class("kate-ui-cartridge-rating", [rating_icon(x.content_rating ?? null)]).attr({
                    "data-rating": x.content_rating ?? null,
                }),
            ]),
            this.class("kate-ui-cartridge-info", [
                this.class("kate-ui-cartridge-title", [x.title]),
                this.class("kate-ui-cartridge-id", [x.id]),
            ]),
        ]).interactive(compact([
            x.on_select == null
                ? null
                : {
                    key: ["o"],
                    on_click: true,
                    label: x.select_label ?? "Ok",
                    handler: async () => x.on_select(),
                },
            x.on_menu == null
                ? null
                : {
                    key: ["menu"],
                    on_menu: true,
                    label: x.menu_label ?? "Options",
                    handler: async () => x.on_menu(),
                },
        ]), {
            custom_focus: true,
        });
    }
    section(x) {
        return this.class("kate-ui-section", [
            this.class("kate-ui-section-title", [x.title]),
            this.class("kate-ui-section-body", [x.body]),
        ]);
    }
    toggle(x) {
        return this.class("kate-ui-toggle-container", [
            this.class("kate-ui-toggle-view", [this.class("kate-ui-toggle-bullet", [])]),
            this.class("kate-ui-toggle-label-yes", [x.enabled_label ?? "Yes"]),
            this.class("kate-ui-toggle-label-no", [x.disabled_label ?? "No"]),
        ]).dynamic(x.value, (widget, value) => {
            widget.canvas.classList.toggle("active", value);
        });
    }
    toggle_panel(x) {
        const value = typeof x.value === "boolean" ? new utils_1.Observable(x.value) : new utils_1.Observable(x.value.value);
        x.tap?.(value);
        return this.class("kate-ui-toggle-panel", [
            this.class("kate-ui-toggle-panel-title", [x.title]),
            this.class("kate-ui-toggle-panel-description", [x.description]),
            this.class("kate-ui-toggle-panel-control", [
                this.toggle({
                    value,
                    enabled_label: x.enabled_label,
                    disabled_label: x.disabled_label,
                }),
            ]),
        ]).interactive([
            {
                key: ["o"],
                label: "Toggle",
                on_click: true,
                handler: async () => {
                    value.value = !value.value;
                },
            },
        ]);
    }
}
exports.WidgetDSL = WidgetDSL;
function style(items) {
    return Object.entries(items)
        .filter(([_, x]) => x != null)
        .map(([k, v]) => `${k}: ${v}`)
        .join("; ");
}
function rem(x) {
    return x != null ? `${x}rem` : null;
}
function compact(xs) {
    return xs.filter((x) => x != null);
}
function pretty_release_type(x) {
    switch (x) {
        case null:
            return null;
        case "beta":
            return "Beta";
        case "demo":
            return "Demo";
        case "early-access":
            return "Dev.";
        case "prototype":
            return "PoC";
        case "regular":
            return "Full";
        case "unofficial":
            return "Unofficial";
        default:
            throw (0, utils_1.unreachable)(x, "release type");
    }
}
function rating_icon(x) {
    switch (x) {
        case null:
            return null;
        case "general":
            return "G";
        case "teen-and-up":
            return "T";
        case "mature":
            return "M";
        case "explicit":
            return "E";
        case "unknown":
            return "—";
        default:
            throw (0, utils_1.unreachable)(x, "content rating");
    }
}
function key_to_button(x) {
    switch (x) {
        case "capture":
            return "capture";
        case "ltrigger":
            return "l";
        case "rtrigger":
            return "r";
        case "down":
            return "dpad-down";
        case "left":
            return "dpad-left";
        case "right":
            return "dpad-right";
        case "up":
            return "dpad-up";
        case "menu":
            return "menu";
        case "o":
            return "ok";
        case "x":
            return "cancel";
        case "sparkle":
            return "sparkle";
        case "berry":
            return "berry";
        default:
            throw (0, utils_1.unreachable)(x);
    }
}

});

// ecosystem/publisher/build/scenes/main.js
require.define(22, "ecosystem/publisher/build/scenes", "ecosystem/publisher/build/scenes/main.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneMain = void 0;
const appui_1 = require(16);
const utils_1 = require(4);
const recipe_importer_1 = require(23);
class SceneMain extends appui_1.UIScene {
    app;
    constructor(app, ui) {
        super(ui);
        this.app = app;
    }
    async render() {
        const projects = await this.app.projects.list();
        if (projects.length === 0) {
            return this.welcome();
        }
        else {
            return this.project_list(projects);
        }
    }
    welcome() {
        const ui = this.ui.dsl;
        return ui.two_panel_screen({
            left: ui.hero({
                title: "Kate Publisher",
                subtitle: "Create your own Kate cartridges.",
                content: ui.stack([
                    ui.p([
                        "The Publisher allows you to convert games from supported ",
                        "engines into proper Kate cartridges. It also lets you export ",
                        "cartridges for other platforms.",
                    ]),
                    ui.p([
                        "You can start by creating a new project, or importing an ",
                        "existing Publisher project you have on disk.",
                    ]),
                    ui.p([
                        "The Publisher has special support for Bitsy and Ren'Py currently, ",
                        "but most web games can be converted to Kate cartridges with some effort.",
                    ]),
                ]),
            }),
            right: ui.app_screen({
                body: ui
                    .vbox({ gap: 2 }, [
                    ui.title(["New project..."], "h2"),
                    ui.action_list([
                        {
                            icon: ui.fa_icon("wand-magic-sparkles", "2x"),
                            title: "From a recipe",
                            description: `
                If you have a game in a supported engine, the Publisher
                can handle most of the conversion to Kate for you.
              `,
                            on_select: () => {
                                this.ui.push_scene(new recipe_importer_1.SceneRecipeImporter(this.app, this.ui));
                            },
                        },
                    ]),
                ])
                    .style({ padding: "2rem 0" }),
                status: ui.status_bar([ui.dynamic_status_icons()]),
            }),
        });
    }
    project_list(projects) {
        const ui = this.ui.dsl;
        return ui.app_screen({
            title: "Your projects",
            body: ui.scroll_area({}, [
                ui.action_list(projects.map((x) => {
                    return {
                        icon: ui.fa_icon("diamond", "2x"),
                        title: x.data.meta.title,
                        description: `${x.data.domain}/${x.data.id} | Last updated ${(0, utils_1.relative_date)(x.updated_at)}`,
                        on_select() { },
                    };
                })),
            ]),
            status: ui.status_bar([ui.dynamic_status_icons()]),
        });
    }
}
exports.SceneMain = SceneMain;

});

// ecosystem/publisher/build/scenes/recipe-importer.js
require.define(23, "ecosystem/publisher/build/scenes", "ecosystem/publisher/build/scenes/recipe-importer.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneRecipeImporter = void 0;
const appui_1 = require(16);
const utils_1 = require(4);
class SceneRecipeImporter extends appui_1.UIScene {
    app;
    data = {
        recipe_type: new utils_1.Observable(null),
        account: new utils_1.Observable(null),
    };
    constructor(app, ui) {
        super(ui);
        this.app = app;
    }
    render() {
        return this.ui.dsl.multistep([
            {
                content: this.choose_recipe(),
                is_valid: this.data.recipe_type.map((x) => x !== null),
            },
            {
                content: this.choose_account(),
                is_valid: this.data.account.map((x) => x !== null),
            },
        ], { slot_for_actions: "actions" });
    }
    choose_recipe() {
        const ui = this.ui.dsl;
        return ui.two_panel_screen({
            left: ui.hero({
                title: "Your game's engine",
                subtitle: "What did you use to make your game?",
                content: ui.stack([
                    ui.p([
                        "Kate has special support for a few game engines. If you've used ",
                        "one of them we can handle most of the conversion from that engine to ",
                        "Kate cartridges for you.",
                    ]),
                    ui.p([
                        "Otherwise, most games exported for a web browser can be ",
                        "converted to a Kate cartridge with some effort. This will require ",
                        "some knowledge of web programming and some fiddling with different ",
                        "strategies to let Kate emulate the web APIs your game uses.",
                    ]),
                ]),
            }),
            right: ui.app_screen({
                body: ui
                    .vbox({ gap: 2 }, [
                    ui
                        .scroll_area({}, [
                        ui.action_selection({
                            value: this.data.recipe_type.value,
                            on_change: (x) => {
                                this.data.recipe_type.value = x;
                            },
                            options: [
                                {
                                    title: "Ren'Py",
                                    description: `Use the recipe for Ren'Py 7.x and newer`,
                                    value: "renpy",
                                },
                                {
                                    title: "Bitsy",
                                    description: `Use the recipe for Bitsy. Might not support Bitsy hacks.`,
                                    value: "bitsy",
                                },
                                {
                                    title: "Web game",
                                    description: `Use the basic recipe for web games. You'll need to handle 
                   specific features for your game later.
                  `,
                                    value: "web",
                                },
                            ],
                        }),
                    ])
                        .style({ padding: "2rem 0", "flex-grow": "1" }),
                    ui.slot("actions").style({ "flex-shrink": "0" }),
                ])
                    .style({ "padding-bottom": "1rem", height: "100%" }),
                status: ui.status_bar([ui.dynamic_status_icons()]),
            }),
        });
    }
    choose_account() {
        return "";
    }
}
exports.SceneRecipeImporter = SceneRecipeImporter;

});

module.exports = require(1);
}((() => {
  if (typeof require !== "undefined" && typeof module !== "undefined") {
    return [module, module.exports, require];
  } else if (typeof window !== "undefined") {
    const module = Object.create(null);
    module.exports = Object.create(null);
    Object.defineProperty(window, "KatePublisher", {
      get() { return module.exports },
      set(v) { module.exports = v }
    });
    return [module, module.exports, (id) => {
      throw new Error("Cannot load " + JSON.stringify(id) + " because node modules are not supported.");
    }];
  } else {
    throw new Error("Unsupported environment");
  }
})());