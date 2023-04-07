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

// packages\kate-core\build\index.js
require.define(1, "packages\\kate-core\\build", "packages\\kate-core\\build\\index.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.os = exports.kernel = void 0;
exports.kernel = require(2);
exports.os = require(24);

});

// packages\kate-core\build\kernel\index.js
require.define(2, "packages\\kate-core\\build\\kernel", "packages\\kate-core\\build\\kernel\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(3), exports);
__exportStar(require(4), exports);
__exportStar(require(20), exports);
__exportStar(require(21), exports);
__exportStar(require(22), exports);

});

// packages\kate-core\build\kernel\kate.js
require.define(3, "packages\\kate-core\\build\\kernel", "packages\\kate-core\\build\\kernel\\kate.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateKernel = void 0;
const cart_runtime_1 = require(4);
const gamepad_1 = require(20);
const input_1 = require(21);
const virtual_1 = require(22);
class KateKernel {
    console;
    keyboard;
    gamepad;
    runtimes;
    constructor(console, keyboard, gamepad) {
        this.console = console;
        this.keyboard = keyboard;
        this.gamepad = gamepad;
        this.runtimes = new cart_runtime_1.KateRuntimes(console);
    }
    static from_root(root, options) {
        const console = new virtual_1.VirtualConsole(root, {
            mode: options.mode ?? "web",
            persistent_storage: options.persistent_storage ?? false,
        });
        const keyboard = new input_1.KeyboardInput(console);
        const gamepad = new gamepad_1.GamepadInput(console);
        console.listen();
        keyboard.listen(document.body);
        gamepad.setup();
        return new KateKernel(console, keyboard, gamepad);
    }
}
exports.KateKernel = KateKernel;

});

// packages\kate-core\build\kernel\cart-runtime.js
require.define(4, "packages\\kate-core\\build\\kernel", "packages\\kate-core\\build\\kernel\\cart-runtime.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CR_Web_archive = exports.CRW_Process = exports.CR_Process = exports.CartRuntime = exports.KateRuntimes = void 0;
const utils_1 = require(5);
const translate_html_1 = require(17);
class KateRuntimes {
    console;
    constructor(console) {
        this.console = console;
    }
    from_cartridge(cart, env) {
        switch (cart.runtime.type) {
            case "web-archive":
                return new CR_Web_archive(this.console, cart.metadata, cart.runtime, env);
            default:
                throw new Error(`Unsupported cartridge`);
        }
    }
}
exports.KateRuntimes = KateRuntimes;
class CartRuntime {
}
exports.CartRuntime = CartRuntime;
class CR_Process {
}
exports.CR_Process = CR_Process;
class UpdateTimeLoop {
    start_time;
    on_update;
    UPDATE_FREQUENCY = 1000 * 60 * 10; // 10 min
    last_stored = null;
    handler = null;
    constructor(start_time, on_update) {
        this.start_time = start_time;
        this.on_update = on_update;
    }
    start() {
        this.handler = setTimeout(this.tick, this.UPDATE_FREQUENCY);
    }
    tick = () => {
        clearTimeout(this.handler);
        this.update();
        this.handler = setTimeout(this.tick, this.UPDATE_FREQUENCY);
    };
    update() {
        const now = new Date();
        const elapsed = now.getTime() - (this.last_stored ?? this.start_time).getTime();
        this.last_stored = now;
        this.on_update(elapsed);
    }
    stop() {
        clearTimeout(this.handler);
        this.update();
    }
}
class CRW_Process extends CR_Process {
    runtime;
    env;
    time_loop;
    _setup = false;
    constructor(runtime, env) {
        super();
        this.runtime = runtime;
        this.env = env;
        this.time_loop = new UpdateTimeLoop(new Date(), env.on_playtime_update);
    }
    get node() {
        return this.env.frame;
    }
    async setup() {
        if (this._setup) {
            throw new Error(`setup() called twice`);
        }
        this._setup = true;
        this.time_loop.start();
    }
    async exit() {
        this.env.frame.src = "about:blank";
        this.env.frame.remove();
        this.env.channel?.dispose();
        this.time_loop.stop();
        await this.env.audio_server.stop();
    }
    async pause() {
        this.env.channel?.send({
            type: "kate:paused",
            state: true,
        });
    }
    async unpause() {
        this.env.channel?.send({
            type: "kate:paused",
            state: false,
        });
    }
}
exports.CRW_Process = CRW_Process;
class CR_Web_archive extends CartRuntime {
    console;
    metadata;
    runtime;
    env;
    constructor(console, metadata, runtime, env) {
        super();
        this.console = console;
        this.metadata = metadata;
        this.runtime = runtime;
        this.env = env;
    }
    async run(os) {
        const secret = (0, utils_1.make_id)();
        const frame = document.createElement("iframe");
        const audio_server = os.make_audio_server();
        const capture_tokens = new Set();
        const env = {
            ...this.env,
            secret: secret,
            frame: frame,
            audio_server: audio_server,
            channel: null,
            capture_tokens,
        };
        const channel = os.ipc.add_process(env);
        env.channel = channel;
        frame.className = "kate-game-frame kate-game-frame-defaults";
        frame.sandbox = "allow-scripts";
        frame.allow = "";
        frame.csp =
            "default-src data: blob: 'unsafe-inline' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'; navigate-to 'none'";
        this.console.on_input_changed.listen((ev) => {
            channel.send({
                type: "kate:input-state-changed",
                key: ev.key,
                is_down: ev.is_down,
            });
        });
        let recording = false;
        this.console.on_key_pressed.listen((key) => {
            channel.send({
                type: "kate:input-key-pressed",
                key: key,
            });
            if (key.key === "capture") {
                const token = (0, utils_1.make_id)();
                env.capture_tokens.add(token);
                channel.send({ type: "kate:take-screenshot", token });
            }
            if (key.key === "long_capture") {
                recording = !recording;
                if (recording) {
                    const token = (0, utils_1.make_id)();
                    env.capture_tokens.add(token);
                    channel.send({ type: "kate:start-recording", token });
                }
                else {
                    channel.send({ type: "kate:stop-recording" });
                }
            }
        });
        frame.src = URL.createObjectURL(new Blob([await this.proxy_html(env)], { type: "text/html" }));
        frame.scrolling = "no";
        const process = new CRW_Process(this, env);
        process.setup();
        return process;
    }
    async proxy_html(env) {
        return (0, translate_html_1.translate_html)(this.env.cart.runtime.html, env);
    }
}
exports.CR_Web_archive = CR_Web_archive;

});

// packages\kate-core\build\utils.js
require.define(5, "packages\\kate-core\\build", "packages\\kate-core\\build\\utils.js", (module, exports, __dirname, __filename) => {
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
exports.TC = void 0;
__exportStar(require(6), exports);
__exportStar(require(7), exports);
__exportStar(require(8), exports);
__exportStar(require(9), exports);
__exportStar(require(10), exports);
__exportStar(require(11), exports);
__exportStar(require(12), exports);
__exportStar(require(13), exports);
__exportStar(require(14), exports);
exports.TC = require(15);
__exportStar(require(16), exports);

});

// packages\util\build\assert.js
require.define(6, "packages\\util\\build", "packages\\util\\build\\assert.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unreachable = void 0;
function unreachable(x, message = "") {
    throw new Error(`Unhandled value(${message}): ${x}`);
}
exports.unreachable = unreachable;

});

// packages\util\build\pathname.js
require.define(7, "packages\\util\\build", "packages\\util\\build\\pathname.js", (module, exports, __dirname, __filename) => {
"use strict";
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
    join(x) {
        if (x.is_absolute) {
            return x;
        }
        else {
            return new Pathname(this.is_absolute, [...this.segments, ...x.segments]);
        }
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

// packages\util\build\random.js
require.define(8, "packages\\util\\build", "packages\\util\\build\\random.js", (module, exports, __dirname, __filename) => {
"use strict";
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

// packages\util\build\promise.js
require.define(9, "packages\\util\\build", "packages\\util\\build\\promise.js", (module, exports, __dirname, __filename) => {
"use strict";
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

// packages\util\build\events.js
require.define(10, "packages\\util\\build", "packages\\util\\build\\events.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStream = void 0;
class EventStream {
    subscribers = [];
    on_dispose = () => { };
    listen(fn) {
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
        for (const fn of this.subscribers) {
            fn(ev);
        }
    }
    dispose() {
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
}
exports.EventStream = EventStream;

});

// packages\util\build\url.js
require.define(11, "packages\\util\\build", "packages\\util\\build\\url.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.file_to_dataurl = void 0;
function file_to_dataurl(file) {
    const content = Array.from(file.data)
        .map((x) => String.fromCharCode(x))
        .join("");
    return `data:${file.mime};base64,${btoa(content)}`;
}
exports.file_to_dataurl = file_to_dataurl;

});

// packages\util\build\graphics.js
require.define(12, "packages\\util\\build", "packages\\util\\build\\graphics.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.make_thumbnail = exports.make_thumbnail_from_bytes = exports.load_image = void 0;
function load_image(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Loading image from ${url} failed`));
        img.src = url;
    });
}
exports.load_image = load_image;
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
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png");
}
exports.make_thumbnail = make_thumbnail;

});

// packages\util\build\mime.js
require.define(13, "packages\\util\\build", "packages\\util\\build\\mime.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.to_extension = void 0;
function to_extension(mime) {
    switch (mime) {
        case "image/png":
            return ".png";
        case "video/webm":
            return ".webm";
        default:
            return "";
    }
}
exports.to_extension = to_extension;

});

// packages\util\build\ua-parser.js
require.define(14, "packages\\util\\build", "packages\\util\\build\\ua-parser.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalise_brands = exports.basic_ua_details = exports.user_agent_info = void 0;
async function user_agent_info() {
    if (navigator.userAgentData != null) {
        return try_ua_details();
    }
    else {
        return {
            engine: [{ name: "unknown", version: "" }],
            cpu: { architecture: "unknown" },
            os: { name: "unknown" },
        };
    }
}
exports.user_agent_info = user_agent_info;
async function try_ua_details() {
    const ua = navigator.userAgentData;
    try {
        const details = await ua.getHighEntropyValues([
            "fullVersionList",
            "bitness",
            "architecture",
            "platform",
            "platformVersion",
            "wow64",
        ]);
        return {
            engine: normalise_brands(details.fullVersionList ?? details.brands),
            cpu: {
                architecture: normalise_architecture(details.architecture, details.bitness),
                wow64: details.wow64,
            },
            os: {
                name: details.platform,
                version: normalise_version(details.platform, details.platformVersion),
            },
            mobile: details.mobile,
        };
    }
    catch (_) {
        return basic_ua_details();
    }
}
function basic_ua_details() {
    const ua = navigator.userAgentData ?? {};
    return {
        engine: normalise_brands(ua.brands),
        cpu: {
            architecture: "unknown",
        },
        os: {
            name: ua.platform,
        },
        mobile: ua.mobile,
    };
}
exports.basic_ua_details = basic_ua_details;
function normalise_brands(brands) {
    return brands
        .map((x) => ({ name: x.brand, version: x.version }))
        .filter((x) => !(/\bnot/i.test(x.name) && /brand\b/i.test(x.name)));
}
exports.normalise_brands = normalise_brands;
function normalise_architecture(kind, bitness) {
    switch (kind) {
        case "x86": {
            switch (bitness) {
                case "64":
                    return "x64";
                case "32":
                    return "x86";
                default:
                    return `x86 (${bitness})`;
            }
        }
        case "arm": {
            switch (bitness) {
                case "64":
                    return "ARM64";
                case "32":
                    return "ARM32";
                default:
                    return `ARM (${bitness})`;
            }
        }
        default:
            return `${kind} (${bitness})`;
    }
}
function normalise_version(platform, version) {
    switch (platform) {
        case "Windows": {
            const v = parse_win_version(version);
            if (v.major >= 13) {
                return "11 or newer";
            }
            if (v.major > 0) {
                return "10";
            }
            return "8.1 or older";
        }
        default:
            return version;
    }
}
function parse_win_version(version) {
    const [major, feature, minor] = version
        .trim()
        .split(".")
        .map((x) => Number(x));
    return { major, feature, minor };
}

});

// packages\util\build\type-check.js
require.define(15, "packages\\util\\build", "packages\\util\\build\\type-check.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nullable = exports.integer = exports.boolean = exports.number = exports.string = void 0;
function string(x) {
    if (typeof x !== "string") {
        throw new Error(`Expected string`);
    }
    return x;
}
exports.string = string;
function number(x) {
    if (typeof x !== "number") {
        throw new Error(`Expected number`);
    }
    return x;
}
exports.number = number;
function boolean(x) {
    if (typeof x !== "boolean") {
        throw new Error(`Expected boolean`);
    }
    return x;
}
exports.boolean = boolean;
function integer(x) {
    const x1 = number(x);
    if (Math.floor(x1) !== x1) {
        throw new Error(`Expected integer`);
    }
    return x;
}
exports.integer = integer;
function nullable(f, value) {
    if (value == null) {
        return null;
    }
    else {
        return f(value);
    }
}
exports.nullable = nullable;

});

// packages\util\build\unit.js
require.define(16, "packages\\util\\build", "packages\\util\\build\\unit.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gb = exports.mb = exports.kb = exports.bytes = exports.from_bytes = exports.mhz_to_ghz = void 0;
function mhz_to_ghz(n) {
    return `${(n / 1000).toFixed(3)} GHz`;
}
exports.mhz_to_ghz = mhz_to_ghz;
function from_bytes(n0) {
    const units = [
        ["KB", 1024],
        ["MB", 1024],
        ["GB", 1024],
        ["TB", 1024],
    ];
    let n = n0;
    let use_unit = "B";
    for (const [unit, bucket] of units) {
        if (n > bucket) {
            n /= bucket;
            use_unit = unit;
        }
        else {
            break;
        }
    }
    return `${n.toFixed(2)} ${use_unit}`;
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

// packages\kate-core\build\kernel\translate-html.js
require.define(17, "packages\\kate-core\\build\\kernel", "packages\\kate-core\\build\\kernel\\translate-html.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.add_cover = exports.translate_html = void 0;
const bridges_1 = require(18);
const utils_1 = require(5);
async function translate_html(html, context) {
    const dom = new DOMParser().parseFromString(html, "text/html");
    const preamble = add_preamble(dom, context);
    add_bridges(preamble, dom, context);
    await inline_all_scripts(dom, context);
    await inline_all_links(dom, context);
    await load_all_media(dom, context);
    add_cover(dom, context);
    return dom.documentElement.outerHTML;
}
exports.translate_html = translate_html;
function add_cover(dom, context) {
    const element = dom.createElement("div");
    const id = `kate_${(0, utils_1.make_id)().replace(/\-/g, "_")}`;
    element.id = id;
    element.style.position = "fixed";
    element.style.top = "0px";
    element.style.left = "0px";
    element.style.width = "100%";
    element.style.height = "100%";
    element.style.zIndex = "99999";
    element.setAttribute("onclick", `
    event.preventDefault();
    KateAPI.focus();
    `);
    dom.body.appendChild(element);
}
exports.add_cover = add_cover;
async function load_all_media(dom, context) {
    for (const img of Array.from(dom.querySelectorAll("img"))) {
        const path = img.getAttribute("src");
        const file = await try_get_file(path, context);
        if (file == null) {
            continue;
        }
        if (file.data.length < 1024 * 1024) {
            // inline 1mb or less images
            img.setAttribute("src", await get_data_url(path, context));
        }
        else {
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
function add_preamble(dom, context) {
    const script = dom.createElement("script");
    const id = `preamble_${(0, utils_1.make_id)()}`;
    script.id = id;
    script.textContent = `
  void function() {
    var KATE_SECRET = ${JSON.stringify(context.secret)};
    ${bridges_1.bridges["kate-api.js"]};
    
    let script = document.getElementById(${JSON.stringify(id)});
    script.remove();
    script = null;
  }();
  `;
    dom.head.insertBefore(script, dom.head.firstChild);
    const all_scripts = Array.from(dom.querySelectorAll("script"));
    if (all_scripts[0] !== script) {
        throw new Error(`Cannot sandbox HTML: aborting insecure cartridge instantiation`);
    }
    return script;
}
function add_bridges(reference, dom, context) {
    for (const bridge of context.cart.runtime.bridges) {
        apply_bridge(bridge, reference, dom, context);
    }
}
function apply_bridge(bridge, reference, dom, context) {
    const wrap = (source) => {
        return `void function(exports) {
      "use strict";
      ${source};
    }({});`;
    };
    const append_proxy = (source, before = reference) => {
        const script = dom.createElement("script");
        script.textContent = wrap(source);
        if (before.nextSibling != null && before.parentNode != null) {
            before.parentNode.insertBefore(script, before.nextSibling);
        }
        else {
            before.parentNode.appendChild(script);
        }
    };
    switch (bridge.type) {
        case "network-proxy": {
            append_proxy(bridges_1.bridges["standard-network.js"]);
            break;
        }
        case "input-proxy": {
            const code = bridges_1.bridges["input.js"];
            const keys = JSON.stringify(generate_proxied_key_mappings(bridge.mapping), null, 2);
            const full_source = `const key_mapping = ${keys};\n${code}`;
            append_proxy(full_source);
            break;
        }
        case "local-storage-proxy": {
            const full_source = `
        var KATE_LOCAL_STORAGE = ${JSON.stringify(context.local_storage ?? {})};
        ${bridges_1.bridges["local-storage.js"]}
      `;
            append_proxy(full_source);
            break;
        }
        case "preserve-render": {
            append_proxy(bridges_1.bridges["preserve-render.js"]);
            break;
        }
        case "capture-canvas": {
            const code = bridges_1.bridges["capture-canvas.js"];
            const full_source = `const SELECTOR = ${JSON.stringify(bridge.selector)};\n${code}`;
            const script = document.createElement("script");
            script.textContent = wrap(full_source);
            dom.body.appendChild(script);
            break;
        }
        default:
            throw (0, utils_1.unreachable)(bridge, "kate bridge");
    }
}
function generate_proxied_key_mappings(map) {
    const pairs = [...map.entries()].map(([k, v]) => [
        k,
        [v.key, v.code, Number(v.key_code)],
    ]);
    return Object.fromEntries(pairs);
}
async function inline_all_scripts(dom, context) {
    for (const script of Array.from(dom.querySelectorAll("script"))) {
        const src = script.getAttribute("src");
        if (src != null && src.trim() !== "") {
            const real_path = utils_1.Pathname.from_string(src).make_absolute().as_string();
            const contents = await get_text_file(real_path, context);
            script.removeAttribute("src");
            script.removeAttribute("type");
            script.textContent = contents;
        }
    }
}
async function inline_all_links(dom, context) {
    for (const link of Array.from(dom.querySelectorAll("link"))) {
        const href = link.getAttribute("href") ?? "";
        const path = utils_1.Pathname.from_string(href).make_absolute();
        if (link.rel === "stylesheet") {
            await inline_css(link, path, dom, context);
        }
        else {
            link.setAttribute("href", await get_data_url(path.as_string(), context));
        }
    }
}
async function inline_css(link, root, dom, context) {
    const source0 = await get_text_file(root.as_string(), context);
    const source1 = await transform_css_urls(root.dirname(), source0, context);
    // TODO: inline imports
    const style = dom.createElement("style");
    style.textContent = source1;
    link.parentNode.insertBefore(style, link);
    link.remove();
}
async function transform_css_urls(base, source, context) {
    const imports = Array.from(new Set([...source.matchAll(/\burl\(("[^"]+")\)/g)].map((x) => x[1])));
    const import_map = new Map(await Promise.all(imports.map(async (url_string) => {
        const url_path = utils_1.Pathname.from_string(JSON.parse(url_string));
        const path = base.join(url_path).as_string();
        const data_url = await get_data_url(path, context);
        return [url_string, data_url];
    })));
    return source.replace(/\burl\(("[^"]+")\)/g, (_, url_string) => {
        const data_url = import_map.get(url_string);
        return `url(${JSON.stringify(data_url)})`;
    });
}
async function try_get_file(path, env) {
    return await env.read_file(path);
}
async function try_get_text_file(path, env) {
    const file = await try_get_file(path, env);
    if (file != null) {
        const decoder = new TextDecoder("utf-8");
        return decoder.decode(file.data);
    }
    else {
        return null;
    }
}
async function get_text_file(real_path, env) {
    const contents = await try_get_text_file(real_path, env);
    if (contents != null) {
        return contents;
    }
    else {
        throw new Error(`File not found: ${real_path}`);
    }
}
async function get_data_url(real_path, env) {
    const file = await try_get_file(real_path, env);
    if (file != null) {
        return (0, utils_1.file_to_dataurl)(file);
    }
    else {
        throw new Error(`File not found: ${real_path}`);
    }
}

});

// packages\kate-core\build\bridges.js
require.define(18, "packages\\kate-core\\build", "packages\\kate-core\\build\\bridges.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(19), exports);

});

// packages\kate-bridges\build\index.js
require.define(19, "packages\\kate-bridges\\build", "packages\\kate-bridges\\build\\index.js", (module, exports, __dirname, __filename) => {
"use strict";
exports.__esModule = true;
exports.bridges = void 0;
exports.bridges = {
    "capture-canvas.js": "\"use strict\";\r\nconst MAX_RETRIES = 60;\r\nfunction try_capture(retries) {\r\n    const element = document.querySelector(SELECTOR);\r\n    if (element instanceof HTMLCanvasElement) {\r\n        KateAPI.capture.set_root(element);\r\n    }\r\n    else if (retries > 0) {\r\n        setTimeout(() => try_capture(retries - 1), 1_000);\r\n    }\r\n    else {\r\n        console.log(`[Kate] Could not find '${SELECTOR}' to capture in ${MAX_RETRIES} seconds. Giving up.`);\r\n    }\r\n}\r\ntry_capture(MAX_RETRIES);\r\n",
    "input.js": "\"use strict\";\r\nlet paused = false;\r\nconst { events } = KateAPI;\r\nconst add_event_listener = window.addEventListener;\r\nconst down_listeners = [];\r\nconst up_listeners = [];\r\nconst down = new Set();\r\nconst on_key_update = ({ key: kate_key, is_down, }) => {\r\n    if (!paused) {\r\n        const data = key_mapping[kate_key];\r\n        if (data) {\r\n            if (is_down) {\r\n                down.add(kate_key);\r\n            }\r\n            else {\r\n                down.delete(kate_key);\r\n            }\r\n            const listeners = is_down ? down_listeners : up_listeners;\r\n            const type = is_down ? \"keydown\" : \"keyup\";\r\n            const [key, code, keyCode] = data;\r\n            const key_ev = new KeyboardEvent(type, { key, code, keyCode });\r\n            for (const fn of listeners) {\r\n                fn.call(document, key_ev);\r\n            }\r\n        }\r\n    }\r\n};\r\nevents.input_state_changed.listen(on_key_update);\r\nevents.paused.listen((state) => {\r\n    if (state === true) {\r\n        for (const key of down) {\r\n            on_key_update({ key, is_down: false });\r\n        }\r\n    }\r\n    paused = state;\r\n});\r\nfunction listen(type, listener, options) {\r\n    if (type === \"keydown\") {\r\n        down_listeners.push(listener);\r\n    }\r\n    else if (type === \"keyup\") {\r\n        up_listeners.push(listener);\r\n    }\r\n    else if (type === \"gamepadconnected\" || type === \"gamepaddisconnected\") {\r\n        // do nothing\r\n    }\r\n    else {\r\n        add_event_listener.call(this, type, listener, options);\r\n    }\r\n}\r\nwindow.addEventListener = listen;\r\ndocument.addEventListener = listen;\r\n// Disable gamepad input\r\nObject.defineProperty(navigator, \"getGamepads\", {\r\n    enumerable: false,\r\n    configurable: false,\r\n    value: () => [null, null, null, null],\r\n});\r\n",
    "kate-api.js": "void function([module, exports, node_require]) {\n  const require = (id) => {\n    if (typeof id === \"string\") {\n      return node_require(id);\n    }\n\n    const module = require.mapping.get(id);\n    if (module == null) {\n      throw new Error(\"Undefined module \" + id);\n    }\n    if (!module.initialised) {\n      module.initialised = true;\n      module.load.call(null,\n        module.module,\n        module.module.exports,\n        module.dirname,\n        module.filename\n      );\n    }\n    return module.module.exports;\n  };\n  \n  require.mapping = new Map();\n  require.define = (id, dirname, filename, fn) => {\n    const module = Object.create(null);\n    module.exports = Object.create(null);\n    require.mapping.set(id, {\n      module: module,\n      dirname,\n      filename,\n      initialised: false,\n      load: fn\n    });\n  };\n\n// packages\\kate-api\\build\\index.js\nrequire.define(1, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\index.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.focus = exports.capture = exports.input = exports.timer = exports.audio = exports.store = exports.cart_fs = exports.events = void 0;\r\nconst audio_1 = require(2);\r\nconst capture_1 = require(3);\r\nconst cart_fs_1 = require(5);\r\nconst channel_1 = require(6);\r\nconst input_1 = require(8);\r\nconst object_store_1 = require(9);\r\nconst timer_1 = require(10);\r\nconst channel = new channel_1.KateIPC(KATE_SECRET, window.parent);\r\nchannel.setup();\r\nexports.events = channel.events;\r\nexports.cart_fs = new cart_fs_1.KateCartFS(channel);\r\nexports.store = new object_store_1.KateObjectStore(channel);\r\nexports.audio = new audio_1.KateAudio(channel);\r\nexports.timer = new timer_1.KateTimer();\r\nexports.timer.setup();\r\nexports.input = new input_1.KateInput(channel, exports.timer);\r\nexports.input.setup();\r\nexports.capture = new capture_1.KateCapture(channel, exports.input);\r\nexports.capture.setup();\r\nconst focus = () => {\r\n    channel.send_and_ignore_result(\"kate:special.focus\", {});\r\n};\r\nexports.focus = focus;\r\n\n});\n\n// packages\\kate-api\\build\\audio.js\nrequire.define(2, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\audio.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateAudioChannel = exports.KateAudioSource = exports.KateAudio = void 0;\r\nclass KateAudio {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    async create_channel(name, max_tracks = 1) {\r\n        const { id, volume } = await this.#channel.call(\"kate:audio.create-channel\", { max_tracks });\r\n        return new KateAudioChannel(this, name, id, max_tracks, volume);\r\n    }\r\n    async stop_all_sources(channel) {\r\n        await this.#channel.call(\"kate:audio.stop-all-sources\", { id: channel.id });\r\n    }\r\n    async change_channel_volume(channel, value) {\r\n        await this.#channel.call(\"kate:audio.change-volume\", {\r\n            id: channel.id,\r\n            volume: value,\r\n        });\r\n    }\r\n    async load_audio(mime, bytes) {\r\n        const audio = await this.#channel.call(\"kate:audio.load\", {\r\n            mime,\r\n            bytes,\r\n        });\r\n        return new KateAudioSource(this, audio);\r\n    }\r\n    async play(channel, audio, loop) {\r\n        await this.#channel.call(\"kate:audio.play\", {\r\n            channel: channel.id,\r\n            source: audio.id,\r\n            loop: loop,\r\n        });\r\n    }\r\n}\r\nexports.KateAudio = KateAudio;\r\nclass KateAudioSource {\r\n    audio;\r\n    id;\r\n    constructor(audio, id) {\r\n        this.audio = audio;\r\n        this.id = id;\r\n    }\r\n}\r\nexports.KateAudioSource = KateAudioSource;\r\nclass KateAudioChannel {\r\n    audio;\r\n    name;\r\n    id;\r\n    max_tracks;\r\n    _volume;\r\n    constructor(audio, name, id, max_tracks, _volume) {\r\n        this.audio = audio;\r\n        this.name = name;\r\n        this.id = id;\r\n        this.max_tracks = max_tracks;\r\n        this._volume = _volume;\r\n    }\r\n    get volume() {\r\n        return this._volume;\r\n    }\r\n    async set_volume(value) {\r\n        if (value < 0 || value > 1) {\r\n            throw new Error(`Invalid volume value ${value}`);\r\n        }\r\n        this._volume = value;\r\n        this.audio.change_channel_volume(this, value);\r\n    }\r\n    async stop_all_sources() {\r\n        return this.audio.stop_all_sources(this);\r\n    }\r\n    async play(source, loop) {\r\n        return this.audio.play(this, source, loop);\r\n    }\r\n}\r\nexports.KateAudioChannel = KateAudioChannel;\r\n\n});\n\n// packages\\kate-api\\build\\capture.js\nrequire.define(3, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\capture.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateCapture = void 0;\r\nconst promise_1 = require(4);\r\nclass KateCapture {\r\n    _input;\r\n    CAPTURE_FPS = 24;\r\n    CAPTURE_FORMAT = { mimeType: \"video/webm; codecs=vp9\" };\r\n    CAPTURE_MAX_LENGTH = 60000;\r\n    #channel;\r\n    #initialised = false;\r\n    #capture_root = null;\r\n    #capture_monitor = null;\r\n    constructor(channel, _input) {\r\n        this._input = _input;\r\n        this.#channel = channel;\r\n    }\r\n    setup() {\r\n        if (this.#initialised) {\r\n            throw new Error(`setup() called twice`);\r\n        }\r\n        this.#initialised = true;\r\n        this.#channel.events.take_screenshot.listen(({ token }) => {\r\n            if (this.will_capture()) {\r\n                this.#save_screenshot(token);\r\n            }\r\n        });\r\n        this.#channel.events.start_recording.listen(({ token }) => {\r\n            if (this.#capture_monitor != null) {\r\n                return;\r\n            }\r\n            if (this.will_capture()) {\r\n                this.#capture_monitor = this.#record_video(token);\r\n            }\r\n        });\r\n        this.#channel.events.stop_recording.listen(() => {\r\n            if (this.#capture_monitor == null) {\r\n                return;\r\n            }\r\n            if (this.will_capture()) {\r\n                this.#capture_monitor.stop((blob, token) => this.#save_video(blob, token));\r\n                this.#capture_monitor = null;\r\n            }\r\n        });\r\n    }\r\n    set_root(element) {\r\n        if (element != null && !(element instanceof HTMLCanvasElement)) {\r\n            throw new Error(`Invalid root for captures. Kate captures only support <canvas>`);\r\n        }\r\n        this.#capture_root = element;\r\n    }\r\n    will_capture() {\r\n        if (this.#capture_root == null) {\r\n            this.#channel.send_and_ignore_result(\"kate:notify.transient\", {\r\n                title: \"Capture unsupported\",\r\n                message: \"Screen capture is not available right now.\",\r\n            });\r\n            return false;\r\n        }\r\n        return true;\r\n    }\r\n    #record_video(token) {\r\n        const data = (0, promise_1.defer)();\r\n        const canvas = this.#capture_root;\r\n        const recorder = new MediaRecorder(canvas.captureStream(this.CAPTURE_FPS), this.CAPTURE_FORMAT);\r\n        recorder.ondataavailable = (ev) => {\r\n            if (ev.data.size > 0) {\r\n                data.resolve(ev.data);\r\n            }\r\n        };\r\n        recorder.start();\r\n        this.#channel.send_and_ignore_result(\"kate:capture.start-recording\", {});\r\n        const monitor = new RecorderMonitor(recorder, data.promise, token);\r\n        setTimeout(() => {\r\n            monitor.stop((blob) => this.#save_video(blob, token));\r\n        }, this.CAPTURE_MAX_LENGTH);\r\n        return monitor;\r\n    }\r\n    async #save_video(blob, token) {\r\n        const buffer = await blob.arrayBuffer();\r\n        await this.#channel.call(\"kate:capture.save-recording\", {\r\n            data: new Uint8Array(buffer),\r\n            type: \"video/webm\",\r\n            token: token,\r\n        });\r\n    }\r\n    async #save_screenshot(token) {\r\n        const blob = await this.#take_screenshot();\r\n        const buffer = await blob.arrayBuffer();\r\n        await this.#channel.call(\"kate:capture.save-image\", {\r\n            data: new Uint8Array(buffer),\r\n            type: \"image/png\",\r\n            token: token,\r\n        });\r\n    }\r\n    async #take_screenshot() {\r\n        const canvas = this.#capture_root;\r\n        if (canvas == null) {\r\n            throw new Error(`screenshot() called without a canvas`);\r\n        }\r\n        return new Promise((resolve, reject) => {\r\n            canvas.toBlob(async (blob) => {\r\n                if (blob == null) {\r\n                    reject(new Error(`Failed to capture a screenshot`));\r\n                }\r\n                else {\r\n                    resolve(blob);\r\n                }\r\n            });\r\n        });\r\n    }\r\n}\r\nexports.KateCapture = KateCapture;\r\nclass RecorderMonitor {\r\n    recorder;\r\n    data;\r\n    token;\r\n    _stopped = false;\r\n    constructor(recorder, data, token) {\r\n        this.recorder = recorder;\r\n        this.data = data;\r\n        this.token = token;\r\n    }\r\n    async stop(save) {\r\n        if (this._stopped) {\r\n            return;\r\n        }\r\n        this._stopped = true;\r\n        this.recorder.stop();\r\n        const data = await this.data;\r\n        save(data, this.token);\r\n    }\r\n}\r\n\n});\n\n// packages\\util\\build\\promise.js\nrequire.define(4, \"packages\\\\util\\\\build\", \"packages\\\\util\\\\build\\\\promise.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.sleep = exports.defer = void 0;\r\nfunction defer() {\r\n    const p = Object.create(null);\r\n    p.promise = new Promise((resolve, reject) => {\r\n        p.resolve = resolve;\r\n        p.reject = reject;\r\n    });\r\n    return p;\r\n}\r\nexports.defer = defer;\r\nfunction sleep(ms) {\r\n    return new Promise((resolve, reject) => {\r\n        setTimeout(() => resolve(), ms);\r\n    });\r\n}\r\nexports.sleep = sleep;\r\n\n});\n\n// packages\\kate-api\\build\\cart-fs.js\nrequire.define(5, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\cart-fs.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateCartFS = void 0;\r\nclass KateCartFS {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    read_file(path0) {\r\n        const path = new URL(path0, \"http://localhost\").pathname;\r\n        return this.#channel.call(\"kate:cart.read-file\", { path });\r\n    }\r\n    async get_file_url(path) {\r\n        const file = await this.read_file(path);\r\n        const blob = new Blob([file.bytes], { type: file.mime });\r\n        return URL.createObjectURL(blob);\r\n    }\r\n}\r\nexports.KateCartFS = KateCartFS;\r\n\n});\n\n// packages\\kate-api\\build\\channel.js\nrequire.define(6, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\channel.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateIPC = void 0;\r\nconst events_1 = require(7);\r\nconst promise_1 = require(4);\r\nclass KateIPC {\r\n    #secret;\r\n    #pending;\r\n    #initialised;\r\n    #server;\r\n    events = {\r\n        input_state_changed: new events_1.EventStream(),\r\n        key_pressed: new events_1.EventStream(),\r\n        take_screenshot: new events_1.EventStream(),\r\n        start_recording: new events_1.EventStream(),\r\n        stop_recording: new events_1.EventStream(),\r\n        paused: new events_1.EventStream(),\r\n    };\r\n    constructor(secret, server) {\r\n        this.#secret = secret;\r\n        this.#pending = new Map();\r\n        this.#initialised = false;\r\n        this.#server = server;\r\n    }\r\n    #make_id() {\r\n        let id = new Uint8Array(16);\r\n        crypto.getRandomValues(id);\r\n        return Array.from(id)\r\n            .map((x) => x.toString(16).padStart(2, \"0\"))\r\n            .join(\"\");\r\n    }\r\n    setup() {\r\n        if (this.#initialised) {\r\n            throw new Error(`setup() called twice`);\r\n        }\r\n        this.#initialised = true;\r\n        window.addEventListener(\"message\", this.handle_message);\r\n    }\r\n    #do_send(id, type, payload) {\r\n        this.#server.postMessage({\r\n            type: type,\r\n            secret: this.#secret,\r\n            id: id,\r\n            payload: payload,\r\n        }, \"*\");\r\n    }\r\n    async call(type, payload) {\r\n        const deferred = (0, promise_1.defer)();\r\n        const id = this.#make_id();\r\n        this.#pending.set(id, deferred);\r\n        this.#do_send(id, type, payload);\r\n        return deferred.promise;\r\n    }\r\n    async send_and_ignore_result(type, payload) {\r\n        this.#do_send(this.#make_id(), type, payload);\r\n    }\r\n    handle_message = (ev) => {\r\n        switch (ev.data.type) {\r\n            case \"kate:reply\": {\r\n                const pending = this.#pending.get(ev.data.id);\r\n                if (pending != null) {\r\n                    this.#pending.delete(ev.data.id);\r\n                    if (ev.data.ok) {\r\n                        pending.resolve(ev.data.value);\r\n                    }\r\n                    else {\r\n                        pending.reject(ev.data.value);\r\n                    }\r\n                }\r\n                break;\r\n            }\r\n            case \"kate:input-state-changed\": {\r\n                this.events.input_state_changed.emit({\r\n                    key: ev.data.key,\r\n                    is_down: ev.data.is_down,\r\n                });\r\n                break;\r\n            }\r\n            case \"kate:input-key-pressed\": {\r\n                this.events.key_pressed.emit(ev.data.key);\r\n                break;\r\n            }\r\n            case \"kate:paused\": {\r\n                this.events.paused.emit(ev.data.state);\r\n                break;\r\n            }\r\n            case \"kate:take-screenshot\": {\r\n                this.events.take_screenshot.emit({ token: ev.data.token });\r\n                break;\r\n            }\r\n            case \"kate:start-recording\": {\r\n                this.events.start_recording.emit({ token: ev.data.token });\r\n                break;\r\n            }\r\n            case \"kate:stop-recording\": {\r\n                this.events.stop_recording.emit();\r\n                break;\r\n            }\r\n        }\r\n    };\r\n}\r\nexports.KateIPC = KateIPC;\r\n\n});\n\n// packages\\util\\build\\events.js\nrequire.define(7, \"packages\\\\util\\\\build\", \"packages\\\\util\\\\build\\\\events.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.EventStream = void 0;\r\nclass EventStream {\r\n    subscribers = [];\r\n    on_dispose = () => { };\r\n    listen(fn) {\r\n        this.remove(fn);\r\n        this.subscribers.push(fn);\r\n        return fn;\r\n    }\r\n    remove(fn) {\r\n        this.subscribers = this.subscribers.filter((x) => x !== fn);\r\n        return this;\r\n    }\r\n    once(fn) {\r\n        const handler = this.listen((x) => {\r\n            this.remove(handler);\r\n            fn(x);\r\n        });\r\n        return handler;\r\n    }\r\n    emit(ev) {\r\n        for (const fn of this.subscribers) {\r\n            fn(ev);\r\n        }\r\n    }\r\n    dispose() {\r\n        this.on_dispose();\r\n    }\r\n    filter(fn) {\r\n        const stream = new EventStream();\r\n        const subscriber = this.listen((ev) => {\r\n            if (fn(ev)) {\r\n                stream.emit(ev);\r\n            }\r\n        });\r\n        stream.on_dispose = () => {\r\n            this.remove(subscriber);\r\n        };\r\n        return stream;\r\n    }\r\n    map(fn) {\r\n        const stream = new EventStream();\r\n        const subscriber = this.listen((ev) => {\r\n            stream.emit(fn(ev));\r\n        });\r\n        stream.on_dispose = () => {\r\n            this.remove(subscriber);\r\n        };\r\n        return stream;\r\n    }\r\n}\r\nexports.EventStream = EventStream;\r\n\n});\n\n// packages\\kate-api\\build\\input.js\nrequire.define(8, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\input.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateInput = void 0;\r\nconst events_1 = require(7);\r\nclass KateInput {\r\n    timer;\r\n    #channel;\r\n    on_key_pressed = new events_1.EventStream();\r\n    on_extended_key_pressed = new events_1.EventStream();\r\n    _paused = false;\r\n    _state = Object.assign(Object.create(null), {\r\n        up: 0,\r\n        right: 0,\r\n        down: 0,\r\n        left: 0,\r\n        menu: 0,\r\n        capture: 0,\r\n        x: 0,\r\n        o: 0,\r\n        ltrigger: 0,\r\n        rtrigger: 0,\r\n    });\r\n    _changed = new Set();\r\n    _keys = Object.keys(this._state);\r\n    constructor(channel, timer) {\r\n        this.timer = timer;\r\n        this.#channel = channel;\r\n    }\r\n    get is_paused() {\r\n        return this._paused;\r\n    }\r\n    setup() {\r\n        this.#channel.events.input_state_changed.listen(({ key, is_down }) => {\r\n            if (!this._paused) {\r\n                if (is_down) {\r\n                    if (this._state[key] <= 0) {\r\n                        this._changed.add(key);\r\n                        this.on_key_pressed.emit(key);\r\n                    }\r\n                    this._state[key] = Math.max(1, this._state[key]);\r\n                }\r\n                else {\r\n                    if (this._state[key] > 0) {\r\n                        this._changed.add(key);\r\n                    }\r\n                    this._state[key] = -1;\r\n                }\r\n            }\r\n        });\r\n        this.#channel.events.paused.listen((state) => {\r\n            this._paused = state;\r\n            for (const key of this._keys) {\r\n                this._state[key] = 0;\r\n            }\r\n        });\r\n        this.#channel.events.key_pressed.listen((key) => this.on_extended_key_pressed.emit(key));\r\n        this.timer.on_tick.listen(this.update_key_state);\r\n    }\r\n    update_key_state = () => {\r\n        for (const key of this._keys) {\r\n            if (this._state[key] !== 0 && !this._changed.has(key)) {\r\n                this._state[key] += 1;\r\n                if (this._state[key] >= 65536) {\r\n                    this._state[key] = 2;\r\n                }\r\n            }\r\n        }\r\n        this._changed.clear();\r\n    };\r\n    is_pressed(key) {\r\n        return this._state[key] > 0;\r\n    }\r\n    frames_pressed(key) {\r\n        if (this._state[key] <= 0) {\r\n            return 0;\r\n        }\r\n        else {\r\n            return this._state[key];\r\n        }\r\n    }\r\n    is_just_pressed(key) {\r\n        return this._state[key] === 1;\r\n    }\r\n    is_just_released(key) {\r\n        return this._state[key] === -1;\r\n    }\r\n}\r\nexports.KateInput = KateInput;\r\n\n});\n\n// packages\\kate-api\\build\\object-store.js\nrequire.define(9, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\object-store.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateObjectStore = void 0;\r\nclass KateObjectStore {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    special_keys = {\r\n        local_storage: \"kate:local-storage\",\r\n    };\r\n    async list(count) {\r\n        return await this.#channel.call(\"kate:store.list\", { count });\r\n    }\r\n    async get(key) {\r\n        return await this.#channel.call(\"kate:store.get\", { key });\r\n    }\r\n    async try_get(key) {\r\n        return await this.#channel.call(\"kate:store.try-get\", { key });\r\n    }\r\n    async add(key, value) {\r\n        await this.#channel.call(\"kate:store.add\", { key, value });\r\n    }\r\n    async put(key, value) {\r\n        await this.#channel.call(\"kate:store.put\", { key, value });\r\n    }\r\n    async delete(key) {\r\n        await this.#channel.call(\"kate:store.delete\", { key });\r\n    }\r\n    async usage() {\r\n        return this.#channel.call(\"kate:store.usage\", {});\r\n    }\r\n}\r\nexports.KateObjectStore = KateObjectStore;\r\n\n});\n\n// packages\\kate-api\\build\\timer.js\nrequire.define(10, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\timer.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateTimer = void 0;\r\nconst events_1 = require(7);\r\nclass KateTimer {\r\n    on_tick = new events_1.EventStream();\r\n    _last_time = null;\r\n    _timer_id = null;\r\n    MAX_FPS = 30;\r\n    ONE_FRAME = Math.ceil(1000 / 30);\r\n    _fps = 30;\r\n    setup() {\r\n        cancelAnimationFrame(this._timer_id);\r\n        this._last_time = null;\r\n        this._timer_id = requestAnimationFrame(this.tick);\r\n    }\r\n    get fps() {\r\n        return this._fps;\r\n    }\r\n    tick = (time) => {\r\n        if (this._last_time == null) {\r\n            this._last_time = time;\r\n            this._fps = this.MAX_FPS;\r\n            this.on_tick.emit(time);\r\n            this._timer_id = requestAnimationFrame(this.tick);\r\n        }\r\n        else {\r\n            const elapsed = time - this._last_time;\r\n            if (elapsed < this.ONE_FRAME) {\r\n                this._timer_id = requestAnimationFrame(this.tick);\r\n            }\r\n            else {\r\n                this._last_time = time;\r\n                this._fps = (1000 / elapsed) | 0;\r\n                this.on_tick.emit(time);\r\n                this._timer_id = requestAnimationFrame(this.tick);\r\n            }\r\n        }\r\n    };\r\n}\r\nexports.KateTimer = KateTimer;\r\n\n});\n\nmodule.exports = require(1);\n}((() => {\n  if (typeof require !== \"undefined\" && typeof module !== \"undefined\") {\n    return [module, module.exports, require];\n  } else if (typeof window !== \"undefined\") {\n    const module = Object.create(null);\n    module.exports = Object.create(null);\n    Object.defineProperty(window, \"KateAPI\", {\n      get() { return module.exports },\n      set(v) { module.exports = v }\n    });\n    return [module, module.exports, (id) => {\n      throw new Error(\"Cannot load \" + JSON.stringify(id) + \" because node modules are not supported.\");\n    }];\n  } else {\n    throw new Error(\"Unsupported environment\");\n  }\n})());",
    "kate-bridge.js": "(function(f){if(typeof exports===\"object\"&&typeof module!==\"undefined\"){module.exports=f()}else if(typeof define===\"function\"&&define.amd){define([],f)}else{var g;if(typeof window!==\"undefined\"){g=window}else if(typeof global!==\"undefined\"){g=global}else if(typeof self!==\"undefined\"){g=self}else{g=this}g.KateAPI = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c=\"function\"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error(\"Cannot find module '\"+i+\"'\");throw a.code=\"MODULE_NOT_FOUND\",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u=\"function\"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateAudioChannel = exports.KateAudioSource = exports.KateAudio = void 0;\r\nclass KateAudio {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    async create_channel(name) {\r\n        const { id, volume } = await this.#channel.call(\"kate:audio.create-channel\", {});\r\n        return new KateAudioChannel(this, name, id, volume);\r\n    }\r\n    async resume_channel(channel) {\r\n        await this.#channel.call(\"kate:audio.resume-channel\", { id: channel.id });\r\n    }\r\n    async pause_channel(channel) {\r\n        await this.#channel.call(\"kate:audio.pause-channel\", { id: channel.id });\r\n    }\r\n    async change_channel_volume(channel, value) {\r\n        await this.#channel.call(\"kate:audio.change-volume\", {\r\n            id: channel.id,\r\n            volume: value,\r\n        });\r\n    }\r\n    async load_audio(mime, bytes) {\r\n        const audio = await this.#channel.call(\"kate:audio.load\", {\r\n            mime,\r\n            bytes,\r\n        });\r\n        return new KateAudioSource(this, audio);\r\n    }\r\n    async play(channel, audio, loop) {\r\n        await this.#channel.call(\"kate:audio.play\", {\r\n            channel: channel.id,\r\n            source: audio.id,\r\n            loop: loop,\r\n        });\r\n    }\r\n}\r\nexports.KateAudio = KateAudio;\r\nclass KateAudioSource {\r\n    audio;\r\n    id;\r\n    constructor(audio, id) {\r\n        this.audio = audio;\r\n        this.id = id;\r\n    }\r\n}\r\nexports.KateAudioSource = KateAudioSource;\r\nclass KateAudioChannel {\r\n    audio;\r\n    name;\r\n    id;\r\n    _volume;\r\n    constructor(audio, name, id, _volume) {\r\n        this.audio = audio;\r\n        this.name = name;\r\n        this.id = id;\r\n        this._volume = _volume;\r\n    }\r\n    get volume() {\r\n        return this._volume;\r\n    }\r\n    async set_volume(value) {\r\n        if (value < 0 || value > 1) {\r\n            throw new Error(`Invalid volume value ${value}`);\r\n        }\r\n        this._volume = value;\r\n        this.audio.change_channel_volume(this, value);\r\n    }\r\n    async resume() {\r\n        return this.audio.resume_channel(this);\r\n    }\r\n    async pause() {\r\n        return this.audio.pause_channel(this);\r\n    }\r\n    async play(source, loop) {\r\n        return this.audio.play(this, source, loop);\r\n    }\r\n}\r\nexports.KateAudioChannel = KateAudioChannel;\r\n\n},{}],2:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateCartFS = void 0;\r\nclass KateCartFS {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    read_file(path0) {\r\n        const path = new URL(path0, \"http://localhost\").pathname;\r\n        return this.#channel.call(\"kate:cart.read-file\", { path });\r\n    }\r\n    async get_file_url(path) {\r\n        const file = await this.read_file(path);\r\n        const blob = new Blob([file.bytes], { type: file.mime });\r\n        return URL.createObjectURL(blob);\r\n    }\r\n}\r\nexports.KateCartFS = KateCartFS;\r\n\n},{}],3:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateIPC = void 0;\r\nconst events_1 = require(\"../../util/build/events\");\r\nconst promise_1 = require(\"../../util/build/promise\");\r\nclass KateIPC {\r\n    #secret;\r\n    #pending;\r\n    #initialised;\r\n    #server;\r\n    events = {\r\n        input_state_changed: new events_1.EventStream(),\r\n        key_pressed: new events_1.EventStream(),\r\n        paused: new events_1.EventStream(),\r\n    };\r\n    constructor(secret, server) {\r\n        this.#secret = secret;\r\n        this.#pending = new Map();\r\n        this.#initialised = false;\r\n        this.#server = server;\r\n    }\r\n    make_id() {\r\n        let id = new Uint8Array(16);\r\n        crypto.getRandomValues(id);\r\n        return Array.from(id)\r\n            .map((x) => x.toString(16).padStart(2, \"0\"))\r\n            .join(\"\");\r\n    }\r\n    setup() {\r\n        if (this.#initialised) {\r\n            throw new Error(`setup() called twice`);\r\n        }\r\n        this.#initialised = true;\r\n        window.addEventListener(\"message\", this.handle_message);\r\n    }\r\n    do_send(id, type, payload) {\r\n        this.#server.postMessage({\r\n            type: type,\r\n            secret: this.#secret,\r\n            id: id,\r\n            payload: payload,\r\n        }, \"*\");\r\n    }\r\n    async call(type, payload) {\r\n        const deferred = (0, promise_1.defer)();\r\n        const id = this.make_id();\r\n        this.#pending.set(id, deferred);\r\n        this.do_send(id, type, payload);\r\n        return deferred.promise;\r\n    }\r\n    async send_and_ignore_result(type, payload) {\r\n        this.do_send(this.make_id(), type, payload);\r\n    }\r\n    handle_message = (ev) => {\r\n        switch (ev.data.type) {\r\n            case \"kate:reply\": {\r\n                const pending = this.#pending.get(ev.data.id);\r\n                if (pending != null) {\r\n                    this.#pending.delete(ev.data.id);\r\n                    if (ev.data.ok) {\r\n                        pending.resolve(ev.data.value);\r\n                    }\r\n                    else {\r\n                        pending.reject(ev.data.value);\r\n                    }\r\n                }\r\n                break;\r\n            }\r\n            case \"kate:input-state-changed\": {\r\n                this.events.input_state_changed.emit({\r\n                    key: ev.data.key,\r\n                    is_down: ev.data.is_down,\r\n                });\r\n                break;\r\n            }\r\n            case \"kate:input-key-pressed\": {\r\n                this.events.key_pressed.emit(ev.data.key);\r\n                break;\r\n            }\r\n            case \"kate:paused\": {\r\n                this.events.paused.emit(ev.data.state);\r\n                break;\r\n            }\r\n        }\r\n    };\r\n}\r\nexports.KateIPC = KateIPC;\r\n\n},{\"../../util/build/events\":8,\"../../util/build/promise\":9}],4:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.timer = exports.audio = exports.input = exports.kv_store = exports.cart_fs = exports.events = void 0;\r\nconst audio_1 = require(\"./audio\");\r\nconst cart_fs_1 = require(\"./cart-fs\");\r\nconst channel_1 = require(\"./channel\");\r\nconst input_1 = require(\"./input\");\r\nconst kv_store_1 = require(\"./kv-store\");\r\nconst timer_1 = require(\"./timer\");\r\nconst channel = new channel_1.KateIPC(KATE_SECRET, window.parent);\r\nchannel.setup();\r\nexports.events = channel.events;\r\nexports.cart_fs = new cart_fs_1.KateCartFS(channel);\r\nexports.kv_store = new kv_store_1.KateKVStore(channel);\r\nexports.input = new input_1.KateInput(channel);\r\nexports.input.setup();\r\nexports.audio = new audio_1.KateAudio(channel);\r\nexports.timer = new timer_1.KateTimer();\r\nexports.timer.setup();\r\n\n},{\"./audio\":1,\"./cart-fs\":2,\"./channel\":3,\"./input\":5,\"./kv-store\":6,\"./timer\":7}],5:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateInput = void 0;\r\nconst events_1 = require(\"../../util/build/events\");\r\nclass KateInput {\r\n    #channel;\r\n    on_key_pressed = new events_1.EventStream();\r\n    _state = Object.assign(Object.create(null), {\r\n        up: false,\r\n        right: false,\r\n        down: false,\r\n        left: false,\r\n        menu: false,\r\n        capture: false,\r\n        x: false,\r\n        o: false,\r\n        ltrigger: false,\r\n        rtrigger: false,\r\n    });\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    setup() {\r\n        this.#channel.events.input_state_changed.listen(({ key, is_down }) => {\r\n            this._state[key] = is_down;\r\n        });\r\n        this.#channel.events.key_pressed.listen((key) => {\r\n            this.on_key_pressed.emit(key);\r\n        });\r\n    }\r\n    is_down(key) {\r\n        return this._state[key];\r\n    }\r\n}\r\nexports.KateInput = KateInput;\r\n\n},{\"../../util/build/events\":8}],6:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateKVStore = void 0;\r\nclass KateKVStore {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    async read_all() {\r\n        return await this.#channel.call(\"kate:kv-store.read-all\", {});\r\n    }\r\n    async replace_all(value) {\r\n        await this.#channel.call(\"kate:kv-store.update-all\", { value });\r\n    }\r\n    async get(key) {\r\n        return await this.#channel.call(\"kate:kv-store.get\", { key });\r\n    }\r\n    async set(key, value) {\r\n        await this.#channel.call(\"kate:kv-store.set\", { key, value });\r\n    }\r\n    async delete(key) {\r\n        await this.#channel.call(\"kate:kv-store.delete\", { key });\r\n    }\r\n    async delete_all() {\r\n        await this.replace_all({});\r\n    }\r\n}\r\nexports.KateKVStore = KateKVStore;\r\n\n},{}],7:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateTimer = void 0;\r\nconst events_1 = require(\"../../util/build/events\");\r\nclass KateTimer {\r\n    on_tick = new events_1.EventStream();\r\n    _last_time = null;\r\n    _timer_id = null;\r\n    MAX_FPS = 30;\r\n    ONE_FRAME = Math.ceil(1000 / 30);\r\n    _fps = 30;\r\n    setup() {\r\n        cancelAnimationFrame(this._timer_id);\r\n        this._last_time = null;\r\n        this._timer_id = requestAnimationFrame(this.tick);\r\n    }\r\n    get fps() {\r\n        return this._fps;\r\n    }\r\n    tick = (time) => {\r\n        if (this._last_time == null) {\r\n            this._last_time = time;\r\n            this._fps = this.MAX_FPS;\r\n            this.on_tick.emit(time);\r\n            this._timer_id = requestAnimationFrame(this.tick);\r\n        }\r\n        else {\r\n            const elapsed = time - this._last_time;\r\n            if (elapsed < this.ONE_FRAME) {\r\n                this._timer_id = requestAnimationFrame(this.tick);\r\n            }\r\n            else {\r\n                this._last_time = time;\r\n                this._fps = (1000 / elapsed) | 0;\r\n                this.on_tick.emit(time);\r\n                this._timer_id = requestAnimationFrame(this.tick);\r\n            }\r\n        }\r\n    };\r\n}\r\nexports.KateTimer = KateTimer;\r\n\n},{\"../../util/build/events\":8}],8:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.EventStream = void 0;\r\nclass EventStream {\r\n    subscribers = [];\r\n    on_dispose = () => { };\r\n    listen(fn) {\r\n        this.remove(fn);\r\n        this.subscribers.push(fn);\r\n        return fn;\r\n    }\r\n    remove(fn) {\r\n        this.subscribers = this.subscribers.filter((x) => x !== fn);\r\n        return this;\r\n    }\r\n    emit(ev) {\r\n        for (const fn of this.subscribers) {\r\n            fn(ev);\r\n        }\r\n    }\r\n    dispose() {\r\n        this.on_dispose();\r\n    }\r\n    filter(fn) {\r\n        const stream = new EventStream();\r\n        const subscriber = this.listen((ev) => {\r\n            if (fn(ev)) {\r\n                stream.emit(ev);\r\n            }\r\n        });\r\n        stream.on_dispose = () => {\r\n            this.remove(subscriber);\r\n        };\r\n        return stream;\r\n    }\r\n    map(fn) {\r\n        const stream = new EventStream();\r\n        const subscriber = this.listen((ev) => {\r\n            stream.emit(fn(ev));\r\n        });\r\n        stream.on_dispose = () => {\r\n            this.remove(subscriber);\r\n        };\r\n        return stream;\r\n    }\r\n}\r\nexports.EventStream = EventStream;\r\n\n},{}],9:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.sleep = exports.defer = void 0;\r\nfunction defer() {\r\n    const p = Object.create(null);\r\n    p.promise = new Promise((resolve, reject) => {\r\n        p.resolve = resolve;\r\n        p.reject = reject;\r\n    });\r\n    return p;\r\n}\r\nexports.defer = defer;\r\nfunction sleep(ms) {\r\n    return new Promise((resolve, reject) => {\r\n        setTimeout(() => resolve(), ms);\r\n    });\r\n}\r\nexports.sleep = sleep;\r\n\n},{}]},{},[4])(4)\n});\n",
    "local-storage.js": "\"use strict\";\r\nconst { store } = KateAPI;\r\nlet contents = KATE_LOCAL_STORAGE ?? Object.create(null);\r\nlet timer = null;\r\nfunction persist(contents) {\r\n    clearTimeout(timer);\r\n    timer = setTimeout(() => {\r\n        store.put(store.special_keys.local_storage, contents);\r\n    });\r\n}\r\nclass KateStorage {\r\n    __contents;\r\n    __persistent;\r\n    constructor(contents, persistent) {\r\n        this.__contents = contents;\r\n        this.__persistent = persistent;\r\n    }\r\n    _persist() {\r\n        if (this.__persistent) {\r\n            persist(this.__contents);\r\n        }\r\n    }\r\n    getItem(name) {\r\n        return this.__contents[name] ?? null;\r\n    }\r\n    setItem(name, value) {\r\n        this.__contents[name] = String(value);\r\n        this._persist();\r\n    }\r\n    removeItem(name) {\r\n        delete this.__contents[name];\r\n        this._persist();\r\n    }\r\n    clear() {\r\n        this.__contents = Object.create(null);\r\n        this._persist();\r\n    }\r\n    key(index) {\r\n        return this.getItem(Object.keys(this.__contents)[index]) ?? null;\r\n    }\r\n    get length() {\r\n        return Object.keys(this.__contents).length;\r\n    }\r\n}\r\nfunction proxy_storage(storage, key) {\r\n    const exposed = [\"getItem\", \"setItem\", \"removeItem\", \"clear\", \"key\"];\r\n    Object.defineProperty(window, key, {\r\n        value: new Proxy(storage, {\r\n            get(target, prop, receiver) {\r\n                return exposed.includes(prop)\r\n                    ? storage[prop].bind(storage)\r\n                    : storage.getItem(prop);\r\n            },\r\n            has(target, prop) {\r\n                return exposed.includes(prop) || prop in contents;\r\n            },\r\n            set(target, prop, value) {\r\n                storage.setItem(prop, value);\r\n                return true;\r\n            },\r\n            deleteProperty(target, prop) {\r\n                storage.removeItem(prop);\r\n                return true;\r\n            },\r\n        }),\r\n    });\r\n}\r\nconst storage = new KateStorage(contents, true);\r\nproxy_storage(storage, \"localStorage\");\r\nconst session_storage = new KateStorage(Object.create(null), false);\r\nproxy_storage(session_storage, \"sessionStorage\");\r\n",
    "preserve-render.js": "\"use strict\";\r\n// Make sure canvas WebGL contexts are instantiated to preserve buffers\r\n// after drawing, since screenshot and video capture cannot be synchronised\r\n// currently.\r\nconst old_get_context = HTMLCanvasElement.prototype.getContext;\r\nHTMLCanvasElement.prototype.getContext = function (context, options0) {\r\n    if (context === \"webgl\" || context === \"webgl2\") {\r\n        const options = Object.assign({}, options0, {\r\n            preserveDrawingBuffer: true,\r\n        });\r\n        return old_get_context.call(this, context, options);\r\n    }\r\n    else {\r\n        return old_get_context.call(this, context, options0);\r\n    }\r\n};\r\n",
    "renpy.js": "\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nlet paused = false;\r\nconst { events } = KateAPI;\r\nconst add_event_listener = window.addEventListener;\r\nconst key_mapping = {\r\n    up: [\"ArrowUp\", \"ArrowUp\", 38],\r\n    right: [\"ArrowRight\", \"ArrowRight\", 39],\r\n    down: [\"ArrowDown\", \"ArrowDown\", 40],\r\n    left: [\"ArrowLeft\", \"ArrowLeft\", 37],\r\n    x: [\"Escape\", \"Escape\", 27],\r\n    o: [\"Enter\", \"Enter\", 13],\r\n    ltrigger: [\"PageUp\", \"PageUp\", 33],\r\n    rtrigger: [\"PageDown\", \"PageDown\", 34],\r\n};\r\nconst down_listeners = [];\r\nconst up_listeners = [];\r\nevents.input_state_changed.listen(({ key: kate_key, is_down }) => {\r\n    if (!paused) {\r\n        const data = key_mapping[kate_key];\r\n        if (data) {\r\n            const listeners = is_down ? down_listeners : up_listeners;\r\n            const type = is_down ? \"keydown\" : \"keyup\";\r\n            const [key, code, keyCode] = data;\r\n            const key_ev = new KeyboardEvent(type, { key, code, keyCode });\r\n            for (const fn of listeners) {\r\n                fn.call(document, key_ev);\r\n            }\r\n        }\r\n    }\r\n});\r\nevents.paused.listen((state) => {\r\n    paused = state;\r\n});\r\nfunction listen(type, listener, options) {\r\n    if (type === \"keydown\") {\r\n        down_listeners.push(listener);\r\n    }\r\n    else if (type === \"keyup\") {\r\n        up_listeners.push(listener);\r\n    }\r\n    else {\r\n        add_event_listener.call(this, type, listener, options);\r\n    }\r\n}\r\nwindow.addEventListener = listen;\r\ndocument.addEventListener = listen;\r\n",
    "rpgmk-mv.js": "\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nlet paused = false;\r\nconst { events } = KateAPI;\r\n// Disable RPGMkMV's handling of gamepads to avoid double-input handling.\r\nInput._updateGamepadState = () => { };\r\n// Ensure RPGMkMV uses ogg files (Kate will handle the decoding).\r\nWebAudio.canPlayOgg = () => true;\r\nWebAudio.canPlayM4a = () => false;\r\nAudioManager.audioFileExt = () => \".ogg\";\r\n// Patch RPGMkMV's keyboard input handling directly\r\nconst key_mapping = {\r\n    up: \"up\",\r\n    right: \"right\",\r\n    down: \"down\",\r\n    left: \"left\",\r\n    x: \"cancel\",\r\n    o: \"ok\",\r\n    menu: \"menu\",\r\n    rtrigger: \"shift\",\r\n};\r\nevents.input_state_changed.listen(({ key, is_down }) => {\r\n    if (!paused) {\r\n        const name = key_mapping[key];\r\n        if (name) {\r\n            Input._currentState[name] = is_down;\r\n        }\r\n    }\r\n});\r\nevents.paused.listen((state) => {\r\n    paused = state;\r\n    if (state) {\r\n        for (const key of Object.values(key_mapping)) {\r\n            Input._currentState[key] = false;\r\n        }\r\n    }\r\n});\r\n",
    "standard-network.js": "\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nconst { cart_fs } = KateAPI;\r\nfunction is_data_url(x) {\r\n    if (typeof x !== \"string\") {\r\n        return false;\r\n    }\r\n    else {\r\n        return /^data:\\w+\\/\\w+;base64,/.test(x);\r\n    }\r\n}\r\n// -- Arbitrary fetching\r\nconst old_fetch = window.fetch;\r\nwindow.fetch = async function (request, options) {\r\n    let url;\r\n    let method;\r\n    if (Object(request) === request && request.url) {\r\n        url = request.url;\r\n        method = request.method;\r\n    }\r\n    else {\r\n        url = request;\r\n        method = options?.method ?? \"GET\";\r\n    }\r\n    if (method !== \"GET\") {\r\n        return new Promise((_, reject) => reject(new Error(`Non-GET requests are not supported.`)));\r\n    }\r\n    if (is_data_url(url)) {\r\n        return old_fetch(url);\r\n    }\r\n    return new Promise(async (resolve, reject) => {\r\n        try {\r\n            const file = await cart_fs.get_file_url(String(url));\r\n            const result = await old_fetch(file);\r\n            resolve(result);\r\n        }\r\n        catch (error) {\r\n            reject(error);\r\n        }\r\n    });\r\n};\r\nconst old_xhr_open = XMLHttpRequest.prototype.open;\r\nconst old_xhr_send = XMLHttpRequest.prototype.send;\r\nXMLHttpRequest.prototype.open = function (method, url) {\r\n    if (method !== \"GET\") {\r\n        throw new Error(`Non-GET requests are not supported.`);\r\n    }\r\n    this.__waiting_open = true;\r\n    void (async () => {\r\n        try {\r\n            const real_url = await cart_fs.get_file_url(String(url));\r\n            old_xhr_open.call(this, \"GET\", real_url, true);\r\n            this.__maybe_send();\r\n        }\r\n        catch (error) {\r\n            old_xhr_open.call(this, \"GET\", \"not-found\", true);\r\n            this.__maybe_send();\r\n        }\r\n    })();\r\n};\r\nXMLHttpRequest.prototype.__maybe_send = function () {\r\n    this.__waiting_open = false;\r\n    if (this.__waiting_send) {\r\n        this.__waiting_send = false;\r\n        this.send();\r\n    }\r\n};\r\nXMLHttpRequest.prototype.send = function () {\r\n    if (this.__waiting_open) {\r\n        this.__waiting_send = true;\r\n        return;\r\n    }\r\n    else {\r\n        return old_xhr_send.call(this);\r\n    }\r\n};\r\n// -- Image loading\r\nconst old_img_src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, \"src\");\r\nObject.defineProperty(HTMLImageElement.prototype, \"src\", {\r\n    enumerable: old_img_src.enumerable,\r\n    configurable: old_img_src.configurable,\r\n    get() {\r\n        return this.__src ?? old_img_src.get.call(this);\r\n    },\r\n    set(url) {\r\n        this.__src = url;\r\n        if (is_data_url(url)) {\r\n            old_img_src.set.call(this, url);\r\n            return;\r\n        }\r\n        void (async () => {\r\n            try {\r\n                const real_url = await cart_fs.get_file_url(String(url));\r\n                old_img_src.set.call(this, real_url);\r\n            }\r\n            catch (error) {\r\n                old_img_src.set.call(this, \"not-found\");\r\n            }\r\n        })();\r\n    },\r\n});\r\n// -- Media loading\r\nconst old_media_src = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, \"src\");\r\nObject.defineProperty(HTMLMediaElement.prototype, \"src\", {\r\n    enumerable: old_media_src.enumerable,\r\n    configurable: old_media_src.configurable,\r\n    get() {\r\n        return this.__src ?? old_media_src.get.call(this);\r\n    },\r\n    set(url) {\r\n        this.__src = url;\r\n        if (is_data_url(url)) {\r\n            old_media_src.set.call(this, url);\r\n        }\r\n        void (async () => {\r\n            try {\r\n                const real_url = await cart_fs.get_file_url(String(url));\r\n                old_media_src.set.call(this, real_url);\r\n            }\r\n            catch (error) {\r\n                old_media_src.set.call(this, \"not-found\");\r\n            }\r\n        })();\r\n    },\r\n});\r\n"
};

});

// packages\kate-core\build\kernel\gamepad.js
require.define(20, "packages\\kate-core\\build\\kernel", "packages\\kate-core\\build\\kernel\\gamepad.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamepadInput = void 0;
class GamepadInput {
    console;
    attached = false;
    gamepad = null;
    layouts = [new StandardGamepad()];
    timer_id = null;
    constructor(console) {
        this.console = console;
    }
    setup() {
        if (this.attached) {
            throw new Error(`setup() called twice`);
        }
        this.attached = true;
        window.addEventListener("gamepadconnected", (ev) => {
            this.update_gamepad(ev.gamepad, true);
        });
        window.addEventListener("gamepaddisconnected", (ev) => {
            this.update_gamepad(ev.gamepad, false);
        });
    }
    update_gamepad(gamepad, connected) {
        if (this.gamepad == null && connected) {
            this.gamepad = this.get_layout(gamepad);
        }
        else if (this.gamepad?.is_same(gamepad) && !connected) {
            this.gamepad = null;
        }
        if (this.gamepad != null) {
            cancelAnimationFrame(this.timer_id);
            this.timer_id = requestAnimationFrame(this.update_virtual_state);
        }
    }
    get_layout(gamepad) {
        const layout = this.layouts.find((x) => x.accepts(gamepad));
        if (layout != null) {
            return new LayoutedGamepad(gamepad, layout, this.console);
        }
        else {
            return null;
        }
    }
    update_virtual_state = (time) => {
        this.gamepad?.update_virtual_state(time);
        this.timer_id = requestAnimationFrame(this.update_virtual_state);
    };
}
exports.GamepadInput = GamepadInput;
class LayoutedGamepad {
    raw_gamepad;
    layout;
    console;
    last_update = null;
    constructor(raw_gamepad, layout, console) {
        this.raw_gamepad = raw_gamepad;
        this.layout = layout;
        this.console = console;
    }
    is_same(gamepad) {
        return this.raw_gamepad.id === gamepad.id;
    }
    resolve_gamepad() {
        const gamepad = navigator.getGamepads()[this.raw_gamepad.index] ?? null;
        if (gamepad?.id !== this.raw_gamepad.id) {
            return null;
        }
        else {
            return gamepad;
        }
    }
    update_virtual_state(time) {
        const g = this.resolve_gamepad();
        if (g == null) {
            return;
        }
        if (this.last_update != null && this.last_update > g.timestamp) {
            return;
        }
        this.last_update = time;
        this.layout.update(this.console, g);
    }
}
class StandardGamepad {
    accepts(gamepad) {
        return gamepad.mapping === "standard";
    }
    update(console, g) {
        console.update_virtual_key("up", g.buttons[12 /* Std.UP */].pressed || g.axes[1] < -0.5);
        console.update_virtual_key("right", g.buttons[15 /* Std.RIGHT */].pressed || g.axes[0] > 0.5);
        console.update_virtual_key("down", g.buttons[13 /* Std.DOWN */].pressed || g.axes[1] > 0.5);
        console.update_virtual_key("left", g.buttons[14 /* Std.LEFT */].pressed || g.axes[0] < -0.5);
        console.update_virtual_key("x", g.buttons[0 /* Std.X */].pressed);
        console.update_virtual_key("o", g.buttons[1 /* Std.O */].pressed);
        console.update_virtual_key("ltrigger", g.buttons[4 /* Std.L */].pressed);
        console.update_virtual_key("rtrigger", g.buttons[5 /* Std.R */].pressed);
        console.update_virtual_key("menu", g.buttons[8 /* Std.MENU */].pressed);
        console.update_virtual_key("capture", g.buttons[9 /* Std.CAPTURE */].pressed);
    }
}

});

// packages\kate-core\build\kernel\input.js
require.define(21, "packages\\kate-core\\build\\kernel", "packages\\kate-core\\build\\kernel\\input.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyboardInput = void 0;
class KeyboardInput {
    console;
    physical_config = {
        up: "ArrowUp",
        right: "ArrowRight",
        down: "ArrowDown",
        left: "ArrowLeft",
        menu: "ShiftLeft",
        capture: "ControlLeft",
        x: "KeyX",
        o: "KeyZ",
        ltrigger: "KeyA",
        rtrigger: "KeyS",
    };
    ignore_repeat = ["menu", "capture"];
    physical_map;
    attached = false;
    constructor(console) {
        this.console = console;
        this.update_physical_map();
    }
    update_physical_map() {
        const map = Object.create(null);
        for (const [key, value] of Object.entries(this.physical_config)) {
            map[value] = key;
        }
        this.physical_map = map;
    }
    listen(root) {
        if (this.attached) {
            throw new Error(`listen called twice`);
        }
        this.attached = true;
        document.addEventListener("keydown", (ev) => {
            if (ev.code in this.physical_map) {
                ev.preventDefault();
                const key = this.physical_map[ev.code];
                if (!this.ignore_repeat.includes(key) || !ev.repeat) {
                    this.console.update_virtual_key(key, true);
                }
            }
        });
        document.addEventListener("keyup", (ev) => {
            if (ev.code in this.physical_map) {
                ev.preventDefault();
                this.console.update_virtual_key(this.physical_map[ev.code], false);
            }
        });
    }
}
exports.KeyboardInput = KeyboardInput;

});

// packages\kate-core\build\kernel\virtual.js
require.define(22, "packages\\kate-core\\build\\kernel", "packages\\kate-core\\build\\kernel\\virtual.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualConsole = void 0;
const utils_1 = require(5);
const pkg = require(23);
class VirtualConsole {
    options;
    up_button;
    right_button;
    down_button;
    left_button;
    menu_button;
    capture_button;
    x_button;
    o_button;
    ltrigger_button;
    rtrigger_button;
    is_listening = false;
    _scale = 1;
    body;
    device_display;
    hud;
    os_root;
    version_container;
    resources_container;
    version = pkg?.version == null ? null : `v${pkg.version}`;
    on_input_changed = new utils_1.EventStream();
    on_key_pressed = new utils_1.EventStream();
    on_tick = new utils_1.EventStream();
    on_scale_changed = new utils_1.EventStream();
    audio_context = new AudioContext();
    resources = new Map();
    timer_id = null;
    last_time = null;
    SPECIAL_FRAMES = 15;
    REPEAT_FRAMES = 10;
    FPS = 30;
    ONE_FRAME = Math.ceil(1000 / 30);
    input_state;
    keys = [
        "up",
        "right",
        "down",
        "left",
        "x",
        "o",
        "ltrigger",
        "rtrigger",
    ];
    special_keys = ["menu", "capture"];
    constructor(root, options) {
        this.options = options;
        this.up_button = root.querySelector(".kate-dpad-up");
        this.right_button = root.querySelector(".kate-dpad-right");
        this.down_button = root.querySelector(".kate-dpad-down");
        this.left_button = root.querySelector(".kate-dpad-left");
        this.menu_button = root.querySelector(".kate-area-menu");
        this.capture_button = root.querySelector(".kate-area-capture");
        this.x_button = root.querySelector(".kate-button-x");
        this.o_button = root.querySelector(".kate-button-o");
        this.ltrigger_button = root.querySelector(".kate-trigger-left");
        this.rtrigger_button = root.querySelector(".kate-trigger-right");
        this.os_root = root.querySelector("#kate-os-root");
        this.hud = root.querySelector("#kate-hud");
        this.device_display = root.querySelector(".kate-screen");
        this.body = root.querySelector(".kate-body");
        this.version_container = root.querySelector(".kate-version");
        this.resources_container = root.querySelector(".kate-resources");
        if (this.version_container != null && this.version != null) {
            this.version_container.textContent = this.version;
        }
        this.open_audio_output();
        this.reset_states();
    }
    reset_states() {
        this.input_state = {
            up: { pressed: false, count: 0 },
            right: { pressed: false, count: 0 },
            down: { pressed: false, count: 0 },
            left: { pressed: false, count: 0 },
            menu: { pressed: false, count: 0 },
            capture: { pressed: false, count: 0 },
            x: { pressed: false, count: 0 },
            o: { pressed: false, count: 0 },
            ltrigger: { pressed: false, count: 0 },
            rtrigger: { pressed: false, count: 0 },
        };
        this.up_button.classList.remove("down");
        this.right_button.classList.remove("down");
        this.down_button.classList.remove("down");
        this.left_button.classList.remove("down");
        this.menu_button.classList.remove("down");
        this.capture_button.classList.remove("down");
        this.x_button.classList.remove("down");
        this.o_button.classList.remove("down");
        this.ltrigger_button.classList.remove("down");
        this.rtrigger_button.classList.remove("down");
    }
    start_ticking() {
        cancelAnimationFrame(this.timer_id);
        this.timer_id = requestAnimationFrame(this.tick);
    }
    open_audio_output() {
        this.audio_context.resume().catch((e) => { });
        if (this.audio_context.state !== "running") {
            const open_audio_output = () => {
                this.audio_context.resume().catch((e) => { });
                window.removeEventListener("touchstart", open_audio_output);
                window.removeEventListener("click", open_audio_output);
                window.removeEventListener("keydown", open_audio_output);
            };
            window.addEventListener("touchstart", open_audio_output);
            window.addEventListener("click", open_audio_output);
            window.addEventListener("keydown", open_audio_output);
        }
    }
    tick = (time) => {
        if (this.last_time == null) {
            this.last_time = time;
            this.on_tick.emit(time);
            this.timer_id = requestAnimationFrame(this.tick);
            return;
        }
        const elapsed = time - this.last_time;
        if (elapsed < this.ONE_FRAME) {
            this.timer_id = requestAnimationFrame(this.tick);
        }
        else {
            this.last_time = time;
            this.on_tick.emit(time);
            this.timer_id = requestAnimationFrame(this.tick);
        }
    };
    get scale() {
        return this._scale;
    }
    listen() {
        if (this.is_listening) {
            throw new Error(`listen called twice`);
        }
        this.is_listening = true;
        window.addEventListener("load", () => this.update_scale(true));
        window.addEventListener("resize", () => this.update_scale(true));
        window.addEventListener("orientationchange", () => this.update_scale(true));
        screen.addEventListener?.("orientationchange", () => this.update_scale(true));
        this.update_scale(true);
        this.body
            .querySelector(".kate-engraving")
            ?.addEventListener("click", () => {
            this.request_fullscreen();
        });
        const listen_button = (button, key) => {
            button.addEventListener("mousedown", (ev) => {
                ev.preventDefault();
                this.update_virtual_key(key, true);
            });
            button.addEventListener("mouseup", (ev) => {
                ev.preventDefault();
                this.update_virtual_key(key, false);
            });
            button.addEventListener("touchstart", (ev) => {
                ev.preventDefault();
                this.update_virtual_key(key, true);
            });
            button.addEventListener("touchend", (ev) => {
                ev.preventDefault();
                this.update_virtual_key(key, false);
            });
        };
        listen_button(this.up_button, "up");
        listen_button(this.right_button, "right");
        listen_button(this.down_button, "down");
        listen_button(this.left_button, "left");
        listen_button(this.menu_button, "menu");
        listen_button(this.capture_button, "capture");
        listen_button(this.x_button, "x");
        listen_button(this.o_button, "o");
        listen_button(this.ltrigger_button, "ltrigger");
        listen_button(this.rtrigger_button, "rtrigger");
        this.start_ticking();
        this.on_tick.listen(this.key_update_loop);
    }
    update_scale(force) {
        const width = 1312;
        const ww = window.innerWidth;
        const wh = window.innerHeight;
        let zoom = Math.min(1, ww / width);
        if (zoom === this._scale && !force) {
            return;
        }
        const x = Math.round(ww - this.body.offsetWidth * zoom) / 2;
        const y = Math.round(wh - this.body.offsetHeight * zoom) / 2;
        this.body.style.transform = `scale(${zoom})`;
        this.body.style.transformOrigin = `0 0`;
        this.body.style.left = `${x}px`;
        this.body.style.top = `${y}px`;
        window.scrollTo({ left: 0, top: 0 });
        document.body.scroll({ left: 0, top: 0 });
        this._scale = zoom;
        this.on_scale_changed.emit(zoom);
    }
    async request_fullscreen() {
        try {
            await document.body.requestFullscreen({ navigationUI: "hide" });
            await screen.orientation.lock("landscape").catch((_) => { });
            return true;
        }
        catch (error) {
            console.warn(`[Kate] locking orientation in fullscreen not supported`, error);
            return false;
        }
    }
    key_update_loop = (time) => {
        for (const key of this.keys) {
            this.update_single_key(key, false);
        }
        for (const key of this.special_keys) {
            this.update_single_key(key, true);
        }
    };
    update_single_key(key, special) {
        const x = this.input_state[key];
        if (x.pressed) {
            x.count = (x.count + 1) >>> 0 || 2;
            if (special && x.count >= this.SPECIAL_FRAMES) {
                x.count = 0;
                x.pressed = false;
                this.on_key_pressed.emit({
                    key: `long_${key}`,
                    is_repeat: false,
                });
                this.render_button_state(key, false);
            }
            else if (!special && x.count === 1) {
                this.on_input_changed.emit({ key, is_down: true });
                this.on_key_pressed.emit({ key, is_repeat: false });
            }
            else if (!special && x.count % this.REPEAT_FRAMES === 0) {
                this.on_key_pressed.emit({ key, is_repeat: true });
            }
        }
        else {
            if (special) {
                if (x.count === -1) {
                    this.on_input_changed.emit({ key, is_down: false });
                    x.count = 0;
                }
                else if (x.count > 0 && x.count < this.SPECIAL_FRAMES) {
                    this.on_input_changed.emit({ key, is_down: true });
                    this.on_key_pressed.emit({ key, is_repeat: false });
                    x.count = -1;
                }
            }
            else if (x.count > 0) {
                x.count = 0;
                this.on_input_changed.emit({ key, is_down: false });
            }
        }
    }
    update_virtual_key(key, state) {
        const x = this.input_state[key];
        if (x.pressed !== state) {
            x.pressed = state;
            if (state) {
                x.count = 0;
            }
            this.render_button_state(key, state);
        }
    }
    render_button_state(key, state) {
        const button = {
            up: this.up_button,
            right: this.right_button,
            down: this.down_button,
            left: this.left_button,
            menu: this.menu_button,
            capture: this.capture_button,
            x: this.x_button,
            o: this.o_button,
            ltrigger: this.ltrigger_button,
            rtrigger: this.rtrigger_button,
        }[key];
        if (state) {
            button.classList.add("down");
        }
        else {
            button.classList.remove("down");
        }
    }
    take_resource(resource) {
        const refs = this.resources.get(resource) ?? 0;
        this.resources.set(resource, refs + 1);
        this.update_resource_display();
    }
    release_resource(resource) {
        const refs = this.resources.get(resource) ?? 0;
        this.resources.set(resource, Math.max(0, refs - 1));
        this.update_resource_display();
    }
    update_resource_display() {
        this.resources_container.textContent = "";
        for (const [resource, refs] of this.resources.entries()) {
            if (refs > 0) {
                const e = document.createElement("div");
                e.className = `kate-resource kate-resource-${resource}`;
                this.resources_container.append(e);
            }
        }
    }
}
exports.VirtualConsole = VirtualConsole;

});

// packages\kate-core\package.json
require.define(23, "", "", (module, exports, __dirname, __filename) => {
  module.exports = {"name":"@qteatime/kate-core","version":"0.23.4-a1","description":"The Kate emulator --- a fantasy console for 2d story games.","main":"build/index.js","repository":{"type":"git","url":"git+https://github.com/qteatime/kate.git"},"author":"Q.","license":"MIT","bugs":{"url":"https://github.com/qteatime/kate/issues"},"homepage":"https://github.com/qteatime/kate#readme"};
})

// packages\kate-core\build\os\index.js
require.define(24, "packages\\kate-core\\build\\os", "packages\\kate-core\\build\\os\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(25), exports);
__exportStar(require(32), exports);
__exportStar(require(46), exports);
__exportStar(require(69), exports);

});

// packages\kate-core\build\os\os.js
require.define(25, "packages\\kate-core\\build\\os", "packages\\kate-core\\build\\os\\os.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateOS = void 0;
const KateDb = require(26);
const utils_1 = require(5);
const time_1 = require(32);
const boot_1 = require(33);
const home_1 = require(36);
const cart_manager_1 = require(50);
const processes_1 = require(61);
const context_menu_1 = require(63);
const notification_1 = require(64);
const drop_installer_1 = require(65);
const focus_handler_1 = require(66);
const status_bar_1 = require(67);
const ipc_1 = require(68);
const apis_1 = require(69);
const dialog_1 = require(72);
const capture_1 = require(73);
const sfx_1 = require(74);
const settings_1 = require(75);
class KateOS {
    kernel;
    db;
    sfx;
    settings;
    _scene_stack = [];
    _active_hud = [];
    _current_scene = null;
    cart_manager;
    processes;
    context_menu;
    notifications;
    installer;
    focus_handler;
    status_bar;
    object_store;
    ipc;
    dialog;
    capture;
    events = {
        on_cart_inserted: new utils_1.EventStream(),
        on_cart_removed: new utils_1.EventStream(),
    };
    constructor(kernel, db, sfx, settings) {
        this.kernel = kernel;
        this.db = db;
        this.sfx = sfx;
        this.settings = settings;
        this.cart_manager = new cart_manager_1.CartManager(this);
        this.processes = new processes_1.KateProcesses(this);
        this.object_store = new apis_1.KateObjectStore(this);
        this.context_menu = new context_menu_1.KateContextMenu(this);
        this.context_menu.setup();
        this.notifications = new notification_1.KateNotification(this);
        this.notifications.setup();
        this.installer = new drop_installer_1.KateDropInstaller(this);
        this.installer.setup();
        this.focus_handler = new focus_handler_1.KateFocusHandler(this);
        this.focus_handler.setup();
        this.status_bar = new status_bar_1.KateStatusBar(this);
        this.status_bar.setup();
        this.ipc = new ipc_1.KateIPCServer(this);
        this.ipc.setup();
        this.dialog = new dialog_1.KateDialog(this);
        this.dialog.setup();
        this.capture = new capture_1.KateCapture(this);
    }
    get display() {
        return this.kernel.console.os_root;
    }
    get hud_display() {
        return this.kernel.console.hud;
    }
    get current_scene() {
        return this._current_scene;
    }
    push_scene(scene) {
        if (this._current_scene != null) {
            this._scene_stack.push(this._current_scene);
        }
        this._current_scene = scene;
        scene.attach(this.display);
        this.focus_handler.push_root(scene.canvas);
    }
    pop_scene() {
        if (this._current_scene != null) {
            this.focus_handler.pop_root(this._current_scene.canvas);
            this._current_scene.detach();
        }
        this._current_scene = this._scene_stack.pop() ?? null;
        this.focus_handler.push_root(this._current_scene?.canvas ?? null);
    }
    replace_scene(scene) {
        this.pop_scene();
        this.push_scene(scene);
    }
    show_hud(scene) {
        this._active_hud.push(scene);
        scene.attach(this.hud_display);
    }
    hide_hud(scene) {
        this._active_hud = this._active_hud.filter((x) => x !== scene);
        scene.detach();
    }
    make_audio_server() {
        return new apis_1.KateAudioServer(this.kernel);
    }
    static async boot(kernel) {
        const sfx = await sfx_1.KateSfx.make(kernel);
        const { db } = await KateDb.kate.open();
        const settings = await settings_1.KateSettings.load(db);
        const os = new KateOS(kernel, db, sfx, settings);
        await request_persistent_storage(os);
        const boot_screen = new boot_1.SceneBoot(os);
        os.push_scene(boot_screen);
        await (0, time_1.wait)(2100);
        os.pop_scene();
        os.push_scene(new home_1.SceneHome(os));
        return os;
    }
}
exports.KateOS = KateOS;
async function request_persistent_storage(os) {
    if (navigator.storage?.persisted == null ||
        navigator.storage?.persist == null) {
        os.kernel.console.take_resource("transient-storage");
        return;
    }
    if (os.kernel.console.options.persistent_storage &&
        !(await navigator.storage.persisted())) {
        const persistent = await navigator.storage.persist();
        if (persistent) {
            return;
        }
    }
    if (!(await navigator.storage.persisted())) {
        os.kernel.console.take_resource("transient-storage");
    }
}

});

// packages\kate-core\build\data\index.js
require.define(26, "packages\\kate-core\\build\\data", "packages\\kate-core\\build\\data\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(27), exports);

});

// packages\kate-core\build\data\db.js
require.define(27, "packages\\kate-core\\build\\data", "packages\\kate-core\\build\\data\\db.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settings = exports.media_files = exports.idx_media_store_by_cart = exports.media_store = exports.quota_usage = exports.idx_cart_object_store_by_cart = exports.object_store = exports.notifications = exports.cart_files = exports.play_habits = exports.cart_meta = exports.kate = void 0;
const Db = require(28);
exports.kate = new Db.DatabaseSchema("kate", 7);
exports.cart_meta = exports.kate.table1({
    since: 3,
    name: "cart_meta_v2",
    path: "id",
    auto_increment: false,
});
exports.play_habits = exports.kate.table1({
    since: 5,
    name: "play_habits",
    path: "id",
    auto_increment: false,
});
exports.cart_files = exports.kate.table2({
    since: 3,
    name: "cart_files_v2",
    path: ["id", "file_id"],
    auto_increment: false,
});
exports.notifications = exports.kate.table1({
    since: 1,
    name: "notifications",
    path: "id",
    auto_increment: true,
});
exports.object_store = exports.kate.table2({
    since: 6,
    name: "object_store",
    path: ["cart_id", "id"],
    auto_increment: false,
});
exports.idx_cart_object_store_by_cart = exports.object_store.index1({
    since: 6,
    name: "by_cart",
    path: ["cart_id"],
    unique: false,
});
exports.quota_usage = exports.kate.table1({
    since: 6,
    name: "quota_usage",
    path: "cart_id",
    auto_increment: false,
});
exports.media_store = exports.kate.table1({
    since: 4,
    name: "media_store_v2",
    path: "id",
    auto_increment: false,
});
exports.idx_media_store_by_cart = exports.media_store.index1({
    since: 3,
    name: "by_cart",
    path: ["cart_id"],
    unique: false,
});
exports.media_files = exports.kate.table1({
    since: 4,
    name: "media_files",
    path: "id",
    auto_increment: false,
});
exports.settings = exports.kate.table1({
    since: 7,
    name: "settings",
    path: "key",
    auto_increment: false,
});
// Data migrations

});

// packages\kate-core\build\db-schema.js
require.define(28, "packages\\kate-core\\build", "packages\\kate-core\\build\\db-schema.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(29), exports);

});

// packages\db-schema\build\index.js
require.define(29, "packages\\db-schema\\build", "packages\\db-schema\\build\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(30), exports);
__exportStar(require(31), exports);

});

// packages\db-schema\build\schema.js
require.define(30, "packages\\db-schema\\build", "packages\\db-schema\\build\\schema.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexSchema2 = exports.IndexSchema1 = exports.TableSchema2 = exports.TableSchema1 = exports.TableSchema = exports.DatabaseSchema = void 0;
const core_1 = require(31);
class DatabaseSchema {
    name;
    version;
    tables = [];
    constructor(name, version) {
        this.name = name;
        this.version = version;
    }
    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.name, this.version);
            let old_version = this.version;
            request.onerror = (ev) => {
                console.error(`[Kate] failed to open database`, ev);
                reject(new Error(`Unable to open database`));
            };
            request.onsuccess = (ev) => {
                resolve({
                    db: new core_1.Database(request.result),
                    old_version,
                });
            };
            request.onupgradeneeded = (ev) => {
                old_version = ev.oldVersion;
                const request = ev.target;
                const db = request.result;
                const transaction = request.transaction;
                for (const table of this.tables) {
                    table.upgrade(db, transaction, old_version);
                }
            };
        });
    }
    table1(x) {
        const table = new TableSchema1(x.since, x.name, {
            path: x.path,
            auto_increment: x.auto_increment,
        });
        this.tables.push(table);
        return table;
    }
    table2(x) {
        const table = new TableSchema2(x.since, x.name, {
            path: x.path,
            auto_increment: x.auto_increment,
        });
        this.tables.push(table);
        return table;
    }
}
exports.DatabaseSchema = DatabaseSchema;
class TableSchema {
    version;
    name;
    key;
    indexes = [];
    constructor(version, name, key) {
        this.version = version;
        this.name = name;
        this.key = key;
    }
    upgrade(db, transaction, old_version) {
        if (this.version > old_version) {
            db.createObjectStore(this.name, {
                keyPath: this.key.path,
                autoIncrement: this.key.auto_increment,
            });
        }
        for (const index of this.indexes) {
            index.upgrade(transaction, old_version);
        }
    }
    index1(x) {
        const id = new IndexSchema1(this, x.since, x.name, x.path, {
            unique: x.unique ?? true,
            multi_entry: x.multi_entry ?? false,
        });
        this.indexes.push(id);
        return id;
    }
    index2(x) {
        const id = new IndexSchema2(this, x.since, x.name, x.path, {
            unique: x.unique ?? true,
            multi_entry: x.multi_entry ?? false,
        });
        this.indexes.push(id);
        return id;
    }
}
exports.TableSchema = TableSchema;
class TableSchema1 extends TableSchema {
    __schema1;
    __k1;
    __kt1;
    constructor(version, name, key) {
        super(version, name, key);
    }
}
exports.TableSchema1 = TableSchema1;
class TableSchema2 extends TableSchema {
    __schema2;
    __k1;
    __kt1;
    __k2;
    __kt2;
    constructor(version, name, key) {
        super(version, name, key);
    }
}
exports.TableSchema2 = TableSchema2;
class IndexSchema {
    table;
    version;
    name;
    key;
    options;
    constructor(table, version, name, key, options) {
        this.table = table;
        this.version = version;
        this.name = name;
        this.key = key;
        this.options = options;
    }
    upgrade(transaction, old_version) {
        if (this.version > old_version) {
            const store = transaction.objectStore(this.table.name);
            store.createIndex(this.name, this.key, {
                unique: this.options.unique,
                multiEntry: this.options.multi_entry,
            });
        }
    }
}
class IndexSchema1 extends IndexSchema {
    __schema1;
    __k1;
    __kt1;
    constructor(table, version, name, key, options) {
        super(table, version, name, key, options);
    }
}
exports.IndexSchema1 = IndexSchema1;
class IndexSchema2 extends IndexSchema {
    __schema2;
    __k1;
    __kt1;
    __k2;
    __kt2;
    constructor(table, version, name, key, options) {
        super(table, version, name, key, options);
    }
}
exports.IndexSchema2 = IndexSchema2;

});

// packages\db-schema\build\core.js
require.define(31, "packages\\db-schema\\build", "packages\\db-schema\\build\\core.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Index = exports.Table = exports.Transaction = exports.Database = void 0;
function lift_request(req) {
    return new Promise((resolve, reject) => {
        req.onerror = (_) => reject(new Error(`failed`));
        req.onsuccess = (_) => resolve(req.result);
    });
}
class Database {
    db;
    constructor(db) {
        this.db = db;
    }
    async delete_database() {
        this.db.close();
        await lift_request(indexedDB.deleteDatabase(this.db.name));
    }
    async transaction(tables, mode, fn) {
        return new Promise(async (resolve, reject) => {
            const request = this.db.transaction(tables.map((x) => x.name), mode);
            let result;
            request.onerror = (ev) => {
                reject(new Error(`cannot start transaction`));
            };
            request.onabort = (ev) => {
                reject(new Error(`transaction aborted`));
            };
            request.oncomplete = (ev) => {
                resolve(result);
            };
            const trans = new Transaction(request);
            try {
                result = await fn(trans);
                trans.commit();
            }
            catch (error) {
                trans.abort();
                reject(error);
            }
        });
    }
}
exports.Database = Database;
class Transaction {
    trans;
    constructor(trans) {
        this.trans = trans;
    }
    commit() {
        this.trans.commit();
    }
    abort() {
        this.trans.abort();
    }
    get_table1(table) {
        return new Table(this.trans.objectStore(table.name));
    }
    get_table2(table) {
        return new Table(this.trans.objectStore(table.name));
    }
    get_index1(index) {
        const store = this.trans.objectStore(index.table.name);
        return new Index(store.index(index.name));
    }
    get_index2(index) {
        const store = this.trans.objectStore(index.table.name);
        return new Index(store.index(index.name));
    }
}
exports.Transaction = Transaction;
class Table {
    store;
    constructor(store) {
        this.store = store;
    }
    async add(value) {
        return (await lift_request(this.store.add(value)));
    }
    async put(value) {
        return (await lift_request(this.store.put(value)));
    }
    async clear() {
        await lift_request(this.store.clear());
    }
    async count(query) {
        return await lift_request(this.store.count(query));
    }
    async delete(query) {
        return await lift_request(this.store.delete(query));
    }
    async get(query) {
        return await lift_request(this.store.get(query));
    }
    async get_all(query, count) {
        return await lift_request(this.store.getAll(query, count));
    }
    async try_get(query) {
        const value = await this.get_all(query, 1);
        if (value.length === 1) {
            return value[0];
        }
        else {
            return null;
        }
    }
}
exports.Table = Table;
class Index {
    index;
    constructor(index) {
        this.index = index;
    }
    async count(query) {
        return await lift_request(this.index.count(query));
    }
    async get(query) {
        return await lift_request(this.index.get(query));
    }
    async get_all(query, count) {
        return await lift_request(this.index.getAll(query, count));
    }
}
exports.Index = Index;

});

// packages\kate-core\build\os\time.js
require.define(32, "packages\\kate-core\\build\\os", "packages\\kate-core\\build\\os\\time.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wait = void 0;
async function wait(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(), ms));
}
exports.wait = wait;

});

// packages\kate-core\build\os\apps\boot.js
require.define(33, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\boot.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneBoot = void 0;
const widget_1 = require(34);
const scenes_1 = require(35);
class SceneBoot extends scenes_1.Scene {
    render() {
        return (0, widget_1.h)("div", { class: "kate-os-logo" }, [
            (0, widget_1.h)("div", { class: "kate-os-logo-image" }, [
                (0, widget_1.h)("div", { class: "kate-os-logo-paw" }, [
                    (0, widget_1.h)("i", {}, []),
                    (0, widget_1.h)("i", {}, []),
                    (0, widget_1.h)("i", {}, []),
                ]),
                (0, widget_1.h)("div", { class: "kate-os-logo-name" }, ["Kate"]),
            ]),
        ]);
    }
}
exports.SceneBoot = SceneBoot;

});

// packages\kate-core\build\os\ui\widget.js
require.define(34, "packages\\kate-core\\build\\os\\ui", "packages\\kate-core\\build\\os\\ui\\widget.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vdivider = exports.hspace = exports.vspace = exports.button = exports.p = exports.padding = exports.text_panel = exports.simple_screen = exports.scroll = exports.statusbar = exports.link_card = exports.legible_bg = exports.toggle = exports.info_cell = exports.info_line = exports.focusable_container = exports.fa_icon = exports.status_bar = exports.Icon = exports.fa_icon_button = exports.icon_button = exports.link = exports.Button = exports.when = exports.If = exports.Menu_list = exports.Section_title = exports.Space = exports.Title_bar = exports.VBox = exports.HBox = exports.WithClass = exports.append = exports.render = exports.svg = exports.h = exports.fragment = exports.Widget = void 0;
const utils_1 = require(5);
class Widget {
    with_classes(names) {
        return new WithClass(names, this);
    }
}
exports.Widget = Widget;
function fragment(children) {
    const x = document.createDocumentFragment();
    for (const child of children) {
        append(child, x);
    }
    return x;
}
exports.fragment = fragment;
function h(tag, attrs, children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        element.setAttribute(key, value);
    }
    for (const child of children) {
        append(child, element);
    }
    return element;
}
exports.h = h;
function svg(tag, attrs, children) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attrs)) {
        element.setAttribute(key, value);
    }
    for (const child of children) {
        element.appendChild(child);
    }
    return element;
}
exports.svg = svg;
function render(x) {
    const element = x.render();
    if (element instanceof Widget) {
        return render(element);
    }
    else {
        return element;
    }
}
exports.render = render;
function append(child, to) {
    let content = child instanceof Widget ? render(child) : child;
    if (typeof content === "string") {
        to.appendChild(document.createTextNode(content));
    }
    else if (content != null) {
        to.appendChild(content);
    }
}
exports.append = append;
class WithClass extends Widget {
    classes;
    child;
    constructor(classes, child) {
        super();
        this.classes = classes;
        this.child = child;
    }
    render() {
        const element = render(this.child);
        if (element instanceof HTMLElement) {
            for (const k of this.classes) {
                element.classList.add(k);
            }
        }
        return element;
    }
}
exports.WithClass = WithClass;
class HBox extends Widget {
    gap;
    children;
    constructor(gap, children) {
        super();
        this.gap = gap;
        this.children = children;
    }
    render() {
        return h("div", { class: "kate-ui-hbox", style: `gap: ${this.gap}px` }, this.children);
    }
}
exports.HBox = HBox;
class VBox extends Widget {
    gap;
    children;
    constructor(gap, children) {
        super();
        this.gap = gap;
        this.children = children;
    }
    render() {
        return h("div", { class: "kate-ui-vbox", style: `gap: ${this.gap}px` }, this.children);
    }
}
exports.VBox = VBox;
class Title_bar extends Widget {
    children;
    constructor(children) {
        super();
        this.children = children;
    }
    render() {
        return h("div", { class: "kate-ui-title-bar" }, [
            h("div", { class: "kate-ui-title-bar-child" }, [
                this.children.left ?? null,
            ]),
            h("div", { class: "kate-ui-title-bar-child" }, [
                this.children.middle ?? null,
            ]),
            h("div", { class: "kate-ui-title-bar-child" }, [
                this.children.right ?? null,
            ]),
        ]);
    }
}
exports.Title_bar = Title_bar;
class Space extends Widget {
    x;
    constructor(x) {
        super();
        this.x = x;
    }
    render() {
        return h("div", {
            class: "kate-ui-space",
            style: `width: ${this.x.width ?? 0}px; height: ${this.x.height ?? 0}px`,
        }, []);
    }
}
exports.Space = Space;
class Section_title extends Widget {
    children;
    constructor(children) {
        super();
        this.children = children;
    }
    render() {
        return h("div", { class: "kate-ui-section-title" }, this.children);
    }
}
exports.Section_title = Section_title;
class Menu_list extends Widget {
    children;
    constructor(children) {
        super();
        this.children = children;
    }
    render() {
        return h("div", { class: "kate-ui-menu-list" }, this.children);
    }
}
exports.Menu_list = Menu_list;
class If extends Widget {
    condition;
    child;
    constructor(condition, child) {
        super();
        this.condition = condition;
        this.child = child;
    }
    render() {
        if (this.condition()) {
            return this.child.then;
        }
        else {
            return this.child.else;
        }
    }
}
exports.If = If;
function when(condition, children) {
    if (condition) {
        return fragment(children);
    }
    else {
        return null;
    }
}
exports.when = when;
class Button extends Widget {
    children;
    _on_clicked = new utils_1.EventStream();
    _is_focus_target = true;
    constructor(children) {
        super();
        this.children = children;
    }
    on_clicked(fn) {
        this._on_clicked.listen(fn);
        return this;
    }
    focus_target(x) {
        this._is_focus_target = x;
        return this;
    }
    render() {
        const element = h("button", { class: "kate-ui-button" }, this.children);
        if (this._is_focus_target) {
            element.classList.add("kate-ui-focus-target");
        }
        element.addEventListener("click", (ev) => {
            ev.preventDefault();
            this._on_clicked.emit();
        });
        element.addEventListener("mouseenter", () => {
            element.classList.add("focus");
        });
        element.addEventListener("mouseleave", () => {
            element.classList.remove("focus");
        });
        return element;
    }
}
exports.Button = Button;
function link(text, x) {
    const link = h("a", {
        class: "kate-ui-button-link kate-ui-focus-target",
        href: x.href ?? "#",
        target: x.target ?? "",
    }, [text]);
    if (x.on_click != null) {
        link.addEventListener("click", (ev) => {
            ev.preventDefault();
            x.on_click();
        });
    }
    return link;
}
exports.link = link;
function icon_button(icon, text) {
    return new Button([new HBox(5, [new Icon(icon), text])]).focus_target(false);
}
exports.icon_button = icon_button;
function fa_icon_button(name, text, spacing = 10) {
    return new Button([new HBox(spacing, [fa_icon(name), text])]);
}
exports.fa_icon_button = fa_icon_button;
class Icon extends Widget {
    type;
    constructor(type) {
        super();
        this.type = type;
    }
    render() {
        switch (this.type) {
            case "up":
            case "down":
            case "right":
            case "left":
                return h("div", { class: "kate-icon kate-icon-light", "data-name": this.type }, [h("img", { src: `img/${this.type}.png` }, [])]);
            case "ltrigger":
            case "rtrigger":
            case "menu":
            case "capture":
                return h("div", { class: "kate-icon", "data-name": this.type }, []);
            case "x":
                return h("div", { class: "kate-icon", "data-name": this.type }, [
                    h("img", { src: `img/cancel.png` }, []),
                ]);
            case "o":
                return h("div", { class: "kate-icon", "data-name": this.type }, [
                    h("img", { src: `img/ok.png` }, []),
                ]);
        }
    }
}
exports.Icon = Icon;
function status_bar(children) {
    return h("div", { class: "kate-os-statusbar" }, [...children]);
}
exports.status_bar = status_bar;
function fa_icon(name, size = "1x", style = "solid", animation) {
    const anim = animation == null ? "" : `fa-${animation}`;
    return h("i", { class: `fa-${style} fa-${size} fa-${name} ${anim}` }, []);
}
exports.fa_icon = fa_icon;
function focusable_container(children) {
    return h("div", { class: "kate-ui-focusable-container kate-ui-focus-target" }, [...children]);
}
exports.focusable_container = focusable_container;
function info_line(label, data, x) {
    const info = [
        h("div", { class: "kate-ui-info-line" }, [
            h("div", { class: "kate-ui-info-line-label" }, [label]),
            h("div", { class: "kate-ui-info-line-data" }, [...data]),
        ]),
    ];
    if (x?.interactive !== true) {
        return focusable_container(info);
    }
    else {
        return fragment(info);
    }
}
exports.info_line = info_line;
function info_cell(label, data) {
    return info_line(label, data, { interactive: true });
}
exports.info_cell = info_cell;
function toggle(value, x = {}) {
    let checked = value;
    const container = h("div", { class: "kate-ui-toggle-container kate-ui-focus-target" }, [
        h("div", { class: "kate-ui-toggle-view" }, [
            h("div", { class: "kate-ui-toggle-bullet" }, []),
        ]),
        h("div", { class: "kate-ui-toggle-label-yes" }, [x.enabled ?? "YES"]),
        h("div", { class: "kate-ui-toggle-label-no" }, [x.disabled ?? "NO "]),
    ]);
    container.classList.toggle("active", checked);
    container.addEventListener("click", () => {
        checked = !checked;
        container.classList.toggle("active", checked);
        x.on_changed?.(checked);
    });
    return container;
}
exports.toggle = toggle;
function legible_bg(children) {
    return h("div", { class: "kate-ui-legible-bg" }, [...children]);
}
exports.legible_bg = legible_bg;
function link_card(x) {
    const element = h("div", { class: "kate-ui-link-card kate-ui-focus-target" }, [
        h("div", { class: "kate-ui-link-card-icon" }, [fa_icon(x.icon, "2x")]),
        h("div", { class: "kate-ui-link-card-text" }, [
            h("div", { class: "kate-ui-link-card-title" }, [x.title]),
            h("div", { class: "kate-ui-link-card-description" }, [x.description]),
        ]),
    ]);
    if (x.on_click) {
        element.classList.add("kate-ui-link-card-clickable");
        element.addEventListener("click", () => x.on_click());
    }
    return element;
}
exports.link_card = link_card;
function statusbar(children) {
    return h("div", { class: "kate-os-statusbar" }, [...children]);
}
exports.statusbar = statusbar;
function scroll(children) {
    return h("div", { class: "kate-os-scroll" }, [...children]);
}
exports.scroll = scroll;
function simple_screen(x) {
    return h("div", { class: "kate-os-simple-screen" }, [
        new Title_bar({
            left: fragment([fa_icon(x.icon, "lg"), new Section_title(x.title)]),
            right: x.subtitle,
        }),
        x.body,
        x.status ? statusbar([...x.status]) : null,
    ]);
}
exports.simple_screen = simple_screen;
function text_panel(x) {
    return h("div", { class: "kate-ui-text-panel" }, [
        h("div", { class: "kate-ui-text-panel-title" }, [x.title]),
        h("div", { class: "kate-ui-text-panel-description" }, [x.description]),
    ]);
}
exports.text_panel = text_panel;
function padding(amount, children) {
    return h("div", { style: `padding: ${amount}px` }, [...children]);
}
exports.padding = padding;
function p(children) {
    return h("p", {}, [...children]);
}
exports.p = p;
function button(text, x) {
    const button = new Button([text]);
    button.focus_target(x.focus_target ?? true);
    if (x.on_clicked != null) {
        button.on_clicked(x.on_clicked);
    }
    return button;
}
exports.button = button;
function vspace(x) {
    return new Space({ height: x });
}
exports.vspace = vspace;
function hspace(x) {
    return new Space({ width: x });
}
exports.hspace = hspace;
function vdivider() {
    return h("div", { class: "kate-ui-vertical-divider" }, []);
}
exports.vdivider = vdivider;

});

// packages\kate-core\build\os\ui\scenes.js
require.define(35, "packages\\kate-core\\build\\os\\ui", "packages\\kate-core\\build\\os\\ui\\scenes.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleScene = exports.Scene = void 0;
const widget_1 = require(34);
class Scene {
    os;
    canvas;
    constructor(os) {
        this.os = os;
        this.canvas = (0, widget_1.h)("div", { class: "kate-os-screen" }, []);
    }
    async attach(to) {
        to.appendChild(this.canvas);
        this.canvas.innerHTML = "";
        (0, widget_1.append)(this.render(), this.canvas);
        this.on_attached();
    }
    async detach() {
        this.canvas.remove();
        this.on_detached();
    }
    on_attached() { }
    on_detached() { }
}
exports.Scene = Scene;
class SimpleScene extends Scene {
    subtitle = null;
    render() {
        return (0, widget_1.simple_screen)({
            icon: this.icon,
            title: this.title,
            subtitle: this.subtitle,
            body: (0, widget_1.scroll)([
                (0, widget_1.h)("div", { class: "kate-os-content kate-os-screen-body" }, this.body()),
            ]),
            status: [
                (0, widget_1.icon_button)("x", "Return").on_clicked(this.handle_close),
                (0, widget_1.icon_button)("o", "Open").on_clicked(this.handle_open),
            ],
        });
    }
    replace_body(content) {
        const body = this.canvas.querySelector(".kate-os-screen-body");
        if (body != null) {
            body.textContent = "";
            for (const child of content) {
                (0, widget_1.append)(child, body);
            }
        }
    }
    on_attached() {
        this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    }
    on_detached() {
        this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
    }
    handle_key_pressed = (x) => {
        if (x.is_repeat) {
            return false;
        }
        switch (x.key) {
            case "o":
                this.handle_open();
                return true;
            case "x":
                this.handle_close();
                return true;
        }
        return false;
    };
    handle_close = () => {
        this.os.pop_scene();
    };
    handle_open = () => {
        const current = this.os.focus_handler.current_focus;
        if (current != null) {
            current.click();
        }
    };
}
exports.SimpleScene = SimpleScene;

});

// packages\kate-core\build\os\apps\home.js
require.define(36, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\home.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneHome = void 0;
const widget_1 = require(34);
const UI = require(34);
const utils_1 = require(5);
const scenes_1 = require(35);
const applications_1 = require(37);
const text_file_1 = require(43);
const load_screen_1 = require(49);
class SceneHome extends scenes_1.Scene {
    cart_map = new Map();
    render_cart(x) {
        return new UI.Button([
            (0, widget_1.h)("div", { class: "kate-os-carts-box" }, [
                (0, widget_1.h)("div", { class: "kate-os-carts-image" }, [
                    (0, widget_1.h)("img", { src: x.thumbnail_dataurl }, []),
                ]),
                (0, widget_1.h)("div", { class: "kate-os-carts-title" }, [x.metadata.game.title]),
            ]),
        ]).on_clicked(() => this.play(x.id));
    }
    async show_carts(list) {
        const recency = (x) => {
            return Math.max(x.habits.last_played?.getTime() ?? 0, x.meta.updated_at.getTime());
        };
        try {
            const carts = (await this.os.cart_manager.list()).sort((a, b) => recency(b) - recency(a));
            list.textContent = "";
            this.cart_map = new Map();
            for (const x of carts) {
                const child = this.render_cart(x.meta).render();
                this.cart_map.set(child, x.meta);
                list.appendChild(child);
            }
            this.os.focus_handler.focus(list.querySelector(".kate-ui-focus-target") ??
                list.firstElementChild ??
                null);
        }
        catch (error) {
            console.error("[Kate] Failed to load cartridges", error);
            this.os.notifications.push("kate:os", "Failed to load games", `An internal error happened while loading.`);
        }
    }
    async show_pop_menu(cart) {
        const result = await this.os.dialog.pop_menu("kate:home", cart.metadata.game.title, [
            { label: "Legal notices", value: "legal" },
            { label: "Uninstall", value: "uninstall" },
        ], "close");
        switch (result) {
            case "uninstall": {
                const should_uninstall = await this.os.dialog.confirm("kate:home", {
                    title: `Uninstall ${cart.metadata.game.title}?`,
                    message: `This will remove the cartridge files, but not save data.`,
                    cancel: "Keep game",
                    ok: "Uninstall game",
                    dangerous: true,
                });
                if (should_uninstall) {
                    this.os.cart_manager.uninstall({
                        id: cart.metadata.id,
                        title: cart.metadata.game.title,
                    });
                }
                break;
            }
            case "close": {
                break;
            }
            case "legal": {
                const loading = new load_screen_1.HUD_LoadIndicator(this.os);
                this.os.show_hud(loading);
                try {
                    const legal = new text_file_1.SceneTextFile(this.os, `Legal Notices`, cart.metadata.game.title, cart.metadata.release.legal_notices);
                    this.os.push_scene(legal);
                }
                catch (error) {
                    console.error(`Failed to show legal notices for ${cart.id}`, error);
                    await this.os.notifications.push("kate:os", "Failed to open", "Cartridge may be corrupted or not compatible with this version");
                }
                finally {
                    this.os.hide_hud(loading);
                }
                break;
            }
            default: {
                throw (0, utils_1.unreachable)(result);
            }
        }
    }
    render() {
        return (0, widget_1.h)("div", { class: "kate-os-home" }, [
            new UI.Title_bar({
                left: UI.fragment([
                    UI.fa_icon("diamond", "lg"),
                    new UI.Section_title(["Start"]),
                ]),
                right: "Recently played and favourites",
            }),
            (0, widget_1.h)("div", { class: "kate-os-carts-scroll" }, [
                (0, widget_1.h)("div", { class: "kate-os-carts" }, []),
            ]),
            UI.status_bar([
                UI.icon_button("ltrigger", "Applications").on_clicked(this.handle_applications),
                UI.icon_button("menu", "Options").on_clicked(this.handle_options),
                UI.icon_button("o", "Play").on_clicked(this.handle_play),
            ]),
        ]);
    }
    on_attached() {
        this.update_carts();
        this.os.events.on_cart_inserted.listen(this.update_carts);
        this.os.events.on_cart_removed.listen(this.update_carts);
        this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    }
    on_detached() {
        this.os.events.on_cart_inserted.remove(this.update_carts);
        this.os.events.on_cart_removed.remove(this.update_carts);
        this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
    }
    update_carts = () => {
        const home = this.canvas;
        const carts = home.querySelector(".kate-os-carts");
        this.show_carts(carts);
    };
    handle_key_pressed = (x) => {
        if (x.is_repeat) {
            return false;
        }
        switch (x.key) {
            case "menu": {
                this.handle_options();
                return true;
            }
            case "ltrigger": {
                this.handle_applications();
                return true;
            }
        }
        return false;
    };
    handle_options = () => {
        for (const [button, cart] of this.cart_map) {
            if (button.classList.contains("focus")) {
                this.show_pop_menu(cart);
                return;
            }
        }
    };
    handle_play = () => {
        const current = this.os.focus_handler.current_focus;
        if (current != null) {
            current.click();
        }
    };
    handle_applications = () => {
        const apps = new applications_1.SceneApps(this.os);
        this.os.push_scene(apps);
    };
    async play(id) {
        await this.os.processes.run(id);
        await this.update_carts();
    }
}
exports.SceneHome = SceneHome;

});

// packages\kate-core\build\os\apps\applications.js
require.define(37, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\applications.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneApps = void 0;
const widget_1 = require(34);
const UI = require(34);
const media_1 = require(38);
const scenes_1 = require(35);
const about_kate_1 = require(40);
const settings_1 = require(45);
class SceneApps extends scenes_1.Scene {
    apps = [
        {
            name: "media",
            title: "Media gallery",
            icon: UI.fa_icon("images"),
            open: () => new media_1.SceneMedia(this.os, null),
        },
        {
            name: "about",
            title: "About Kate",
            icon: UI.fa_icon("cat"),
            open: () => new about_kate_1.SceneAboutKate(this.os),
        },
        {
            name: "settings",
            title: "Settings",
            icon: UI.fa_icon("gear"),
            open: () => new settings_1.SceneSettings(this.os),
        },
    ];
    render() {
        return (0, widget_1.h)("div", { class: "kate-os-simple-screen" }, [
            new UI.Title_bar({
                left: UI.fragment([
                    UI.fa_icon("puzzle-piece", "lg"),
                    new UI.Section_title(["Applications"]),
                ]),
            }),
            (0, widget_1.h)("div", { class: "kate-os-scroll" }, [
                (0, widget_1.h)("div", { class: "kate-os-applications" }, [
                    ...this.apps.map((x) => this.render_app(x)),
                ]),
            ]),
            (0, widget_1.h)("div", { class: "kate-os-statusbar" }, [
                UI.icon_button("x", "Return").on_clicked(this.handle_close),
                UI.icon_button("o", "Open").on_clicked(this.handle_open),
            ]),
        ]);
    }
    on_attached() {
        this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    }
    on_detached() {
        this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
    }
    handle_key_pressed = (x) => {
        switch (x.key) {
            case "x": {
                if (!x.is_repeat) {
                    this.handle_close();
                    return true;
                }
            }
        }
        return false;
    };
    handle_close = () => {
        this.os.pop_scene();
    };
    handle_open = () => {
        const current = this.os.focus_handler.current_focus;
        if (current != null) {
            current.click();
        }
    };
    render_app(app) {
        return new UI.Button([
            (0, widget_1.h)("div", { class: "kate-os-app-button" }, [
                (0, widget_1.h)("div", { class: "kate-os-app-button-icon" }, [app.icon]),
                (0, widget_1.h)("div", { class: "kate-os-app-button-title" }, [app.title]),
            ]),
        ]).on_clicked(() => this.open_app(app));
    }
    open_app(app) {
        const screen = app.open();
        this.os.push_scene(screen);
    }
}
exports.SceneApps = SceneApps;

});

// packages\kate-core\build\os\apps\media.js
require.define(38, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\media.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneMedia = void 0;
const widget_1 = require(34);
const UI = require(34);
const scenes_1 = require(35);
const view_media_1 = require(39);
class SceneMedia extends scenes_1.Scene {
    filter;
    media = new Map();
    constructor(os, filter) {
        super(os);
        this.filter = filter;
    }
    render() {
        return (0, widget_1.h)("div", { class: "kate-os-simple-screen" }, [
            new UI.Title_bar({
                left: UI.fragment([
                    UI.fa_icon("images", "lg"),
                    new UI.Section_title(["Media gallery"]),
                ]),
                right: (0, widget_1.h)("div", { class: "kate-os-media-status" }, []),
            }),
            (0, widget_1.h)("div", { class: "kate-os-scroll" }, [
                (0, widget_1.h)("div", { class: "kate-os-media-items" }, []),
            ]),
            (0, widget_1.h)("div", { class: "kate-os-statusbar" }, [
                UI.icon_button("x", "Return").on_clicked(this.handle_close),
                UI.icon_button("o", "View").on_clicked(this.handle_view),
            ]),
        ]);
    }
    on_attached() {
        this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
        this.load_media();
    }
    on_detached() {
        this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
    }
    async get_media_filtered() {
        const media0 = await this.os.capture.list();
        const filter = this.filter;
        if (filter == null) {
            return { title: "All", media: media0 };
        }
        else {
            return {
                title: filter.title,
                media: media0.filter((x) => x.cart_id === filter.id),
            };
        }
    }
    async load_media() {
        const { title, media } = await this.get_media_filtered();
        this.update_status(`${title} (${media.length})`);
        const buttons = await Promise.all(media.map(async (x) => [x, await this.make_button(x)]));
        const container = this.canvas.querySelector(".kate-os-media-items");
        container.textContent = "";
        for (const [meta, button] of buttons) {
            const child = UI.render(button);
            container.append(child);
            this.media.set(child, meta);
        }
    }
    async make_button(x) {
        const element = new UI.Button([
            (0, widget_1.h)("div", { class: "kate-os-media-thumbnail" }, [
                (0, widget_1.h)("img", { src: x.thumbnail_dataurl }, []),
                this.make_video_length(x.video_length),
            ]),
        ]).on_clicked(() => this.view(x));
        return element;
    }
    make_video_length(duration) {
        if (duration == null) {
            return null;
        }
        else {
            return (0, widget_1.h)("div", { class: "kate-os-video-duration" }, [
                this.format_duration(duration),
            ]);
        }
    }
    format_duration(n0) {
        const units = [
            [60, "mins"],
            [60, "hours"],
        ];
        let n = n0;
        let unit = "secs";
        for (const [span, new_unit] of units) {
            if (n >= span) {
                n = n / span;
                unit = new_unit;
            }
            else {
                break;
            }
        }
        return `${Math.round(n)} ${unit}`;
    }
    update_status(text) {
        this.canvas.querySelector(".kate-os-media-status").textContent = text;
    }
    handle_close = () => {
        this.os.pop_scene();
    };
    handle_view = () => {
        const current = this.os.focus_handler.current_focus;
        if (current != null) {
            const data = this.media.get(current);
            if (data != null) {
                this.view(data);
            }
        }
    };
    handle_key_pressed = (x) => {
        if (x.is_repeat) {
            return false;
        }
        switch (x.key) {
            case "x": {
                this.handle_close();
                return true;
            }
            case "o": {
                this.handle_view();
                return true;
            }
        }
        return false;
    };
    view = (x) => {
        const viewer = new view_media_1.SceneViewMedia(this.os, this, x);
        this.os.push_scene(viewer);
    };
    mark_deleted = (id) => {
        for (const [button, meta] of this.media) {
            if (meta.id === id) {
                if (button.classList.contains("focus")) {
                    const new_focus = button.previousElementSibling ?? button.nextElementSibling ?? null;
                    this.os.focus_handler.focus(new_focus);
                    button.remove();
                    this.media.delete(button);
                }
                break;
            }
        }
    };
}
exports.SceneMedia = SceneMedia;

});

// packages\kate-core\build\os\apps\view-media.js
require.define(39, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\view-media.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneViewMedia = void 0;
const widget_1 = require(34);
const UI = require(34);
const utils_1 = require(5);
const scenes_1 = require(35);
class SceneViewMedia extends scenes_1.Scene {
    media_list;
    media;
    url = null;
    constructor(os, media_list, media) {
        super(os);
        this.media_list = media_list;
        this.media = media;
    }
    render() {
        return (0, widget_1.h)("div", { class: "kate-os-media-fullscreen" }, [
            (0, widget_1.h)("div", { class: "kate-os-media-container" }, []),
            (0, widget_1.h)("div", { class: "kate-os-statusbar visible" }, [
                UI.icon_button("menu", "Options").on_clicked(this.handle_options),
                UI.icon_button("x", "Return").on_clicked(this.handle_close),
                this.media.kind === "video"
                    ? UI.icon_button("o", "Play/Pause").on_clicked(this.handle_play_pause)
                    : null,
            ]),
        ]);
    }
    async on_attached() {
        this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
        const file = await this.os.capture.read_file(this.media.id);
        const blob = new Blob([file.data], { type: file.mime });
        this.url = URL.createObjectURL(blob);
        this.render_media(this.url);
    }
    render_media(url) {
        switch (this.media.kind) {
            case "image": {
                this.render_image(url);
                break;
            }
            case "video": {
                this.render_video(url);
                break;
            }
            default:
                return null;
        }
    }
    get container() {
        return this.canvas.querySelector(".kate-os-media-container");
    }
    render_image(url) {
        const img = (0, widget_1.h)("img", { src: url, class: "kate-os-media-image" }, []);
        this.container.append(img);
    }
    render_video(url) {
        const player = (0, widget_1.h)("video", {
            src: url,
            class: "kate-os-media-video",
            autoplay: "autoplay",
            loop: "loop",
        }, []);
        this.container.append(player);
    }
    on_detached() {
        this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
        if (this.url != null) {
            URL.revokeObjectURL(this.url);
        }
    }
    handle_key_pressed = (x) => {
        if (x.is_repeat) {
            return false;
        }
        switch (x.key) {
            case "x": {
                this.handle_close();
                return true;
            }
            case "o": {
                this.handle_play_pause();
                return true;
            }
            case "menu": {
                this.handle_options();
                return true;
            }
        }
        return false;
    };
    handle_play_pause = () => {
        const video = this.canvas.querySelector("video");
        if (video != null) {
            if (video.paused || video.ended) {
                video.play();
            }
            else {
                video.pause();
            }
        }
    };
    handle_toggle_ui = () => {
        const status = this.canvas.querySelector(".kate-os-statusbar");
        status.classList.toggle("visible");
    };
    handle_options = async () => {
        const ui = this.canvas.querySelector(".kate-os-statusbar");
        const ui_visible = ui.classList.contains("visible");
        const result = await this.os.dialog.pop_menu("kate:media", "", [
            { label: "Delete", value: "delete" },
            {
                label: `${ui_visible ? "Hide" : "Show"} UI`,
                value: "toggle-ui",
            },
            { label: "Download", value: "download" },
        ], "close");
        switch (result) {
            case "toggle-ui": {
                this.handle_toggle_ui();
                break;
            }
            case "close": {
                break;
            }
            case "delete": {
                this.handle_delete();
                break;
            }
            case "download": {
                this.handle_download();
                break;
            }
            default:
                throw (0, utils_1.unreachable)(result);
        }
    };
    handle_delete = async () => {
        const should_delete = await this.os.dialog.confirm("kate:media", {
            title: "",
            message: "Delete this file? This is an irreversible operation.",
            ok: "Delete",
            cancel: "Keep file",
            dangerous: true,
        });
        if (should_delete) {
            await this.os.capture.delete(this.media.id);
            await this.os.notifications.push("kate:media", `Media deleted`, "");
            this.media_list.mark_deleted(this.media.id);
            this.os.pop_scene();
        }
    };
    handle_close = () => {
        this.os.pop_scene();
    };
    handle_download = () => {
        if (this.url == null) {
            return;
        }
        const extension = this.media.kind === "image" ? ".png" : ".webm";
        this.download_url(this.url, "kate-capture", extension);
    };
    async download_url(url, name, extension) {
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = `${name}${this.timestamp_string()}${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
    }
    timestamp_string() {
        const d = new Date();
        const f = (a) => String(a).padStart(2, "0");
        const date = `${d.getFullYear()}-${f(d.getMonth() + 1)}-${f(d.getDate())}`;
        const time = `${f(d.getHours())}-${f(d.getMinutes())}-${f(d.getSeconds())}`;
        return `${date}_${time}`;
    }
}
exports.SceneViewMedia = SceneViewMedia;

});

// packages\kate-core\build\os\apps\about-kate.js
require.define(40, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\about-kate.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneAboutKate = exports.bool_text = void 0;
const widget_1 = require(34);
const UI = require(34);
const Legal = require(41);
const text_file_1 = require(43);
const scenes_1 = require(35);
const utils_1 = require(5);
const release_notes = require(44);
function friendly_mode(mode) {
    switch (mode) {
        case "native":
            return "Native";
        case "single":
            return "Single Cartridge";
        case "web":
            return `Web App`;
    }
}
function bool_text(x) {
    switch (x) {
        case null:
            return "unknown";
        case true:
            return "Yes";
        case false:
            return "No";
    }
}
exports.bool_text = bool_text;
class SceneAboutKate extends scenes_1.Scene {
    kate_info() {
        const console = this.os.kernel.console;
        return {
            mode: friendly_mode(console.options.mode),
            version: console.version,
        };
    }
    async native_info() {
        return await KateNative.get_system_information();
    }
    async system_info() {
        const mode = this.os.kernel.console.options.mode;
        switch (mode) {
            case "native": {
                const info = await this.native_info();
                const ua = await (0, utils_1.user_agent_info)();
                const device = ua.mobile ? "Mobile" : "Other";
                return {
                    kate: this.kate_info(),
                    host: {
                        os: info.os.name,
                        browser: info.engine.map((x) => `${x.name} ${x.version}`),
                        device: device,
                        arm64_translation: info.os.arm64_translation,
                        architecture: info.os.architecture,
                    },
                    hardware: {
                        cpu_model: info.cpu.model,
                        cpu_logical_cores: info.cpu.logical_cores,
                        cpu_frequency: (0, utils_1.mhz_to_ghz)(info.cpu.speed),
                        memory: `${(0, utils_1.from_bytes)(info.memory.total)} (${(0, utils_1.from_bytes)(info.memory.free)} free)`,
                    },
                };
            }
            case "web": {
                const ua = await (0, utils_1.user_agent_info)();
                const device = ua.mobile ? "Mobile" : "Other";
                return {
                    kate: this.kate_info(),
                    host: {
                        os: `${ua.os.name} ${ua.os.version ?? ""}`,
                        browser: ua.engine.map((x) => `${x.name} ${x.version ?? ""}`),
                        device: device,
                        arm64_translation: ua.cpu.wow64 ?? null,
                        architecture: ua.cpu.architecture,
                    },
                    hardware: {
                        cpu_model: "unknown",
                        cpu_logical_cores: "unknown",
                        cpu_frequency: "unknown",
                        memory: "unknown",
                    },
                };
            }
            case "single": {
                const ua = (0, utils_1.basic_ua_details)();
                return {
                    kate: this.kate_info(),
                    host: {
                        os: ua.os.name ?? "unknown",
                        browser: ua.engine.map((x) => `${x.name} ${x.version ?? ""}`),
                        device: ua.mobile ? "Mobile" : "Other",
                        arm64_translation: null,
                        architecture: "unknown",
                    },
                    hardware: {
                        cpu_model: "unknown",
                        cpu_logical_cores: "unknown",
                        cpu_frequency: "unknown",
                        memory: "unknown",
                    },
                };
            }
        }
    }
    async render_sysinfo(canvas) {
        const x = await this.system_info();
        canvas.textContent = "";
        canvas.append(UI.legible_bg([
            (0, widget_1.h)("h2", {}, ["System"]),
            UI.info_line("Kate version", [x.kate.version]),
            UI.info_line("Kate mode", [x.kate.mode]),
            (0, widget_1.h)("h2", {}, ["Host"]),
            UI.info_line("Browser", [
                new UI.VBox(5, [...x.host.browser.map((x) => UI.h("div", {}, [x]))]),
            ]),
            UI.info_line("OS", [x.host.os]),
            UI.info_line("Architecture", [x.host.architecture]),
            UI.info_line("x64/ARM64 translation?", [
                bool_text(x.host.arm64_translation),
            ]),
            UI.info_line("Device", [x.host.device]),
            (0, widget_1.h)("h2", {}, ["Hardware"]),
            UI.info_line("CPU model", [x.hardware.cpu_model]),
            UI.info_line("CPU logical cores", [
                String(x.hardware.cpu_logical_cores),
            ]),
            UI.info_line("CPU frequency", [x.hardware.cpu_frequency]),
            UI.info_line("Memory", [x.hardware.memory]),
        ]));
    }
    render() {
        const sysinfo = (0, widget_1.h)("div", { class: "kate-os-system-information" }, []);
        this.render_sysinfo(sysinfo);
        const update_button = (0, widget_1.h)("div", { class: "kate-os-update-button" }, [
            (0, widget_1.h)("h2", {}, ["Updates"]),
            "Checking for updates...",
        ]);
        this.check_for_updates(update_button);
        return (0, widget_1.h)("div", { class: "kate-os-simple-screen" }, [
            new UI.Title_bar({
                left: UI.fragment([
                    UI.fa_icon("cat", "lg"),
                    new UI.Section_title(["About Kate"]),
                ]),
            }),
            (0, widget_1.h)("div", { class: "kate-os-scroll kate-os-content kate-about-bg" }, [
                (0, widget_1.h)("div", { class: "kate-os-about-box" }, [
                    (0, widget_1.h)("div", { class: "kate-os-about-content" }, [
                        (0, widget_1.h)("h2", {}, [
                            "Kate",
                            new UI.Space({ width: 10 }),
                            this.os.kernel.console.version,
                        ]),
                        (0, widget_1.h)("div", { class: "kt-meta" }, [
                            "Copyright (c) 2023 Q. (MIT licensed)",
                        ]),
                        new UI.Space({ height: 32 }),
                        new UI.VBox(10, [
                            new UI.Button(["Third-party notices"]).on_clicked(this.handle_third_party),
                            new UI.Button(["Release notes"]).on_clicked(this.handle_release_notes),
                        ]),
                        new UI.Space({ height: 24 }),
                        update_button,
                        new UI.Space({ height: 32 }),
                        sysinfo,
                    ]),
                ]),
            ]),
            (0, widget_1.h)("div", { class: "kate-os-statusbar" }, [
                UI.icon_button("x", "Return").on_clicked(this.handle_close),
            ]),
        ]);
    }
    on_attached() {
        this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    }
    on_detached() {
        this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
    }
    handle_key_pressed = (x) => {
        switch (x.key) {
            case "x": {
                if (!x.is_repeat) {
                    this.handle_close();
                    return true;
                }
            }
        }
        return false;
    };
    handle_close = () => {
        this.os.pop_scene();
    };
    handle_third_party = () => {
        this.os.push_scene(new text_file_1.SceneTextFile(this.os, "Legal Notices", "Kate", Legal.notice));
    };
    handle_release_notes = () => {
        this.os.push_scene(new text_file_1.SceneTextFile(this.os, "Release Notes", "Kate", release_notes));
    };
    async check_for_updates(container) {
        if (this.os.kernel.console.options.mode !== "web") {
            container.textContent = "";
            return;
        }
        const versions = (await fetch("/versions.json").then((x) => x.json()));
        const channel = localStorage["kate-channel"];
        const current = JSON.parse(localStorage["kate-version"]);
        const available = versions.versions.filter((x) => x.channels.includes(channel));
        if (available.length > 0) {
            const current_index = available.findIndex((x) => x.version === current.version) ?? 0;
            if (current_index < available.length - 1) {
                const latest = available.at(-1);
                container.textContent = "";
                container.append((0, widget_1.h)("div", {}, [
                    new UI.VBox(5, [
                        new UI.HBox(5, [
                            `Version ${latest.version} is available!`,
                            UI.link("(Release Notes)", {
                                on_click: () => this.handle_release_notes_for_version(latest),
                            }),
                        ]),
                        new UI.Button([`Update to ${latest.version}`]).on_clicked(() => {
                            this.handle_update_to_version(latest);
                        }),
                    ]),
                ]));
                return;
            }
        }
        container.textContent = "You're up to date!";
    }
    async handle_release_notes_for_version(version) {
        const text = await fetch(version.release_notes).then((x) => x.text());
        await this.os.push_scene(new text_file_1.SceneTextFile(this.os, `Release notes v${version.version}`, "Kate", text));
    }
    async handle_update_to_version(version) {
        const suffix = version.migration_needed
            ? "We'll need to update your storage to a new format, this may take a few minutes."
            : "";
        const should_update = await this.os.dialog.confirm("kate:update", {
            title: `Update to v${version.version}`,
            message: `The application will reload to complete the update. ${suffix}`,
            cancel: "Cancel",
            ok: "Update now",
        });
        if (should_update) {
            await this.os.notifications.log("kate:update", `Updated to v${version.version}`, "");
            localStorage["kate-version"] = JSON.stringify(version);
            window.location.reload();
        }
    }
}
exports.SceneAboutKate = SceneAboutKate;

});

// packages\kate-core\build\legal.js
require.define(41, "packages\\kate-core\\build", "packages\\kate-core\\build\\legal.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notice = void 0;
exports.notice = require(42);

});

// packages\kate-core\LICENCES.txt
require.define(42, "", "", (module, exports, __dirname, __filename) => {
  module.exports = "Kate is made possible thanks to the amazing work of other people\r\nshared under permissive licenses. The software and assets that\r\nmake up Kate are listed here.\r\n\r\nKate's original source code is itself released under the MIT\r\nlicense, and all original non-code assets it uses is released\r\nunder the CC0 1.0 Universal licence (essentially, they're\r\nin the public domain).\r\n\r\nSome of the UI sounds are currently generated with jsfxr.\r\n\r\nFull text for all relevant licenses are included here after\r\nattributions, in the goal of making them offline-friendly.\r\n\r\n_______________________________________________________________________________\r\n\r\n## Fonts:\r\n\r\nFont Awesome 6 Free (c) 2023 Fonticons, Inc. (https://fontawesome.com)\r\nLicensed under the SIL Open Font License (font files),\r\nCreative Commons 4.0 Attribution International license (icons), and\r\nMIT (CSS source code).\r\n\r\n---\r\n\r\nPoppins (c) 2020 The Poppins Project Authors\r\n(https://github.com/itfoundry/Poppins)\r\nLicensed under the SIL Open Font License.\r\n\r\n---\r\n\r\nRoboto and Roboto Mono (c) Google\r\n(https://fonts.google.com/specimen/Roboto/about)\r\nLicensed under the Apache License 2.0.\r\n\r\n_______________________________________________________________________________\r\n\r\n## Themes\r\n\r\nThe Candy Pop colour theme for Kate is based on a the Pollen8 palette\r\nby Conker (https://lospec.com/palette-list/pollen8)\r\n\r\n_______________________________________________________________________________\r\n\r\n## SIL Open Font License\r\n\r\nThis license is copied below, and is also available with a FAQ at:\r\nhttp://scripts.sil.org/OFL\r\n\r\n\r\n-----------------------------------------------------------\r\nSIL OPEN FONT LICENSE Version 1.1 - 26 February 2007\r\n-----------------------------------------------------------\r\n\r\nPREAMBLE\r\nThe goals of the Open Font License (OFL) are to stimulate worldwide\r\ndevelopment of collaborative font projects, to support the font creation\r\nefforts of academic and linguistic communities, and to provide a free and\r\nopen framework in which fonts may be shared and improved in partnership\r\nwith others.\r\n\r\nThe OFL allows the licensed fonts to be used, studied, modified and\r\nredistributed freely as long as they are not sold by themselves. The\r\nfonts, including any derivative works, can be bundled, embedded, \r\nredistributed and/or sold with any software provided that any reserved\r\nnames are not used by derivative works. The fonts and derivatives,\r\nhowever, cannot be released under any other type of license. The\r\nrequirement for fonts to remain under this license does not apply\r\nto any document created using the fonts or their derivatives.\r\n\r\nDEFINITIONS\r\n\"Font Software\" refers to the set of files released by the Copyright\r\nHolder(s) under this license and clearly marked as such. This may\r\ninclude source files, build scripts and documentation.\r\n\r\n\"Reserved Font Name\" refers to any names specified as such after the\r\ncopyright statement(s).\r\n\r\n\"Original Version\" refers to the collection of Font Software components as\r\ndistributed by the Copyright Holder(s).\r\n\r\n\"Modified Version\" refers to any derivative made by adding to, deleting,\r\nor substituting -- in part or in whole -- any of the components of the\r\nOriginal Version, by changing formats or by porting the Font Software to a\r\nnew environment.\r\n\r\n\"Author\" refers to any designer, engineer, programmer, technical\r\nwriter or other person who contributed to the Font Software.\r\n\r\nPERMISSION & CONDITIONS\r\nPermission is hereby granted, free of charge, to any person obtaining\r\na copy of the Font Software, to use, study, copy, merge, embed, modify,\r\nredistribute, and sell modified and unmodified copies of the Font\r\nSoftware, subject to the following conditions:\r\n\r\n1) Neither the Font Software nor any of its individual components,\r\nin Original or Modified Versions, may be sold by itself.\r\n\r\n2) Original or Modified Versions of the Font Software may be bundled,\r\nredistributed and/or sold with any software, provided that each copy\r\ncontains the above copyright notice and this license. These can be\r\nincluded either as stand-alone text files, human-readable headers or\r\nin the appropriate machine-readable metadata fields within text or\r\nbinary files as long as those fields can be easily viewed by the user.\r\n\r\n3) No Modified Version of the Font Software may use the Reserved Font\r\nName(s) unless explicit written permission is granted by the corresponding\r\nCopyright Holder. This restriction only applies to the primary font name as\r\npresented to the users.\r\n\r\n4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font\r\nSoftware shall not be used to promote, endorse or advertise any\r\nModified Version, except to acknowledge the contribution(s) of the\r\nCopyright Holder(s) and the Author(s) or with their explicit written\r\npermission.\r\n\r\n5) The Font Software, modified or unmodified, in part or in whole,\r\nmust be distributed entirely under this license, and must not be\r\ndistributed under any other license. The requirement for fonts to\r\nremain under this license does not apply to any document created\r\nusing the Font Software.\r\n\r\nTERMINATION\r\nThis license becomes null and void if any of the above conditions are\r\nnot met.\r\n\r\nDISCLAIMER\r\nTHE FONT SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND,\r\nEXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF\r\nMERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT\r\nOF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE\r\nCOPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,\r\nINCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL\r\nDAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING\r\nFROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM\r\nOTHER DEALINGS IN THE FONT SOFTWARE.\r\n\r\n_______________________________________________________________________________\r\n\r\n## Apache License 2.0\r\n\r\nApache License\r\nVersion 2.0, January 2004\r\nhttp://www.apache.org/licenses/\r\n\r\nTERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION\r\n\r\n1. Definitions.\r\n\r\n\"License\" shall mean the terms and conditions for use, reproduction,\r\nand distribution as defined by Sections 1 through 9 of this document.\r\n\r\n\"Licensor\" shall mean the copyright owner or entity authorized by\r\nthe copyright owner that is granting the License.\r\n\r\n\"Legal Entity\" shall mean the union of the acting entity and all\r\nother entities that control, are controlled by, or are under common\r\ncontrol with that entity. For the purposes of this definition,\r\n\"control\" means (i) the power, direct or indirect, to cause the\r\ndirection or management of such entity, whether by contract or\r\notherwise, or (ii) ownership of fifty percent (50%) or more of the\r\noutstanding shares, or (iii) beneficial ownership of such entity.\r\n\r\n\"You\" (or \"Your\") shall mean an individual or Legal Entity\r\nexercising permissions granted by this License.\r\n\r\n\"Source\" form shall mean the preferred form for making modifications,\r\nincluding but not limited to software source code, documentation\r\nsource, and configuration files.\r\n\r\n\"Object\" form shall mean any form resulting from mechanical\r\ntransformation or translation of a Source form, including but\r\nnot limited to compiled object code, generated documentation,\r\nand conversions to other media types.\r\n\r\n\"Work\" shall mean the work of authorship, whether in Source or\r\nObject form, made available under the License, as indicated by a\r\ncopyright notice that is included in or attached to the work\r\n(an example is provided in the Appendix below).\r\n\r\n\"Derivative Works\" shall mean any work, whether in Source or Object\r\nform, that is based on (or derived from) the Work and for which the\r\neditorial revisions, annotations, elaborations, or other modifications\r\nrepresent, as a whole, an original work of authorship. For the purposes\r\nof this License, Derivative Works shall not include works that remain\r\nseparable from, or merely link (or bind by name) to the interfaces of,\r\nthe Work and Derivative Works thereof.\r\n\r\n\"Contribution\" shall mean any work of authorship, including\r\nthe original version of the Work and any modifications or additions\r\nto that Work or Derivative Works thereof, that is intentionally\r\nsubmitted to Licensor for inclusion in the Work by the copyright owner\r\nor by an individual or Legal Entity authorized to submit on behalf of\r\nthe copyright owner. For the purposes of this definition, \"submitted\"\r\nmeans any form of electronic, verbal, or written communication sent\r\nto the Licensor or its representatives, including but not limited to\r\ncommunication on electronic mailing lists, source code control systems,\r\nand issue tracking systems that are managed by, or on behalf of, the\r\nLicensor for the purpose of discussing and improving the Work, but\r\nexcluding communication that is conspicuously marked or otherwise\r\ndesignated in writing by the copyright owner as \"Not a Contribution.\"\r\n\r\n\"Contributor\" shall mean Licensor and any individual or Legal Entity\r\non behalf of whom a Contribution has been received by Licensor and\r\nsubsequently incorporated within the Work.\r\n\r\n2. Grant of Copyright License. Subject to the terms and conditions of\r\nthis License, each Contributor hereby grants to You a perpetual,\r\nworldwide, non-exclusive, no-charge, royalty-free, irrevocable\r\ncopyright license to reproduce, prepare Derivative Works of,\r\npublicly display, publicly perform, sublicense, and distribute the\r\nWork and such Derivative Works in Source or Object form.\r\n\r\n3. Grant of Patent License. Subject to the terms and conditions of\r\nthis License, each Contributor hereby grants to You a perpetual,\r\nworldwide, non-exclusive, no-charge, royalty-free, irrevocable\r\n(except as stated in this section) patent license to make, have made,\r\nuse, offer to sell, sell, import, and otherwise transfer the Work,\r\nwhere such license applies only to those patent claims licensable\r\nby such Contributor that are necessarily infringed by their\r\nContribution(s) alone or by combination of their Contribution(s)\r\nwith the Work to which such Contribution(s) was submitted. If You\r\ninstitute patent litigation against any entity (including a\r\ncross-claim or counterclaim in a lawsuit) alleging that the Work\r\nor a Contribution incorporated within the Work constitutes direct\r\nor contributory patent infringement, then any patent licenses\r\ngranted to You under this License for that Work shall terminate\r\nas of the date such litigation is filed.\r\n\r\n4. Redistribution. You may reproduce and distribute copies of the\r\nWork or Derivative Works thereof in any medium, with or without\r\nmodifications, and in Source or Object form, provided that You\r\nmeet the following conditions:\r\n\r\n(a) You must give any other recipients of the Work or\r\nDerivative Works a copy of this License; and\r\n\r\n(b) You must cause any modified files to carry prominent notices\r\nstating that You changed the files; and\r\n\r\n(c) You must retain, in the Source form of any Derivative Works\r\nthat You distribute, all copyright, patent, trademark, and\r\nattribution notices from the Source form of the Work,\r\nexcluding those notices that do not pertain to any part of\r\nthe Derivative Works; and\r\n\r\n(d) If the Work includes a \"NOTICE\" text file as part of its\r\ndistribution, then any Derivative Works that You distribute must\r\ninclude a readable copy of the attribution notices contained\r\nwithin such NOTICE file, excluding those notices that do not\r\npertain to any part of the Derivative Works, in at least one\r\nof the following places: within a NOTICE text file distributed\r\nas part of the Derivative Works; within the Source form or\r\ndocumentation, if provided along with the Derivative Works; or,\r\nwithin a display generated by the Derivative Works, if and\r\nwherever such third-party notices normally appear. The contents\r\nof the NOTICE file are for informational purposes only and\r\ndo not modify the License. You may add Your own attribution\r\nnotices within Derivative Works that You distribute, alongside\r\nor as an addendum to the NOTICE text from the Work, provided\r\nthat such additional attribution notices cannot be construed\r\nas modifying the License.\r\n\r\nYou may add Your own copyright statement to Your modifications and\r\nmay provide additional or different license terms and conditions\r\nfor use, reproduction, or distribution of Your modifications, or\r\nfor any such Derivative Works as a whole, provided Your use,\r\nreproduction, and distribution of the Work otherwise complies with\r\nthe conditions stated in this License.\r\n\r\n5. Submission of Contributions. Unless You explicitly state otherwise,\r\nany Contribution intentionally submitted for inclusion in the Work\r\nby You to the Licensor shall be under the terms and conditions of\r\nthis License, without any additional terms or conditions.\r\nNotwithstanding the above, nothing herein shall supersede or modify\r\nthe terms of any separate license agreement you may have executed\r\nwith Licensor regarding such Contributions.\r\n\r\n6. Trademarks. This License does not grant permission to use the trade\r\nnames, trademarks, service marks, or product names of the Licensor,\r\nexcept as required for reasonable and customary use in describing the\r\norigin of the Work and reproducing the content of the NOTICE file.\r\n\r\n7. Disclaimer of Warranty. Unless required by applicable law or\r\nagreed to in writing, Licensor provides the Work (and each\r\nContributor provides its Contributions) on an \"AS IS\" BASIS,\r\nWITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or\r\nimplied, including, without limitation, any warranties or conditions\r\nof TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A\r\nPARTICULAR PURPOSE. You are solely responsible for determining the\r\nappropriateness of using or redistributing the Work and assume any\r\nrisks associated with Your exercise of permissions under this License.\r\n\r\n8. Limitation of Liability. In no event and under no legal theory,\r\nwhether in tort (including negligence), contract, or otherwise,\r\nunless required by applicable law (such as deliberate and grossly\r\nnegligent acts) or agreed to in writing, shall any Contributor be\r\nliable to You for damages, including any direct, indirect, special,\r\nincidental, or consequential damages of any character arising as a\r\nresult of this License or out of the use or inability to use the\r\nWork (including but not limited to damages for loss of goodwill,\r\nwork stoppage, computer failure or malfunction, or any and all\r\nother commercial damages or losses), even if such Contributor\r\nhas been advised of the possibility of such damages.\r\n\r\n9. Accepting Warranty or Additional Liability. While redistributing\r\nthe Work or Derivative Works thereof, You may choose to offer,\r\nand charge a fee for, acceptance of support, warranty, indemnity,\r\nor other liability obligations and/or rights consistent with this\r\nLicense. However, in accepting such obligations, You may act only\r\non Your own behalf and on Your sole responsibility, not on behalf\r\nof any other Contributor, and only if You agree to indemnify,\r\ndefend, and hold each Contributor harmless for any liability\r\nincurred by, or claims asserted against, such Contributor by reason\r\nof your accepting any such warranty or additional liability.\r\n\r\nEND OF TERMS AND CONDITIONS\r\n\r\nAPPENDIX: How to apply the Apache License to your work.\r\n\r\nTo apply the Apache License to your work, attach the following\r\nboilerplate notice, with the fields enclosed by brackets \"[]\"\r\nreplaced with your own identifying information. (Don't include\r\nthe brackets!)  The text should be enclosed in the appropriate\r\ncomment syntax for the file format. We also recommend that a\r\nfile or class name and description of purpose be included on the\r\nsame \"printed page\" as the copyright notice for easier\r\nidentification within third-party archives.\r\n\r\nCopyright [yyyy] [name of copyright owner]\r\n\r\nLicensed under the Apache License, Version 2.0 (the \"License\");\r\nyou may not use this file except in compliance with the License.\r\nYou may obtain a copy of the License at\r\n\r\nhttp://www.apache.org/licenses/LICENSE-2.0\r\n\r\nUnless required by applicable law or agreed to in writing, software\r\ndistributed under the License is distributed on an \"AS IS\" BASIS,\r\nWITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\nSee the License for the specific language governing permissions and\r\nlimitations under the License.\r\n\r\n_______________________________________________________________________________\r\n\r\n## Creative Commons 4.0 Attribution International\r\n\r\n## Creative Commons Attribution 4.0\r\n\r\nAttribution 4.0 International\r\n\r\n=======================================================================\r\n\r\nCreative Commons Corporation (\"Creative Commons\") is not a law firm and\r\ndoes not provide legal services or legal advice. Distribution of\r\nCreative Commons public licenses does not create a lawyer-client or\r\nother relationship. Creative Commons makes its licenses and related\r\ninformation available on an \"as-is\" basis. Creative Commons gives no\r\nwarranties regarding its licenses, any material licensed under their\r\nterms and conditions, or any related information. Creative Commons\r\ndisclaims all liability for damages resulting from their use to the\r\nfullest extent possible.\r\n\r\nUsing Creative Commons Public Licenses\r\n\r\nCreative Commons public licenses provide a standard set of terms and\r\nconditions that creators and other rights holders may use to share\r\noriginal works of authorship and other material subject to copyright\r\nand certain other rights specified in the public license below. The\r\nfollowing considerations are for informational purposes only, are not\r\nexhaustive, and do not form part of our licenses.\r\n\r\n     Considerations for licensors: Our public licenses are\r\n     intended for use by those authorized to give the public\r\n     permission to use material in ways otherwise restricted by\r\n     copyright and certain other rights. Our licenses are\r\n     irrevocable. Licensors should read and understand the terms\r\n     and conditions of the license they choose before applying it.\r\n     Licensors should also secure all rights necessary before\r\n     applying our licenses so that the public can reuse the\r\n     material as expected. Licensors should clearly mark any\r\n     material not subject to the license. This includes other CC-\r\n     licensed material, or material used under an exception or\r\n     limitation to copyright. More considerations for licensors:\r\n    wiki.creativecommons.org/Considerations_for_licensors\r\n\r\n     Considerations for the public: By using one of our public\r\n     licenses, a licensor grants the public permission to use the\r\n     licensed material under specified terms and conditions. If\r\n     the licensor's permission is not necessary for any reason--for\r\n     example, because of any applicable exception or limitation to\r\n     copyright--then that use is not regulated by the license. Our\r\n     licenses grant only permissions under copyright and certain\r\n     other rights that a licensor has authority to grant. Use of\r\n     the licensed material may still be restricted for other\r\n     reasons, including because others have copyright or other\r\n     rights in the material. A licensor may make special requests,\r\n     such as asking that all changes be marked or described.\r\n     Although not required by our licenses, you are encouraged to\r\n     respect those requests where reasonable. More considerations\r\n     for the public:\r\n    wiki.creativecommons.org/Considerations_for_licensees\r\n\r\n=======================================================================\r\n\r\nCreative Commons Attribution 4.0 International Public License\r\n\r\nBy exercising the Licensed Rights (defined below), You accept and agree\r\nto be bound by the terms and conditions of this Creative Commons\r\nAttribution 4.0 International Public License (\"Public License\"). To the\r\nextent this Public License may be interpreted as a contract, You are\r\ngranted the Licensed Rights in consideration of Your acceptance of\r\nthese terms and conditions, and the Licensor grants You such rights in\r\nconsideration of benefits the Licensor receives from making the\r\nLicensed Material available under these terms and conditions.\r\n\r\n\r\nSection 1 -- Definitions.\r\n\r\n  a. Adapted Material means material subject to Copyright and Similar\r\n     Rights that is derived from or based upon the Licensed Material\r\n     and in which the Licensed Material is translated, altered,\r\n     arranged, transformed, or otherwise modified in a manner requiring\r\n     permission under the Copyright and Similar Rights held by the\r\n     Licensor. For purposes of this Public License, where the Licensed\r\n     Material is a musical work, performance, or sound recording,\r\n     Adapted Material is always produced where the Licensed Material is\r\n     synched in timed relation with a moving image.\r\n\r\n  b. Adapter's License means the license You apply to Your Copyright\r\n     and Similar Rights in Your contributions to Adapted Material in\r\n     accordance with the terms and conditions of this Public License.\r\n\r\n  c. Copyright and Similar Rights means copyright and/or similar rights\r\n     closely related to copyright including, without limitation,\r\n     performance, broadcast, sound recording, and Sui Generis Database\r\n     Rights, without regard to how the rights are labeled or\r\n     categorized. For purposes of this Public License, the rights\r\n     specified in Section 2(b)(1)-(2) are not Copyright and Similar\r\n     Rights.\r\n\r\n  d. Effective Technological Measures means those measures that, in the\r\n     absence of proper authority, may not be circumvented under laws\r\n     fulfilling obligations under Article 11 of the WIPO Copyright\r\n     Treaty adopted on December 20, 1996, and/or similar international\r\n     agreements.\r\n\r\n  e. Exceptions and Limitations means fair use, fair dealing, and/or\r\n     any other exception or limitation to Copyright and Similar Rights\r\n     that applies to Your use of the Licensed Material.\r\n\r\n  f. Licensed Material means the artistic or literary work, database,\r\n     or other material to which the Licensor applied this Public\r\n     License.\r\n\r\n  g. Licensed Rights means the rights granted to You subject to the\r\n     terms and conditions of this Public License, which are limited to\r\n     all Copyright and Similar Rights that apply to Your use of the\r\n     Licensed Material and that the Licensor has authority to license.\r\n\r\n  h. Licensor means the individual(s) or entity(ies) granting rights\r\n     under this Public License.\r\n\r\n  i. Share means to provide material to the public by any means or\r\n     process that requires permission under the Licensed Rights, such\r\n     as reproduction, public display, public performance, distribution,\r\n     dissemination, communication, or importation, and to make material\r\n     available to the public including in ways that members of the\r\n     public may access the material from a place and at a time\r\n     individually chosen by them.\r\n\r\n  j. Sui Generis Database Rights means rights other than copyright\r\n     resulting from Directive 96/9/EC of the European Parliament and of\r\n     the Council of 11 March 1996 on the legal protection of databases,\r\n     as amended and/or succeeded, as well as other essentially\r\n     equivalent rights anywhere in the world.\r\n\r\n  k. You means the individual or entity exercising the Licensed Rights\r\n     under this Public License. Your has a corresponding meaning.\r\n\r\n\r\nSection 2 -- Scope.\r\n\r\n  a. License grant.\r\n\r\n       1. Subject to the terms and conditions of this Public License,\r\n          the Licensor hereby grants You a worldwide, royalty-free,\r\n          non-sublicensable, non-exclusive, irrevocable license to\r\n          exercise the Licensed Rights in the Licensed Material to:\r\n\r\n            a. reproduce and Share the Licensed Material, in whole or\r\n               in part; and\r\n\r\n            b. produce, reproduce, and Share Adapted Material.\r\n\r\n       2. Exceptions and Limitations. For the avoidance of doubt, where\r\n          Exceptions and Limitations apply to Your use, this Public\r\n          License does not apply, and You do not need to comply with\r\n          its terms and conditions.\r\n\r\n       3. Term. The term of this Public License is specified in Section\r\n          6(a).\r\n\r\n       4. Media and formats; technical modifications allowed. The\r\n          Licensor authorizes You to exercise the Licensed Rights in\r\n          all media and formats whether now known or hereafter created,\r\n          and to make technical modifications necessary to do so. The\r\n          Licensor waives and/or agrees not to assert any right or\r\n          authority to forbid You from making technical modifications\r\n          necessary to exercise the Licensed Rights, including\r\n          technical modifications necessary to circumvent Effective\r\n          Technological Measures. For purposes of this Public License,\r\n          simply making modifications authorized by this Section 2(a)\r\n          (4) never produces Adapted Material.\r\n\r\n       5. Downstream recipients.\r\n\r\n            a. Offer from the Licensor -- Licensed Material. Every\r\n               recipient of the Licensed Material automatically\r\n               receives an offer from the Licensor to exercise the\r\n               Licensed Rights under the terms and conditions of this\r\n               Public License.\r\n\r\n            b. No downstream restrictions. You may not offer or impose\r\n               any additional or different terms or conditions on, or\r\n               apply any Effective Technological Measures to, the\r\n               Licensed Material if doing so restricts exercise of the\r\n               Licensed Rights by any recipient of the Licensed\r\n               Material.\r\n\r\n       6. No endorsement. Nothing in this Public License constitutes or\r\n          may be construed as permission to assert or imply that You\r\n          are, or that Your use of the Licensed Material is, connected\r\n          with, or sponsored, endorsed, or granted official status by,\r\n          the Licensor or others designated to receive attribution as\r\n          provided in Section 3(a)(1)(A)(i).\r\n\r\n  b. Other rights.\r\n\r\n       1. Moral rights, such as the right of integrity, are not\r\n          licensed under this Public License, nor are publicity,\r\n          privacy, and/or other similar personality rights; however, to\r\n          the extent possible, the Licensor waives and/or agrees not to\r\n          assert any such rights held by the Licensor to the limited\r\n          extent necessary to allow You to exercise the Licensed\r\n          Rights, but not otherwise.\r\n\r\n       2. Patent and trademark rights are not licensed under this\r\n          Public License.\r\n\r\n       3. To the extent possible, the Licensor waives any right to\r\n          collect royalties from You for the exercise of the Licensed\r\n          Rights, whether directly or through a collecting society\r\n          under any voluntary or waivable statutory or compulsory\r\n          licensing scheme. In all other cases the Licensor expressly\r\n          reserves any right to collect such royalties.\r\n\r\n\r\nSection 3 -- License Conditions.\r\n\r\nYour exercise of the Licensed Rights is expressly made subject to the\r\nfollowing conditions.\r\n\r\n  a. Attribution.\r\n\r\n       1. If You Share the Licensed Material (including in modified\r\n          form), You must:\r\n\r\n            a. retain the following if it is supplied by the Licensor\r\n               with the Licensed Material:\r\n\r\n                 i. identification of the creator(s) of the Licensed\r\n                    Material and any others designated to receive\r\n                    attribution, in any reasonable manner requested by\r\n                    the Licensor (including by pseudonym if\r\n                    designated);\r\n\r\n                ii. a copyright notice;\r\n\r\n               iii. a notice that refers to this Public License;\r\n\r\n                iv. a notice that refers to the disclaimer of\r\n                    warranties;\r\n\r\n                 v. a URI or hyperlink to the Licensed Material to the\r\n                    extent reasonably practicable;\r\n\r\n            b. indicate if You modified the Licensed Material and\r\n               retain an indication of any previous modifications; and\r\n\r\n            c. indicate the Licensed Material is licensed under this\r\n               Public License, and include the text of, or the URI or\r\n               hyperlink to, this Public License.\r\n\r\n       2. You may satisfy the conditions in Section 3(a)(1) in any\r\n          reasonable manner based on the medium, means, and context in\r\n          which You Share the Licensed Material. For example, it may be\r\n          reasonable to satisfy the conditions by providing a URI or\r\n          hyperlink to a resource that includes the required\r\n          information.\r\n\r\n       3. If requested by the Licensor, You must remove any of the\r\n          information required by Section 3(a)(1)(A) to the extent\r\n          reasonably practicable.\r\n\r\n       4. If You Share Adapted Material You produce, the Adapter's\r\n          License You apply must not prevent recipients of the Adapted\r\n          Material from complying with this Public License.\r\n\r\n\r\nSection 4 -- Sui Generis Database Rights.\r\n\r\nWhere the Licensed Rights include Sui Generis Database Rights that\r\napply to Your use of the Licensed Material:\r\n\r\n  a. for the avoidance of doubt, Section 2(a)(1) grants You the right\r\n     to extract, reuse, reproduce, and Share all or a substantial\r\n     portion of the contents of the database;\r\n\r\n  b. if You include all or a substantial portion of the database\r\n     contents in a database in which You have Sui Generis Database\r\n     Rights, then the database in which You have Sui Generis Database\r\n     Rights (but not its individual contents) is Adapted Material; and\r\n\r\n  c. You must comply with the conditions in Section 3(a) if You Share\r\n     all or a substantial portion of the contents of the database.\r\n\r\nFor the avoidance of doubt, this Section 4 supplements and does not\r\nreplace Your obligations under this Public License where the Licensed\r\nRights include other Copyright and Similar Rights.\r\n\r\n\r\nSection 5 -- Disclaimer of Warranties and Limitation of Liability.\r\n\r\n  a. UNLESS OTHERWISE SEPARATELY UNDERTAKEN BY THE LICENSOR, TO THE\r\n     EXTENT POSSIBLE, THE LICENSOR OFFERS THE LICENSED MATERIAL AS-IS\r\n     AND AS-AVAILABLE, AND MAKES NO REPRESENTATIONS OR WARRANTIES OF\r\n     ANY KIND CONCERNING THE LICENSED MATERIAL, WHETHER EXPRESS,\r\n     IMPLIED, STATUTORY, OR OTHER. THIS INCLUDES, WITHOUT LIMITATION,\r\n     WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR\r\n     PURPOSE, NON-INFRINGEMENT, ABSENCE OF LATENT OR OTHER DEFECTS,\r\n     ACCURACY, OR THE PRESENCE OR ABSENCE OF ERRORS, WHETHER OR NOT\r\n     KNOWN OR DISCOVERABLE. WHERE DISCLAIMERS OF WARRANTIES ARE NOT\r\n     ALLOWED IN FULL OR IN PART, THIS DISCLAIMER MAY NOT APPLY TO YOU.\r\n\r\n  b. TO THE EXTENT POSSIBLE, IN NO EVENT WILL THE LICENSOR BE LIABLE\r\n     TO YOU ON ANY LEGAL THEORY (INCLUDING, WITHOUT LIMITATION,\r\n     NEGLIGENCE) OR OTHERWISE FOR ANY DIRECT, SPECIAL, INDIRECT,\r\n     INCIDENTAL, CONSEQUENTIAL, PUNITIVE, EXEMPLARY, OR OTHER LOSSES,\r\n     COSTS, EXPENSES, OR DAMAGES ARISING OUT OF THIS PUBLIC LICENSE OR\r\n     USE OF THE LICENSED MATERIAL, EVEN IF THE LICENSOR HAS BEEN\r\n     ADVISED OF THE POSSIBILITY OF SUCH LOSSES, COSTS, EXPENSES, OR\r\n     DAMAGES. WHERE A LIMITATION OF LIABILITY IS NOT ALLOWED IN FULL OR\r\n     IN PART, THIS LIMITATION MAY NOT APPLY TO YOU.\r\n\r\n  c. The disclaimer of warranties and limitation of liability provided\r\n     above shall be interpreted in a manner that, to the extent\r\n     possible, most closely approximates an absolute disclaimer and\r\n     waiver of all liability.\r\n\r\n\r\nSection 6 -- Term and Termination.\r\n\r\n  a. This Public License applies for the term of the Copyright and\r\n     Similar Rights licensed here. However, if You fail to comply with\r\n     this Public License, then Your rights under this Public License\r\n     terminate automatically.\r\n\r\n  b. Where Your right to use the Licensed Material has terminated under\r\n     Section 6(a), it reinstates:\r\n\r\n       1. automatically as of the date the violation is cured, provided\r\n          it is cured within 30 days of Your discovery of the\r\n          violation; or\r\n\r\n       2. upon express reinstatement by the Licensor.\r\n\r\n     For the avoidance of doubt, this Section 6(b) does not affect any\r\n     right the Licensor may have to seek remedies for Your violations\r\n     of this Public License.\r\n\r\n  c. For the avoidance of doubt, the Licensor may also offer the\r\n     Licensed Material under separate terms or conditions or stop\r\n     distributing the Licensed Material at any time; however, doing so\r\n     will not terminate this Public License.\r\n\r\n  d. Sections 1, 5, 6, 7, and 8 survive termination of this Public\r\n     License.\r\n\r\n\r\nSection 7 -- Other Terms and Conditions.\r\n\r\n  a. The Licensor shall not be bound by any additional or different\r\n     terms or conditions communicated by You unless expressly agreed.\r\n\r\n  b. Any arrangements, understandings, or agreements regarding the\r\n     Licensed Material not stated herein are separate from and\r\n     independent of the terms and conditions of this Public License.\r\n\r\n\r\nSection 8 -- Interpretation.\r\n\r\n  a. For the avoidance of doubt, this Public License does not, and\r\n     shall not be interpreted to, reduce, limit, restrict, or impose\r\n     conditions on any use of the Licensed Material that could lawfully\r\n     be made without permission under this Public License.\r\n\r\n  b. To the extent possible, if any provision of this Public License is\r\n     deemed unenforceable, it shall be automatically reformed to the\r\n     minimum extent necessary to make it enforceable. If the provision\r\n     cannot be reformed, it shall be severed from this Public License\r\n     without affecting the enforceability of the remaining terms and\r\n     conditions.\r\n\r\n  c. No term or condition of this Public License will be waived and no\r\n     failure to comply consented to unless expressly agreed to by the\r\n     Licensor.\r\n\r\n  d. Nothing in this Public License constitutes or may be interpreted\r\n     as a limitation upon, or waiver of, any privileges and immunities\r\n     that apply to the Licensor or You, including from the legal\r\n     processes of any jurisdiction or authority.\r\n\r\n\r\n=======================================================================\r\n\r\nCreative Commons is not a party to its public\r\nlicenses. Notwithstanding, Creative Commons may elect to apply one of\r\nits public licenses to material it publishes and in those instances\r\nwill be considered the “Licensor.” The text of the Creative Commons\r\npublic licenses is dedicated to the public domain under the CC0 Public\r\nDomain Dedication. Except for the limited purpose of indicating that\r\nmaterial is shared under a Creative Commons public license or as\r\notherwise permitted by the Creative Commons policies published at\r\ncreativecommons.org/policies, Creative Commons does not authorize the\r\nuse of the trademark \"Creative Commons\" or any other trademark or logo\r\nof Creative Commons without its prior written consent including,\r\nwithout limitation, in connection with any unauthorized modifications\r\nto any of its public licenses or any other arrangements,\r\nunderstandings, or agreements concerning use of licensed material. For\r\nthe avoidance of doubt, this paragraph does not form part of the\r\npublic licenses.\r\n\r\nCreative Commons may be contacted at creativecommons.org.\r\n\r\n_______________________________________________________________________________\r\n\r\n## MIT Licence\r\n\r\nPermission is hereby granted, free of charge, to any person obtaining\r\na copy of this software and associated documentation files (the \"Software\"),\r\nto deal in the Software without restriction, including without limitation\r\nthe rights to use, copy, modify, merge, publish, distribute, sublicense,\r\nand/or sell copies of the Software, and to permit persons to whom the\r\nSoftware is furnished to do so, subject to the following conditions:\r\n\r\nThe above copyright notice and this permission notice shall be\r\nincluded in all copies or substantial portions of the Software.\r\n\r\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\r\nOR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\r\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL\r\nTHE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\r\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\r\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\r\nTHE SOFTWARE."
})

// packages\kate-core\build\os\apps\text-file.js
require.define(43, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\text-file.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneTextFile = void 0;
const widget_1 = require(34);
const UI = require(34);
const scenes_1 = require(35);
class SceneTextFile extends scenes_1.Scene {
    title;
    app_title;
    text;
    constructor(os, title, app_title, text) {
        super(os);
        this.title = title;
        this.app_title = app_title;
        this.text = text;
    }
    render() {
        return (0, widget_1.h)("div", { class: "kate-os-simple-screen" }, [
            new UI.Title_bar({
                left: UI.fragment([
                    UI.fa_icon("circle-info", "lg"),
                    new UI.Section_title([this.title]),
                ]),
                right: this.app_title,
            }),
            (0, widget_1.h)("div", { class: "kate-os-text-scroll" }, [
                (0, widget_1.h)("div", { class: "kate-os-padding" }, [this.text]),
            ]),
            (0, widget_1.h)("div", { class: "kate-os-statusbar" }, [
                UI.icon_button("x", "Return").on_clicked(this.handle_close),
            ]),
        ]);
    }
    on_attached() {
        this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    }
    on_detached() {
        this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
    }
    handle_key_pressed = (x) => {
        const scroll = this.canvas.querySelector(".kate-os-text-scroll");
        if (scroll == null) {
            return false;
        }
        switch (x.key) {
            case "up": {
                scroll.scrollBy({ top: -350, behavior: "smooth" });
                return true;
            }
            case "down": {
                scroll.scrollBy({ top: 350, behavior: "smooth" });
                return true;
            }
            case "x": {
                if (!x.is_repeat) {
                    this.handle_close();
                    return true;
                }
            }
        }
        return false;
    };
    handle_close = () => {
        this.os.pop_scene();
    };
}
exports.SceneTextFile = SceneTextFile;

});

// packages\kate-core\RELEASE.txt
require.define(44, "", "", (module, exports, __dirname, __filename) => {
  module.exports = "=======================================================================\r\nKate v0.23.4  (April 2023)\r\n=======================================================================\r\n\r\nThe v0.23.4 is April's experimental release of Kate, including a\r\nhandful of bugfixes, some new features, and a database redesign\r\n(a breaking change).\r\n\r\n\r\nUI redesign & code simplifications\r\n----------------------------------\r\n\r\nThis version has a minor UI redesign including more playful\r\nsans-serif fonts and a more pervasive use of button hints in the\r\nstatus bar. There's now some audio feedback for keyboard/gamepad\r\nactions and a more consistent handling of \"X\" as a \"go back\" button.\r\n\r\nCustom themes are going to land sometime later this year, there's\r\nstill some work needed on how they're going to be distributed, and\r\nhow to divide up capabilities in themming (e.g.: allowing people to\r\ninstall CSS files directly is too dangerous, since Kate relies\r\nheavily on having specific visual cues for security).\r\n\r\nThere's been quite a lot of work in simplifying parts of the code,\r\nsuch as focus handling and game/OS scene handling. Though the code\r\nis still very much experimental, this should make management a\r\nlittle bit easier.\r\n\r\n\r\nScreen capture & Media gallery\r\n------------------------------\r\n\r\nThere's support for taking screenshots and capturing videos of\r\ngameplay from an installed cartridge. The cartridge must indicate\r\nits intention of being captured by registering an HTML Canvas element\r\nwith the Kate Capture API.\r\n\r\nScreenshots have audio feedback, screen recording has a visual\r\nfeedback in the form of a little recording icon in the active\r\nresources area. Recording can be started by holding the Capture\r\nbutton for a second, and stopped by holding the Capture button\r\nfor a second again.\r\n\r\n\r\nIn-game legal notices\r\n---------------------\r\n\r\nGames, and indie games in particular, generally include content (such\r\nas code or assets) that have been developed by a third party, and made\r\navailable under some sort of licence. Developers need to provide\r\nsufficiently visible notices of these licences, which is a bit trickier\r\nwhen you ship a binary cartridge around.\r\n\r\nThis version of Kate adds support to including a text file that\r\ncollects all these licences into a single place, and can be displayed\r\nto the user in a regular KateOS screen, which is similar to how other\r\nhand-held consoles handle the issue, and should fulfill the legal\r\nrequirements of shipping licences in a readable format with your\r\nbinary distribution.\r\n\r\n\r\nStorage and memory usage improvements\r\n-------------------------------------\r\n\r\nCartridges are now unpacked in the IndexedDB storage, which means that\r\ncartridge binary changes do not affect already installed cartridges.\r\n\r\nBesides that, this has the benefit of improving memory usage for\r\ninstalled cartridges, as the game does not need to keep all of the\r\nfiles in memory while running. For games with a larger size, this\r\nshould allow a little smoother playing, as long as individual files\r\nhave reasonable sizes as well.\r\n\r\nWhile reading files has an added latency because of this, files are\r\nstill loaded from local storage, so it should be fast enough for most\r\nuse cases.\r\n\r\n\r\nNew ObjectStorage API\r\n---------------------\r\n\r\nThis version adds a new ObjectStorage API, which is a key/value store\r\nwith enforced quota. This should allow cartridges to serialise save\r\ndata while protecting users from malicious cartridges trying to\r\noverload the device's storage.\r\n\r\nEach cartridge gets 32MB of storage in the object store. There will\r\nbe a capability to request more storage in future versions, but for\r\nnow this should be enough for most save data use cases.\r\n\r\nNote that the ObjectStorage API does not protect against degrading\r\nthe device storage by abusing writes. That's something that may be\r\nlooked into for future versions.\r\n\r\n\r\nA new JS packaging tool\r\n-----------------------\r\n\r\nThis version does away with Browserify as a way of packaging Kate code\r\nand introduces a new tool, Glomp, which handles packaging JavaScript\r\n(and other web files) in a simplified manner.\r\n\r\nThis was a requirement for improving Kate security, as Browserify is\r\ntoo large to manually audit, and it injects packages arbitrarily in the\r\noutput.\r\n\r\nGlomp is not yet verified, and it does not handle mal-formed JavaScript;\r\nthose are the next steps before a stable release of Kate.\r\n\r\n\r\nLoading images in HTML entry-point\r\n----------------------------------\r\n\r\nImages included in the HTML entry-point are now loaded while sandboxing\r\nthe HTML page, so they should work in the same way as images\r\ndynamically loaded. Paths still need to point to a valid cartridge file\r\npath (e.g.: `/images/loading.png`)\r\n\r\n\r\nActive Resources Area\r\n---------------------\r\n\r\nIt's hard to know what applications are doing sometimes. Previously\r\nKate distinguished between trusted/untrusted prompts (like confirmation\r\ndialogs and menus) by showing a red border around the screen. But that\r\ndoesn't work for things like \"this game is using my microphone\".\r\n\r\nThis version of Kate introduces the \"Active Resources Area\", a small\r\ndisplay of icons to the right of the \"= KATE =\" engraving in the\r\nemulator that shows which special resources the current application\r\nor game is using.\r\n\r\nCurrently this is used to display the use of screen recording\r\n(a small red bullet is displayed), or the lack of persistent storage\r\n(a hard drive with a clock is displayed).\r\n\r\nLack of persistent storage here means that data stored in Kate is\r\nstored in a \"best effort\" manner, where the browser might delete it\r\nif the device is running out of space. This should only be an issue\r\nwhen using Kate online, without having it installed as a WebApp.\r\n\r\n\r\nPlaying habits\r\n--------------\r\n\r\nThis version of Kate now collects small playing habit data by default,\r\nmeaning that we store locally when a cartridge was last played, and\r\nhow much time in total was spent in each cartridge. There's a new\r\nsettings screen where this feature can be turned off, and collected\r\ndata both visualised and deleted.\r\n\r\nThe last_played data is used to sort entries in the Home screen. The\r\ntotal play times are not currently used for anything, just available\r\nlocally.\r\n\r\n\r\nPinned versions on the web\r\n--------------------------\r\n\r\nThe web version of the Kate emulator no longer updates automatically.\r\nWe record what version you're running, and offer the option to update\r\nat your leisure from the About Kate screen.\r\n\r\nThis is needed because, since all data is stored locally, some upgrades\r\nrequire updating the local data due to format changes, and these\r\nupdates can run for a few minutes if you have a lot of data. Having\r\nthe player initiate these updates means less surprises when they're\r\njust trying to play something.\r\n\r\nThis also gives players a chance of reviewing what has changed between\r\nthe current version and the new one."
})

// packages\kate-core\build\os\apps\settings\index.js
require.define(45, "packages\\kate-core\\build\\os\\apps\\settings", "packages\\kate-core\\build\\os\\apps\\settings\\index.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneSettings = void 0;
const UI = require(46);
const play_habits_1 = require(47);
const recovery_1 = require(48);
class SceneSettings extends UI.SimpleScene {
    icon = "gear";
    title = ["Settings"];
    body() {
        return [
            UI.link_card({
                icon: "gamepad",
                title: "Play habits",
                description: "Recently played and play time",
                on_click: () => {
                    this.os.push_scene(new play_habits_1.ScenePlayHabits(this.os));
                },
            }),
            UI.link_card({
                icon: "stethoscope",
                title: "Diagnostics & Recovery",
                description: "Troubleshoot and reset parts of the console",
                on_click: () => {
                    this.os.push_scene(new recovery_1.SceneRecovery(this.os));
                },
            }),
        ];
    }
}
exports.SceneSettings = SceneSettings;

});

// packages\kate-core\build\os\ui\index.js
require.define(46, "packages\\kate-core\\build\\os\\ui", "packages\\kate-core\\build\\os\\ui\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(34), exports);
__exportStar(require(35), exports);

});

// packages\kate-core\build\os\apps\settings\play-habits.js
require.define(47, "packages\\kate-core\\build\\os\\apps\\settings", "packages\\kate-core\\build\\os\\apps\\settings\\play-habits.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenePlayHabits = void 0;
const UI = require(46);
class ScenePlayHabits extends UI.SimpleScene {
    icon = "gamepad";
    title = ["Play habits"];
    body() {
        const data = this.os.settings.get("play_habits");
        const play_habit_list = UI.h("div", { class: "play-habit-history" }, []);
        this.load_history(play_habit_list);
        return [
            UI.p([
                `Kate stores, locally, data about the cartridges you play to
        support filtering and sorting them in the library by recency
        and usage.`,
            ]),
            UI.p([
                `You can disable collection of this data here, and also remove
         any previously collected data.`,
            ]),
            new UI.Space({ height: 32 }),
            UI.info_cell(UI.text_panel({
                title: "Last played time",
                description: "Record the last time you played a cartridge.",
            }), [
                UI.toggle(data.recently_played, {
                    on_changed: this.handle_last_played_change,
                }),
            ]),
            UI.info_cell(UI.text_panel({
                title: "Total play time",
                description: "Record how many minutes you've played a cartridge.",
            }), [
                UI.toggle(data.play_times, {
                    on_changed: this.handle_play_time_change,
                }),
            ]),
            new UI.Space({ height: 16 }),
            new UI.Button(["Delete all stored play habits"]).on_clicked(this.handle_delete),
            new UI.Space({ height: 32 }),
            UI.h("h2", {}, ["Stored play habits"]),
            play_habit_list,
        ];
    }
    async load_history(container) {
        container.textContent = "";
        const items = [];
        const history = await this.os.cart_manager.habit_history();
        for (const entry of history) {
            items.push(UI.focusable_container([
                UI.text_panel({
                    title: UI.fragment([
                        entry.title,
                        entry.installed
                            ? null
                            : UI.h("em", { style: "margin-left: 8px" }, [
                                "(not installed)",
                            ]),
                    ]),
                    description: UI.fragment([
                        entry.play_time === 0
                            ? "No total play time recorded"
                            : `Played for ${coarse_play_time(entry.play_time)}`,
                        UI.h("br", {}, []),
                        entry.last_played === null
                            ? "No play date recorded"
                            : `Last played ${relative_play_date(entry.last_played)}`,
                    ]),
                }),
            ]));
        }
        UI.append(new UI.VBox(20, [...items]), container);
    }
    handle_delete = async () => {
        const should_delete = await this.os.dialog.confirm("kate:settings", {
            title: "Delete stored playing habits?",
            message: `Recorded total play times and last play time will be deleted
                for all cartridges. This is an irreversible operation.`,
            cancel: "Keep data",
            ok: "Delete all play habits",
            dangerous: true,
        });
        if (should_delete) {
            await this.os.cart_manager.delete_play_habits();
            await this.load_history(this.canvas.querySelector(".play-habit-history"));
        }
    };
    handle_last_played_change = async (x) => {
        await this.os.settings.update("play_habits", (v) => ({
            ...v,
            recently_played: x,
        }));
        await this.os.notifications.log(`kate:settings`, "Updated play habits", `Store cartridge's last played time: ${x}`);
    };
    handle_play_time_change = async (x) => {
        await this.os.settings.update("play_habits", (v) => ({
            ...v,
            play_times: x,
        }));
        await this.os.notifications.log(`kate:settings`, "Updated play habits", `Store cartridge's total play time: ${x}`);
    };
}
exports.ScenePlayHabits = ScenePlayHabits;
function coarse_play_time(x) {
    const second_threshold = 1_000 * 60; // 1 minute
    const minute_threshold = 1_000 * 60 * 15; // 15 minutes
    const hour_threshold = 1_000 * 60 * 60; // 1 hour
    if (x < second_threshold) {
        return "a little while";
    }
    else if (x < minute_threshold) {
        return "a few minutes";
    }
    else if (x < hour_threshold) {
        return `${Math.round(x / (1_000 * 60))} minutes`;
    }
    else {
        return plural(Math.round(x / hour_threshold), (_) => "1 hour", (n) => `${n} hours`);
    }
}
function relative_play_date(x) {
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
        else if (year === now.getFullYear() &&
            month === now.getMonth() &&
            date === now.getDate()) {
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
function plural(n, single, plural) {
    if (n === 0) {
        return single(String(n));
    }
    else {
        return plural(String(n));
    }
}

});

// packages\kate-core\build\os\apps\settings\recovery.js
require.define(48, "packages\\kate-core\\build\\os\\apps\\settings", "packages\\kate-core\\build\\os\\apps\\settings\\recovery.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneRecovery = void 0;
const UI = require(46);
class SceneRecovery extends UI.SimpleScene {
    icon = "stethoscope";
    title = ["Diagnostics & Recovery"];
    body() {
        return [
            UI.p([
                `
        If you're having issues with the Kate emulator, resetting the emulator might help.
      `,
            ]),
            UI.vspace(16),
            UI.button("Restore default settings", {
                on_clicked: this.restore_default_settings,
            }),
            UI.p([`Switch all settings back to the default ones.`]),
            UI.vdivider(),
            UI.button("Delete all data", { on_clicked: this.delete_all_data }),
            UI.p([
                `Delete ALL data locally stored in the console. The application will reload
        afterwards.`,
            ]),
        ];
    }
    restore_default_settings = async () => {
        await this.os.dialog.progress("kate:recovery", "Restoring default settings", async (progress) => {
            await this.os.settings.reset_to_defaults();
        });
        await this.os.dialog.message("kate:recovery", {
            title: "",
            message: "All settings reverted to defaults.",
        });
    };
    delete_all_data = async () => {
        try {
            await this.os.dialog.progress("kate:recovery", "Removing all console data", async (progress) => {
                await this.os.db.delete_database();
                delete localStorage["kate-version"];
                delete localStorage["kate-channel"];
            });
            location.reload();
        }
        catch (error) {
            console.error(`[Kate] failed to factory reset:`, error);
            await this.os.dialog.message("kate:recovery", {
                title: "Failed to remove data",
                message: `Kate's local data could not be removed.`,
            });
        }
    };
}
exports.SceneRecovery = SceneRecovery;

});

// packages\kate-core\build\os\apps\load-screen.js
require.define(49, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\load-screen.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_LoadIndicator = void 0;
const widget_1 = require(34);
const scenes_1 = require(35);
class HUD_LoadIndicator extends scenes_1.Scene {
    render() {
        return (0, widget_1.h)("div", { class: "kate-hud-load-screen" }, ["Loading..."]);
    }
}
exports.HUD_LoadIndicator = HUD_LoadIndicator;

});

// packages\kate-core\build\os\apis\cart-manager.js
require.define(50, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\cart-manager.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartManager = void 0;
const Cart = require(51);
const Db = require(26);
const utils_1 = require(5);
class CartManager {
    os;
    CARTRIDGE_SIZE_LIMIT = 1024 * 1024 * 512; // 512MB
    THUMBNAIL_WIDTH = 200;
    THUMBNAIL_HEIGHT = 350;
    constructor(os) {
        this.os = os;
    }
    async list() {
        return await this.os.db.transaction([Db.cart_meta, Db.play_habits], "readonly", async (t) => {
            const meta = t.get_table1(Db.cart_meta);
            const habits = t.get_table1(Db.play_habits);
            const carts = await meta.get_all();
            const full_data = carts.map(async (x) => ({
                meta: x,
                habits: await habits.get(x.id),
            }));
            return Promise.all(full_data);
        });
    }
    // -- Retrieval
    async read_files_by_cart(id) {
        const cartridge = await this.os.db.transaction([Db.cart_meta, Db.cart_files], "readonly", async (t) => {
            const meta = t.get_table1(Db.cart_meta);
            const files = t.get_table2(Db.cart_files);
            const cart_meta = await meta.get(id);
            const cart_files = await Promise.all(cart_meta.files.map((x) => [x.path, files.get([id, x.id])]));
            return new Map(cart_files);
        });
        return cartridge;
    }
    async read_file_by_id(id, file_id) {
        return await this.os.db.transaction([Db.cart_files], "readonly", async (t) => {
            const files = t.get_table2(Db.cart_files);
            return files.get([id, file_id]);
        });
    }
    async try_read_metadata(id) {
        return await this.os.db.transaction([Db.cart_meta], "readonly", async (t) => {
            const meta = t.get_table1(Db.cart_meta);
            const cart_meta = await meta.try_get(id);
            if (cart_meta == null) {
                return null;
            }
            return cart_meta;
        });
    }
    async read_metadata(id) {
        const metadata = await this.try_read_metadata(id);
        if (metadata == null) {
            throw new Error(`Cartridge not found: ${id}`);
        }
        return metadata;
    }
    // -- Installation
    async install_from_file(file) {
        if (file.size > this.CARTRIDGE_SIZE_LIMIT) {
            this.os.notifications.push_transient("kate:cart-manager", "Installation failed", `${file.name} exceeds the 512MB cartridge size limit.`);
            return;
        }
        try {
            const buffer = await file.arrayBuffer();
            const cart = Cart.parse(new Uint8Array(buffer));
            await this.install(cart);
        }
        catch (error) {
            console.error(`Failed to install ${file.name}:`, error);
            await this.os.notifications.push("kate:cart-manager", "Installation failed", `${file.name} could not be installed.`);
        }
    }
    async uninstall(cart) {
        await this.os.db.transaction([Db.cart_meta, Db.cart_files], "readwrite", async (t) => {
            const meta = t.get_table1(Db.cart_meta);
            const files = t.get_table2(Db.cart_files);
            const cart_meta = await meta.get(cart.id);
            for (const file of cart_meta.files) {
                await files.delete([cart.id, file.id]);
            }
            await meta.delete(cart.id);
        });
        await this.os.notifications.push("kate:cart-manager", `Game uninstalled`, `${cart.title} ${cart.id} and its data was removed.`);
        await this.os.events.on_cart_removed.emit(cart);
    }
    async install(cart) {
        const old_meta = await this.try_read_metadata(cart.metadata.id);
        if (old_meta != null) {
            const version = old_meta.metadata.release.version;
            const title = old_meta.metadata.game.title;
            const should_update = await this.os.dialog.confirm("kate:installer", {
                title: `Update ${title}?`,
                message: `A cartridge already exists for ${cart.metadata.id}. Update it to ${title} v${version.major}.${version.minor}?`,
                ok: "Update",
                cancel: "Keep old version",
                dangerous: true,
            });
            if (!should_update) {
                return false;
            }
        }
        const thumbnail = await (0, utils_1.make_thumbnail_from_bytes)(this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT, cart.thumbnail.mime, cart.thumbnail.data);
        await this.os.db.transaction([Db.cart_meta, Db.cart_files, Db.play_habits], "readwrite", async (t) => {
            const meta = t.get_table1(Db.cart_meta);
            const files = t.get_table2(Db.cart_files);
            const habits = t.get_table1(Db.play_habits);
            if (old_meta != null) {
                for (const file of old_meta.files) {
                    await files.delete([cart.metadata.id, file.id]);
                }
            }
            let nodes = [];
            for (const node of cart.files) {
                const id = (0, utils_1.make_id)();
                await files.put({
                    id: cart.metadata.id,
                    file_id: id,
                    mime: node.mime,
                    data: node.data,
                });
                nodes.push({
                    id: id,
                    path: node.path,
                    size: node.data.length,
                });
            }
            const now = new Date();
            await meta.put({
                id: cart.metadata.id,
                metadata: cart.metadata,
                runtime: cart.runtime,
                thumbnail_dataurl: thumbnail,
                files: nodes,
                installed_at: old_meta?.installed_at ?? now,
                updated_at: now,
            });
            const play_habits = (await habits.try_get(cart.metadata.id)) ?? {
                id: cart.metadata.id,
                last_played: null,
                play_time: 0,
            };
            await habits.put(play_habits);
        });
        await this.os.notifications.push("kate:cart-manager", `New game installed`, `${cart.metadata.game.title} is ready to play!`);
        this.os.events.on_cart_inserted.emit(cart);
        return true;
    }
    // -- Playing habits
    async read_habits(id) {
        await this.os.db.transaction([Db.play_habits], "readonly", async (t) => {
            const habits = t.get_table1(Db.play_habits);
            return habits.get(id);
        });
    }
    async habit_history() {
        return await this.os.db.transaction([Db.play_habits, Db.cart_meta], "readonly", async (t) => {
            const carts = t.get_table1(Db.cart_meta);
            const habits = t.get_table1(Db.play_habits);
            const entries = await habits.get_all();
            return Promise.all(entries.map(async (x) => {
                const cart = await carts.try_get(x.id);
                return {
                    id: x.id,
                    installed: cart != null,
                    title: cart?.metadata.game.title ?? x.id,
                    last_played: x.last_played,
                    play_time: x.play_time,
                };
            }));
        });
    }
    async delete_play_habits() {
        await this.os.db.transaction([Db.play_habits], "readwrite", async (t) => {
            const habits = t.get_table1(Db.play_habits);
            const rows = await habits.get_all();
            for (const row of rows) {
                await habits.put({
                    id: row.id,
                    last_played: null,
                    play_time: 0,
                });
            }
        });
    }
    async update_last_played(cart_id, last_played) {
        if (!this.os.settings.get("play_habits").recently_played) {
            return;
        }
        await this.os.db.transaction([Db.play_habits], "readwrite", async (t) => {
            const habits = t.get_table1(Db.play_habits);
            const cart = await habits.get(cart_id);
            cart.last_played = last_played;
            await habits.put(cart);
        });
    }
    async increase_play_time(cart_id, play_time) {
        if (!this.os.settings.get("play_habits").play_times) {
            return;
        }
        await this.os.db.transaction([Db.play_habits], "readwrite", async (t) => {
            const habits = t.get_table1(Db.play_habits);
            const cart = await habits.get(cart_id);
            cart.play_time += play_time || 0;
            await habits.put(cart);
        });
    }
}
exports.CartManager = CartManager;

});

// packages\kate-core\build\cart\index.js
require.define(51, "packages\\kate-core\\build\\cart", "packages\\kate-core\\build\\cart\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(52), exports);
__exportStar(require(56), exports);
__exportStar(require(58), exports);
__exportStar(require(59), exports);
__exportStar(require(60), exports);

});

// packages\kate-core\build\cart\metadata.js
require.define(52, "packages\\kate-core\\build\\cart", "packages\\kate-core\\build\\cart\\metadata.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_metadata = exports.version_string = void 0;
const v2_1 = require(53);
const utils_1 = require(5);
const parser_utils_1 = require(57);
function version_string(meta) {
    return `${meta.release.version.major}.${meta.release.version.minor}`;
}
exports.version_string = version_string;
function parse_metadata(cart) {
    return {
        id: (0, parser_utils_1.str)(valid_id(cart.id), 255),
        game: {
            title: (0, parser_utils_1.str)(cart.metadata.title.title, 255),
            author: (0, parser_utils_1.str)(cart.metadata.title.author, 255),
            description: (0, parser_utils_1.str)(cart.metadata.title.description, 10_000),
            genre: new Set(cart.metadata.title.genre.map((x) => genre(x))),
            tags: new Set((0, parser_utils_1.list)(cart.metadata.title.tags.map((x) => tag(x)), 10)),
        },
        release: {
            kind: release_kind(cart.metadata.release.release_type),
            date: date(cart.metadata.release.release_date),
            version: {
                major: Math.floor(cart.metadata.release.version.major),
                minor: Math.floor(cart.metadata.release.version.minor),
            },
            licence_name: (0, parser_utils_1.str)(cart.metadata.release.licence_name, 255),
            allow_commercial: cart.metadata.release.allow_commercial,
            allow_derivative: cart.metadata.release.allow_derivative,
            legal_notices: (0, parser_utils_1.str)(cart.metadata.release.legal_notices, (0, parser_utils_1.chars_in_mb)(5)),
        },
        rating: {
            rating: content_rating(cart.metadata.rating.rating),
            content_warning: cart.metadata.rating.warnings
                ? (0, parser_utils_1.str)(cart.metadata.rating.warnings, 1_000)
                : null,
        },
        play_style: {
            accessibility: new Set(cart.metadata.play.accessibility.map(accessibility)),
            average_duration: duration(cart.metadata.play.average_duration),
            input_methods: new Set(cart.metadata.play.input_methods.map(input_method)),
            languages: (0, parser_utils_1.list)(cart.metadata.play.languages.map(language), 255),
            local_multiplayer: player_range(cart.metadata.play.local_multiplayer),
            online_multiplayer: player_range(cart.metadata.play.online_multiplayer),
        },
    };
}
exports.parse_metadata = parse_metadata;
function genre(x) {
    switch (x.$tag) {
        case 1 /* Cart_v2.Genre.$Tags.Action */:
            return "action";
        case 2 /* Cart_v2.Genre.$Tags.Figthing */:
            return "fighting";
        case 3 /* Cart_v2.Genre.$Tags.Interactive_fiction */:
            return "interactive-fiction";
        case 4 /* Cart_v2.Genre.$Tags.Platformer */:
            return "platformer";
        case 5 /* Cart_v2.Genre.$Tags.Puzzle */:
            return "puzzle";
        case 6 /* Cart_v2.Genre.$Tags.Racing */:
            return "racing";
        case 7 /* Cart_v2.Genre.$Tags.Rhythm */:
            return "rhythm";
        case 8 /* Cart_v2.Genre.$Tags.RPG */:
            return "rpg";
        case 9 /* Cart_v2.Genre.$Tags.Simulation */:
            return "simulation";
        case 10 /* Cart_v2.Genre.$Tags.Shooter */:
            return "shooter";
        case 11 /* Cart_v2.Genre.$Tags.Sports */:
            return "sports";
        case 12 /* Cart_v2.Genre.$Tags.Strategy */:
            return "strategy";
        case 13 /* Cart_v2.Genre.$Tags.Tool */:
            return "tool";
        case 14 /* Cart_v2.Genre.$Tags.Other */:
            return "other";
        case 0 /* Cart_v2.Genre.$Tags.Not_specified */:
            return "not-specified";
        default:
            throw (0, utils_1.unreachable)(x);
    }
}
function release_kind(x) {
    switch (x.$tag) {
        case 2 /* Cart_v2.Release_type.$Tags.Beta */:
            return "beta";
        case 3 /* Cart_v2.Release_type.$Tags.Demo */:
            return "demo";
        case 1 /* Cart_v2.Release_type.$Tags.Early_access */:
            return "early-access";
        case 4 /* Cart_v2.Release_type.$Tags.Full */:
            return "full";
        case 0 /* Cart_v2.Release_type.$Tags.Prototype */:
            return "prototype";
        default:
            throw (0, utils_1.unreachable)(x);
    }
}
function content_rating(x) {
    switch (x.$tag) {
        case 0 /* Cart_v2.Content_rating.$Tags.General */:
            return "general";
        case 1 /* Cart_v2.Content_rating.$Tags.Teen_and_up */:
            return "teen-and-up";
        case 2 /* Cart_v2.Content_rating.$Tags.Mature */:
            return "mature";
        case 3 /* Cart_v2.Content_rating.$Tags.Explicit */:
            return "explicit";
        case 4 /* Cart_v2.Content_rating.$Tags.Unknown */:
            return "unknown";
        default:
            throw (0, utils_1.unreachable)(x);
    }
}
function accessibility(x) {
    switch (x.$tag) {
        case 4 /* Cart_v2.Accessibility.$Tags.Configurable_difficulty */:
            return "configurable-difficulty";
        case 0 /* Cart_v2.Accessibility.$Tags.High_contrast */:
            return "high-contrast";
        case 2 /* Cart_v2.Accessibility.$Tags.Image_captions */:
            return "image-captions";
        case 5 /* Cart_v2.Accessibility.$Tags.Skippable_content */:
            return "skippable-content";
        case 1 /* Cart_v2.Accessibility.$Tags.Subtitles */:
            return "subtitles";
        case 3 /* Cart_v2.Accessibility.$Tags.Voiced_text */:
            return "voiced-text";
        default:
            throw (0, utils_1.unreachable)(x);
    }
}
function duration(x) {
    switch (x.$tag) {
        case 0 /* Cart_v2.Duration.$Tags.Seconds */:
            return "seconds";
        case 1 /* Cart_v2.Duration.$Tags.Few_minutes */:
            return "few-minutes";
        case 2 /* Cart_v2.Duration.$Tags.Half_hour */:
            return "half-hour";
        case 3 /* Cart_v2.Duration.$Tags.One_hour */:
            return "one-hour";
        case 4 /* Cart_v2.Duration.$Tags.Few_hours */:
            return "few-hours";
        case 5 /* Cart_v2.Duration.$Tags.Several_hours */:
            return "several-hours";
        case 6 /* Cart_v2.Duration.$Tags.Unknown */:
            return "unknown";
        default:
            throw (0, utils_1.unreachable)(x);
    }
}
function input_method(x) {
    switch (x.$tag) {
        case 0 /* Cart_v2.Input_method.$Tags.Kate_buttons */:
            return "kate-buttons";
        case 1 /* Cart_v2.Input_method.$Tags.Touch */:
            return "touch";
        default:
            throw (0, utils_1.unreachable)(x);
    }
}
const valid_language = (0, parser_utils_1.regex)("language iso-code", /^[a-z]{2}(?:[\-_][a-zA-Z_]{2,})?$/);
function language(x) {
    return {
        iso_code: valid_language((0, parser_utils_1.str)(x.iso_code, 255)),
        audio: x.audio,
        interface: x._interface,
        text: x.text,
    };
}
function player_range(x) {
    if (x == null) {
        return null;
    }
    else {
        return { maximum: x.maximum, minimum: x.minimum };
    }
}
function date(x) {
    return new Date(x.year, x.month - 1, x.day, 0, 0, 0, 0);
}
const tag = (0, parser_utils_1.regex)("tag", /^[a-z\-]+$/);
const valid_id = (0, parser_utils_1.regex)("id", /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\/[a-z0-9\-]+(\.[a-z0-9\-]+)*$/);

});

// packages\kate-core\build\cart\v2.js
require.define(53, "packages\\kate-core\\build\\cart", "packages\\kate-core\\build\\cart\\v2.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_v2 = exports.Fingerprint = exports.Cart_v2 = void 0;
const Cart_v2 = require(54);
exports.Cart_v2 = Cart_v2;
const Fingerprint = require(55);
exports.Fingerprint = Fingerprint;
const Metadata = require(52);
const Runtime = require(56);
const Files = require(58);
function parse_v2(x) {
    let cart;
    let view;
    try {
        view = Fingerprint.remove_fingerprint(new DataView(x.buffer));
    }
    catch (error) {
        return null;
    }
    const decoder = new Cart_v2._Decoder(view);
    cart = Cart_v2.Cartridge.decode(decoder);
    return {
        metadata: Metadata.parse_metadata(cart),
        runtime: Runtime.parse_runtime(cart),
        thumbnail: Files.parse_file(cart.metadata.title.thumbnail),
        files: Files.parse_files(cart),
    };
}
exports.parse_v2 = parse_v2;

});

// packages\schema\generated\cartridge.js
require.define(54, "packages\\schema\\generated", "packages\\schema\\generated\\cartridge.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyboardKey = exports.VirtualKey = exports.VirtualKey$Base = exports.Bridge = exports.Bridge$Base = exports.Platform = exports.Platform$Base = exports.Booklet_align = exports.Booklet_align$Base = exports.Booklet_cell = exports.Booklet_row = exports.Booklet_expr = exports.Booklet_expr$Base = exports.Accessibility = exports.Accessibility$Base = exports.Language = exports.Player_range = exports.Input_method = exports.Input_method$Base = exports.Duration = exports.Duration$Base = exports.Date = exports.Content_rating = exports.Content_rating$Base = exports.Version = exports.Release_type = exports.Release_type$Base = exports.Genre = exports.Genre$Base = exports.Capability = exports.Capability$Base = exports.Extra = exports.Extra$Base = exports.Meta_play = exports.Meta_rating = exports.Meta_release = exports.Meta_title = exports.Metadata = exports.File = exports.Cartridge = exports.Meta_security = exports._Encoder = exports._Decoder = void 0;
class _Decoder {
    view;
    offset = 0;
    constructor(view) {
        this.view = view;
    }
    get remaining_bytes() {
        return this.view.byteLength - (this.view.byteOffset + this.offset);
    }
    peek(f) {
        return f(new DataView(this.view.buffer, this.view.byteOffset + this.offset));
    }
    bool() {
        return this.ui8() > 0;
    }
    i8() {
        const value = this.view.getInt8(this.offset);
        this.offset += 1;
        return value;
    }
    i16() {
        const value = this.view.getInt16(this.offset, true);
        this.offset += 2;
        return value;
    }
    i32() {
        const value = this.view.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }
    ui8() {
        const value = this.view.getUint8(this.offset);
        this.offset += 1;
        return value;
    }
    ui16() {
        const value = this.view.getUint16(this.offset, true);
        this.offset += 2;
        return value;
    }
    ui32() {
        const value = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }
    f32() {
        const value = this.view.getFloat32(this.offset, true);
        this.offset += 4;
        return value;
    }
    f64() {
        const value = this.view.getFloat64(this.offset, true);
        this.offset += 8;
        return value;
    }
    bigint() {
        const negative = this.bool();
        const size = this.ui32();
        const buffer = [];
        for (let i = 0; i < size; ++i) {
            buffer[i] = this.ui8().toString(16).padStart(2, "0");
        }
        const result = BigInt(`0x${buffer.join("")}`);
        return negative ? -result : result;
    }
    text() {
        const size = this.ui32();
        const decoder = new TextDecoder("utf-8");
        const text_view = new DataView(this.view.buffer, this.offset, size);
        const result = decoder.decode(text_view);
        this.offset += size;
        return result;
    }
    bytes() {
        const size = this.ui32();
        if (size > this.remaining_bytes) {
            throw new Error(`Invalid size ${size}`);
        }
        const result = new Uint8Array(size);
        for (let i = 0; i < result.length; ++i) {
            result[i] = this.view.getUint8(this.offset + i);
        }
        this.offset += size;
        return result;
    }
    array(f) {
        const size = this.ui32();
        const result = [];
        for (let i = 0; i < size; ++i) {
            result[i] = f();
        }
        return result;
    }
    map(k, v) {
        const size = this.ui32();
        const result = new Map();
        for (let i = 0; i < size; ++i) {
            const key = k();
            const value = v();
            result.set(key, value);
        }
        return result;
    }
    optional(f) {
        const has_value = this.bool();
        if (has_value) {
            return f();
        }
        else {
            return null;
        }
    }
    decode(method) {
        method.decode(this);
    }
}
exports._Decoder = _Decoder;
class _Encoder {
    buffers = [];
    bool(x) {
        this.buffers.push(new Uint8Array([x ? 0x01 : 0x00]));
        return this;
    }
    i8(x) {
        const a = new Uint8Array(1);
        const v = new DataView(a.buffer);
        v.setInt8(0, x);
        this.buffers.push(a);
        return this;
    }
    i16(x) {
        const a = new Uint8Array(2);
        const v = new DataView(a.buffer);
        v.setInt16(0, x, true);
        this.buffers.push(a);
        return this;
    }
    i32(x) {
        const a = new Uint8Array(4);
        const v = new DataView(a.buffer);
        v.setInt32(0, x, true);
        this.buffers.push(a);
        return this;
    }
    ui8(x) {
        const a = new Uint8Array(1);
        const v = new DataView(a.buffer);
        v.setUint8(0, x);
        this.buffers.push(a);
        return this;
    }
    ui16(x) {
        const a = new Uint8Array(2);
        const v = new DataView(a.buffer);
        v.setUint16(0, x, true);
        this.buffers.push(a);
        return this;
    }
    ui32(x) {
        const a = new Uint8Array(4);
        const v = new DataView(a.buffer);
        v.setUint32(0, x, true);
        this.buffers.push(a);
        return this;
    }
    float32(x) {
        const a = new Uint8Array(4);
        const v = new DataView(a.buffer);
        v.setFloat32(0, x, true);
        this.buffers.push(a);
        return this;
    }
    float64(x) {
        const a = new Uint8Array(8);
        const v = new DataView(a.buffer);
        v.setFloat64(0, x, true);
        this.buffers.push(a);
        return this;
    }
    integer(x) {
        let bytes = (x < 0 ? -x : x).toString(16);
        if (bytes.length % 2 != 0)
            bytes = "0" + bytes;
        const size = bytes.length / 2;
        const header_size = 5;
        const buffer = new Uint8Array(size + header_size);
        const bufferv = new DataView(buffer.buffer);
        bufferv.setUint8(0, x < 0 ? 0x01 : 0x00);
        bufferv.setUint32(1, size, true);
        for (let i = 0; i < size; ++i) {
            const byte_offset = i * 2;
            bufferv.setUint8(header_size + i, parseInt(bytes.substring(byte_offset, byte_offset + 2), 16));
        }
        this.buffers.push(buffer);
        return this;
    }
    text(x) {
        const encoder = new TextEncoder();
        let encoded_text = encoder.encode(x);
        const header_size = 4;
        const result = new Uint8Array(encoded_text.length + header_size);
        const resultv = new DataView(result.buffer);
        resultv.setUint32(0, encoded_text.length, true);
        result.set(encoded_text, header_size);
        this.buffers.push(result);
        return this;
    }
    bytes(x) {
        const result = new Uint8Array(x.length + 4);
        const view = new DataView(result.buffer);
        view.setUint32(0, x.length, true);
        result.set(x, 4);
        this.buffers.push(result);
        return this;
    }
    array(xs, f) {
        this.ui32(xs.length);
        for (const x of xs) {
            f(this, x);
        }
        return this;
    }
    map(x, fk, fv) {
        this.ui32(x.size);
        for (const [k, v] of x.entries()) {
            fk(this, k);
            fv(this, v);
        }
        return this;
    }
    optional(x, f) {
        if (x == null) {
            this.bool(false);
        }
        else {
            this.bool(true);
            f(this, x);
        }
        return this;
    }
    encode(method) {
        method.encode(this);
        return this;
    }
    to_bytes() {
        const size = this.buffers.reduce((a, b) => a + b.byteLength, 0);
        const result = new Uint8Array(size);
        let offset = 0;
        for (let i = 0; i < this.buffers.length; ++i) {
            result.set(this.buffers[i], offset);
            offset += this.buffers[i].byteLength;
        }
        return result;
    }
}
exports._Encoder = _Encoder;
class Meta_security {
    capabilities;
    static $tag = 8;
    $tag = 8;
    constructor(capabilities) {
        this.capabilities = capabilities;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 8) {
            throw new Error(`Invalid tag ${$tag} for Meta-security: expected 8`);
        }
        return Meta_security.$do_decode($d);
    }
    static $do_decode($d) {
        const capabilities = $d.array(() => {
            const item = Capability$Base.$do_decode($d);
            ;
            return item;
        });
        return new Meta_security(capabilities);
    }
    encode($e) {
        $e.ui32(8);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.array((this.capabilities), ($e, v) => {
            (v).$do_encode($e);
        });
    }
}
exports.Meta_security = Meta_security;
class Cartridge {
    id;
    metadata;
    files;
    platform;
    static $tag = 0;
    $tag = 0;
    constructor(id, metadata, files, platform) {
        this.id = id;
        this.metadata = metadata;
        this.files = files;
        this.platform = platform;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 0) {
            throw new Error(`Invalid tag ${$tag} for Cartridge: expected 0`);
        }
        return Cartridge.$do_decode($d);
    }
    static $do_decode($d) {
        const id = $d.text();
        const metadata = Metadata.$do_decode($d);
        const files = $d.array(() => {
            const item = File.$do_decode($d);
            ;
            return item;
        });
        const platform = Platform$Base.$do_decode($d);
        return new Cartridge(id, metadata, files, platform);
    }
    encode($e) {
        $e.ui32(0);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.text(this.id);
        (this.metadata).$do_encode($e);
        $e.array((this.files), ($e, v) => {
            (v).$do_encode($e);
        });
        (this.platform).$do_encode($e);
    }
}
exports.Cartridge = Cartridge;
class File {
    path;
    mime;
    data;
    static $tag = 1;
    $tag = 1;
    constructor(path, mime, data) {
        this.path = path;
        this.mime = mime;
        this.data = data;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 1) {
            throw new Error(`Invalid tag ${$tag} for File: expected 1`);
        }
        return File.$do_decode($d);
    }
    static $do_decode($d) {
        const path = $d.text();
        const mime = $d.text();
        const data = $d.bytes();
        return new File(path, mime, data);
    }
    encode($e) {
        $e.ui32(1);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.text(this.path);
        $e.text(this.mime);
        $e.bytes(this.data);
    }
}
exports.File = File;
class Metadata {
    title;
    release;
    rating;
    play;
    security;
    extras;
    static $tag = 2;
    $tag = 2;
    constructor(title, release, rating, play, security, extras) {
        this.title = title;
        this.release = release;
        this.rating = rating;
        this.play = play;
        this.security = security;
        this.extras = extras;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 2) {
            throw new Error(`Invalid tag ${$tag} for Metadata: expected 2`);
        }
        return Metadata.$do_decode($d);
    }
    static $do_decode($d) {
        const title = Meta_title.$do_decode($d);
        const release = Meta_release.$do_decode($d);
        const rating = Meta_rating.$do_decode($d);
        const play = Meta_play.$do_decode($d);
        const security = Meta_security.$do_decode($d);
        const extras = $d.array(() => {
            const item = Extra$Base.$do_decode($d);
            ;
            return item;
        });
        return new Metadata(title, release, rating, play, security, extras);
    }
    encode($e) {
        $e.ui32(2);
        this.$do_encode($e);
    }
    $do_encode($e) {
        (this.title).$do_encode($e);
        (this.release).$do_encode($e);
        (this.rating).$do_encode($e);
        (this.play).$do_encode($e);
        (this.security).$do_encode($e);
        $e.array((this.extras), ($e, v) => {
            (v).$do_encode($e);
        });
    }
}
exports.Metadata = Metadata;
class Meta_title {
    author;
    title;
    description;
    genre;
    tags;
    thumbnail;
    static $tag = 3;
    $tag = 3;
    constructor(author, title, description, genre, tags, thumbnail) {
        this.author = author;
        this.title = title;
        this.description = description;
        this.genre = genre;
        this.tags = tags;
        this.thumbnail = thumbnail;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 3) {
            throw new Error(`Invalid tag ${$tag} for Meta-title: expected 3`);
        }
        return Meta_title.$do_decode($d);
    }
    static $do_decode($d) {
        const author = $d.text();
        const title = $d.text();
        const description = $d.text();
        const genre = $d.array(() => {
            const item = Genre$Base.$do_decode($d);
            ;
            return item;
        });
        const tags = $d.array(() => {
            const item = $d.text();
            ;
            return item;
        });
        const thumbnail = File.$do_decode($d);
        return new Meta_title(author, title, description, genre, tags, thumbnail);
    }
    encode($e) {
        $e.ui32(3);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.text(this.author);
        $e.text(this.title);
        $e.text(this.description);
        $e.array((this.genre), ($e, v) => {
            (v).$do_encode($e);
        });
        $e.array((this.tags), ($e, v) => {
            $e.text(v);
        });
        (this.thumbnail).$do_encode($e);
    }
}
exports.Meta_title = Meta_title;
class Meta_release {
    release_type;
    release_date;
    version;
    legal_notices;
    licence_name;
    allow_derivative;
    allow_commercial;
    static $tag = 4;
    $tag = 4;
    constructor(release_type, release_date, version, legal_notices, licence_name, allow_derivative, allow_commercial) {
        this.release_type = release_type;
        this.release_date = release_date;
        this.version = version;
        this.legal_notices = legal_notices;
        this.licence_name = licence_name;
        this.allow_derivative = allow_derivative;
        this.allow_commercial = allow_commercial;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 4) {
            throw new Error(`Invalid tag ${$tag} for Meta-release: expected 4`);
        }
        return Meta_release.$do_decode($d);
    }
    static $do_decode($d) {
        const release_type = Release_type$Base.$do_decode($d);
        const release_date = Date.$do_decode($d);
        const version = Version.$do_decode($d);
        const legal_notices = $d.text();
        const licence_name = $d.text();
        const allow_derivative = $d.bool();
        const allow_commercial = $d.bool();
        return new Meta_release(release_type, release_date, version, legal_notices, licence_name, allow_derivative, allow_commercial);
    }
    encode($e) {
        $e.ui32(4);
        this.$do_encode($e);
    }
    $do_encode($e) {
        (this.release_type).$do_encode($e);
        (this.release_date).$do_encode($e);
        (this.version).$do_encode($e);
        $e.text(this.legal_notices);
        $e.text(this.licence_name);
        $e.bool(this.allow_derivative);
        $e.bool(this.allow_commercial);
    }
}
exports.Meta_release = Meta_release;
class Meta_rating {
    rating;
    warnings;
    static $tag = 5;
    $tag = 5;
    constructor(rating, warnings) {
        this.rating = rating;
        this.warnings = warnings;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 5) {
            throw new Error(`Invalid tag ${$tag} for Meta-rating: expected 5`);
        }
        return Meta_rating.$do_decode($d);
    }
    static $do_decode($d) {
        const rating = Content_rating$Base.$do_decode($d);
        const warnings = $d.optional(() => {
            const item = $d.text();
            ;
            return item;
        });
        return new Meta_rating(rating, warnings);
    }
    encode($e) {
        $e.ui32(5);
        this.$do_encode($e);
    }
    $do_encode($e) {
        (this.rating).$do_encode($e);
        $e.optional((this.warnings), ($e, v) => { $e.text(v); });
    }
}
exports.Meta_rating = Meta_rating;
class Meta_play {
    input_methods;
    local_multiplayer;
    online_multiplayer;
    languages;
    accessibility;
    average_duration;
    static $tag = 6;
    $tag = 6;
    constructor(input_methods, local_multiplayer, online_multiplayer, languages, accessibility, average_duration) {
        this.input_methods = input_methods;
        this.local_multiplayer = local_multiplayer;
        this.online_multiplayer = online_multiplayer;
        this.languages = languages;
        this.accessibility = accessibility;
        this.average_duration = average_duration;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 6) {
            throw new Error(`Invalid tag ${$tag} for Meta-play: expected 6`);
        }
        return Meta_play.$do_decode($d);
    }
    static $do_decode($d) {
        const input_methods = $d.array(() => {
            const item = Input_method$Base.$do_decode($d);
            ;
            return item;
        });
        const local_multiplayer = $d.optional(() => {
            const item = Player_range.$do_decode($d);
            ;
            return item;
        });
        const online_multiplayer = $d.optional(() => {
            const item = Player_range.$do_decode($d);
            ;
            return item;
        });
        const languages = $d.array(() => {
            const item = Language.$do_decode($d);
            ;
            return item;
        });
        const accessibility = $d.array(() => {
            const item = Accessibility$Base.$do_decode($d);
            ;
            return item;
        });
        const average_duration = Duration$Base.$do_decode($d);
        return new Meta_play(input_methods, local_multiplayer, online_multiplayer, languages, accessibility, average_duration);
    }
    encode($e) {
        $e.ui32(6);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.array((this.input_methods), ($e, v) => {
            (v).$do_encode($e);
        });
        $e.optional((this.local_multiplayer), ($e, v) => { (v).$do_encode($e); });
        $e.optional((this.online_multiplayer), ($e, v) => { (v).$do_encode($e); });
        $e.array((this.languages), ($e, v) => {
            (v).$do_encode($e);
        });
        $e.array((this.accessibility), ($e, v) => {
            (v).$do_encode($e);
        });
        (this.average_duration).$do_encode($e);
    }
}
exports.Meta_play = Meta_play;
class Extra$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 7) {
            throw new Error(`Invalid tag ${$tag} for Extra: expected 7`);
        }
        return Extra$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Extra.Booklet.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Extra`);
        }
    }
}
exports.Extra$Base = Extra$Base;
var Extra;
(function (Extra) {
    class Booklet extends Extra$Base {
        pages;
        custom_css;
        language;
        static $tag = 0 /* $Tags.Booklet */;
        $tag = 0 /* $Tags.Booklet */;
        constructor(pages, custom_css, language) {
            super();
            this.pages = pages;
            this.custom_css = custom_css;
            this.language = language;
        }
        static decode($d) {
            return Booklet.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Extra.Booklet: expected 0`);
            }
            const pages = $d.array(() => {
                const item = Booklet_expr$Base.$do_decode($d);
                ;
                return item;
            });
            const custom_css = $d.text();
            const language = $d.text();
            return new Booklet(pages, custom_css, language);
        }
        encode($e) {
            $e.ui32(7);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
            $e.array((this.pages), ($e, v) => {
                (v).$do_encode($e);
            });
            $e.text(this.custom_css);
            $e.text(this.language);
        }
    }
    Extra.Booklet = Booklet;
})(Extra = exports.Extra || (exports.Extra = {}));
class Capability$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 9) {
            throw new Error(`Invalid tag ${$tag} for Capability: expected 9`);
        }
        return Capability$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Capability.Network.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Capability`);
        }
    }
}
exports.Capability$Base = Capability$Base;
var Capability;
(function (Capability) {
    class Network extends Capability$Base {
        allow;
        static $tag = 0 /* $Tags.Network */;
        $tag = 0 /* $Tags.Network */;
        constructor(allow) {
            super();
            this.allow = allow;
        }
        static decode($d) {
            return Network.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Capability.Network: expected 0`);
            }
            const allow = $d.array(() => {
                const item = $d.text();
                ;
                return item;
            });
            return new Network(allow);
        }
        encode($e) {
            $e.ui32(9);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
            $e.array((this.allow), ($e, v) => {
                $e.text(v);
            });
        }
    }
    Capability.Network = Network;
})(Capability = exports.Capability || (exports.Capability = {}));
class Genre$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 10) {
            throw new Error(`Invalid tag ${$tag} for Genre: expected 10`);
        }
        return Genre$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Genre.Not_specified.decode($d);
            case 1: return Genre.Action.decode($d);
            case 2: return Genre.Figthing.decode($d);
            case 3: return Genre.Interactive_fiction.decode($d);
            case 4: return Genre.Platformer.decode($d);
            case 5: return Genre.Puzzle.decode($d);
            case 6: return Genre.Racing.decode($d);
            case 7: return Genre.Rhythm.decode($d);
            case 8: return Genre.RPG.decode($d);
            case 9: return Genre.Simulation.decode($d);
            case 10: return Genre.Shooter.decode($d);
            case 11: return Genre.Sports.decode($d);
            case 12: return Genre.Strategy.decode($d);
            case 13: return Genre.Tool.decode($d);
            case 14: return Genre.Other.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Genre`);
        }
    }
}
exports.Genre$Base = Genre$Base;
var Genre;
(function (Genre) {
    class Not_specified extends Genre$Base {
        static $tag = 0 /* $Tags.Not_specified */;
        $tag = 0 /* $Tags.Not_specified */;
        constructor() {
            super();
        }
        static decode($d) {
            return Not_specified.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Genre.Not-specified: expected 0`);
            }
            return new Not_specified();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
        }
    }
    Genre.Not_specified = Not_specified;
    class Action extends Genre$Base {
        static $tag = 1 /* $Tags.Action */;
        $tag = 1 /* $Tags.Action */;
        constructor() {
            super();
        }
        static decode($d) {
            return Action.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 1) {
                throw new Error(`Invalid tag ${$tag} for Genre.Action: expected 1`);
            }
            return new Action();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(1);
        }
    }
    Genre.Action = Action;
    class Figthing extends Genre$Base {
        static $tag = 2 /* $Tags.Figthing */;
        $tag = 2 /* $Tags.Figthing */;
        constructor() {
            super();
        }
        static decode($d) {
            return Figthing.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 2) {
                throw new Error(`Invalid tag ${$tag} for Genre.Figthing: expected 2`);
            }
            return new Figthing();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(2);
        }
    }
    Genre.Figthing = Figthing;
    class Interactive_fiction extends Genre$Base {
        static $tag = 3 /* $Tags.Interactive_fiction */;
        $tag = 3 /* $Tags.Interactive_fiction */;
        constructor() {
            super();
        }
        static decode($d) {
            return Interactive_fiction.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 3) {
                throw new Error(`Invalid tag ${$tag} for Genre.Interactive-fiction: expected 3`);
            }
            return new Interactive_fiction();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(3);
        }
    }
    Genre.Interactive_fiction = Interactive_fiction;
    class Platformer extends Genre$Base {
        static $tag = 4 /* $Tags.Platformer */;
        $tag = 4 /* $Tags.Platformer */;
        constructor() {
            super();
        }
        static decode($d) {
            return Platformer.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 4) {
                throw new Error(`Invalid tag ${$tag} for Genre.Platformer: expected 4`);
            }
            return new Platformer();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(4);
        }
    }
    Genre.Platformer = Platformer;
    class Puzzle extends Genre$Base {
        static $tag = 5 /* $Tags.Puzzle */;
        $tag = 5 /* $Tags.Puzzle */;
        constructor() {
            super();
        }
        static decode($d) {
            return Puzzle.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 5) {
                throw new Error(`Invalid tag ${$tag} for Genre.Puzzle: expected 5`);
            }
            return new Puzzle();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(5);
        }
    }
    Genre.Puzzle = Puzzle;
    class Racing extends Genre$Base {
        static $tag = 6 /* $Tags.Racing */;
        $tag = 6 /* $Tags.Racing */;
        constructor() {
            super();
        }
        static decode($d) {
            return Racing.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 6) {
                throw new Error(`Invalid tag ${$tag} for Genre.Racing: expected 6`);
            }
            return new Racing();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(6);
        }
    }
    Genre.Racing = Racing;
    class Rhythm extends Genre$Base {
        static $tag = 7 /* $Tags.Rhythm */;
        $tag = 7 /* $Tags.Rhythm */;
        constructor() {
            super();
        }
        static decode($d) {
            return Rhythm.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 7) {
                throw new Error(`Invalid tag ${$tag} for Genre.Rhythm: expected 7`);
            }
            return new Rhythm();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(7);
        }
    }
    Genre.Rhythm = Rhythm;
    class RPG extends Genre$Base {
        static $tag = 8 /* $Tags.RPG */;
        $tag = 8 /* $Tags.RPG */;
        constructor() {
            super();
        }
        static decode($d) {
            return RPG.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 8) {
                throw new Error(`Invalid tag ${$tag} for Genre.RPG: expected 8`);
            }
            return new RPG();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(8);
        }
    }
    Genre.RPG = RPG;
    class Simulation extends Genre$Base {
        static $tag = 9 /* $Tags.Simulation */;
        $tag = 9 /* $Tags.Simulation */;
        constructor() {
            super();
        }
        static decode($d) {
            return Simulation.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 9) {
                throw new Error(`Invalid tag ${$tag} for Genre.Simulation: expected 9`);
            }
            return new Simulation();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(9);
        }
    }
    Genre.Simulation = Simulation;
    class Shooter extends Genre$Base {
        static $tag = 10 /* $Tags.Shooter */;
        $tag = 10 /* $Tags.Shooter */;
        constructor() {
            super();
        }
        static decode($d) {
            return Shooter.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 10) {
                throw new Error(`Invalid tag ${$tag} for Genre.Shooter: expected 10`);
            }
            return new Shooter();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(10);
        }
    }
    Genre.Shooter = Shooter;
    class Sports extends Genre$Base {
        static $tag = 11 /* $Tags.Sports */;
        $tag = 11 /* $Tags.Sports */;
        constructor() {
            super();
        }
        static decode($d) {
            return Sports.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 11) {
                throw new Error(`Invalid tag ${$tag} for Genre.Sports: expected 11`);
            }
            return new Sports();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(11);
        }
    }
    Genre.Sports = Sports;
    class Strategy extends Genre$Base {
        static $tag = 12 /* $Tags.Strategy */;
        $tag = 12 /* $Tags.Strategy */;
        constructor() {
            super();
        }
        static decode($d) {
            return Strategy.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 12) {
                throw new Error(`Invalid tag ${$tag} for Genre.Strategy: expected 12`);
            }
            return new Strategy();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(12);
        }
    }
    Genre.Strategy = Strategy;
    class Tool extends Genre$Base {
        static $tag = 13 /* $Tags.Tool */;
        $tag = 13 /* $Tags.Tool */;
        constructor() {
            super();
        }
        static decode($d) {
            return Tool.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 13) {
                throw new Error(`Invalid tag ${$tag} for Genre.Tool: expected 13`);
            }
            return new Tool();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(13);
        }
    }
    Genre.Tool = Tool;
    class Other extends Genre$Base {
        static $tag = 14 /* $Tags.Other */;
        $tag = 14 /* $Tags.Other */;
        constructor() {
            super();
        }
        static decode($d) {
            return Other.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 14) {
                throw new Error(`Invalid tag ${$tag} for Genre.Other: expected 14`);
            }
            return new Other();
        }
        encode($e) {
            $e.ui32(10);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(14);
        }
    }
    Genre.Other = Other;
})(Genre = exports.Genre || (exports.Genre = {}));
class Release_type$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 11) {
            throw new Error(`Invalid tag ${$tag} for Release-type: expected 11`);
        }
        return Release_type$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Release_type.Prototype.decode($d);
            case 1: return Release_type.Early_access.decode($d);
            case 2: return Release_type.Beta.decode($d);
            case 3: return Release_type.Demo.decode($d);
            case 4: return Release_type.Full.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Release-type`);
        }
    }
}
exports.Release_type$Base = Release_type$Base;
var Release_type;
(function (Release_type) {
    class Prototype extends Release_type$Base {
        static $tag = 0 /* $Tags.Prototype */;
        $tag = 0 /* $Tags.Prototype */;
        constructor() {
            super();
        }
        static decode($d) {
            return Prototype.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Release-type.Prototype: expected 0`);
            }
            return new Prototype();
        }
        encode($e) {
            $e.ui32(11);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
        }
    }
    Release_type.Prototype = Prototype;
    class Early_access extends Release_type$Base {
        static $tag = 1 /* $Tags.Early_access */;
        $tag = 1 /* $Tags.Early_access */;
        constructor() {
            super();
        }
        static decode($d) {
            return Early_access.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 1) {
                throw new Error(`Invalid tag ${$tag} for Release-type.Early-access: expected 1`);
            }
            return new Early_access();
        }
        encode($e) {
            $e.ui32(11);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(1);
        }
    }
    Release_type.Early_access = Early_access;
    class Beta extends Release_type$Base {
        static $tag = 2 /* $Tags.Beta */;
        $tag = 2 /* $Tags.Beta */;
        constructor() {
            super();
        }
        static decode($d) {
            return Beta.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 2) {
                throw new Error(`Invalid tag ${$tag} for Release-type.Beta: expected 2`);
            }
            return new Beta();
        }
        encode($e) {
            $e.ui32(11);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(2);
        }
    }
    Release_type.Beta = Beta;
    class Demo extends Release_type$Base {
        static $tag = 3 /* $Tags.Demo */;
        $tag = 3 /* $Tags.Demo */;
        constructor() {
            super();
        }
        static decode($d) {
            return Demo.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 3) {
                throw new Error(`Invalid tag ${$tag} for Release-type.Demo: expected 3`);
            }
            return new Demo();
        }
        encode($e) {
            $e.ui32(11);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(3);
        }
    }
    Release_type.Demo = Demo;
    class Full extends Release_type$Base {
        static $tag = 4 /* $Tags.Full */;
        $tag = 4 /* $Tags.Full */;
        constructor() {
            super();
        }
        static decode($d) {
            return Full.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 4) {
                throw new Error(`Invalid tag ${$tag} for Release-type.Full: expected 4`);
            }
            return new Full();
        }
        encode($e) {
            $e.ui32(11);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(4);
        }
    }
    Release_type.Full = Full;
})(Release_type = exports.Release_type || (exports.Release_type = {}));
class Version {
    major;
    minor;
    static $tag = 12;
    $tag = 12;
    constructor(major, minor) {
        this.major = major;
        this.minor = minor;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 12) {
            throw new Error(`Invalid tag ${$tag} for Version: expected 12`);
        }
        return Version.$do_decode($d);
    }
    static $do_decode($d) {
        const major = $d.ui32();
        const minor = $d.ui32();
        return new Version(major, minor);
    }
    encode($e) {
        $e.ui32(12);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.ui32(this.major);
        $e.ui32(this.minor);
    }
}
exports.Version = Version;
class Content_rating$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 13) {
            throw new Error(`Invalid tag ${$tag} for Content-rating: expected 13`);
        }
        return Content_rating$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Content_rating.General.decode($d);
            case 1: return Content_rating.Teen_and_up.decode($d);
            case 2: return Content_rating.Mature.decode($d);
            case 3: return Content_rating.Explicit.decode($d);
            case 4: return Content_rating.Unknown.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Content-rating`);
        }
    }
}
exports.Content_rating$Base = Content_rating$Base;
var Content_rating;
(function (Content_rating) {
    class General extends Content_rating$Base {
        static $tag = 0 /* $Tags.General */;
        $tag = 0 /* $Tags.General */;
        constructor() {
            super();
        }
        static decode($d) {
            return General.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Content-rating.General: expected 0`);
            }
            return new General();
        }
        encode($e) {
            $e.ui32(13);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
        }
    }
    Content_rating.General = General;
    class Teen_and_up extends Content_rating$Base {
        static $tag = 1 /* $Tags.Teen_and_up */;
        $tag = 1 /* $Tags.Teen_and_up */;
        constructor() {
            super();
        }
        static decode($d) {
            return Teen_and_up.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 1) {
                throw new Error(`Invalid tag ${$tag} for Content-rating.Teen-and-up: expected 1`);
            }
            return new Teen_and_up();
        }
        encode($e) {
            $e.ui32(13);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(1);
        }
    }
    Content_rating.Teen_and_up = Teen_and_up;
    class Mature extends Content_rating$Base {
        static $tag = 2 /* $Tags.Mature */;
        $tag = 2 /* $Tags.Mature */;
        constructor() {
            super();
        }
        static decode($d) {
            return Mature.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 2) {
                throw new Error(`Invalid tag ${$tag} for Content-rating.Mature: expected 2`);
            }
            return new Mature();
        }
        encode($e) {
            $e.ui32(13);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(2);
        }
    }
    Content_rating.Mature = Mature;
    class Explicit extends Content_rating$Base {
        static $tag = 3 /* $Tags.Explicit */;
        $tag = 3 /* $Tags.Explicit */;
        constructor() {
            super();
        }
        static decode($d) {
            return Explicit.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 3) {
                throw new Error(`Invalid tag ${$tag} for Content-rating.Explicit: expected 3`);
            }
            return new Explicit();
        }
        encode($e) {
            $e.ui32(13);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(3);
        }
    }
    Content_rating.Explicit = Explicit;
    class Unknown extends Content_rating$Base {
        static $tag = 4 /* $Tags.Unknown */;
        $tag = 4 /* $Tags.Unknown */;
        constructor() {
            super();
        }
        static decode($d) {
            return Unknown.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 4) {
                throw new Error(`Invalid tag ${$tag} for Content-rating.Unknown: expected 4`);
            }
            return new Unknown();
        }
        encode($e) {
            $e.ui32(13);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(4);
        }
    }
    Content_rating.Unknown = Unknown;
})(Content_rating = exports.Content_rating || (exports.Content_rating = {}));
class Date {
    year;
    month;
    day;
    static $tag = 14;
    $tag = 14;
    constructor(year, month, day) {
        this.year = year;
        this.month = month;
        this.day = day;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 14) {
            throw new Error(`Invalid tag ${$tag} for Date: expected 14`);
        }
        return Date.$do_decode($d);
    }
    static $do_decode($d) {
        const year = $d.ui32();
        const month = $d.ui8();
        const day = $d.ui8();
        return new Date(year, month, day);
    }
    encode($e) {
        $e.ui32(14);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.ui32(this.year);
        $e.ui8(this.month);
        $e.ui8(this.day);
    }
}
exports.Date = Date;
class Duration$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 15) {
            throw new Error(`Invalid tag ${$tag} for Duration: expected 15`);
        }
        return Duration$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Duration.Seconds.decode($d);
            case 1: return Duration.Few_minutes.decode($d);
            case 2: return Duration.Half_hour.decode($d);
            case 3: return Duration.One_hour.decode($d);
            case 4: return Duration.Few_hours.decode($d);
            case 5: return Duration.Several_hours.decode($d);
            case 6: return Duration.Unknown.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Duration`);
        }
    }
}
exports.Duration$Base = Duration$Base;
var Duration;
(function (Duration) {
    class Seconds extends Duration$Base {
        static $tag = 0 /* $Tags.Seconds */;
        $tag = 0 /* $Tags.Seconds */;
        constructor() {
            super();
        }
        static decode($d) {
            return Seconds.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Duration.Seconds: expected 0`);
            }
            return new Seconds();
        }
        encode($e) {
            $e.ui32(15);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
        }
    }
    Duration.Seconds = Seconds;
    class Few_minutes extends Duration$Base {
        static $tag = 1 /* $Tags.Few_minutes */;
        $tag = 1 /* $Tags.Few_minutes */;
        constructor() {
            super();
        }
        static decode($d) {
            return Few_minutes.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 1) {
                throw new Error(`Invalid tag ${$tag} for Duration.Few-minutes: expected 1`);
            }
            return new Few_minutes();
        }
        encode($e) {
            $e.ui32(15);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(1);
        }
    }
    Duration.Few_minutes = Few_minutes;
    class Half_hour extends Duration$Base {
        static $tag = 2 /* $Tags.Half_hour */;
        $tag = 2 /* $Tags.Half_hour */;
        constructor() {
            super();
        }
        static decode($d) {
            return Half_hour.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 2) {
                throw new Error(`Invalid tag ${$tag} for Duration.Half-hour: expected 2`);
            }
            return new Half_hour();
        }
        encode($e) {
            $e.ui32(15);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(2);
        }
    }
    Duration.Half_hour = Half_hour;
    class One_hour extends Duration$Base {
        static $tag = 3 /* $Tags.One_hour */;
        $tag = 3 /* $Tags.One_hour */;
        constructor() {
            super();
        }
        static decode($d) {
            return One_hour.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 3) {
                throw new Error(`Invalid tag ${$tag} for Duration.One-hour: expected 3`);
            }
            return new One_hour();
        }
        encode($e) {
            $e.ui32(15);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(3);
        }
    }
    Duration.One_hour = One_hour;
    class Few_hours extends Duration$Base {
        static $tag = 4 /* $Tags.Few_hours */;
        $tag = 4 /* $Tags.Few_hours */;
        constructor() {
            super();
        }
        static decode($d) {
            return Few_hours.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 4) {
                throw new Error(`Invalid tag ${$tag} for Duration.Few-hours: expected 4`);
            }
            return new Few_hours();
        }
        encode($e) {
            $e.ui32(15);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(4);
        }
    }
    Duration.Few_hours = Few_hours;
    class Several_hours extends Duration$Base {
        static $tag = 5 /* $Tags.Several_hours */;
        $tag = 5 /* $Tags.Several_hours */;
        constructor() {
            super();
        }
        static decode($d) {
            return Several_hours.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 5) {
                throw new Error(`Invalid tag ${$tag} for Duration.Several-hours: expected 5`);
            }
            return new Several_hours();
        }
        encode($e) {
            $e.ui32(15);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(5);
        }
    }
    Duration.Several_hours = Several_hours;
    class Unknown extends Duration$Base {
        static $tag = 6 /* $Tags.Unknown */;
        $tag = 6 /* $Tags.Unknown */;
        constructor() {
            super();
        }
        static decode($d) {
            return Unknown.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 6) {
                throw new Error(`Invalid tag ${$tag} for Duration.Unknown: expected 6`);
            }
            return new Unknown();
        }
        encode($e) {
            $e.ui32(15);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(6);
        }
    }
    Duration.Unknown = Unknown;
})(Duration = exports.Duration || (exports.Duration = {}));
class Input_method$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 16) {
            throw new Error(`Invalid tag ${$tag} for Input-method: expected 16`);
        }
        return Input_method$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Input_method.Kate_buttons.decode($d);
            case 1: return Input_method.Touch.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Input-method`);
        }
    }
}
exports.Input_method$Base = Input_method$Base;
var Input_method;
(function (Input_method) {
    class Kate_buttons extends Input_method$Base {
        static $tag = 0 /* $Tags.Kate_buttons */;
        $tag = 0 /* $Tags.Kate_buttons */;
        constructor() {
            super();
        }
        static decode($d) {
            return Kate_buttons.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Input-method.Kate-buttons: expected 0`);
            }
            return new Kate_buttons();
        }
        encode($e) {
            $e.ui32(16);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
        }
    }
    Input_method.Kate_buttons = Kate_buttons;
    class Touch extends Input_method$Base {
        static $tag = 1 /* $Tags.Touch */;
        $tag = 1 /* $Tags.Touch */;
        constructor() {
            super();
        }
        static decode($d) {
            return Touch.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 1) {
                throw new Error(`Invalid tag ${$tag} for Input-method.Touch: expected 1`);
            }
            return new Touch();
        }
        encode($e) {
            $e.ui32(16);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(1);
        }
    }
    Input_method.Touch = Touch;
})(Input_method = exports.Input_method || (exports.Input_method = {}));
class Player_range {
    minimum;
    maximum;
    static $tag = 17;
    $tag = 17;
    constructor(minimum, maximum) {
        this.minimum = minimum;
        this.maximum = maximum;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 17) {
            throw new Error(`Invalid tag ${$tag} for Player-range: expected 17`);
        }
        return Player_range.$do_decode($d);
    }
    static $do_decode($d) {
        const minimum = $d.ui32();
        const maximum = $d.ui32();
        return new Player_range(minimum, maximum);
    }
    encode($e) {
        $e.ui32(17);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.ui32(this.minimum);
        $e.ui32(this.maximum);
    }
}
exports.Player_range = Player_range;
class Language {
    iso_code;
    _interface;
    audio;
    text;
    static $tag = 18;
    $tag = 18;
    constructor(iso_code, _interface, audio, text) {
        this.iso_code = iso_code;
        this._interface = _interface;
        this.audio = audio;
        this.text = text;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 18) {
            throw new Error(`Invalid tag ${$tag} for Language: expected 18`);
        }
        return Language.$do_decode($d);
    }
    static $do_decode($d) {
        const iso_code = $d.text();
        const _interface = $d.bool();
        const audio = $d.bool();
        const text = $d.bool();
        return new Language(iso_code, _interface, audio, text);
    }
    encode($e) {
        $e.ui32(18);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.text(this.iso_code);
        $e.bool(this._interface);
        $e.bool(this.audio);
        $e.bool(this.text);
    }
}
exports.Language = Language;
class Accessibility$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 19) {
            throw new Error(`Invalid tag ${$tag} for Accessibility: expected 19`);
        }
        return Accessibility$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Accessibility.High_contrast.decode($d);
            case 1: return Accessibility.Subtitles.decode($d);
            case 2: return Accessibility.Image_captions.decode($d);
            case 3: return Accessibility.Voiced_text.decode($d);
            case 4: return Accessibility.Configurable_difficulty.decode($d);
            case 5: return Accessibility.Skippable_content.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Accessibility`);
        }
    }
}
exports.Accessibility$Base = Accessibility$Base;
var Accessibility;
(function (Accessibility) {
    class High_contrast extends Accessibility$Base {
        static $tag = 0 /* $Tags.High_contrast */;
        $tag = 0 /* $Tags.High_contrast */;
        constructor() {
            super();
        }
        static decode($d) {
            return High_contrast.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Accessibility.High-contrast: expected 0`);
            }
            return new High_contrast();
        }
        encode($e) {
            $e.ui32(19);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
        }
    }
    Accessibility.High_contrast = High_contrast;
    class Subtitles extends Accessibility$Base {
        static $tag = 1 /* $Tags.Subtitles */;
        $tag = 1 /* $Tags.Subtitles */;
        constructor() {
            super();
        }
        static decode($d) {
            return Subtitles.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 1) {
                throw new Error(`Invalid tag ${$tag} for Accessibility.Subtitles: expected 1`);
            }
            return new Subtitles();
        }
        encode($e) {
            $e.ui32(19);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(1);
        }
    }
    Accessibility.Subtitles = Subtitles;
    class Image_captions extends Accessibility$Base {
        static $tag = 2 /* $Tags.Image_captions */;
        $tag = 2 /* $Tags.Image_captions */;
        constructor() {
            super();
        }
        static decode($d) {
            return Image_captions.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 2) {
                throw new Error(`Invalid tag ${$tag} for Accessibility.Image-captions: expected 2`);
            }
            return new Image_captions();
        }
        encode($e) {
            $e.ui32(19);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(2);
        }
    }
    Accessibility.Image_captions = Image_captions;
    class Voiced_text extends Accessibility$Base {
        static $tag = 3 /* $Tags.Voiced_text */;
        $tag = 3 /* $Tags.Voiced_text */;
        constructor() {
            super();
        }
        static decode($d) {
            return Voiced_text.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 3) {
                throw new Error(`Invalid tag ${$tag} for Accessibility.Voiced-text: expected 3`);
            }
            return new Voiced_text();
        }
        encode($e) {
            $e.ui32(19);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(3);
        }
    }
    Accessibility.Voiced_text = Voiced_text;
    class Configurable_difficulty extends Accessibility$Base {
        static $tag = 4 /* $Tags.Configurable_difficulty */;
        $tag = 4 /* $Tags.Configurable_difficulty */;
        constructor() {
            super();
        }
        static decode($d) {
            return Configurable_difficulty.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 4) {
                throw new Error(`Invalid tag ${$tag} for Accessibility.Configurable-difficulty: expected 4`);
            }
            return new Configurable_difficulty();
        }
        encode($e) {
            $e.ui32(19);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(4);
        }
    }
    Accessibility.Configurable_difficulty = Configurable_difficulty;
    class Skippable_content extends Accessibility$Base {
        static $tag = 5 /* $Tags.Skippable_content */;
        $tag = 5 /* $Tags.Skippable_content */;
        constructor() {
            super();
        }
        static decode($d) {
            return Skippable_content.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 5) {
                throw new Error(`Invalid tag ${$tag} for Accessibility.Skippable-content: expected 5`);
            }
            return new Skippable_content();
        }
        encode($e) {
            $e.ui32(19);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(5);
        }
    }
    Accessibility.Skippable_content = Skippable_content;
})(Accessibility = exports.Accessibility || (exports.Accessibility = {}));
class Booklet_expr$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 20) {
            throw new Error(`Invalid tag ${$tag} for Booklet-expr: expected 20`);
        }
        return Booklet_expr$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Booklet_expr.BE_text.decode($d);
            case 1: return Booklet_expr.BE_image.decode($d);
            case 2: return Booklet_expr.BE_bold.decode($d);
            case 3: return Booklet_expr.BE_italic.decode($d);
            case 4: return Booklet_expr.BE_title.decode($d);
            case 5: return Booklet_expr.BE_subtitle.decode($d);
            case 6: return Booklet_expr.BE_subtitle2.decode($d);
            case 7: return Booklet_expr.BE_font.decode($d);
            case 8: return Booklet_expr.BE_color.decode($d);
            case 9: return Booklet_expr.BE_background.decode($d);
            case 10: return Booklet_expr.BE_columns.decode($d);
            case 11: return Booklet_expr.BE_fixed.decode($d);
            case 12: return Booklet_expr.BE_row.decode($d);
            case 13: return Booklet_expr.BE_column.decode($d);
            case 14: return Booklet_expr.BE_stack.decode($d);
            case 15: return Booklet_expr.BE_table.decode($d);
            case 16: return Booklet_expr.BE_class.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Booklet-expr`);
        }
    }
}
exports.Booklet_expr$Base = Booklet_expr$Base;
var Booklet_expr;
(function (Booklet_expr) {
    class BE_text extends Booklet_expr$Base {
        value;
        static $tag = 0 /* $Tags.BE_text */;
        $tag = 0 /* $Tags.BE_text */;
        constructor(value) {
            super();
            this.value = value;
        }
        static decode($d) {
            return BE_text.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-text: expected 0`);
            }
            const value = $d.text();
            return new BE_text(value);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
            $e.text(this.value);
        }
    }
    Booklet_expr.BE_text = BE_text;
    class BE_image extends Booklet_expr$Base {
        path;
        static $tag = 1 /* $Tags.BE_image */;
        $tag = 1 /* $Tags.BE_image */;
        constructor(path) {
            super();
            this.path = path;
        }
        static decode($d) {
            return BE_image.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 1) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-image: expected 1`);
            }
            const path = $d.text();
            return new BE_image(path);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(1);
            $e.text(this.path);
        }
    }
    Booklet_expr.BE_image = BE_image;
    class BE_bold extends Booklet_expr$Base {
        value;
        static $tag = 2 /* $Tags.BE_bold */;
        $tag = 2 /* $Tags.BE_bold */;
        constructor(value) {
            super();
            this.value = value;
        }
        static decode($d) {
            return BE_bold.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 2) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-bold: expected 2`);
            }
            const value = Booklet_expr$Base.$do_decode($d);
            return new BE_bold(value);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(2);
            (this.value).$do_encode($e);
        }
    }
    Booklet_expr.BE_bold = BE_bold;
    class BE_italic extends Booklet_expr$Base {
        value;
        static $tag = 3 /* $Tags.BE_italic */;
        $tag = 3 /* $Tags.BE_italic */;
        constructor(value) {
            super();
            this.value = value;
        }
        static decode($d) {
            return BE_italic.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 3) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-italic: expected 3`);
            }
            const value = Booklet_expr$Base.$do_decode($d);
            return new BE_italic(value);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(3);
            (this.value).$do_encode($e);
        }
    }
    Booklet_expr.BE_italic = BE_italic;
    class BE_title extends Booklet_expr$Base {
        value;
        static $tag = 4 /* $Tags.BE_title */;
        $tag = 4 /* $Tags.BE_title */;
        constructor(value) {
            super();
            this.value = value;
        }
        static decode($d) {
            return BE_title.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 4) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-title: expected 4`);
            }
            const value = Booklet_expr$Base.$do_decode($d);
            return new BE_title(value);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(4);
            (this.value).$do_encode($e);
        }
    }
    Booklet_expr.BE_title = BE_title;
    class BE_subtitle extends Booklet_expr$Base {
        value;
        static $tag = 5 /* $Tags.BE_subtitle */;
        $tag = 5 /* $Tags.BE_subtitle */;
        constructor(value) {
            super();
            this.value = value;
        }
        static decode($d) {
            return BE_subtitle.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 5) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-subtitle: expected 5`);
            }
            const value = Booklet_expr$Base.$do_decode($d);
            return new BE_subtitle(value);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(5);
            (this.value).$do_encode($e);
        }
    }
    Booklet_expr.BE_subtitle = BE_subtitle;
    class BE_subtitle2 extends Booklet_expr$Base {
        value;
        static $tag = 6 /* $Tags.BE_subtitle2 */;
        $tag = 6 /* $Tags.BE_subtitle2 */;
        constructor(value) {
            super();
            this.value = value;
        }
        static decode($d) {
            return BE_subtitle2.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 6) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-subtitle2: expected 6`);
            }
            const value = Booklet_expr$Base.$do_decode($d);
            return new BE_subtitle2(value);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(6);
            (this.value).$do_encode($e);
        }
    }
    Booklet_expr.BE_subtitle2 = BE_subtitle2;
    class BE_font extends Booklet_expr$Base {
        family;
        size;
        value;
        static $tag = 7 /* $Tags.BE_font */;
        $tag = 7 /* $Tags.BE_font */;
        constructor(family, size, value) {
            super();
            this.family = family;
            this.size = size;
            this.value = value;
        }
        static decode($d) {
            return BE_font.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 7) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-font: expected 7`);
            }
            const family = $d.text();
            const size = $d.ui32();
            const value = Booklet_expr$Base.$do_decode($d);
            return new BE_font(family, size, value);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(7);
            $e.text(this.family);
            $e.ui32(this.size);
            (this.value).$do_encode($e);
        }
    }
    Booklet_expr.BE_font = BE_font;
    class BE_color extends Booklet_expr$Base {
        r;
        g;
        b;
        value;
        static $tag = 8 /* $Tags.BE_color */;
        $tag = 8 /* $Tags.BE_color */;
        constructor(r, g, b, value) {
            super();
            this.r = r;
            this.g = g;
            this.b = b;
            this.value = value;
        }
        static decode($d) {
            return BE_color.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 8) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-color: expected 8`);
            }
            const r = $d.ui8();
            const g = $d.ui8();
            const b = $d.ui8();
            const value = Booklet_expr$Base.$do_decode($d);
            return new BE_color(r, g, b, value);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(8);
            $e.ui8(this.r);
            $e.ui8(this.g);
            $e.ui8(this.b);
            (this.value).$do_encode($e);
        }
    }
    Booklet_expr.BE_color = BE_color;
    class BE_background extends Booklet_expr$Base {
        r;
        g;
        b;
        value;
        static $tag = 9 /* $Tags.BE_background */;
        $tag = 9 /* $Tags.BE_background */;
        constructor(r, g, b, value) {
            super();
            this.r = r;
            this.g = g;
            this.b = b;
            this.value = value;
        }
        static decode($d) {
            return BE_background.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 9) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-background: expected 9`);
            }
            const r = $d.ui8();
            const g = $d.ui8();
            const b = $d.ui8();
            const value = Booklet_expr$Base.$do_decode($d);
            return new BE_background(r, g, b, value);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(9);
            $e.ui8(this.r);
            $e.ui8(this.g);
            $e.ui8(this.b);
            (this.value).$do_encode($e);
        }
    }
    Booklet_expr.BE_background = BE_background;
    class BE_columns extends Booklet_expr$Base {
        columns;
        value;
        static $tag = 10 /* $Tags.BE_columns */;
        $tag = 10 /* $Tags.BE_columns */;
        constructor(columns, value) {
            super();
            this.columns = columns;
            this.value = value;
        }
        static decode($d) {
            return BE_columns.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 10) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-columns: expected 10`);
            }
            const columns = $d.ui8();
            const value = Booklet_expr$Base.$do_decode($d);
            return new BE_columns(columns, value);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(10);
            $e.ui8(this.columns);
            (this.value).$do_encode($e);
        }
    }
    Booklet_expr.BE_columns = BE_columns;
    class BE_fixed extends Booklet_expr$Base {
        x;
        y;
        value;
        static $tag = 11 /* $Tags.BE_fixed */;
        $tag = 11 /* $Tags.BE_fixed */;
        constructor(x, y, value) {
            super();
            this.x = x;
            this.y = y;
            this.value = value;
        }
        static decode($d) {
            return BE_fixed.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 11) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-fixed: expected 11`);
            }
            const x = $d.ui32();
            const y = $d.ui32();
            const value = Booklet_expr$Base.$do_decode($d);
            return new BE_fixed(x, y, value);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(11);
            $e.ui32(this.x);
            $e.ui32(this.y);
            (this.value).$do_encode($e);
        }
    }
    Booklet_expr.BE_fixed = BE_fixed;
    class BE_row extends Booklet_expr$Base {
        gap;
        align;
        value;
        static $tag = 12 /* $Tags.BE_row */;
        $tag = 12 /* $Tags.BE_row */;
        constructor(gap, align, value) {
            super();
            this.gap = gap;
            this.align = align;
            this.value = value;
        }
        static decode($d) {
            return BE_row.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 12) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-row: expected 12`);
            }
            const gap = $d.ui32();
            const align = Booklet_align$Base.$do_decode($d);
            const value = Booklet_expr$Base.$do_decode($d);
            return new BE_row(gap, align, value);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(12);
            $e.ui32(this.gap);
            (this.align).$do_encode($e);
            (this.value).$do_encode($e);
        }
    }
    Booklet_expr.BE_row = BE_row;
    class BE_column extends Booklet_expr$Base {
        gap;
        align;
        value;
        static $tag = 13 /* $Tags.BE_column */;
        $tag = 13 /* $Tags.BE_column */;
        constructor(gap, align, value) {
            super();
            this.gap = gap;
            this.align = align;
            this.value = value;
        }
        static decode($d) {
            return BE_column.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 13) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-column: expected 13`);
            }
            const gap = $d.ui32();
            const align = Booklet_align$Base.$do_decode($d);
            const value = Booklet_expr$Base.$do_decode($d);
            return new BE_column(gap, align, value);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(13);
            $e.ui32(this.gap);
            (this.align).$do_encode($e);
            (this.value).$do_encode($e);
        }
    }
    Booklet_expr.BE_column = BE_column;
    class BE_stack extends Booklet_expr$Base {
        values;
        static $tag = 14 /* $Tags.BE_stack */;
        $tag = 14 /* $Tags.BE_stack */;
        constructor(values) {
            super();
            this.values = values;
        }
        static decode($d) {
            return BE_stack.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 14) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-stack: expected 14`);
            }
            const values = $d.array(() => {
                const item = Booklet_expr$Base.$do_decode($d);
                ;
                return item;
            });
            return new BE_stack(values);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(14);
            $e.array((this.values), ($e, v) => {
                (v).$do_encode($e);
            });
        }
    }
    Booklet_expr.BE_stack = BE_stack;
    class BE_table extends Booklet_expr$Base {
        headers;
        rows;
        static $tag = 15 /* $Tags.BE_table */;
        $tag = 15 /* $Tags.BE_table */;
        constructor(headers, rows) {
            super();
            this.headers = headers;
            this.rows = rows;
        }
        static decode($d) {
            return BE_table.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 15) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-table: expected 15`);
            }
            const headers = $d.array(() => {
                const item = Booklet_expr$Base.$do_decode($d);
                ;
                return item;
            });
            const rows = Booklet_row.$do_decode($d);
            return new BE_table(headers, rows);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(15);
            $e.array((this.headers), ($e, v) => {
                (v).$do_encode($e);
            });
            (this.rows).$do_encode($e);
        }
    }
    Booklet_expr.BE_table = BE_table;
    class BE_class extends Booklet_expr$Base {
        name;
        value;
        static $tag = 16 /* $Tags.BE_class */;
        $tag = 16 /* $Tags.BE_class */;
        constructor(name, value) {
            super();
            this.name = name;
            this.value = value;
        }
        static decode($d) {
            return BE_class.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 16) {
                throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-class: expected 16`);
            }
            const name = $d.text();
            const value = Booklet_expr$Base.$do_decode($d);
            return new BE_class(name, value);
        }
        encode($e) {
            $e.ui32(20);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(16);
            $e.text(this.name);
            (this.value).$do_encode($e);
        }
    }
    Booklet_expr.BE_class = BE_class;
})(Booklet_expr = exports.Booklet_expr || (exports.Booklet_expr = {}));
class Booklet_row {
    row_span;
    cells;
    static $tag = 21;
    $tag = 21;
    constructor(row_span, cells) {
        this.row_span = row_span;
        this.cells = cells;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 21) {
            throw new Error(`Invalid tag ${$tag} for Booklet-row: expected 21`);
        }
        return Booklet_row.$do_decode($d);
    }
    static $do_decode($d) {
        const row_span = $d.ui32();
        const cells = $d.array(() => {
            const item = Booklet_cell.$do_decode($d);
            ;
            return item;
        });
        return new Booklet_row(row_span, cells);
    }
    encode($e) {
        $e.ui32(21);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.ui32(this.row_span);
        $e.array((this.cells), ($e, v) => {
            (v).$do_encode($e);
        });
    }
}
exports.Booklet_row = Booklet_row;
class Booklet_cell {
    cell_span;
    value;
    static $tag = 22;
    $tag = 22;
    constructor(cell_span, value) {
        this.cell_span = cell_span;
        this.value = value;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 22) {
            throw new Error(`Invalid tag ${$tag} for Booklet-cell: expected 22`);
        }
        return Booklet_cell.$do_decode($d);
    }
    static $do_decode($d) {
        const cell_span = $d.ui32();
        const value = Booklet_expr$Base.$do_decode($d);
        return new Booklet_cell(cell_span, value);
    }
    encode($e) {
        $e.ui32(22);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.ui32(this.cell_span);
        (this.value).$do_encode($e);
    }
}
exports.Booklet_cell = Booklet_cell;
class Booklet_align$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 23) {
            throw new Error(`Invalid tag ${$tag} for Booklet-align: expected 23`);
        }
        return Booklet_align$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Booklet_align.Start.decode($d);
            case 1: return Booklet_align.Center.decode($d);
            case 2: return Booklet_align.End.decode($d);
            case 3: return Booklet_align.Justify.decode($d);
            case 4: return Booklet_align.Space_evenly.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Booklet-align`);
        }
    }
}
exports.Booklet_align$Base = Booklet_align$Base;
var Booklet_align;
(function (Booklet_align) {
    class Start extends Booklet_align$Base {
        static $tag = 0 /* $Tags.Start */;
        $tag = 0 /* $Tags.Start */;
        constructor() {
            super();
        }
        static decode($d) {
            return Start.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Booklet-align.Start: expected 0`);
            }
            return new Start();
        }
        encode($e) {
            $e.ui32(23);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
        }
    }
    Booklet_align.Start = Start;
    class Center extends Booklet_align$Base {
        static $tag = 1 /* $Tags.Center */;
        $tag = 1 /* $Tags.Center */;
        constructor() {
            super();
        }
        static decode($d) {
            return Center.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 1) {
                throw new Error(`Invalid tag ${$tag} for Booklet-align.Center: expected 1`);
            }
            return new Center();
        }
        encode($e) {
            $e.ui32(23);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(1);
        }
    }
    Booklet_align.Center = Center;
    class End extends Booklet_align$Base {
        static $tag = 2 /* $Tags.End */;
        $tag = 2 /* $Tags.End */;
        constructor() {
            super();
        }
        static decode($d) {
            return End.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 2) {
                throw new Error(`Invalid tag ${$tag} for Booklet-align.End: expected 2`);
            }
            return new End();
        }
        encode($e) {
            $e.ui32(23);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(2);
        }
    }
    Booklet_align.End = End;
    class Justify extends Booklet_align$Base {
        static $tag = 3 /* $Tags.Justify */;
        $tag = 3 /* $Tags.Justify */;
        constructor() {
            super();
        }
        static decode($d) {
            return Justify.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 3) {
                throw new Error(`Invalid tag ${$tag} for Booklet-align.Justify: expected 3`);
            }
            return new Justify();
        }
        encode($e) {
            $e.ui32(23);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(3);
        }
    }
    Booklet_align.Justify = Justify;
    class Space_evenly extends Booklet_align$Base {
        static $tag = 4 /* $Tags.Space_evenly */;
        $tag = 4 /* $Tags.Space_evenly */;
        constructor() {
            super();
        }
        static decode($d) {
            return Space_evenly.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 4) {
                throw new Error(`Invalid tag ${$tag} for Booklet-align.Space-evenly: expected 4`);
            }
            return new Space_evenly();
        }
        encode($e) {
            $e.ui32(23);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(4);
        }
    }
    Booklet_align.Space_evenly = Space_evenly;
})(Booklet_align = exports.Booklet_align || (exports.Booklet_align = {}));
class Platform$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 24) {
            throw new Error(`Invalid tag ${$tag} for Platform: expected 24`);
        }
        return Platform$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Platform.Web_archive.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Platform`);
        }
    }
}
exports.Platform$Base = Platform$Base;
var Platform;
(function (Platform) {
    class Web_archive extends Platform$Base {
        html;
        bridges;
        static $tag = 0 /* $Tags.Web_archive */;
        $tag = 0 /* $Tags.Web_archive */;
        constructor(html, bridges) {
            super();
            this.html = html;
            this.bridges = bridges;
        }
        static decode($d) {
            return Web_archive.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Platform.Web-archive: expected 0`);
            }
            const html = $d.text();
            const bridges = $d.array(() => {
                const item = Bridge$Base.$do_decode($d);
                ;
                return item;
            });
            return new Web_archive(html, bridges);
        }
        encode($e) {
            $e.ui32(24);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
            $e.text(this.html);
            $e.array((this.bridges), ($e, v) => {
                (v).$do_encode($e);
            });
        }
    }
    Platform.Web_archive = Web_archive;
})(Platform = exports.Platform || (exports.Platform = {}));
class Bridge$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 25) {
            throw new Error(`Invalid tag ${$tag} for Bridge: expected 25`);
        }
        return Bridge$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Bridge.Network_proxy.decode($d);
            case 1: return Bridge.Local_storage_proxy.decode($d);
            case 2: return Bridge.Input_proxy.decode($d);
            case 3: return Bridge.Preserve_webgl_render.decode($d);
            case 4: return Bridge.Capture_canvas.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Bridge`);
        }
    }
}
exports.Bridge$Base = Bridge$Base;
var Bridge;
(function (Bridge) {
    class Network_proxy extends Bridge$Base {
        static $tag = 0 /* $Tags.Network_proxy */;
        $tag = 0 /* $Tags.Network_proxy */;
        constructor() {
            super();
        }
        static decode($d) {
            return Network_proxy.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Bridge.Network-proxy: expected 0`);
            }
            return new Network_proxy();
        }
        encode($e) {
            $e.ui32(25);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
        }
    }
    Bridge.Network_proxy = Network_proxy;
    class Local_storage_proxy extends Bridge$Base {
        static $tag = 1 /* $Tags.Local_storage_proxy */;
        $tag = 1 /* $Tags.Local_storage_proxy */;
        constructor() {
            super();
        }
        static decode($d) {
            return Local_storage_proxy.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 1) {
                throw new Error(`Invalid tag ${$tag} for Bridge.Local-storage-proxy: expected 1`);
            }
            return new Local_storage_proxy();
        }
        encode($e) {
            $e.ui32(25);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(1);
        }
    }
    Bridge.Local_storage_proxy = Local_storage_proxy;
    class Input_proxy extends Bridge$Base {
        mapping;
        static $tag = 2 /* $Tags.Input_proxy */;
        $tag = 2 /* $Tags.Input_proxy */;
        constructor(mapping) {
            super();
            this.mapping = mapping;
        }
        static decode($d) {
            return Input_proxy.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 2) {
                throw new Error(`Invalid tag ${$tag} for Bridge.Input-proxy: expected 2`);
            }
            const mapping = $d.map(() => {
                const key = VirtualKey$Base.$do_decode($d);
                ;
                return key;
            }, () => {
                const value = KeyboardKey.$do_decode($d);
                ;
                return value;
            });
            return new Input_proxy(mapping);
        }
        encode($e) {
            $e.ui32(25);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(2);
            $e.map((this.mapping), ($e, k) => { (k).$do_encode($e); }, ($e, v) => { (v).$do_encode($e); });
        }
    }
    Bridge.Input_proxy = Input_proxy;
    class Preserve_webgl_render extends Bridge$Base {
        static $tag = 3 /* $Tags.Preserve_webgl_render */;
        $tag = 3 /* $Tags.Preserve_webgl_render */;
        constructor() {
            super();
        }
        static decode($d) {
            return Preserve_webgl_render.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 3) {
                throw new Error(`Invalid tag ${$tag} for Bridge.Preserve-webgl-render: expected 3`);
            }
            return new Preserve_webgl_render();
        }
        encode($e) {
            $e.ui32(25);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(3);
        }
    }
    Bridge.Preserve_webgl_render = Preserve_webgl_render;
    class Capture_canvas extends Bridge$Base {
        selector;
        static $tag = 4 /* $Tags.Capture_canvas */;
        $tag = 4 /* $Tags.Capture_canvas */;
        constructor(selector) {
            super();
            this.selector = selector;
        }
        static decode($d) {
            return Capture_canvas.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 4) {
                throw new Error(`Invalid tag ${$tag} for Bridge.Capture-canvas: expected 4`);
            }
            const selector = $d.text();
            return new Capture_canvas(selector);
        }
        encode($e) {
            $e.ui32(25);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(4);
            $e.text(this.selector);
        }
    }
    Bridge.Capture_canvas = Capture_canvas;
})(Bridge = exports.Bridge || (exports.Bridge = {}));
class VirtualKey$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 26) {
            throw new Error(`Invalid tag ${$tag} for VirtualKey: expected 26`);
        }
        return VirtualKey$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return VirtualKey.Up.decode($d);
            case 1: return VirtualKey.Right.decode($d);
            case 2: return VirtualKey.Down.decode($d);
            case 3: return VirtualKey.Left.decode($d);
            case 4: return VirtualKey.Menu.decode($d);
            case 5: return VirtualKey.Capture.decode($d);
            case 6: return VirtualKey.X.decode($d);
            case 7: return VirtualKey.O.decode($d);
            case 8: return VirtualKey.L_trigger.decode($d);
            case 9: return VirtualKey.R_trigger.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union VirtualKey`);
        }
    }
}
exports.VirtualKey$Base = VirtualKey$Base;
var VirtualKey;
(function (VirtualKey) {
    class Up extends VirtualKey$Base {
        static $tag = 0 /* $Tags.Up */;
        $tag = 0 /* $Tags.Up */;
        constructor() {
            super();
        }
        static decode($d) {
            return Up.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for VirtualKey.Up: expected 0`);
            }
            return new Up();
        }
        encode($e) {
            $e.ui32(26);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
        }
    }
    VirtualKey.Up = Up;
    class Right extends VirtualKey$Base {
        static $tag = 1 /* $Tags.Right */;
        $tag = 1 /* $Tags.Right */;
        constructor() {
            super();
        }
        static decode($d) {
            return Right.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 1) {
                throw new Error(`Invalid tag ${$tag} for VirtualKey.Right: expected 1`);
            }
            return new Right();
        }
        encode($e) {
            $e.ui32(26);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(1);
        }
    }
    VirtualKey.Right = Right;
    class Down extends VirtualKey$Base {
        static $tag = 2 /* $Tags.Down */;
        $tag = 2 /* $Tags.Down */;
        constructor() {
            super();
        }
        static decode($d) {
            return Down.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 2) {
                throw new Error(`Invalid tag ${$tag} for VirtualKey.Down: expected 2`);
            }
            return new Down();
        }
        encode($e) {
            $e.ui32(26);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(2);
        }
    }
    VirtualKey.Down = Down;
    class Left extends VirtualKey$Base {
        static $tag = 3 /* $Tags.Left */;
        $tag = 3 /* $Tags.Left */;
        constructor() {
            super();
        }
        static decode($d) {
            return Left.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 3) {
                throw new Error(`Invalid tag ${$tag} for VirtualKey.Left: expected 3`);
            }
            return new Left();
        }
        encode($e) {
            $e.ui32(26);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(3);
        }
    }
    VirtualKey.Left = Left;
    class Menu extends VirtualKey$Base {
        static $tag = 4 /* $Tags.Menu */;
        $tag = 4 /* $Tags.Menu */;
        constructor() {
            super();
        }
        static decode($d) {
            return Menu.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 4) {
                throw new Error(`Invalid tag ${$tag} for VirtualKey.Menu: expected 4`);
            }
            return new Menu();
        }
        encode($e) {
            $e.ui32(26);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(4);
        }
    }
    VirtualKey.Menu = Menu;
    class Capture extends VirtualKey$Base {
        static $tag = 5 /* $Tags.Capture */;
        $tag = 5 /* $Tags.Capture */;
        constructor() {
            super();
        }
        static decode($d) {
            return Capture.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 5) {
                throw new Error(`Invalid tag ${$tag} for VirtualKey.Capture: expected 5`);
            }
            return new Capture();
        }
        encode($e) {
            $e.ui32(26);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(5);
        }
    }
    VirtualKey.Capture = Capture;
    class X extends VirtualKey$Base {
        static $tag = 6 /* $Tags.X */;
        $tag = 6 /* $Tags.X */;
        constructor() {
            super();
        }
        static decode($d) {
            return X.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 6) {
                throw new Error(`Invalid tag ${$tag} for VirtualKey.X: expected 6`);
            }
            return new X();
        }
        encode($e) {
            $e.ui32(26);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(6);
        }
    }
    VirtualKey.X = X;
    class O extends VirtualKey$Base {
        static $tag = 7 /* $Tags.O */;
        $tag = 7 /* $Tags.O */;
        constructor() {
            super();
        }
        static decode($d) {
            return O.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 7) {
                throw new Error(`Invalid tag ${$tag} for VirtualKey.O: expected 7`);
            }
            return new O();
        }
        encode($e) {
            $e.ui32(26);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(7);
        }
    }
    VirtualKey.O = O;
    class L_trigger extends VirtualKey$Base {
        static $tag = 8 /* $Tags.L_trigger */;
        $tag = 8 /* $Tags.L_trigger */;
        constructor() {
            super();
        }
        static decode($d) {
            return L_trigger.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 8) {
                throw new Error(`Invalid tag ${$tag} for VirtualKey.L-trigger: expected 8`);
            }
            return new L_trigger();
        }
        encode($e) {
            $e.ui32(26);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(8);
        }
    }
    VirtualKey.L_trigger = L_trigger;
    class R_trigger extends VirtualKey$Base {
        static $tag = 9 /* $Tags.R_trigger */;
        $tag = 9 /* $Tags.R_trigger */;
        constructor() {
            super();
        }
        static decode($d) {
            return R_trigger.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 9) {
                throw new Error(`Invalid tag ${$tag} for VirtualKey.R-trigger: expected 9`);
            }
            return new R_trigger();
        }
        encode($e) {
            $e.ui32(26);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(9);
        }
    }
    VirtualKey.R_trigger = R_trigger;
})(VirtualKey = exports.VirtualKey || (exports.VirtualKey = {}));
class KeyboardKey {
    key;
    code;
    key_code;
    static $tag = 27;
    $tag = 27;
    constructor(key, code, key_code) {
        this.key = key;
        this.code = code;
        this.key_code = key_code;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 27) {
            throw new Error(`Invalid tag ${$tag} for KeyboardKey: expected 27`);
        }
        return KeyboardKey.$do_decode($d);
    }
    static $do_decode($d) {
        const key = $d.text();
        const code = $d.text();
        const key_code = $d.ui32();
        return new KeyboardKey(key, code, key_code);
    }
    encode($e) {
        $e.ui32(27);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.text(this.key);
        $e.text(this.code);
        $e.ui32(this.key_code);
    }
}
exports.KeyboardKey = KeyboardKey;

});

// packages\schema\lib\fingerprint.js
require.define(55, "packages\\schema\\lib", "packages\\schema\\lib\\fingerprint.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove_fingerprint = exports.add_fingerprint = exports.check_fingerprint = exports.fingerprint = void 0;
exports.fingerprint = new Uint8Array("KATE/v04".split("").map((x) => x.charCodeAt(0)));
function check_fingerprint(data) {
    if (data.byteLength - data.byteOffset < exports.fingerprint.length) {
        throw new Error(`Invalid cartridge: unmatched fingerprint`);
    }
    for (let i = 0; i < exports.fingerprint.length; ++i) {
        if (exports.fingerprint[i] !== data.getUint8(i)) {
            throw new Error(`Invalid cartridge: unmatched fingerprint`);
        }
    }
}
exports.check_fingerprint = check_fingerprint;
function add_fingerprint(data) {
    const result = new Uint8Array(exports.fingerprint.length + data.length);
    result.set(exports.fingerprint, 0);
    result.set(data, exports.fingerprint.length);
    return result;
}
exports.add_fingerprint = add_fingerprint;
function remove_fingerprint(data) {
    check_fingerprint(data);
    return new DataView(data.buffer.slice(exports.fingerprint.length));
}
exports.remove_fingerprint = remove_fingerprint;

});

// packages\kate-core\build\cart\runtime.js
require.define(56, "packages\\kate-core\\build\\cart", "packages\\kate-core\\build\\cart\\runtime.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_runtime = void 0;
const v2_1 = require(53);
const utils_1 = require(5);
const parser_utils_1 = require(57);
function parse_runtime(cart) {
    const platform = cart.platform;
    switch (platform.$tag) {
        case 0 /* Cart_v2.Platform.$Tags.Web_archive */: {
            return {
                type: "web-archive",
                bridges: platform.bridges.map(bridge),
                html: str(platform.html, (0, parser_utils_1.chars_in_mb)(1)),
            };
        }
    }
}
exports.parse_runtime = parse_runtime;
function bridge(x) {
    switch (x.$tag) {
        case 2 /* Cart_v2.Bridge.$Tags.Input_proxy */: {
            return {
                type: "input-proxy",
                mapping: map_map(x.mapping, (a, b) => [
                    virtual_key(a),
                    keyboard_key(b),
                ]),
            };
        }
        case 1 /* Cart_v2.Bridge.$Tags.Local_storage_proxy */: {
            return { type: "local-storage-proxy" };
        }
        case 0 /* Cart_v2.Bridge.$Tags.Network_proxy */: {
            return { type: "network-proxy" };
        }
        case 3 /* Cart_v2.Bridge.$Tags.Preserve_webgl_render */: {
            return { type: "preserve-render" };
        }
        case 4 /* Cart_v2.Bridge.$Tags.Capture_canvas */: {
            return { type: "capture-canvas", selector: str(x.selector, 255) };
        }
        default:
            throw (0, utils_1.unreachable)(x);
    }
}
function map_map(map, f) {
    const result = new Map();
    for (const [k, v] of map.entries()) {
        const [k1, v1] = f(k, v);
        result.set(k1, v1);
    }
    return result;
}
function virtual_key(key) {
    switch (key.$tag) {
        case 5 /* Cart_v2.VirtualKey.$Tags.Capture */:
            return "capture";
        case 4 /* Cart_v2.VirtualKey.$Tags.Menu */:
            return "menu";
        case 0 /* Cart_v2.VirtualKey.$Tags.Up */:
            return "up";
        case 1 /* Cart_v2.VirtualKey.$Tags.Right */:
            return "right";
        case 2 /* Cart_v2.VirtualKey.$Tags.Down */:
            return "down";
        case 3 /* Cart_v2.VirtualKey.$Tags.Left */:
            return "left";
        case 7 /* Cart_v2.VirtualKey.$Tags.O */:
            return "o";
        case 6 /* Cart_v2.VirtualKey.$Tags.X */:
            return "x";
        case 8 /* Cart_v2.VirtualKey.$Tags.L_trigger */:
            return "ltrigger";
        case 9 /* Cart_v2.VirtualKey.$Tags.R_trigger */:
            return "rtrigger";
        default:
            throw (0, utils_1.unreachable)(key);
    }
}
function keyboard_key(key) {
    return {
        code: str(key.code, 255),
        key: str(key.key, 255),
        key_code: Number(key.key_code),
    };
}
function str(x, size = Infinity) {
    if (typeof x !== "string") {
        throw new Error(`Expected string`);
    }
    if (x.length > size) {
        throw new Error(`String is too long (maximum: ${size})`);
    }
    return x;
}

});

// packages\kate-core\build\cart\parser-utils.js
require.define(57, "packages\\kate-core\\build\\cart", "packages\\kate-core\\build\\cart\\parser-utils.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chars_in_mb = exports.list = exports.regex = exports.str = void 0;
function str(x, size = Infinity) {
    if (typeof x !== "string") {
        throw new Error(`Expected string`);
    }
    if (x.length > size) {
        throw new Error(`String is too long (maximum: ${size})`);
    }
    return x;
}
exports.str = str;
function regex(name, re) {
    return (x) => {
        if (!re.test(str(x))) {
            throw new Error(`Expected ${name}`);
        }
        return x;
    };
}
exports.regex = regex;
function list(x, size) {
    if (!Array.isArray(x)) {
        throw new Error(`Expected a list`);
    }
    if (x.length > size) {
        throw new Error(`List too long. (maximum: ${size})`);
    }
    return x;
}
exports.list = list;
function chars_in_mb(n) {
    return 2 * 1024 * 1024 * n;
}
exports.chars_in_mb = chars_in_mb;

});

// packages\kate-core\build\cart\files.js
require.define(58, "packages\\kate-core\\build\\cart", "packages\\kate-core\\build\\cart\\files.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_file = exports.parse_files = void 0;
function parse_files(cart) {
    return cart.files.map(parse_file);
}
exports.parse_files = parse_files;
function parse_file(file) {
    return {
        path: file.path,
        mime: file.mime,
        data: file.data,
    };
}
exports.parse_file = parse_file;

});

// packages\kate-core\build\cart\cart-type.js
require.define(59, "packages\\kate-core\\build\\cart", "packages\\kate-core\\build\\cart\\cart-type.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

});

// packages\kate-core\build\cart\parser.js
require.define(60, "packages\\kate-core\\build\\cart", "packages\\kate-core\\build\\cart\\parser.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.try_parse = void 0;
const v2_1 = require(53);
const parsers = [v2_1.parse_v2];
function try_parse(data) {
    for (const parser of parsers) {
        const cart = parser(data);
        if (cart != null) {
            return cart;
        }
    }
    return null;
}
exports.try_parse = try_parse;
function parse(data) {
    const cart = try_parse(data);
    if (cart == null) {
        throw new Error(`No suitable parsers found`);
    }
    return cart;
}
exports.parse = parse;

});

// packages\kate-core\build\os\apis\processes.js
require.define(61, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\processes.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateProcess = exports.KateProcesses = void 0;
const Cart = require(51);
const game_1 = require(62);
const load_screen_1 = require(49);
class KateProcesses {
    os;
    _running = null;
    constructor(os) {
        this.os = os;
    }
    get is_busy() {
        return this._running != null;
    }
    get running() {
        return this._running;
    }
    async run_from_cartridge(bytes) {
        if (this.is_busy) {
            throw new Error(`a process is already running`);
        }
        const cart = Cart.parse(bytes);
        const file_map = new Map(cart.files.map((x) => [x.path, x]));
        const storage = await this.os.object_store.try_get(cart.metadata.id, "kate:local-storage");
        const runtime = this.os.kernel.runtimes.from_cartridge(cart, {
            cart: cart,
            local_storage: storage,
            async read_file(path) {
                const file = file_map.get(path);
                if (file == null) {
                    throw new Error(`File not found in ${cart.metadata.id}: ${path}`);
                }
                return file;
            },
            on_playtime_update: () => { },
        });
        return await this.display_process(cart, runtime);
    }
    async display_process(cart, runtime) {
        const process = new KateProcess(this, cart, await runtime.run(this.os));
        this._running = process;
        this.os.push_scene(new game_1.SceneGame(this.os, process));
        return process;
    }
    async terminate(id, requester, reason) {
        if (this._running != null && this._running.cart.metadata.id === id) {
            await this.os.notifications.push(requester, "Process terminated", `${id} was terminated for ${reason}.`);
            await this._running.exit();
        }
    }
    async run(id) {
        if (this.is_busy) {
            throw new Error(`a process is already running`);
        }
        const loading = new load_screen_1.HUD_LoadIndicator(this.os);
        this.os.show_hud(loading);
        try {
            const cart = await this.os.cart_manager.read_metadata(id);
            const file_map = new Map(cart.files.map((x) => [x.path, x.id]));
            const storage = await this.os.object_store.get_local_storage(cart.metadata.id);
            const runtime = this.os.kernel.runtimes.from_cartridge(cart, {
                cart: cart,
                local_storage: storage,
                read_file: async (path) => {
                    const file_id = file_map.get(path);
                    if (file_id == null) {
                        throw new Error(`File not found in ${cart.metadata.id}: ${path}`);
                    }
                    const file = await this.os.cart_manager.read_file_by_id(id, file_id);
                    return { mime: file.mime, data: file.data, path: path };
                },
                on_playtime_update: async (time) => {
                    await this.os.cart_manager.increase_play_time(id, time);
                },
            });
            await this.os.cart_manager.update_last_played(id, new Date());
            return this.display_process(cart, runtime);
        }
        catch (error) {
            this._running = null;
            console.error(`Failed to run cartridge ${id}:`, error);
            await this.os.notifications.push("kate:os", `Failed to run`, `Cartridge may be corrupted or not compatible with this version.`);
        }
        finally {
            this.os.hide_hud(loading);
        }
    }
    notify_exit(process) {
        if (process === this._running) {
            this._running = null;
            this.os.pop_scene();
        }
    }
}
exports.KateProcesses = KateProcesses;
class KateProcess {
    manager;
    cart;
    runtime;
    _paused = false;
    constructor(manager, cart, runtime) {
        this.manager = manager;
        this.cart = cart;
        this.runtime = runtime;
    }
    async pause() {
        if (this._paused)
            return;
        this._paused = true;
        await this.runtime.pause();
    }
    async unpause() {
        if (!this._paused)
            return;
        this._paused = false;
        await this.runtime.unpause();
    }
    async exit() {
        await this.runtime.exit();
        this.manager.notify_exit(this);
    }
}
exports.KateProcess = KateProcess;

});

// packages\kate-core\build\os\apps\game.js
require.define(62, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\game.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneGame = void 0;
const widget_1 = require(34);
const scenes_1 = require(35);
class SceneGame extends scenes_1.Scene {
    process;
    constructor(os, process) {
        super(os);
        this.process = process;
    }
    on_attached() {
        this.os.focus_handler.on_focus_changed.listen(this.handle_focus_changed);
        this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    }
    on_detached() {
        this.os.focus_handler.on_focus_changed.remove(this.handle_focus_changed);
        this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    }
    handle_key_pressed = (x) => {
        return true;
    };
    handle_focus_changed = (focus) => {
        if (focus === this.canvas) {
            setTimeout(() => {
                this.process.unpause();
            });
        }
        else {
            this.process.pause();
        }
    };
    render() {
        return (0, widget_1.h)("div", { class: "kate-os-game" }, [this.process.runtime.node]);
    }
}
exports.SceneGame = SceneGame;

});

// packages\kate-core\build\os\apis\context_menu.js
require.define(63, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\context_menu.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_ContextMenu = exports.KateContextMenu = void 0;
const scenes_1 = require(35);
const about_kate_1 = require(40);
const media_1 = require(38);
const text_file_1 = require(43);
const UI = require(46);
const utils_1 = require(5);
class KateContextMenu {
    os;
    constructor(os) {
        this.os = os;
    }
    setup() {
        this.os.kernel.console.on_key_pressed.listen(this.handle_key_press);
    }
    teardown() {
        this.os.kernel.console.on_key_pressed.remove(this.handle_key_press);
    }
    handle_key_press = (x) => {
        if (x.is_repeat) {
            return;
        }
        switch (x.key) {
            case "long_menu": {
                this.show_context_menu();
                break;
            }
        }
    };
    show_context_menu() {
        if (this.in_context()) {
            return;
        }
        const menu = new HUD_ContextMenu(this.os, this);
        this.os.push_scene(menu);
    }
    in_context() {
        return this.os.display.querySelector(".kate-os-hud-context-menu") != null;
    }
}
exports.KateContextMenu = KateContextMenu;
class HUD_ContextMenu extends scenes_1.Scene {
    os;
    context;
    on_close = new utils_1.EventStream();
    constructor(os, context) {
        super(os);
        this.os = os;
        this.context = context;
    }
    render() {
        const fullscreen_button = () => UI.fa_icon_button("expand", "Fullscreen").on_clicked(this.on_toggle_fullscreen);
        const emulator = this.os.kernel.console;
        return UI.h("div", { class: "kate-os-hud-context-menu" }, [
            UI.h("div", { class: "kate-os-hud-context-menu-backdrop" }, []),
            UI.h("div", { class: "kate-os-hud-context-menu-content" }, [
                UI.h("div", { class: "kate-os-hud-context-menu-items" }, [
                    new UI.If(() => this.os.processes.running != null, {
                        then: new UI.Menu_list([
                            UI.when(emulator.options.mode !== "single", [
                                UI.fa_icon_button("square-xmark", "Close game").on_clicked(this.on_close_game),
                            ]),
                            fullscreen_button(),
                            UI.fa_icon_button("circle-info", "Legal notices").on_clicked(this.on_legal_notices),
                            UI.fa_icon_button("images", "Media gallery").on_clicked(this.on_media_gallery),
                            UI.when(emulator.options.mode === "single", [
                                UI.fa_icon_button("cat", "About Kate").on_clicked(this.on_about_kate),
                            ]),
                        ]),
                        else: new UI.Menu_list([
                            UI.when(emulator.options.mode === "native", [
                                UI.fa_icon_button("power-off", "Power off").on_clicked(this.on_power_off),
                            ]),
                            fullscreen_button(),
                            UI.fa_icon_button("download", "Install cartridge").on_clicked(this.on_install_from_file),
                        ]),
                    }),
                ]),
                UI.h("div", { class: "kate-os-statusbar" }, [
                    UI.icon_button("x", "Return").on_clicked(this.on_return),
                    UI.icon_button("o", "Select").on_clicked(() => { }),
                ]),
            ]),
        ]);
    }
    on_attached() {
        this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    }
    on_detached() {
        this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
    }
    handle_key_pressed = (x) => {
        switch (x.key) {
            case "x": {
                if (!x.is_repeat) {
                    this.on_return();
                    return true;
                }
            }
        }
        return false;
    };
    on_media_gallery = async () => {
        const process = this.os.processes.running;
        const media = new media_1.SceneMedia(this.os, {
            id: process.cart.metadata.id,
            title: process.cart.metadata.game.title,
        });
        this.os.push_scene(media);
    };
    on_legal_notices = () => {
        const process = this.os.processes.running;
        const legal = new text_file_1.SceneTextFile(this.os, "Legal Notices", process.cart.metadata.game.title, process.cart.metadata.release.legal_notices);
        this.os.push_scene(legal);
    };
    on_about_kate = () => {
        this.os.push_scene(new about_kate_1.SceneAboutKate(this.os));
    };
    on_toggle_fullscreen = () => {
        this.close();
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        else {
            this.os.kernel.console.request_fullscreen();
        }
    };
    close() {
        this.os.pop_scene();
        this.on_close.emit();
    }
    on_install_from_file = async () => {
        this.close();
        return new Promise((resolve, reject) => {
            const installer = document.querySelector("#kate-installer");
            const teardown = () => {
                installer.onchange = () => { };
                installer.onerror = () => { };
                installer.onabort = () => { };
            };
            installer.onchange = async (ev) => {
                try {
                    const file = installer.files.item(0);
                    await this.os.cart_manager.install_from_file(file);
                    teardown();
                    resolve();
                }
                catch (error) {
                    teardown();
                    reject(error);
                }
            };
            installer.onerror = async () => {
                teardown();
                reject(new Error(`failed to install`));
            };
            installer.onabort = async () => {
                teardown();
                reject(new Error(`failed to install`));
            };
            installer.click();
        });
    };
    on_close_game = async () => {
        this.close();
        await this.os.processes.running?.exit();
    };
    on_return = async () => {
        this.close();
    };
    on_power_off = async () => {
        this.close();
        window.close();
    };
}
exports.HUD_ContextMenu = HUD_ContextMenu;

});

// packages\kate-core\build\os\apis\notification.js
require.define(64, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\notification.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_Toaster = exports.KateNotification = void 0;
const scenes_1 = require(35);
const UI = require(46);
const Db = require(27);
const time_1 = require(32);
class KateNotification {
    os;
    hud;
    constructor(os) {
        this.os = os;
        this.hud = new HUD_Toaster(this);
    }
    setup() {
        this.hud.setup();
    }
    async push(process_id, title, message) {
        await this.log(process_id, title, message);
        this.hud.show(title, message);
    }
    async log(process_id, title, message) {
        await this.os.db.transaction([Db.notifications], "readwrite", async (t) => {
            const notifications = t.get_table1(Db.notifications);
            await notifications.put({
                type: "basic",
                process_id,
                time: new Date(),
                title,
                message,
            });
        });
    }
    async push_transient(process_id, title, message) {
        this.hud.show(title, message);
    }
}
exports.KateNotification = KateNotification;
class HUD_Toaster extends scenes_1.Scene {
    manager;
    NOTIFICATION_WAIT_TIME_MS = 5000;
    FADE_OUT_TIME_MS = 250;
    constructor(manager) {
        super(manager.os);
        this.manager = manager;
        this.canvas = UI.h("div", { class: "kate-hud-notifications" }, []);
    }
    setup() {
        this.manager.os.show_hud(this);
    }
    teardown() {
        this.manager.os.hide_hud(this);
    }
    render() {
        return null;
    }
    async show(title, message) {
        const element = UI.h("div", { class: "kate-hud-notification-item" }, [
            UI.h("div", { class: "kate-hud-notification-title" }, [title]),
            UI.h("div", { class: "kate-hud-notification-message" }, [message]),
        ]);
        this.canvas.appendChild(element);
        await (0, time_1.wait)(this.NOTIFICATION_WAIT_TIME_MS);
        element.classList.add("leaving");
        await (0, time_1.wait)(this.FADE_OUT_TIME_MS);
        element.remove();
    }
}
exports.HUD_Toaster = HUD_Toaster;

});

// packages\kate-core\build\os\apis\drop-installer.js
require.define(65, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\drop-installer.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_DropInstaller = exports.KateDropInstaller = void 0;
const scenes_1 = require(35);
const UI = require(46);
class KateDropInstaller {
    os;
    hud;
    constructor(os) {
        this.os = os;
        this.hud = new HUD_DropInstaller(this);
    }
    setup() {
        this.hud.setup();
    }
    async install(files) {
        const valid = files.filter((x) => x.name.endsWith(".kart"));
        const status = this.os.status_bar.show(`Installing ${files.length} carts...`);
        for (const file of valid) {
            if (!file.name.endsWith(".kart")) {
                continue;
            }
            status.update(`Installing ${file.name}...`);
            await this.os.cart_manager.install_from_file(file);
        }
        status.hide();
    }
}
exports.KateDropInstaller = KateDropInstaller;
class HUD_DropInstaller extends scenes_1.Scene {
    manager;
    constructor(manager) {
        super(manager.os);
        this.manager = manager;
        this.canvas = UI.h("div", { class: "kate-hud-drop-installer" }, []);
    }
    setup() {
        this.manager.os.show_hud(this);
        const screen = this.manager.os.kernel.console.body;
        screen.addEventListener("dragenter", (ev) => {
            this.canvas.classList.add("active");
            screen.classList.add("drag");
        });
        screen.addEventListener("dragleave", (ev) => {
            this.canvas.classList.remove("active");
            screen.classList.remove("drag");
        });
        screen.addEventListener("dragover", (ev) => {
            ev.preventDefault();
            ev.dataTransfer.dropEffect = "copy";
        });
        screen.addEventListener("drop", (ev) => {
            ev.preventDefault();
            this.canvas.classList.remove("active");
            screen.classList.remove("drag");
            this.manager.install([...ev.dataTransfer.files]);
        });
    }
    render() {
        return UI.fragment([
            UI.h("div", { class: "kate-hud-drop-installer-icon" }, [
                UI.fa_icon("download", "3x"),
            ]),
            UI.h("div", { class: "kate-hud-drop-installer-description" }, [
                "Drop ",
                UI.h("tt", {}, [".kart"]),
                " files here to install them",
            ]),
        ]);
    }
}
exports.HUD_DropInstaller = HUD_DropInstaller;

});

// packages\kate-core\build\os\apis\focus-handler.js
require.define(66, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\focus-handler.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateFocusHandler = void 0;
const utils_1 = require(5);
class KateFocusHandler {
    os;
    _stack = [];
    _current_root = null;
    _handlers = [];
    on_focus_changed = new utils_1.EventStream();
    constructor(os) {
        this.os = os;
    }
    setup() {
        this.os.kernel.console.on_key_pressed.listen(this.handle_input);
    }
    listen(root, handler) {
        this._handlers.push({ root, handler });
    }
    remove(root, handler) {
        this._handlers = this._handlers.filter((x) => x.root !== root && x.handler !== handler);
    }
    should_handle(key) {
        return ["up", "down", "left", "right", "o"].includes(key);
    }
    get current_root() {
        return this._current_root;
    }
    get current_focus() {
        return this._current_root?.querySelector(".focus") ?? null;
    }
    push_root(element) {
        this._stack.push(this._current_root);
        this._current_root = element;
        this.on_focus_changed.emit(element);
        if (element != null && element.querySelector(".focus") == null) {
            const candidates0 = Array.from(element.querySelectorAll(".kate-ui-focus-target"));
            const candidates = candidates0.sort((a, b) => a.offsetTop - b.offsetTop);
            this.focus(candidates[0]);
        }
    }
    pop_root(expected) {
        if (expected != this._current_root) {
            console.warn(`pop_root() with unexpected root`, {
                expected,
                current: this._current_root,
            });
            return;
        }
        if (this._stack.length > 0) {
            this._current_root = this._stack.pop();
            this.on_focus_changed.emit(this._current_root);
        }
        else {
            throw new Error(`pop_root() on an empty focus stack`);
        }
    }
    handle_input = ({ key, is_repeat, }) => {
        if (this._current_root == null) {
            return;
        }
        for (const { root, handler } of this._handlers) {
            if (this._current_root === root) {
                if (handler({ key, is_repeat })) {
                    return;
                }
            }
        }
        if ((key === "capture" || key === "long_capture") && !is_repeat) {
            this.os.notifications.push_transient("kate:focus-manager", "Capture unsupported", "Screen capture is not available right now.");
            return;
        }
        if (!this.should_handle(key)) {
            return;
        }
        const focusable = Array.from(this._current_root.querySelectorAll(".kate-ui-focus-target")).map((x) => ({
            element: x,
            position: {
                x: x.offsetLeft,
                y: x.offsetTop,
                width: x.offsetWidth,
                height: x.offsetHeight,
                right: x.offsetLeft + x.offsetWidth,
                bottom: x.offsetTop + x.offsetHeight,
            },
        }));
        const right_limit = Math.max(...focusable.map((x) => x.position.right));
        const bottom_limit = Math.max(...focusable.map((x) => x.position.bottom));
        const current = focusable.find((x) => x.element.classList.contains("focus"));
        const left = current?.position.x ?? -1;
        const top = current?.position.y ?? -1;
        const right = current?.position.right ?? right_limit + 1;
        const bottom = current?.position.bottom ?? bottom_limit + 1;
        switch (key) {
            case "o": {
                if (current != null && !is_repeat) {
                    this.os.sfx.play("select");
                    current.element.click();
                }
                break;
            }
            case "up": {
                const candidates = focusable
                    .filter((x) => x.position.bottom < bottom)
                    .sort((a, b) => b.position.bottom - a.position.bottom);
                const closest = candidates.sort((a, b) => Math.abs(a.position.x - left) - Math.abs(b.position.x - left));
                this.focus(closest[0]?.element, key);
                break;
            }
            case "down": {
                const candidates = focusable
                    .filter((x) => x.position.y > top)
                    .sort((a, b) => a.position.y - b.position.y);
                const closest = candidates.sort((a, b) => Math.abs(a.position.x - left) - Math.abs(b.position.x - left));
                this.focus(closest[0]?.element, key);
                break;
            }
            case "left": {
                const candidates = focusable
                    .filter((x) => x.position.right < right)
                    .sort((a, b) => b.position.right - a.position.right);
                const closest = candidates.sort((a, b) => Math.abs(a.position.y - top) - Math.abs(b.position.y - top));
                this.focus(closest[0]?.element, key);
                break;
            }
            case "right": {
                const candidates = focusable
                    .filter((x) => x.position.x > left)
                    .sort((a, b) => a.position.x - b.position.x);
                const closest = candidates.sort((a, b) => Math.abs(a.position.y - top) - Math.abs(b.position.y - top));
                this.focus(closest[0]?.element, key);
                break;
            }
        }
    };
    focus(element, key = null) {
        if (element == null || this._current_root == null) {
            if (key != null) {
                this.os.sfx.play("invalid");
            }
            return;
        }
        if (key != null) {
            this.os.sfx.play("cursor");
        }
        for (const x of Array.from(this._current_root.querySelectorAll(".focus"))) {
            x.classList.remove("focus");
        }
        element.focus();
        element.classList.add("focus");
        element.scrollIntoView({
            block: "center",
            inline: "center",
        });
    }
}
exports.KateFocusHandler = KateFocusHandler;

});

// packages\kate-core\build\os\apis\status-bar.js
require.define(67, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\status-bar.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateStatus = exports.HUD_StatusBar = exports.KateStatusBar = void 0;
const ui_1 = require(46);
const scenes_1 = require(35);
class KateStatusBar {
    os;
    hud;
    constructor(os) {
        this.os = os;
        this.hud = new HUD_StatusBar(this);
    }
    setup() {
        this.os.show_hud(this.hud);
    }
    show(content) {
        return this.hud.show(content);
    }
}
exports.KateStatusBar = KateStatusBar;
class HUD_StatusBar extends scenes_1.Scene {
    manager;
    _timer = null;
    STATUS_LINE_TIME_MS = 5000;
    constructor(manager) {
        super(manager.os);
        this.manager = manager;
        this.canvas = (0, ui_1.h)("div", { class: "kate-hud-status-bar" }, []);
    }
    render() {
        return null;
    }
    show(content) {
        const status = new KateStatus(this, (0, ui_1.h)("div", { class: "kate-hud-status-item" }, [content]));
        this.canvas.appendChild(status.canvas);
        this.tick();
        return status;
    }
    refresh() {
        const items = Array.from(this.canvas.querySelectorAll(".kate-hud-status-item"));
        if (items.length === 0) {
            this.canvas.classList.remove("active");
        }
        else {
            this.canvas.classList.add("active");
        }
    }
    tick() {
        clearTimeout(this._timer);
        const items = Array.from(this.canvas.querySelectorAll(".kate-hud-status-item"));
        if (items.length > 0) {
            this.canvas.classList.add("active");
            const current = items.findIndex((x) => x.classList.contains("active"));
            for (const item of items) {
                item.classList.remove("active");
            }
            items[(current + 1) % items.length]?.classList.add("active");
        }
        if (items.length > 1) {
            this._timer = setTimeout(() => this.tick(), this.STATUS_LINE_TIME_MS);
        }
    }
}
exports.HUD_StatusBar = HUD_StatusBar;
class KateStatus {
    display;
    canvas;
    constructor(display, canvas) {
        this.display = display;
        this.canvas = canvas;
    }
    hide() {
        this.canvas.remove();
        this.display.refresh();
    }
    update(content) {
        this.canvas.textContent = "";
        (0, ui_1.append)(content, this.canvas);
    }
}
exports.KateStatus = KateStatus;

});

// packages\kate-core\build\os\apis\ipc.js
require.define(68, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\ipc.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateIPCChannel = exports.KateIPCServer = void 0;
const utils_1 = require(5);
class KateIPCServer {
    os;
    _handlers = new Map();
    _initialised = false;
    constructor(os) {
        this.os = os;
    }
    setup() {
        if (this._initialised) {
            throw new Error(`setup() called twice`);
        }
        this._initialised = true;
        window.addEventListener("message", this.handle_message);
    }
    add_process(env) {
        if (this._handlers.has(env.secret)) {
            throw new Error(`Duplicated secret when constructing IPC channel`);
        }
        this._handlers.set(env.secret, env);
        return new KateIPCChannel(this, env);
    }
    remove_process(process) {
        this._handlers.delete(process.secret);
    }
    send(process, message) {
        process.frame.contentWindow?.postMessage(message, "*");
    }
    handle_message = async (ev) => {
        const secret = ev.data.secret;
        const type = ev.data.type;
        const id = ev.data.id;
        const payload = ev.data.payload;
        if (typeof secret === "string" &&
            typeof type === "string" &&
            typeof id === "string" &&
            typeof payload === "object") {
            console.debug("kate-ipc <==", { type, id, payload });
            const handler = this._handlers.get(secret);
            if (handler != null) {
                if (handler.frame.contentWindow !== ev.source) {
                    const suspicious_handler = this.handler_for_window(ev.source);
                    if (suspicious_handler != null) {
                        this.mark_suspicious_activity(ev, suspicious_handler);
                    }
                    return;
                }
                try {
                    const result = await this.process_message(handler, {
                        type: type,
                        payload,
                    });
                    if (result == null) {
                        return;
                    }
                    const { ok, value } = result;
                    console.debug("kate-ipc ==>", { id, ok, value });
                    handler.frame.contentWindow?.postMessage({
                        type: "kate:reply",
                        id: id,
                        ok: ok,
                        value: value,
                    }, "*");
                }
                catch (error) {
                    console.error(`[Kate] unknown error handling ${type}`, {
                        payload,
                        error,
                    });
                    handler.frame.contentWindow?.postMessage({
                        type: "kate:reply",
                        id: id,
                        ok: false,
                        value: { code: "kate.unknown-error" },
                    }, "*");
                }
            }
            else {
                const handler = this.handler_for_window(ev.source);
                if (handler != null) {
                    this.mark_suspicious_activity(ev, handler);
                }
            }
        }
    };
    async mark_suspicious_activity(ev, handler) {
        if (handler != null) {
            console.debug(`[Kate] suspicious IPC activity`, {
                message: ev.data,
                source: ev.source,
                origin: ev.origin,
            });
            this._handlers.delete(handler.secret);
            await this.os.processes.terminate(handler.cart.metadata.id, "kate:ipc", "suspicious IPC activity");
        }
    }
    handler_for_window(window) {
        for (const [key, env] of this._handlers.entries()) {
            if (env.frame.contentWindow === window) {
                return env;
            }
        }
        return null;
    }
    async consume_capture_token(token, env, message) {
        if (!env.capture_tokens.has(token)) {
            await this.mark_suspicious_activity({
                data: message,
                source: env.frame.contentWindow,
            }, env);
            throw new Error(`Invalid capture token.`);
        }
        env.capture_tokens.delete(token);
    }
    async process_message(env, message) {
        const err = (code) => ({ ok: false, value: { code } });
        const ok = (value) => ({ ok: true, value });
        switch (message.type) {
            // -- Special
            case "kate:special.focus": {
                window.focus();
                return null;
            }
            // -- Notification
            case "kate:notify.transient": {
                this.os.notifications.push_transient(env.cart.metadata.id, String(message.payload.title ?? ""), String(message.payload.message ?? ""));
                return null;
            }
            // -- Capture
            case "kate:capture.save-image": {
                await this.consume_capture_token(message.payload.token, env, message);
                try {
                    this.os.sfx.play("shutter");
                    await this.os.capture.save_screenshot(env.cart.metadata.id, message.payload.data, message.payload.type);
                }
                catch (error) {
                    console.debug(`[Kate] failed to save screenshot`, error);
                    this.os.notifications.push_transient("kate:capture", "Failed to save screenshot", "");
                    return err(`kate.capture.failed`);
                }
                return null;
            }
            case "kate:capture.start-recording": {
                this.os.kernel.console.take_resource("screen-recording");
                await this.os.notifications.push(env.cart.metadata.id, "Screen recording started", "");
                return null;
            }
            case "kate:capture.save-recording": {
                await this.consume_capture_token(message.payload.token, env, message);
                try {
                    this.os.kernel.console.release_resource("screen-recording");
                    await this.os.capture.save_video(env.cart.metadata.id, message.payload.data, message.payload.type);
                }
                catch (error) {
                    console.debug(`[Kate] failed to save recording`, error);
                    this.os.notifications.push_transient("kate:capture", "Failed to save screen recording", "");
                    return err(`kate.capture.failed`);
                }
                return null;
            }
            // -- Cart FS
            case "kate:cart.read-file": {
                try {
                    const file = await env.read_file(message.payload.path);
                    return ok({ mime: file.mime, bytes: file.data });
                }
                catch (error) {
                    console.error(`[Kate] failed to read file ${message.payload.path} from ${env.cart.metadata.id}`);
                    return err("kate.cart-fs.file-not-found");
                }
            }
            // -- Object store
            case "kate:store.usage": {
                const usage = await this.os.object_store.get_usage(env.cart.metadata.id);
                return ok({ available: usage.available, used: usage.used });
            }
            case "kate:store.add": {
                await this.os.object_store.add(env.cart.metadata.id, utils_1.TC.string(message.payload.key), message.payload.value);
                return ok(null);
            }
            case "kate:store.delete": {
                await this.os.object_store.delete(env.cart.metadata.id, utils_1.TC.string(message.payload.key));
                return ok(null);
            }
            case "kate:store.get": {
                const value = await this.os.object_store.get(env.cart.metadata.id, utils_1.TC.string(message.payload.key));
                return ok(value);
            }
            case "kate:store.try-get": {
                const value = await this.os.object_store.try_get(env.cart.metadata.id, utils_1.TC.string(message.payload.key));
                return ok(value);
            }
            case "kate:store.list": {
                const values = await this.os.object_store.list(env.cart.metadata.id, utils_1.TC.nullable(utils_1.TC.integer, message.payload.count));
                return ok(values);
            }
            case "kate:store.put": {
                await this.os.object_store.put(env.cart.metadata.id, utils_1.TC.string(message.payload.key), message.payload.value);
                return ok(null);
            }
            // -- Audio
            case "kate:audio.create-channel": {
                try {
                    const channel = await env.audio_server.create_channel(message.payload.max_tracks ?? 1);
                    return ok({ id: channel.id, volume: channel.volume.gain.value });
                }
                catch (error) {
                    return err(`kate:audio.cannot-create-channel`);
                }
            }
            case "kate:audio.stop-all-sources": {
                try {
                    const channel = env.audio_server.get_channel(message.payload.id);
                    await channel.stop_all_sources();
                    return ok(null);
                }
                catch (_) {
                    return err("kate:audio.cannot-stop-sources");
                }
            }
            case "kate:audio.change-volume": {
                try {
                    const channel = env.audio_server.get_channel(message.payload.id);
                    await channel.set_volume(message.payload.volume);
                    return ok(null);
                }
                catch (_) {
                    return err("kate:audio.cannot-change-volume");
                }
            }
            case "kate:audio.load": {
                try {
                    const source = await env.audio_server.load_sound(message.payload.bytes);
                    return ok(source.id);
                }
                catch (_) {
                    return err("kate:audio.cannot-load");
                }
            }
            case "kate:audio.play": {
                try {
                    const channel = env.audio_server.get_channel(message.payload.channel);
                    const source = env.audio_server.get_source(message.payload.source);
                    await channel.play(source, message.payload.loop);
                    return ok(null);
                }
                catch (_) {
                    return err("kate:audio.cannot-play");
                }
            }
            default:
                return { ok: false, value: { code: "kate:ipc.unknown-message" } };
        }
    }
}
exports.KateIPCServer = KateIPCServer;
class KateIPCChannel {
    server;
    env;
    constructor(server, env) {
        this.server = server;
        this.env = env;
    }
    send(message) {
        this.server.send(this.env, message);
    }
    dispose() {
        this.server.remove_process(this.env);
    }
}
exports.KateIPCChannel = KateIPCChannel;

});

// packages\kate-core\build\os\apis\index.js
require.define(69, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(70), exports);
__exportStar(require(50), exports);
__exportStar(require(63), exports);
__exportStar(require(65), exports);
__exportStar(require(66), exports);
__exportStar(require(68), exports);
__exportStar(require(71), exports);
__exportStar(require(64), exports);
__exportStar(require(61), exports);
__exportStar(require(67), exports);

});

// packages\kate-core\build\os\apis\audio.js
require.define(70, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\audio.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioSource = exports.AudioChannel = exports.KateAudioServer = void 0;
const utils_1 = require(5);
class KateAudioServer {
    kernel;
    channels = new Map();
    sources = new Map();
    get audio_context() {
        return this.kernel.console.audio_context;
    }
    constructor(kernel) {
        this.kernel = kernel;
    }
    async create_channel(max_tracks) {
        const id = (0, utils_1.make_id)();
        const channel = new AudioChannel(this, id, max_tracks);
        this.channels.set(id, channel);
        return channel;
    }
    async load_sound(bytes) {
        const id = (0, utils_1.make_id)();
        const source = await AudioSource.from_bytes(this, id, bytes);
        this.sources.set(id, source);
        return source;
    }
    get_channel(id) {
        const channel = this.channels.get(id);
        if (channel == null) {
            throw new Error(`Unknown channel ${id}`);
        }
        return channel;
    }
    get_source(id) {
        const source = this.sources.get(id);
        if (source == null) {
            throw new Error(`Unknown source ${id}`);
        }
        return source;
    }
    async stop() {
        for (const channel of this.channels.values()) {
            await channel.stop_all_sources();
        }
    }
}
exports.KateAudioServer = KateAudioServer;
class AudioChannel {
    server;
    id;
    max_tracks;
    volume;
    sources = [];
    constructor(server, id, max_tracks = 1) {
        this.server = server;
        this.id = id;
        this.max_tracks = max_tracks;
        this.volume = server.audio_context.createGain();
        this.volume.connect(server.audio_context.destination);
    }
    get input() {
        return this.volume;
    }
    async get_volume() {
        return this.volume.gain.value;
    }
    async set_volume(value) {
        this.volume.gain.value = value;
    }
    async stop_all_sources() {
        for (const source of this.sources) {
            source.stop();
            source.disconnect();
        }
        this.sources = [];
    }
    async play(sound, loop) {
        const node = this.server.audio_context.createBufferSource();
        node.buffer = sound.buffer;
        node.loop = loop;
        this.sources.push(node);
        while (this.sources.length > this.max_tracks) {
            const source = this.sources.shift();
            source.stop();
            source.disconnect();
        }
        node.connect(this.input);
        node.start();
    }
}
exports.AudioChannel = AudioChannel;
class AudioSource {
    id;
    buffer;
    constructor(id, buffer) {
        this.id = id;
        this.buffer = buffer;
    }
    static async from_bytes(server, id, bytes) {
        const buffer = await server.audio_context.decodeAudioData(bytes.buffer);
        return new AudioSource(id, buffer);
    }
}
exports.AudioSource = AudioSource;

});

// packages\kate-core\build\os\apis\object-store.js
require.define(71, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\object-store.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateObjectStore = void 0;
const Db = require(27);
class KateObjectStore {
    os;
    DEFAULT_QUOTA = 32 * 1024 * 1024; // 32MB
    constructor(os) {
        this.os = os;
    }
    default_quota(cart_id) {
        return {
            cart_id: cart_id,
            available: this.DEFAULT_QUOTA,
            used: 0,
        };
    }
    async get_usage(cart_id) {
        return await this.os.db.transaction([Db.quota_usage], "readonly", async (t) => {
            const usage = t.get_table1(Db.quota_usage);
            const value = await usage.try_get(cart_id);
            if (value != null) {
                return value;
            }
            else {
                return this.default_quota(cart_id);
            }
        });
    }
    async assert_can_store(cart_id, usage, size) {
        if (usage.used + size > usage.available) {
            this.os.notifications.push_transient(cart_id, "Quota exceeded", `Failed to save data because storage quota has been exceeded`);
            throw new Error(`Storage quota exceeded`);
        }
    }
    async list(cart_id, count) {
        return await this.os.db.transaction([Db.object_store], "readonly", async (t) => {
            const index = t.get_index1(Db.idx_cart_object_store_by_cart);
            return (await index.get_all(cart_id, count)).map((x) => x.data);
        });
    }
    async add(cart_id, key, value) {
        const size = estimate(value) + estimate(key);
        return await this.os.db.transaction([Db.object_store, Db.quota_usage], "readwrite", async (t) => {
            const store = t.get_table2(Db.object_store);
            const quota = t.get_table1(Db.quota_usage);
            const usage = (await quota.try_get(cart_id)) ?? this.default_quota(cart_id);
            this.assert_can_store(cart_id, usage, size);
            await store.add({
                cart_id,
                id: key,
                size,
                data: value,
            });
            await quota.put({
                cart_id,
                available: usage.available,
                used: usage.used + size,
            });
        });
    }
    async put(cart_id, key, value) {
        const size = estimate(value) + estimate(key);
        return await this.os.db.transaction([Db.object_store, Db.quota_usage], "readwrite", async (t) => {
            const store = t.get_table2(Db.object_store);
            const quota = t.get_table1(Db.quota_usage);
            const previous_size = (await store.try_get([cart_id, key]))?.size ?? 0;
            const usage = (await quota.try_get(cart_id)) ?? this.default_quota(cart_id);
            this.assert_can_store(cart_id, usage, size - previous_size);
            await store.put({
                cart_id,
                id: key,
                size,
                data: value,
            });
            await quota.put({
                cart_id,
                available: usage.available,
                used: usage.used + size - previous_size,
            });
        });
    }
    async delete(cart_id, key) {
        return await this.os.db.transaction([Db.object_store, Db.quota_usage], "readwrite", async (t) => {
            const store = t.get_table2(Db.object_store);
            const quota = t.get_table1(Db.quota_usage);
            const previous_size = (await store.get([cart_id, key])).size;
            const usage = (await quota.try_get(cart_id)) ?? this.default_quota(cart_id);
            await store.delete([cart_id, key]);
            await quota.put({
                cart_id,
                available: usage.available,
                used: usage.used - previous_size,
            });
        });
    }
    async get(cart_id, key) {
        return await this.os.db.transaction([Db.object_store, Db.quota_usage], "readwrite", async (t) => {
            const store = t.get_table2(Db.object_store);
            return (await store.get([cart_id, key])).data;
        });
    }
    async try_get(cart_id, key) {
        return await this.os.db.transaction([Db.object_store, Db.quota_usage], "readwrite", async (t) => {
            const store = t.get_table2(Db.object_store);
            return (await store.try_get([cart_id, key]))?.data ?? null;
        });
    }
    async get_local_storage(cart_id) {
        return ((await this.try_get(cart_id, "kate:local-storage")) ?? Object.create(null));
    }
}
exports.KateObjectStore = KateObjectStore;
function estimate(value) {
    if (typeof value === "string") {
        return value.length * 2;
    }
    else if (typeof value === "number" ||
        typeof value === "boolean" ||
        value == null ||
        typeof value === "undefined") {
        return 2;
    }
    else if (typeof value === "bigint") {
        return Math.ceil(value.toString(16).length / 2);
    }
    else if (Array.isArray(value)) {
        return value.map(estimate).reduce((a, b) => a + b, 0);
    }
    else if (value instanceof Uint8Array ||
        value instanceof Uint32Array ||
        value instanceof Uint16Array ||
        value instanceof Uint8ClampedArray ||
        value instanceof BigUint64Array ||
        value instanceof Int16Array ||
        value instanceof Int32Array ||
        value instanceof Int8Array) {
        return value.byteLength;
    }
    else if (typeof value === "object") {
        let size = 0;
        for (const [k, v] of Object.entries(value)) {
            size += estimate(k) + estimate(v);
        }
        return size;
    }
    else {
        throw new Error(`Serialisation not supported: ${value}`);
    }
}

});

// packages\kate-core\build\os\apis\dialog.js
require.define(72, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\dialog.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_Dialog = exports.Progress = exports.KateDialog = void 0;
const utils_1 = require(5);
const time_1 = require(32);
const UI = require(46);
const scenes_1 = require(35);
class KateDialog {
    os;
    hud;
    constructor(os) {
        this.os = os;
        this.hud = new HUD_Dialog(this);
    }
    setup() {
        this.hud.setup();
    }
    async message(id, x) {
        return await this.hud.show(id, x.title, x.message, [{ label: "Ok", kind: "primary", value: null }], null);
    }
    async confirm(id, x) {
        return await this.hud.show(id, x.title, x.message, [
            { label: x.cancel ?? "Cancel", kind: "cancel", value: false },
            {
                label: x.ok ?? "Ok",
                kind: x.dangerous === true ? "dangerous" : "primary",
                value: true,
            },
        ], false);
    }
    async progress(id, message, process) {
        return await this.hud.progress(id, message, process);
    }
    async pop_menu(id, heading, buttons, cancel_value) {
        return await this.hud.pop_menu(id, heading, buttons, cancel_value);
    }
}
exports.KateDialog = KateDialog;
class Progress {
    _message;
    canvas;
    constructor(_message) {
        this._message = _message;
        this.canvas = document.createElement("div");
        this.canvas.append(this.render());
    }
    render() {
        return UI.h("div", { class: "kate-ui-progress-container" }, [
            UI.h("div", { class: "kate-ui-progress-message" }, [this._message]),
            UI.h("div", { class: "kate-ui-progress-indicator" }, [
                UI.fa_icon("circle-notch", "2x", "solid", "spin"),
            ]),
        ]);
    }
    set_message(message) {
        this._message = message;
        this.canvas.querySelector(".kate-ui-progress-message").textContent =
            message;
    }
}
exports.Progress = Progress;
class HUD_Dialog extends scenes_1.Scene {
    manager;
    FADE_OUT_TIME_MS = 250;
    constructor(manager) {
        super(manager.os);
        this.manager = manager;
        this.canvas = UI.h("div", { class: "kate-hud-dialog" }, []);
    }
    setup() {
        this.manager.os.show_hud(this);
    }
    teardown() {
        this.manager.os.hide_hud(this);
    }
    render() {
        return null;
    }
    is_trusted(id) {
        return id.startsWith("kate:");
    }
    async progress(id, message, process) {
        const progress = new Progress(message);
        const element = UI.h("div", {
            class: "kate-hud-dialog-message",
            "data-trusted": String(this.is_trusted(id)),
        }, [progress.canvas]);
        try {
            const result = process(progress);
            this.canvas.textContent = "";
            this.canvas.appendChild(element);
            this.os.focus_handler.push_root(this.canvas);
            await result;
            this.os.focus_handler.pop_root(this.canvas);
            setTimeout(async () => {
                element.classList.add("leaving");
                await (0, time_1.wait)(this.FADE_OUT_TIME_MS);
                element.remove();
            });
        }
        finally {
            this.os.kernel.console.body.classList.remove("trusted-mode");
            this.canvas.textContent = "";
        }
    }
    async show(id, title, message, buttons, cancel_value) {
        const result = (0, utils_1.defer)();
        const element = UI.h("div", {
            class: "kate-hud-dialog-message",
            "data-trusted": String(this.is_trusted(id)),
        }, [
            UI.h("div", { class: "kate-hud-dialog-container" }, [
                UI.h("div", { class: "kate-hud-dialog-title" }, [title]),
                UI.h("div", { class: "kate-hud-dialog-text" }, [message]),
                UI.h("div", { class: "kate-hud-dialog-actions" }, [
                    ...buttons.map((x) => {
                        return UI.h("div", {
                            class: "kate-hud-dialog-action",
                            "data-kind": x.kind ?? "cancel",
                        }, [
                            new UI.Button([x.label]).on_clicked(() => result.resolve(x.value)),
                        ]);
                    }),
                ]),
            ]),
        ]);
        element.addEventListener("click", (ev) => {
            if (ev.target === element) {
                result.resolve(cancel_value);
            }
        });
        let return_value;
        if (this.is_trusted(id)) {
            this.os.kernel.console.body.classList.add("trusted-mode");
        }
        try {
            this.canvas.textContent = "";
            this.canvas.appendChild(element);
            const key_handler = (x) => {
                if (x.key === "x" && !x.is_repeat) {
                    result.resolve(cancel_value);
                    return true;
                }
                return false;
            };
            this.os.focus_handler.push_root(this.canvas);
            this.os.focus_handler.listen(this.canvas, key_handler);
            return_value = await result.promise;
            this.os.focus_handler.pop_root(this.canvas);
            this.os.focus_handler.remove(this.canvas, key_handler);
            setTimeout(async () => {
                element.classList.add("leaving");
                await (0, time_1.wait)(this.FADE_OUT_TIME_MS);
                element.remove();
            });
        }
        finally {
            this.os.kernel.console.body.classList.remove("trusted-mode");
        }
        return return_value;
    }
    async pop_menu(id, heading, buttons, cancel_value) {
        const result = (0, utils_1.defer)();
        const element = UI.h("div", {
            class: "kate-hud-dialog-pop-menu",
            "data-trusted": String(this.is_trusted(id)),
        }, [
            UI.h("div", { class: "kate-hud-dialog-pop-menu-container" }, [
                UI.h("div", { class: "kate-hud-dialog-pop-menu-title" }, [heading]),
                UI.h("div", { class: "kate-hud-dialog-pop-menu-actions" }, [
                    ...buttons.map((x) => {
                        return UI.h("div", {
                            class: "kate-hud-dialog-pop-menu-action",
                        }, [
                            new UI.Button([x.label]).on_clicked(() => result.resolve(x.value)),
                        ]);
                    }),
                ]),
            ]),
        ]);
        element.addEventListener("click", (ev) => {
            if (ev.target === element) {
                result.resolve(cancel_value);
            }
        });
        let return_value;
        if (this.is_trusted(id)) {
            this.os.kernel.console.body.classList.add("trusted-mode");
        }
        try {
            this.canvas.textContent = "";
            this.canvas.appendChild(element);
            const key_handler = (x) => {
                if (x.key === "x" && !x.is_repeat) {
                    result.resolve(cancel_value);
                    return true;
                }
                return false;
            };
            this.os.focus_handler.push_root(this.canvas);
            this.os.focus_handler.listen(this.canvas, key_handler);
            return_value = await result.promise;
            this.os.focus_handler.pop_root(this.canvas);
            this.os.focus_handler.remove(this.canvas, key_handler);
            setTimeout(async () => {
                element.classList.add("leaving");
                await (0, time_1.wait)(this.FADE_OUT_TIME_MS);
                element.remove();
            });
        }
        finally {
            this.os.kernel.console.body.classList.remove("trusted-mode");
        }
        return return_value;
    }
}
exports.HUD_Dialog = HUD_Dialog;

});

// packages\kate-core\build\os\apis\capture.js
require.define(73, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\capture.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateCapture = void 0;
const Db = require(26);
const utils_1 = require(5);
class KateCapture {
    os;
    THUMBNAIL_WIDTH = 160;
    THUMBNAIL_HEIGHT = 96;
    MAX_SCREENSHOT_SIZE = (0, utils_1.mb)(1);
    MAX_VIDEO_SIZE = (0, utils_1.mb)(32);
    constructor(os) {
        this.os = os;
    }
    async store_file(game_id, data, mime, kind) {
        const file_id = (0, utils_1.make_id)();
        const { thumbnail, length } = await this.make_thumbnail(data, mime, kind);
        await this.os.db.transaction([Db.media_store, Db.media_files], "readwrite", async (t) => {
            const media = t.get_table1(Db.media_store);
            const files = t.get_table1(Db.media_files);
            await files.add({
                id: file_id,
                mime: mime,
                data: data,
            });
            await media.add({
                id: file_id,
                cart_id: game_id,
                kind: kind,
                time: new Date(),
                thumbnail_dataurl: thumbnail,
                video_length: length,
                size: data.length,
            });
        });
        return file_id;
    }
    async save_screenshot(game_id, data, type) {
        if (data.length > this.MAX_SCREENSHOT_SIZE) {
            await this.os.notifications.push(game_id, "Failed to save screenshot", `Size limit of ${(0, utils_1.from_bytes)(this.MAX_SCREENSHOT_SIZE)} exceeded`);
            return null;
        }
        const id = await this.store_file(game_id, data, type, "image");
        await this.os.notifications.push(game_id, `Screenshot saved`, "");
        return id;
    }
    async save_video(game_id, data, type) {
        if (data.length > this.MAX_VIDEO_SIZE) {
            await this.os.notifications.push(game_id, "Failed to save recording", `Size limit of ${(0, utils_1.from_bytes)(this.MAX_VIDEO_SIZE)} exceeded`);
            return null;
        }
        const id = await this.store_file(game_id, data, type, "video");
        await this.os.notifications.push(game_id, `Recording saved`, "");
        return id;
    }
    async list() {
        const files = await this.os.db.transaction([Db.media_store], "readonly", async (t) => {
            const media = t.get_table1(Db.media_store);
            return media.get_all();
        });
        return files;
    }
    async list_by_game(id) {
        const files = await this.os.db.transaction([Db.media_store], "readonly", async (t) => {
            const media = t.get_index1(Db.idx_media_store_by_cart);
            return media.get_all(id);
        });
        return files;
    }
    async read_metadata(id) {
        return await this.os.db.transaction([Db.media_store], "readonly", async (t) => {
            const media = t.get_table1(Db.media_store);
            return media.get(id);
        });
    }
    async read_file(id) {
        return await this.os.db.transaction([Db.media_files], "readonly", async (t) => {
            const media = t.get_table1(Db.media_files);
            return media.get(id);
        });
    }
    async delete(file_id) {
        await this.os.db.transaction([Db.media_store, Db.media_files], "readwrite", async (t) => {
            const media = t.get_table1(Db.media_store);
            const files = t.get_table1(Db.media_files);
            await media.delete(file_id);
            await files.delete(file_id);
        });
    }
    async make_thumbnail(data, type, kind) {
        const blob = new Blob([data], { type: type });
        const url = URL.createObjectURL(blob);
        try {
            switch (kind) {
                case "image": {
                    const img = await (0, utils_1.load_image)(url);
                    return {
                        thumbnail: (0, utils_1.make_thumbnail)(this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT, img),
                        length: null,
                    };
                }
                case "video": {
                    const [img, length] = await load_first_frame(url, this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT);
                    return {
                        thumbnail: img,
                        length: length,
                    };
                }
                default:
                    throw (0, utils_1.unreachable)(kind);
            }
        }
        finally {
            URL.revokeObjectURL(url);
        }
    }
}
exports.KateCapture = KateCapture;
async function load_first_frame(url, width, height) {
    return new Promise((resolve, reject) => {
        let state = "loading";
        let img = "";
        let duration;
        const video = document.createElement("video");
        video.oncanplaythrough = () => {
            if (state === "loading") {
                state = "screenshot";
                video.currentTime = 0.001;
            }
        };
        video.ontimeupdate = () => {
            switch (state) {
                case "loading":
                    break;
                case "screenshot": {
                    img = (0, utils_1.make_thumbnail)(width, height, video);
                    state = "duration";
                    video.currentTime = 60 * 60 * 24;
                    break;
                }
                case "duration": {
                    duration = video.currentTime;
                    video.src = "";
                    resolve([img, duration]);
                    break;
                }
                default:
                    throw (0, utils_1.unreachable)(state);
            }
        };
        video.onerror = () => {
            video.src = "";
            reject(new Error(`Failed to create thumbnail for the video`));
        };
        video.src = url;
        video.load();
    });
}

});

// packages\kate-core\build\os\sfx.js
require.define(74, "packages\\kate-core\\build\\os", "packages\\kate-core\\build\\os\\sfx.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateSfx = void 0;
const apis_1 = require(69);
class KateSfx {
    console;
    server;
    channel;
    sources;
    constructor(console, server, channel, sources) {
        this.console = console;
        this.server = server;
        this.channel = channel;
        this.sources = sources;
    }
    static async make(kernel) {
        const server = new apis_1.KateAudioServer(kernel);
        const channel = await server.create_channel(1);
        const shutter = await server.load_sound(await get_sfx("sfx/shutter.wav"));
        const invalid = await server.load_sound(await get_sfx("sfx/invalid.wav"));
        const select = await server.load_sound(await get_sfx("sfx/select.wav"));
        const cursor = await server.load_sound(await get_sfx("sfx/cursor.wav"));
        return new KateSfx(kernel, server, channel, {
            shutter,
            invalid,
            select,
            cursor,
        });
    }
    play(source) {
        this.channel.play(this.sources[source], false);
    }
}
exports.KateSfx = KateSfx;
async function get_sfx(url) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
}

});

// packages\kate-core\build\os\apis\settings.js
require.define(75, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\settings.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateSettings = void 0;
const Db = require(26);
const defaults = {
    play_habits: {
        recently_played: true,
        play_times: true,
    },
};
class KateSettings {
    db;
    _data = null;
    constructor(db) {
        this.db = db;
    }
    get defaults() {
        return defaults;
    }
    static async load(db) {
        const settings = new KateSettings(db);
        await settings.load();
        return settings;
    }
    get(key) {
        if (this._data == null) {
            throw new Error(`get() called without settings being loaded`);
        }
        return this._data[key];
    }
    async load() {
        this._data = await this.db.transaction([Db.settings], "readonly", async (t) => {
            const settings = t.get_table1(Db.settings);
            const play_habits = (await settings.try_get("play_habits"))?.data ?? defaults.play_habits;
            return {
                play_habits,
            };
        });
    }
    async update(key, fn) {
        await this.db.transaction([Db.settings], "readwrite", async (t) => {
            const settings = t.get_table1(Db.settings);
            const value = fn(this.get(key));
            settings.put({
                key: key,
                data: value,
                last_updated: new Date(),
            });
            this._data[key] = value;
        });
    }
    async reset_to_defaults() {
        await this.db.transaction([Db.settings], "readwrite", async (t) => {
            const settings = t.get_table1(Db.settings);
            for (const [key, value] of Object.entries(defaults)) {
                settings.put({
                    key: key,
                    data: value,
                    last_updated: new Date(),
                });
                this._data[key] = value;
            }
        });
    }
}
exports.KateSettings = KateSettings;

});

module.exports = require(1);
}((() => {
  if (typeof require !== "undefined" && typeof module !== "undefined") {
    return [module, module.exports, require];
  } else if (typeof window !== "undefined") {
    const module = Object.create(null);
    module.exports = Object.create(null);
    Object.defineProperty(window, "Kate", {
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