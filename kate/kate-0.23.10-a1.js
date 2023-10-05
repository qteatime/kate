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
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.capabilities = exports.data = exports.cart = exports.os = exports.kernel = void 0;
exports.kernel = require(2);
exports.os = require(30);
exports.cart = require(64);
exports.data = require(32);
exports.capabilities = require(45);

});

// packages\kate-core\build\kernel\index.js
require.define(2, "packages\\kate-core\\build\\kernel", "packages\\kate-core\\build\\kernel\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(3), exports);
__exportStar(require(4), exports);
__exportStar(require(26), exports);
__exportStar(require(27), exports);
__exportStar(require(28), exports);

});

// packages\kate-core\build\kernel\kate.js
require.define(3, "packages\\kate-core\\build\\kernel", "packages\\kate-core\\build\\kernel\\kate.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateKernel = void 0;
const cart_runtime_1 = require(4);
const gamepad_1 = require(26);
const input_1 = require(27);
const virtual_1 = require(28);
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
            case: options.case ?? {
                type: "handheld",
                resolution: 480,
                scale_to_fit: false,
            },
        });
        const keyboard = new input_1.KeyboardInput(console);
        const gamepad = new gamepad_1.GamepadInput(console);
        console.listen();
        keyboard.listen(document.body);
        gamepad.setup();
        return new KateKernel(console, keyboard, gamepad);
    }
    enter_trusted_mode() {
        this.console.body.classList.add("trusted-mode");
    }
    exit_trusted_mode() {
        this.console.body.classList.remove("trusted-mode");
    }
}
exports.KateKernel = KateKernel;

});

// packages\kate-core\build\kernel\cart-runtime.js
require.define(4, "packages\\kate-core\\build\\kernel", "packages\\kate-core\\build\\kernel\\cart-runtime.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CR_Web_archive = exports.CRW_Process = exports.CR_Process = exports.CartRuntime = exports.KateRuntimes = void 0;
const utils_1 = require(5);
const translate_html_1 = require(23);
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
    async read_file(path) {
        return this.env.read_file(path);
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
        frame.allow = "autoplay";
        frame.csp =
            "default-src data: blob: 'unsafe-inline' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'; navigate-to 'none'";
        this.console.on_input_changed.listen((ev) => {
            if (env.is_foreground(env.cart)) {
                channel.send({
                    type: "kate:input-state-changed",
                    key: ev.key,
                    is_down: ev.is_down,
                });
            }
        });
        let recording = false;
        this.console.on_key_pressed.listen((key) => {
            if (env.is_foreground(env.cart)) {
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
            }
        });
        frame.src = URL.createObjectURL(new Blob([await this.proxy_html(env)], { type: "text/html" }));
        frame.scrolling = "no";
        const process = new CRW_Process(this, env);
        process.setup();
        return process;
    }
    async proxy_html(env) {
        const index_file = await env.read_file(env.cart.runtime.html_path);
        const decoder = new TextDecoder();
        const index = decoder.decode(index_file.data);
        return (0, translate_html_1.translate_html)(index, env);
    }
}
exports.CR_Web_archive = CR_Web_archive;

});

// packages\kate-core\build\utils.js
require.define(5, "packages\\kate-core\\build", "packages\\kate-core\\build\\utils.js", (module, exports, __dirname, __filename) => {
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
exports.Sets = exports.TC = void 0;
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
exports.Sets = require(17);
__exportStar(require(18), exports);
__exportStar(require(19), exports);
__exportStar(require(20), exports);
__exportStar(require(21), exports);
__exportStar(require(22), exports);

});

// packages\util\build\assert.js
require.define(6, "packages\\util\\build", "packages\\util\\build\\assert.js", (module, exports, __dirname, __filename) => {
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

// packages\util\build\pathname.js
require.define(7, "packages\\util\\build", "packages\\util\\build\\pathname.js", (module, exports, __dirname, __filename) => {
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

// packages\util\build\random.js
require.define(8, "packages\\util\\build", "packages\\util\\build\\random.js", (module, exports, __dirname, __filename) => {
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

// packages\util\build\promise.js
require.define(9, "packages\\util\\build", "packages\\util\\build\\promise.js", (module, exports, __dirname, __filename) => {
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

// packages\util\build\events.js
require.define(10, "packages\\util\\build", "packages\\util\\build\\events.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
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
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
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

// packages\util\build\mime.js
require.define(13, "packages\\util\\build", "packages\\util\\build\\mime.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
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
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
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

// packages\util\build\object-spec.js
require.define(15, "packages\\util\\build", "packages\\util\\build\\object-spec.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.or6 = exports.or5 = exports.or4 = exports.or3 = exports.choice = exports.or = exports.tagged_choice = exports.seq3 = exports.map = exports.seq2 = exports.nullable = exports.spec = exports.bytearray = exports.instance_of = exports.one_of = exports.list_of = exports.lazy_optional = exports.lazy = exports.optional = exports.min_max_items = exports.min_items = exports.max_items = exports.min_max_length = exports.min_length = exports.max_length = exports.byte = exports.int = exports.num = exports.constant = exports.regex = exports.url = exports.short_str = exports.str = exports.dictionary = exports.anything = exports.bool = exports.EOr = exports.EAt = exports.EOneOf = exports.ERegExp = exports.EMinLength = exports.EMaxLength = exports.EUnexpected = exports.EInstance = exports.EType = exports.EParse = void 0;
class EParse {
}
exports.EParse = EParse;
class EType extends EParse {
    name;
    value;
    constructor(name, value) {
        super();
        this.name = name;
        this.value = value;
    }
    get message() {
        return `Expected ${this.name}, got ${typeof this.value}`;
    }
}
exports.EType = EType;
class EInstance extends EParse {
    name;
    value;
    constructor(name, value) {
        super();
        this.name = name;
        this.value = value;
    }
    get message() {
        return `Expected an instance of ${this.name}`;
    }
}
exports.EInstance = EInstance;
class EUnexpected extends EParse {
    expected;
    actual;
    constructor(expected, actual) {
        super();
        this.expected = expected;
        this.actual = actual;
    }
    get message() {
        return `Expected the constant ${this.expected}, got ${this.actual}`;
    }
}
exports.EUnexpected = EUnexpected;
class EMaxLength extends EParse {
    max;
    actual;
    constructor(max, actual) {
        super();
        this.max = max;
        this.actual = actual;
    }
    get message() {
        return `Expected maximum length of ${this.max}, got ${this.actual}`;
    }
}
exports.EMaxLength = EMaxLength;
class EMinLength extends EParse {
    min;
    actual;
    constructor(min, actual) {
        super();
        this.min = min;
        this.actual = actual;
    }
    get message() {
        return `Expected minimum length of ${this.min}, got ${this.actual}`;
    }
}
exports.EMinLength = EMinLength;
class ERegExp extends EParse {
    reason;
    regex;
    actual;
    constructor(reason, regex, actual) {
        super();
        this.reason = reason;
        this.regex = regex;
        this.actual = actual;
    }
    get message() {
        return `Expected a ${this.reason} (${this.regex})`;
    }
}
exports.ERegExp = ERegExp;
class EOneOf extends EParse {
    expected;
    actual;
    constructor(expected, actual) {
        super();
        this.expected = expected;
        this.actual = actual;
    }
    get message() {
        return `Expected one of ${this.expected.join(", ")}; got ${this.actual}`;
    }
}
exports.EOneOf = EOneOf;
class EAt extends EParse {
    key;
    error;
    constructor(key, error) {
        super();
        this.key = key;
        this.error = error;
    }
    get message() {
        const { path, error } = this.collect_path();
        return `At ${path}: ${error.message}`;
    }
    collect_path() {
        if (this.error instanceof EAt) {
            const { path, error } = this.error.collect_path();
            return {
                path: `${this.key}.${path}`,
                error: error,
            };
        }
        else {
            return {
                path: this.key,
                error: this.error,
            };
        }
    }
}
exports.EAt = EAt;
class EOr extends EParse {
    left;
    right;
    value;
    constructor(left, right, value) {
        super();
        this.left = left;
        this.right = right;
        this.value = value;
    }
    get message() {
        return `Invalid value: ${this.short(this)}`;
    }
    short(x) {
        if (x instanceof EOr) {
            return `${this.short(x.left)}, ${this.short(x.right)}`;
        }
        else {
            return x.message;
        }
    }
}
exports.EOr = EOr;
function bool(x) {
    if (typeof x === "boolean") {
        return x;
    }
    else {
        throw new EType("Boolean", x);
    }
}
exports.bool = bool;
function anything() {
    return (x) => x;
}
exports.anything = anything;
function dictionary(p) {
    return (x) => {
        if (x == null || Object(x) !== x) {
            throw new EType("dictionary", x);
        }
        const result = Object.create(null);
        for (const [k, v] of Object.entries(x)) {
            result[k] = p(v);
        }
        return result;
    };
}
exports.dictionary = dictionary;
function str(x) {
    if (typeof x === "string") {
        return x;
    }
    else {
        throw new EType("String", x);
    }
}
exports.str = str;
function short_str(max_size = 255) {
    return seq2(str, max_length(max_size));
}
exports.short_str = short_str;
function url(x) {
    try {
        return new URL(x);
    }
    catch (_) {
        throw new EType("URL", x);
    }
}
exports.url = url;
function regex(reason, re) {
    return (x) => {
        if (re.test(x)) {
            return x;
        }
        else {
            throw new ERegExp(reason, re, x);
        }
    };
}
exports.regex = regex;
function constant(expected) {
    return (x) => {
        if (x === expected) {
            return expected;
        }
        else {
            throw new EUnexpected(expected, x);
        }
    };
}
exports.constant = constant;
function num(x) {
    if (typeof x === "number") {
        return x;
    }
    else {
        throw new EType("Number", x);
    }
}
exports.num = num;
function int(x) {
    if (typeof x === "number" && Math.trunc(x) === x) {
        return x;
    }
    else {
        throw new EType("Integer", x);
    }
}
exports.int = int;
function byte(x) {
    return seq2(int, (x) => {
        if (x < 0 || x > 255) {
            throw new EType("byte", x);
        }
        else {
            return x;
        }
    })(x);
}
exports.byte = byte;
function max_length(size) {
    return (x) => {
        if (x.length < size) {
            return x;
        }
        else {
            throw new EMaxLength(size, x.length);
        }
    };
}
exports.max_length = max_length;
function min_length(size) {
    return (x) => {
        if (x.length >= size) {
            return x;
        }
        else {
            throw new EMinLength(size, x.length);
        }
    };
}
exports.min_length = min_length;
function min_max_length(min, max) {
    return seq2(min_length(min), max_length(max));
}
exports.min_max_length = min_max_length;
function max_items(size) {
    return (x) => {
        if (x.length < size) {
            return x;
        }
        else {
            throw new EMaxLength(size, x.length);
        }
    };
}
exports.max_items = max_items;
function min_items(size) {
    return (x) => {
        if (x.length >= size) {
            return x;
        }
        else {
            throw new EMinLength(size, x.length);
        }
    };
}
exports.min_items = min_items;
function min_max_items(min, max) {
    return seq2(min_items(min), max_items(max));
}
exports.min_max_items = min_max_items;
function optional(default_value, spec) {
    return (x) => {
        if (x == null) {
            return default_value;
        }
        else {
            return spec(x);
        }
    };
}
exports.optional = optional;
function lazy(p) {
    return (x) => p(x);
}
exports.lazy = lazy;
function lazy_optional(default_value, spec) {
    return (x) => {
        if (x == null) {
            return default_value();
        }
        else {
            return spec(x);
        }
    };
}
exports.lazy_optional = lazy_optional;
function list_of(f) {
    return (x) => {
        if (Array.isArray(x)) {
            return x.map((a, i) => {
                try {
                    return f(a);
                }
                catch (e) {
                    throw new EAt(String(i), e);
                }
            });
        }
        else {
            throw new EType("List", x);
        }
    };
}
exports.list_of = list_of;
function one_of(xs) {
    return (x) => {
        if (xs.includes(x)) {
            return x;
        }
        else {
            throw new EOneOf(xs, x);
        }
    };
}
exports.one_of = one_of;
function instance_of(type, name) {
    return (x) => {
        if (x instanceof type) {
            return x;
        }
        else {
            throw new EInstance(name ?? type.name, x);
        }
    };
}
exports.instance_of = instance_of;
function bytearray(x) {
    if (x instanceof Uint8Array) {
        return x;
    }
    else {
        throw new EInstance("Uint8Array", x);
    }
}
exports.bytearray = bytearray;
function spec(spec) {
    return (x) => {
        if (x != null && Object(x) === x) {
            const result = Object.create(null);
            for (const [k, p] of Object.entries(spec)) {
                try {
                    result[k] = p(x[k] ?? null);
                }
                catch (e) {
                    throw new EAt(k, e);
                }
            }
            return result;
        }
        else {
            throw new EType("Object", x);
        }
    };
}
exports.spec = spec;
function nullable(spec) {
    return (x) => {
        if (x == null) {
            return null;
        }
        else {
            return spec(x);
        }
    };
}
exports.nullable = nullable;
function seq2(a, b) {
    return (x) => {
        return b(a(x));
    };
}
exports.seq2 = seq2;
exports.map = seq2;
function seq3(a, b, c) {
    return (x) => {
        return c(b(a(x)));
    };
}
exports.seq3 = seq3;
function tagged_choice(tag_field, choices) {
    return (x) => {
        if (x == null || Object(x) !== x) {
            throw new EType("tagged object", x);
        }
        if (typeof x[tag_field] !== "string" || !choices[x[tag_field]]) {
            throw new EAt(tag_field, new EOneOf(Object.keys(choices), x[tag_field]));
        }
        Object.entries(x);
        const spec = choices[x[tag_field]];
        return spec(x);
    };
}
exports.tagged_choice = tagged_choice;
function or(a, b) {
    return (x) => {
        try {
            return a(x);
        }
        catch (e1) {
            try {
                return b(x);
            }
            catch (e2) {
                throw new EOr(e1, e2, x);
            }
        }
    };
}
exports.or = or;
function choice(a) {
    return a.reduce(or);
}
exports.choice = choice;
function or3(a, b, c) {
    return or(a, or(b, c));
}
exports.or3 = or3;
function or4(a, b, c, d) {
    return or(a, or(b, or(c, d)));
}
exports.or4 = or4;
function or5(a, b, c, d, e) {
    return or(a, or(b, or(c, or(d, e))));
}
exports.or5 = or5;
function or6(a, b, c, d, e, f) {
    return or(a, or(b, or(c, or(d, or(e, f)))));
}
exports.or6 = or6;
function parse(spec, value) {
    try {
        return spec(value);
    }
    catch (e) {
        if (e instanceof EParse) {
            throw new Error(`Failed to parse: ${e.message}`);
        }
        else {
            throw e;
        }
    }
}
exports.parse = parse;

});

// packages\util\build\unit.js
require.define(16, "packages\\util\\build", "packages\\util\\build\\unit.js", (module, exports, __dirname, __filename) => {
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

// packages\util\build\sets.js
require.define(17, "packages\\util\\build", "packages\\util\\build\\sets.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.same_set = exports.difference = exports.union = exports.intersection = void 0;
function intersection(a, b) {
    const result = new Set();
    for (const value of a) {
        if (b.has(value)) {
            result.add(value);
        }
    }
    return result;
}
exports.intersection = intersection;
function union(a, b) {
    const result = new Set();
    for (const value of a) {
        result.add(value);
    }
    for (const value of b) {
        result.add(value);
    }
    return result;
}
exports.union = union;
function difference(a, b) {
    const result = new Set();
    for (const value of a) {
        if (!b.has(value)) {
            result.add(value);
        }
    }
    return result;
}
exports.difference = difference;
function same_set(a, b) {
    return a.size === b.size && difference(a, b).size === 0;
}
exports.same_set = same_set;

});

// packages\util\build\observable.js
require.define(18, "packages\\util\\build", "packages\\util\\build\\observable.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Observable = void 0;
const events_1 = require(10);
class Observable {
    _value;
    stream = new events_1.EventStream();
    constructor(_value) {
        this._value = _value;
    }
    static from(value) {
        if (value instanceof Observable) {
            return value;
        }
        else {
            return new Observable(value);
        }
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
    dispose() { }
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

// packages\util\build\iterable.js
require.define(19, "packages\\util\\build", "packages\\util\\build\\iterable.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.zip = exports.iterator = exports.foldl = exports.enumerate = void 0;
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

});

// packages\util\build\math.js
require.define(20, "packages\\util\\build", "packages\\util\\build\\math.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = void 0;
function clamp(n, min, max) {
    return n < min ? min : n > max ? max : n;
}
exports.clamp = clamp;

});

// packages\util\build\time.js
require.define(21, "packages\\util\\build", "packages\\util\\build\\time.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.relative_date = exports.fine_grained_relative_date = exports.relative_time = exports.date_time_string = exports.days_diff = exports.coarse_time_from_minutes = void 0;
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
    return `${x.getFullYear()}-${(x.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${x.getDate().toString().padStart(2, "0")} ${x
        .getHours()
        .toString()
        .padStart(2, "0")}:${x.getMinutes().toString().padStart(2, "0")}:${x
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
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
        else if (year === now.getFullYear() &&
            month === now.getMonth() &&
            date <= now.getDate()) {
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

// packages\util\build\serialise.js
require.define(22, "packages\\util\\build", "packages\\util\\build\\serialise.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialise_error = void 0;
function serialise_error(x) {
    if (x == null) {
        return null;
    }
    else if (x instanceof Error) {
        return {
            name: x.name,
            message: x.message,
            stack: x.stack ?? null,
        };
    }
    else {
        return String(x);
    }
}
exports.serialise_error = serialise_error;

});

// packages\kate-core\build\kernel\translate-html.js
require.define(23, "packages\\kate-core\\build\\kernel", "packages\\kate-core\\build\\kernel\\translate-html.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.translate_html = void 0;
const bridges_1 = require(24);
const utils_1 = require(5);
async function translate_html(html, context) {
    const dom = new DOMParser().parseFromString(html, "text/html");
    const preamble = add_preamble(dom, context);
    add_bridges(preamble, dom, context);
    await inline_all_scripts(dom, context);
    await inline_all_links(dom, context);
    await load_all_media(dom, context);
    return dom.documentElement.outerHTML;
}
exports.translate_html = translate_html;
async function load_all_media(dom, context) {
    for (const media of Array.from(dom.querySelectorAll("img, audio, video"))) {
        const maybe_source = media instanceof HTMLMediaElement
            ? Array.from(media.querySelectorAll("source[src]"))
                .filter((x) => !x.getAttribute("type") ||
                media.canPlayType(x.getAttribute("type")) !== "")
                .map((x) => x.getAttribute("src"))
            : [];
        const maybe_path = media.getAttribute("src") ?? maybe_source[0] ?? null;
        if (maybe_path == null ||
            maybe_path.trim() === "" ||
            is_non_local(maybe_path)) {
            continue;
        }
        const path = utils_1.Pathname.from_string(maybe_path).normalise().make_absolute();
        const file = await try_get_file(path.as_string(), context);
        if (file == null) {
            continue;
        }
        if (file.data.length < 1024 * 1024) {
            // inline 1mb or less images
            media.setAttribute("src", await get_data_url(path.as_string(), context));
        }
        else {
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
function add_preamble(dom, context) {
    const script = dom.createElement("script");
    const user_agent = "Kate";
    const id = `preamble_${(0, utils_1.make_id)()}`;
    script.id = id;
    script.textContent = `
  void function() {
    var KATE_SECRET = ${JSON.stringify(context.secret)};
    ${bridges_1.bridges["kate-api.js"]};
    
    let script = document.getElementById(${JSON.stringify(id)});
    script.remove();
    script = null;

    Object.defineProperty(navigator, "userAgent", {
      value: ${JSON.stringify(user_agent)},
      enumerable: true,
      configurable: true
    });
  }();
  `;
    dom.head.insertBefore(script, dom.head.firstChild);
    const all_scripts = Array.from(dom.querySelectorAll("script"));
    if (all_scripts[0] !== script) {
        throw new Error(`Cannot sandbox HTML: aborting insecure cartridge instantiation`);
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
        case "pointer-input-proxy": {
            const code = bridges_1.bridges["pointer-input.js"];
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
            const code = bridges_1.bridges["indexeddb.js"];
            const full_source = `
        const VERSIONED = ${JSON.stringify(bridge.versioned)};
        ${code}
      `;
            append_proxy(full_source);
            break;
        }
        case "renpy-web-tweaks": {
            const code = bridges_1.bridges["renpy-web-tweaks.js"];
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
            append_proxy(bridges_1.bridges["external-url-handler.js"]);
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
            const real_path = utils_1.Pathname.from_string(src)
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
async function inline_all_links(dom, context) {
    for (const link of Array.from(dom.querySelectorAll("link"))) {
        const href = link.getAttribute("href") ?? "";
        const path = utils_1.Pathname.from_string(href).normalise().make_absolute();
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
    const source1 = await transform_css(root.dirname(), source0, context);
    const style = dom.createElement("style");
    style.textContent = source1;
    link.parentNode.insertBefore(style, link);
    link.remove();
}
async function transform_css(base, source, context) {
    const source1 = await transform_css_imports(base, source, context);
    const source2 = await transform_css_urls(base, source1, context);
    return source2;
}
async function transform_css_imports(base, source, context) {
    const imports = Array.from(new Set([...source.matchAll(/@import\s+url\(("[^"]+")\);/g)]
        .map((x) => x[1])
        .filter((x) => !is_non_local(JSON.parse(x)))));
    const import_map = new Map(await Promise.all(imports.map(async (url_string) => {
        const url_path = utils_1.Pathname.from_string(JSON.parse(url_string));
        const path = base.join(url_path);
        const style0 = await get_text_file(path.as_string(), context);
        const style = await transform_css(path.dirname(), style0, context);
        return [url_string, style];
    })));
    return source.replace(/@import\s+url\(("[^"]+")\);/g, (match, url_string) => {
        const source = import_map.get(url_string);
        return source == null ? match : source;
    });
}
async function transform_css_urls(base, source, context) {
    const imports = Array.from(new Set([...source.matchAll(/\burl\(("[^"]+")\)/g)]
        .map((x) => x[1])
        .filter((x) => !is_non_local(JSON.parse(x)))));
    const import_map = new Map(await Promise.all(imports.map(async (url_string) => {
        const url_path = utils_1.Pathname.from_string(JSON.parse(url_string));
        const path = base.join(url_path).as_string();
        const data_url = await get_data_url(path, context);
        return [url_string, data_url];
    })));
    return source.replace(/\burl\(("[^"]+")\)/g, (match, url_string) => {
        const data_url = import_map.get(url_string);
        return data_url == null ? match : `url(${JSON.stringify(data_url)})`;
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
function is_non_local(url) {
    try {
        new URL(url);
        return true;
    }
    catch (_) {
        return false;
    }
}

});

// packages\kate-core\build\bridges.js
require.define(24, "packages\\kate-core\\build", "packages\\kate-core\\build\\bridges.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(25), exports);

});

// packages\kate-bridges\build\index.js
require.define(25, "packages\\kate-bridges\\build", "packages\\kate-bridges\\build\\index.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bridges = void 0;
exports.bridges = {
    "capture-canvas.js": "\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nvoid (function () {\n    const MAX_RETRIES = 60;\n    function try_capture(retries) {\n        const element = document.querySelector(SELECTOR);\n        if (element instanceof HTMLCanvasElement) {\n            KateAPI.capture.set_root(element);\n        }\n        else if (retries > 0) {\n            setTimeout(() => try_capture(retries - 1), 1_000);\n        }\n        else {\n            console.warn(`[Kate] Could not find '${SELECTOR}' to capture in ${MAX_RETRIES} seconds. Giving up.`);\n        }\n    }\n    try_capture(MAX_RETRIES);\n})();\n",
    "external-url-handler.js": "\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nvoid (function () {\n    Object.defineProperty(window, \"open\", {\n        configurable: true,\n        value: (url) => {\n            KateAPI.browser.open(new URL(url));\n        },\n    });\n})();\n",
    "indexeddb.js": "\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nvoid (function () {\n    const { store } = KateAPI;\n    function partition() {\n        if (VERSIONED) {\n            return store.versioned();\n        }\n        else {\n            return store.unversioned();\n        }\n    }\n    const DB_META_KEY = \"kate:idb-bridge:metadata\";\n    function defer() {\n        const result = {};\n        result.promise = new Promise((resolve, reject) => {\n            result.resolve = resolve;\n            result.reject = reject;\n        });\n        return result;\n    }\n    class JobQueue {\n        _jobs = [];\n        _busy = false;\n        on_emptied_listeners = [];\n        on_emptied(fn) {\n            setTimeout(() => {\n                if (this._jobs.length === 0) {\n                    fn();\n                }\n                else {\n                    this.on_emptied_listeners.push(fn);\n                }\n            });\n        }\n        async submit(job) {\n            const result = defer();\n            this._jobs.push(async () => {\n                job().then((value) => result.resolve(value), (error) => result.reject(error));\n            });\n            this.process();\n            return result.promise;\n        }\n        submit_request(req, job) {\n            return request(req, async (req) => {\n                return this.submit(async () => {\n                    return job(req);\n                });\n            });\n        }\n        async process() {\n            if (this._busy) {\n                return;\n            }\n            this._busy = true;\n            while (this._jobs.length > 0) {\n                const job = this._jobs.shift();\n                await job().catch((error) => {\n                    console.error(`[Kate][IDBBridge] job failed`, error);\n                });\n            }\n            const listeners = this.on_emptied_listeners.slice();\n            this.on_emptied_listeners = [];\n            for (const fn of listeners) {\n                fn();\n            }\n            this._busy = false;\n        }\n    }\n    const queue = new JobQueue();\n    class KDBRequest extends EventTarget {\n        _error = null;\n        _result = null;\n        _source = null;\n        _ready_state = \"pending\";\n        _transaction = null;\n        _deferred = defer();\n        get error() {\n            return this._error;\n        }\n        get result() {\n            return this._result;\n        }\n        get source() {\n            return this._source;\n        }\n        get readyState() {\n            return this._ready_state;\n        }\n        get transaction() {\n            return this._transaction;\n        }\n        set onsuccess(value) {\n            this.addEventListener(\"success\", value);\n        }\n        set onerror(value) {\n            this.addEventListener(\"error\", value);\n        }\n        do_success(value) {\n            const event = new CustomEvent(\"success\");\n            Object.defineProperty(event, \"target\", {\n                configurable: true,\n                value: { result: value },\n            });\n            this._result = value;\n            this._ready_state = \"done\";\n            this.dispatchEvent(event);\n            this._deferred.resolve(value);\n        }\n        do_error(reason) {\n            const event = new CustomEvent(\"error\");\n            this._error = reason;\n            this._ready_state = \"done\";\n            this.dispatchEvent(event);\n            this._deferred.reject(reason);\n        }\n    }\n    class KDBOpenRequest extends KDBRequest {\n        set onupgradeneeded(value) {\n            this.addEventListener(\"upgradeneeded\", value);\n        }\n    }\n    function cursor_request(cursor) {\n        setTimeout(() => {\n            cursor.req.do_success(cursor.records.length > 0 ? cursor : null);\n        });\n        return cursor.req;\n    }\n    function request(req, fn) {\n        fn(req).then((value) => req.do_success(value), (error) => req.do_error(error));\n        return req;\n    }\n    class KDBFactory {\n        open(name, version = 1) {\n            return queue.submit_request(new KDBOpenRequest(), async (req) => {\n                const meta = await partition().ensure_bucket(DB_META_KEY);\n                const db = (await meta.try_read_data(name)) ?? {\n                    name,\n                    version: 0,\n                    stores: [],\n                };\n                await meta.write_structured(name, { name, version, stores: db.stores });\n                const kdb = new KDBDatabase(db);\n                if (version !== db.version) {\n                    const ev = new CustomEvent(\"upgradeneeded\");\n                    ev.oldVersion = db.version;\n                    ev.newVersion = version;\n                    Object.defineProperty(ev, \"target\", {\n                        configurable: true,\n                        value: {\n                            result: kdb,\n                            transaction: new KDBTransaction(kdb, db.stores.map((x) => new KDBObjectStore(kdb, x))),\n                        },\n                    });\n                    req.dispatchEvent(ev);\n                    db.version = 1;\n                    kdb._flush();\n                }\n                return kdb;\n            });\n        }\n        deleteDatabase(name) {\n            return queue.submit_request(new KDBOpenRequest(), async (req) => {\n                const meta = await partition().ensure_bucket(DB_META_KEY);\n                await meta.delete(name);\n            });\n        }\n        databases() {\n            return queue.submit(async () => {\n                const meta = await partition().ensure_bucket(DB_META_KEY);\n                const db_keys = await meta.list();\n                const dbs = (await Promise.all(db_keys.map((x) => meta.read_data(x.key))));\n                return dbs.map((x) => x.name);\n            });\n        }\n    }\n    class KDBDatabase {\n        _meta;\n        constructor(_meta) {\n            this._meta = _meta;\n        }\n        get name() {\n            return this._meta.name;\n        }\n        get version() {\n            return this._meta.version;\n        }\n        get objectStoreNames() {\n            return dom_list(this._meta.stores.map((x) => x.name));\n        }\n        close() { }\n        createObjectStore(name, options) {\n            if (this._meta.stores.find((x) => x.name === name)) {\n                throw new DOMException(`Duplicate object store ${name}`, \"ContraintError\");\n            }\n            const key_path0 = options?.keyPath ?? [];\n            const key_path = Array.isArray(key_path0) ? key_path0 : [key_path0];\n            if (!key_path.every((x) => typeof x === \"string\")) {\n                throw new DOMException(\"Invalid key path\", \"ConstraintError\");\n            }\n            const store_meta = {\n                name,\n                sequence_id: 0,\n                key_path: key_path,\n                auto_increment: options?.autoIncrement ?? false,\n                indexes: [],\n                data: [],\n            };\n            this._meta.stores.push(store_meta);\n            this._flush();\n            return new KDBObjectStore(this, store_meta);\n        }\n        deleteObjectStore(name) {\n            const index = this._meta.stores.findIndex((x) => x.name === name);\n            if (index === -1) {\n                throw new DOMException(`Undefined store ${name}`, \"NotFoundError\");\n            }\n            this._meta.stores.splice(index, 1);\n            this._flush();\n        }\n        // The IDBBridge is **NOT** transactional!!!\n        transaction(stores0) {\n            const stores1 = Array.isArray(stores0) ? stores0 : [stores0];\n            const stores = stores1.map((n) => this._meta.stores.find((x) => x.name === n));\n            if (!stores.every((x) => x != null)) {\n                throw new DOMException(`Some stores not found`, \"NotFoundError\");\n            }\n            const transaction = new KDBTransaction(this, stores.map((x) => new KDBObjectStore(this, x)));\n            queue.on_emptied(() => transaction.commit());\n            return transaction;\n        }\n        async _flush() {\n            return queue.submit(async () => {\n                const meta = await partition().ensure_bucket(DB_META_KEY);\n                await meta.write_structured(this.name, this._meta);\n            });\n        }\n    }\n    class KDBObjectStore {\n        _db;\n        _meta;\n        constructor(_db, _meta) {\n            this._db = _db;\n            this._meta = _meta;\n        }\n        get indexNames() {\n            return dom_list(this._meta.indexes.map((x) => x.name));\n        }\n        get autoIncrement() {\n            return this._meta.auto_increment;\n        }\n        get keyPath() {\n            return this._meta.key_path;\n        }\n        get name() {\n            return this._meta.name;\n        }\n        add(value, key) {\n            const id = this._resolve_key(value, key);\n            if (this._has(id)) {\n                throw new DOMException(`Duplicated id ${id}`, \"ConstraintError\");\n            }\n            this._meta.data.push({ key: id, value });\n            return queue.submit_request(new KDBRequest(), async (req) => {\n                await this._flush();\n                return id;\n            });\n        }\n        clear() {\n            this._meta.data = [];\n            return queue.submit_request(new KDBRequest(), async (req) => {\n                await this._flush();\n            });\n        }\n        count(query) {\n            let result = 0;\n            for (const _ of search(query, this._meta.data)) {\n                result += 1;\n            }\n            return queue.submit_request(new KDBRequest(), async (_) => result);\n        }\n        delete(query) {\n            const items = search(query, this._meta.data);\n            for (const { key } of items) {\n                this._meta.data = this._meta.data.filter((x) => key !== x.key);\n            }\n            return queue.submit_request(new KDBRequest(), async (req) => {\n                await this._flush();\n            });\n        }\n        get(query) {\n            const item = [...search(query, this._meta.data)][0];\n            return queue.submit_request(new KDBRequest(), async (req) => {\n                return item?.value;\n            });\n        }\n        getAll(query, count = 2 ** 32 - 1) {\n            const items = [...search(query, this._meta.data)].slice(0, count);\n            return queue.submit_request(new KDBRequest(), async (req) => {\n                return items.map((x) => x.value);\n            });\n        }\n        getAllKeys(query, count = 2 ** 32 - 1) {\n            const items = [...search(query, this._meta.data)].slice(0, count);\n            return queue.submit_request(new KDBRequest(), async (req) => {\n                return items.map((x) => x.key);\n            });\n        }\n        getKey(query) {\n            const item = [...search(query, this._meta.data)][0];\n            return queue.submit_request(new KDBRequest(), async (req) => {\n                return item?.key;\n            });\n        }\n        put(value, key) {\n            const id = this._resolve_key(value, key);\n            const index = this._meta.data.findIndex((x) => match(id, x.key));\n            if (index === -1) {\n                this._meta.data.push({ key: id, value: value });\n            }\n            else {\n                this._meta.data.splice(index, 1, { key: id, value: value });\n            }\n            return queue.submit_request(new KDBRequest(), async (req) => {\n                await this._flush();\n                return id;\n            });\n        }\n        openCursor(query = null, direction = \"next\") {\n            const records = [...search(query, this._meta.data)]\n                .sort((a, b) => cmp(a.key, b.key))\n                .map((x) => ({ key: x.key, primaryKey: x.key, value: x.value }));\n            return cursor_request(new KDBCursor(new KDBRequest(), records, direction, (x) => x.value));\n        }\n        openKeyCursor(query = null, direction = \"next\") {\n            const records = [...search(query, this._meta.data)]\n                .sort((a, b) => cmp(a.key, b.key))\n                .map((x) => ({ key: x.key, primaryKey: x.key, value: x.value }));\n            return cursor_request(new KDBCursor(new KDBRequest(), records, direction, (x) => x.key));\n        }\n        createIndex(name, key_path, options) {\n            if (this._meta.indexes.find((x) => x.name === name)) {\n                throw new DOMException(`Duplicate index name ${name}`, \"ConstraintError\");\n            }\n            if (options?.multiEntry) {\n                throw new Error(`[Kate][IDBBridge] multiEntry indexes are not supported`);\n            }\n            const meta = {\n                name: name,\n                key_path: Array.isArray(key_path) ? key_path : [key_path],\n                multi_entry: options?.multiEntry ?? false,\n                unique: options?.unique ?? false,\n            };\n            this._meta.indexes.push(meta);\n            this._flush();\n            return new KDBIndex(this, meta);\n        }\n        deleteIndex(name) {\n            const index = this._meta.indexes.findIndex((x) => x.name === name);\n            if (index === -1) {\n                throw new DOMException(`Unknown index ${name}`, \"NotFoundError\");\n            }\n            this._meta.indexes.splice(index, 1);\n            this._flush();\n        }\n        index(name) {\n            const index = this._meta.indexes.find((x) => x.name === name);\n            if (index == null) {\n                throw new DOMException(`Unknown index ${name}`, \"NotFoundError\");\n            }\n            return new KDBIndex(this, index);\n        }\n        _has(key) {\n            return this._meta.data.some((x) => match(key, x.key));\n        }\n        _resolve_key(value, key) {\n            if (key != null) {\n                return key;\n            }\n            const paths = this._meta.key_path;\n            if (paths.length === 0) {\n                throw new Error(`Auto-increment keys unsupported`);\n            }\n            else if (paths.length === 1) {\n                return get_path(value, paths[0]);\n            }\n            else {\n                return paths.map((x) => get_path(value, x));\n            }\n        }\n        _flush() {\n            return this._db._flush();\n        }\n    }\n    class KDBIndex {\n        _store;\n        _meta;\n        constructor(_store, _meta) {\n            this._store = _store;\n            this._meta = _meta;\n        }\n        get keyPath() {\n            return this._meta.key_path;\n        }\n        get multiEntry() {\n            return this._meta.multi_entry;\n        }\n        get name() {\n            return this._meta.name;\n        }\n        get unique() {\n            return this._meta.unique;\n        }\n        get objectStore() {\n            return this._store;\n        }\n        count(query) {\n            const items = linear_search(query, this._make_index());\n            return queue.submit_request(new KDBRequest(), async (req) => {\n                return [...items].length;\n            });\n        }\n        get(query) {\n            const item = [...linear_search(query, this._make_index())][0];\n            return queue.submit_request(new KDBRequest(), async (req) => {\n                return item?.value;\n            });\n        }\n        getAll(query, count = 2 ** 32 - 1) {\n            const items = [...linear_search(query, this._make_index())].slice(0, count);\n            return queue.submit_request(new KDBRequest(), async (req) => {\n                return items.map((x) => x.value);\n            });\n        }\n        getAllKeys(query, count = 2 ** 32 - 1) {\n            const items = [...linear_search(query, this._make_index())].slice(0, count);\n            return queue.submit_request(new KDBRequest(), async (req) => {\n                return items.map((x) => x.key);\n            });\n        }\n        getKey(query) {\n            const item = [...linear_search(query, this._make_index())][0];\n            return queue.submit_request(new KDBRequest(), async (req) => {\n                return item?.key;\n            });\n        }\n        openCursor(query = null, direction = \"next\") {\n            const records = [...linear_search(query, this._make_index())].sort((a, b) => cmp(a.key, b.key));\n            return cursor_request(new KDBCursor(new KDBRequest(), records, direction, (x) => x.value));\n        }\n        openKeyCursor(query = null, direction = \"next\") {\n            const records = [...linear_search(query, this._make_index())].sort((a, b) => cmp(a.key, b.key));\n            return cursor_request(new KDBCursor(new KDBRequest(), records, direction, (x) => x.key));\n        }\n        _make_index() {\n            const result = [];\n            for (const { key: k, value: v } of this._store._meta.data) {\n                const key0 = this.keyPath.map((x) => v[x]);\n                const key = key0.length === 1 ? key0[0] : key0;\n                result.push({ key, primaryKey: k, value: v });\n            }\n            return result;\n        }\n    }\n    class KDBCursor {\n        req;\n        records;\n        reify;\n        _index;\n        _step;\n        constructor(req, records, direction, reify) {\n            this.req = req;\n            this.records = records;\n            this.reify = reify;\n            this._index = direction.startsWith(\"next\") ? 0 : records.length;\n            this._step = direction.startsWith(\"next\") ? 1 : -1;\n        }\n        get _current() {\n            const item = this.records[this._index];\n            return item;\n        }\n        get key() {\n            return this._current.key;\n        }\n        get primaryKey() {\n            return this._current.primaryKey;\n        }\n        advance(count) {\n            if (count <= 0) {\n                throw new TypeError(\"Invalid advance count\");\n            }\n            const index = this._index + this._step * count;\n            if (index <= 0 || index >= this.records.length) {\n                this.req.do_success(null);\n                return;\n            }\n            this._index = index;\n            this.req.do_success(this);\n        }\n        continue(query) {\n            if (query == null) {\n                this.advance(1);\n            }\n            else {\n                throw new Error(`[Kate][IDBBridge] Not supported: continue with key`);\n            }\n        }\n        continuePrimaryKey() {\n            throw new Error(`[Kate][IDBBridge] Not supported: continue with key`);\n        }\n        delete() {\n            throw new Error(`[Kate][IDBBridge] Not supported: continue with key`);\n        }\n        update() {\n            throw new Error(`[Kate][IDBBridge] Not supported: continue with key`);\n        }\n    }\n    function lift_query(query) {\n        if (query == null) {\n            return null;\n        }\n        else if (Array.isArray(query) && query.length === 1) {\n            return query[0];\n        }\n        else {\n            return query;\n        }\n    }\n    function* search(query0, items) {\n        const query = lift_query(query0);\n        for (const { key, value } of items) {\n            if (match(query, key)) {\n                yield { key, value };\n            }\n        }\n    }\n    function* linear_search(query0, items) {\n        const query = lift_query(query0);\n        for (const { key, primaryKey, value } of items) {\n            if (match(query, key)) {\n                yield { key, primaryKey, value };\n            }\n        }\n    }\n    function match(query, key) {\n        if (query == null) {\n            return true;\n        }\n        else if (Array.isArray(query) && Array.isArray(key)) {\n            return query.every((q, i) => match(q, key[i]));\n        }\n        else if (query instanceof IDBKeyRange) {\n            if (Array.isArray(key)) {\n                return query.includes(key[0]);\n            }\n            else {\n                return query.includes(key);\n            }\n        }\n        else {\n            return query === key;\n        }\n    }\n    class KDBTransaction extends EventTarget {\n        _db;\n        _stores;\n        resolved = false;\n        constructor(_db, _stores) {\n            super();\n            this._db = _db;\n            this._stores = _stores;\n        }\n        get db() {\n            return this._db;\n        }\n        get durability() {\n            return \"relaxed\";\n        }\n        get mode() {\n            return \"readwrite\";\n        }\n        get objectStoreNames() {\n            return dom_list(this._stores.map((x) => x.name));\n        }\n        abort() {\n            if (this.resolved) {\n                return;\n            }\n            this.resolved = true;\n            console.warn(`[Kate][IDBBridge] Kate's IndexedDB bridge is not transactional!`);\n        }\n        commit() {\n            if (this.resolved) {\n                return;\n            }\n            this.resolved = true;\n            const ev = new CustomEvent(\"complete\");\n            this.dispatchEvent(ev);\n        }\n        set oncomplete(fn) {\n            this.addEventListener(\"complete\", fn);\n        }\n        set onerror(fn) {\n            this.addEventListener(\"error\", fn);\n        }\n        set onabort(fn) {\n            console.warn(`[Kate][IDBBridge] Kate's IndexedDB bridge is not transactional!`);\n        }\n        objectStore(name) {\n            const store = this._stores.find((x) => x.name === name);\n            if (store == null) {\n                throw new DOMException(`Store not in this transaction ${name}`, \"NotFoundError\");\n            }\n            return store;\n        }\n    }\n    function get_path(value, path) {\n        const keys = path.split(\".\");\n        return keys.reduce((v, k) => v[k], value);\n    }\n    function cmp(a, b) {\n        if (Array.isArray(a) && Array.isArray(b)) {\n            return a.reduce((x, i) => cmp(x, b[i]), 0);\n        }\n        else if (typeof a === \"number\" && typeof b === \"number\") {\n            return a - b;\n        }\n        else if (typeof a === \"string\" && typeof b === \"string\") {\n            return a.localeCompare(b);\n        }\n        else {\n            const va = a;\n            const vb = b;\n            return va < vb ? -1 : va > vb ? 1 : 0;\n        }\n    }\n    function dom_list(names) {\n        Object.defineProperty(names, \"contains\", {\n            configurable: true,\n            value: (name) => {\n                return names.includes(name);\n            },\n        });\n        Object.defineProperty(names, \"item\", {\n            configurable: true,\n            value: (index) => {\n                return names[index];\n            },\n        });\n        return names;\n    }\n    Object.defineProperty(window, \"indexedDB\", {\n        configurable: true,\n        value: new KDBFactory(),\n    });\n})();\n",
    "input.js": "\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nvoid (function () {\n    let paused = false;\n    const { events } = KateAPI;\n    const add_event_listener = window.addEventListener;\n    const down_listeners = [];\n    const up_listeners = [];\n    const down = new Set();\n    const on_key_update = ({ key: kate_key, is_down, }) => {\n        if (!paused) {\n            const data = key_mapping[kate_key];\n            if (data) {\n                if (is_down) {\n                    down.add(kate_key);\n                }\n                else {\n                    down.delete(kate_key);\n                }\n                const listeners = is_down ? down_listeners : up_listeners;\n                const type = is_down ? \"keydown\" : \"keyup\";\n                const [key, code, keyCode] = data;\n                const key_ev = new KeyboardEvent(type, { key, code, keyCode });\n                for (const fn of listeners) {\n                    fn.call(document, key_ev);\n                }\n            }\n        }\n    };\n    events.input_state_changed.listen(on_key_update);\n    events.paused.listen((state) => {\n        if (state === true) {\n            for (const key of down) {\n                on_key_update({ key, is_down: false });\n            }\n        }\n        paused = state;\n    });\n    function listen(type, listener, options) {\n        if (type === \"keydown\") {\n            down_listeners.push(listener);\n        }\n        else if (type === \"keyup\") {\n            up_listeners.push(listener);\n        }\n        else if (type === \"gamepadconnected\" || type === \"gamepaddisconnected\") {\n            // do nothing\n        }\n        else {\n            add_event_listener.call(this, type, listener, options);\n        }\n    }\n    window.addEventListener = listen;\n    document.addEventListener = listen;\n    // Disable gamepad input\n    Object.defineProperty(navigator, \"getGamepads\", {\n        enumerable: false,\n        configurable: false,\n        value: () => [null, null, null, null],\n    });\n})();\n",
    "kate-api.js": "void function([module, exports, node_require]) {\n  const require = (id) => {\n    if (typeof id === \"string\") {\n      return node_require(id);\n    }\n\n    const module = require.mapping.get(id);\n    if (module == null) {\n      throw new Error(\"Undefined module \" + id);\n    }\n    if (!module.initialised) {\n      module.initialised = true;\n      module.load.call(null,\n        module.module,\n        module.module.exports,\n        module.dirname,\n        module.filename\n      );\n    }\n    return module.module.exports;\n  };\n  \n  require.mapping = new Map();\n  require.define = (id, dirname, filename, fn) => {\n    const module = Object.create(null);\n    module.exports = Object.create(null);\n    require.mapping.set(id, {\n      module: module,\n      dirname,\n      filename,\n      initialised: false,\n      load: fn\n    });\n  };\n\n// packages\\kate-api\\build\\index.js\nrequire.define(1, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\index.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.dialogs = exports.cart_manager = exports.device_files = exports.browser = exports.capture = exports.pointer_input = exports.input = exports.timer = exports.store = exports.cart_fs = exports.events = void 0;\nconst browser_1 = require(2);\nconst capture_1 = require(3);\nconst cart_fs_1 = require(8);\nconst cart_manager_1 = require(9);\nconst channel_1 = require(10);\nconst device_file_1 = require(11);\nconst dialog_1 = require(12);\nconst input_1 = require(13);\nconst object_store_1 = require(14);\nconst pointer_input_1 = require(15);\nconst timer_1 = require(16);\nconst channel = new channel_1.KateIPC(KATE_SECRET, window.parent);\nchannel.setup();\nexports.events = channel.events;\nexports.cart_fs = new cart_fs_1.KateCartFS(channel);\nexports.store = new object_store_1.KateObjectStore(channel);\nexports.timer = new timer_1.KateTimer();\nexports.timer.setup();\nexports.input = new input_1.KateInput(channel, exports.timer);\nexports.input.setup();\nexports.pointer_input = new pointer_input_1.KatePointerInput(exports.timer);\nexports.capture = new capture_1.KateCapture(channel, exports.input);\nexports.capture.setup();\nexports.browser = new browser_1.KateBrowser(channel);\nexports.device_files = new device_file_1.KateDeviceFileAccess(channel);\nexports.cart_manager = new cart_manager_1.KateCartManager(channel);\nexports.dialogs = new dialog_1.KateDialogs(channel);\nwindow.addEventListener(\"focus\", () => {\n    channel.send_and_ignore_result(\"kate:special.focus\", {});\n});\n// NOTE: this is a best-effort to avoid the game accidentally trapping focus\n//       and breaking keyboard/gamepad input, it's not a security measure;\n//       there is no way of making it secure from within the cartridge as\n//       we have to assume all cartridge code is malicious and hostile.\nconst cover = document.createElement(\"div\");\ncover.style.display = \"block\";\ncover.style.position = \"absolute\";\ncover.style.top = \"0px\";\ncover.style.left = \"0px\";\ncover.style.width = \"100%\";\ncover.style.height = \"100%\";\nconst highest_zindex = /* prettier-ignore */ String((2 ** 32) / 2 - 1);\nwindow.addEventListener(\"load\", () => {\n    document.body?.appendChild(cover);\n    setInterval(() => {\n        cover.style.zIndex = highest_zindex;\n    }, 1_000);\n});\nexports.pointer_input.monitor(cover);\n\n});\n\n// packages\\kate-api\\build\\browser.js\nrequire.define(2, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\browser.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.KateBrowser = void 0;\nclass KateBrowser {\n    #channel;\n    constructor(channel) {\n        this.#channel = channel;\n    }\n    open(url) {\n        this.#channel.call(\"kate:browser.open\", { url: url.toString() });\n    }\n    download(filename, data) {\n        this.#channel.call(\"kate:browser.download\", { filename, data });\n    }\n}\nexports.KateBrowser = KateBrowser;\n\n});\n\n// packages\\kate-api\\build\\capture.js\nrequire.define(3, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\capture.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.KateCapture = void 0;\nconst util_1 = require(4);\nclass KateCapture {\n    _input;\n    CAPTURE_FPS = 24;\n    CAPTURE_FORMAT = { mimeType: \"video/webm; codecs=vp9\" };\n    CAPTURE_MAX_LENGTH = 60000;\n    #channel;\n    #initialised = false;\n    #capture_root = null;\n    #capture_monitor = null;\n    constructor(channel, _input) {\n        this._input = _input;\n        this.#channel = channel;\n    }\n    setup() {\n        if (this.#initialised) {\n            throw new Error(`setup() called twice`);\n        }\n        this.#initialised = true;\n        this.#channel.events.take_screenshot.listen(({ token }) => {\n            if (this.will_capture()) {\n                this.#save_screenshot(token);\n            }\n        });\n        this.#channel.events.start_recording.listen(({ token }) => {\n            if (this.#capture_monitor != null) {\n                return;\n            }\n            if (this.will_capture()) {\n                this.#capture_monitor = this.#record_video(token);\n            }\n        });\n        this.#channel.events.stop_recording.listen(() => {\n            if (this.#capture_monitor == null) {\n                return;\n            }\n            if (this.will_capture()) {\n                this.#capture_monitor.stop((blob, token) => this.#save_video(blob, token));\n                this.#capture_monitor = null;\n            }\n        });\n    }\n    set_root(element) {\n        if (element != null && !(element instanceof HTMLCanvasElement)) {\n            throw new Error(`Invalid root for captures. Kate captures only support <canvas>`);\n        }\n        this.#capture_root = element;\n    }\n    will_capture() {\n        if (this.#capture_root == null) {\n            this.#channel.send_and_ignore_result(\"kate:notify.transient\", {\n                title: \"Capture unsupported\",\n                message: \"Screen capture is not available right now.\",\n            });\n            return false;\n        }\n        return true;\n    }\n    #record_video(token) {\n        const data = (0, util_1.defer)();\n        const canvas = this.#capture_root;\n        const recorder = new MediaRecorder(canvas.captureStream(this.CAPTURE_FPS), this.CAPTURE_FORMAT);\n        recorder.ondataavailable = (ev) => {\n            if (ev.data.size > 0) {\n                data.resolve(ev.data);\n            }\n        };\n        recorder.start();\n        this.#channel.send_and_ignore_result(\"kate:capture.start-recording\", {});\n        const monitor = new RecorderMonitor(recorder, data.promise, token);\n        setTimeout(() => {\n            monitor.stop((blob) => this.#save_video(blob, token));\n        }, this.CAPTURE_MAX_LENGTH);\n        return monitor;\n    }\n    async #save_video(blob, token) {\n        const buffer = await blob.arrayBuffer();\n        await this.#channel.call(\"kate:capture.save-recording\", {\n            data: new Uint8Array(buffer),\n            type: \"video/webm\",\n            token: token,\n        }, [buffer]);\n    }\n    async #save_screenshot(token) {\n        const blob = await this.#take_screenshot();\n        const buffer = await blob.arrayBuffer();\n        await this.#channel.call(\"kate:capture.save-image\", {\n            data: new Uint8Array(buffer),\n            type: \"image/png\",\n            token: token,\n        }, [buffer]);\n    }\n    async #take_screenshot() {\n        const canvas = this.#capture_root;\n        if (canvas == null) {\n            throw new Error(`screenshot() called without a canvas`);\n        }\n        return new Promise((resolve, reject) => {\n            canvas.toBlob(async (blob) => {\n                if (blob == null) {\n                    reject(new Error(`Failed to capture a screenshot`));\n                }\n                else {\n                    resolve(blob);\n                }\n            });\n        });\n    }\n}\nexports.KateCapture = KateCapture;\nclass RecorderMonitor {\n    recorder;\n    data;\n    token;\n    _stopped = false;\n    constructor(recorder, data, token) {\n        this.recorder = recorder;\n        this.data = data;\n        this.token = token;\n    }\n    async stop(save) {\n        if (this._stopped) {\n            return;\n        }\n        this._stopped = true;\n        this.recorder.stop();\n        const data = await this.data;\n        save(data, this.token);\n    }\n}\n\n});\n\n// packages\\kate-api\\build\\util.js\nrequire.define(4, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\util.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nvar __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    var desc = Object.getOwnPropertyDescriptor(m, k);\n    if (!desc || (\"get\" in desc ? !m.__esModule : desc.writable || desc.configurable)) {\n      desc = { enumerable: true, get: function() { return m[k]; } };\n    }\n    Object.defineProperty(o, k2, desc);\n}) : (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    o[k2] = m[k];\n}));\nvar __exportStar = (this && this.__exportStar) || function(m, exports) {\n    for (var p in m) if (p !== \"default\" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\n__exportStar(require(5), exports);\n__exportStar(require(6), exports);\n__exportStar(require(7), exports);\n\n});\n\n// packages\\util\\build\\events.js\nrequire.define(5, \"packages\\\\util\\\\build\", \"packages\\\\util\\\\build\\\\events.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.EventStream = void 0;\nclass EventStream {\n    subscribers = [];\n    on_dispose = () => { };\n    listen(fn) {\n        this.remove(fn);\n        this.subscribers.push(fn);\n        return fn;\n    }\n    remove(fn) {\n        this.subscribers = this.subscribers.filter((x) => x !== fn);\n        return this;\n    }\n    once(fn) {\n        const handler = this.listen((x) => {\n            this.remove(handler);\n            fn(x);\n        });\n        return handler;\n    }\n    emit(ev) {\n        for (const fn of this.subscribers) {\n            fn(ev);\n        }\n    }\n    dispose() {\n        this.on_dispose();\n    }\n    filter(fn) {\n        const stream = new EventStream();\n        const subscriber = this.listen((ev) => {\n            if (fn(ev)) {\n                stream.emit(ev);\n            }\n        });\n        stream.on_dispose = () => {\n            this.remove(subscriber);\n        };\n        return stream;\n    }\n    map(fn) {\n        const stream = new EventStream();\n        const subscriber = this.listen((ev) => {\n            stream.emit(fn(ev));\n        });\n        stream.on_dispose = () => {\n            this.remove(subscriber);\n        };\n        return stream;\n    }\n}\nexports.EventStream = EventStream;\n\n});\n\n// packages\\util\\build\\promise.js\nrequire.define(6, \"packages\\\\util\\\\build\", \"packages\\\\util\\\\build\\\\promise.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.sleep = exports.defer = void 0;\nfunction defer() {\n    const p = Object.create(null);\n    p.promise = new Promise((resolve, reject) => {\n        p.resolve = resolve;\n        p.reject = reject;\n    });\n    return p;\n}\nexports.defer = defer;\nfunction sleep(ms) {\n    return new Promise((resolve, reject) => {\n        setTimeout(() => resolve(), ms);\n    });\n}\nexports.sleep = sleep;\n\n});\n\n// packages\\util\\build\\pathname.js\nrequire.define(7, \"packages\\\\util\\\\build\", \"packages\\\\util\\\\build\\\\pathname.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.Pathname = void 0;\nclass Pathname {\n    is_absolute;\n    segments;\n    constructor(is_absolute, segments) {\n        this.is_absolute = is_absolute;\n        this.segments = segments;\n    }\n    static from_string(x) {\n        if (x.startsWith(\"/\")) {\n            return new Pathname(true, get_segments(x.slice(1)));\n        }\n        else {\n            return new Pathname(false, get_segments(x));\n        }\n    }\n    as_string() {\n        const prefix = this.is_absolute ? \"/\" : \"\";\n        return prefix + this.normalise().segments.join(\"/\");\n    }\n    make_absolute() {\n        return new Pathname(true, this.segments);\n    }\n    make_relative() {\n        return new Pathname(false, this.segments);\n    }\n    join(x) {\n        if (x.is_absolute) {\n            return x;\n        }\n        else {\n            return new Pathname(this.is_absolute, [...this.segments, ...x.segments]);\n        }\n    }\n    to(x) {\n        return this.join(Pathname.from_string(x));\n    }\n    drop_prefix(prefix) {\n        const segments = this.segments.slice();\n        for (const segment of prefix) {\n            if (segments.length > 0 && segments[0] === segment) {\n                segments.shift();\n            }\n            else {\n                break;\n            }\n        }\n        return new Pathname(false, [...segments]);\n    }\n    starts_with(path) {\n        if (path.segments.length > this.segments.length) {\n            return false;\n        }\n        let i = 0;\n        for (const segment of path.segments) {\n            if (this.segments[i] !== segment) {\n                return false;\n            }\n            i += 1;\n        }\n        return true;\n    }\n    normalise() {\n        const stack = [];\n        for (const segment of this.segments) {\n            switch (segment) {\n                case \".\": {\n                    continue;\n                }\n                case \"..\": {\n                    stack.pop();\n                    continue;\n                }\n                default: {\n                    stack.push(segment);\n                    continue;\n                }\n            }\n        }\n        return new Pathname(this.is_absolute, stack);\n    }\n    basename() {\n        if (this.segments.length > 0) {\n            return this.segments[this.segments.length - 1];\n        }\n        else {\n            return \"\";\n        }\n    }\n    extname() {\n        const match = this.basename().match(/(\\.[^\\.]+)$/);\n        if (match != null) {\n            return match[1];\n        }\n        else {\n            return null;\n        }\n    }\n    dirname() {\n        return new Pathname(this.is_absolute, this.segments.slice(0, -1));\n    }\n}\nexports.Pathname = Pathname;\nfunction get_segments(x) {\n    return x\n        .replace(/\\/{2,}/g, \"/\")\n        .split(\"/\")\n        .map(parse_segment);\n}\nfunction parse_segment(x) {\n    if (/^[^\\/#\\?]+$/.test(x)) {\n        return x;\n    }\n    else {\n        throw new Error(`invalid segment: ${x}`);\n    }\n}\n\n});\n\n// packages\\kate-api\\build\\cart-fs.js\nrequire.define(8, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\cart-fs.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.KateCartFS = void 0;\nconst util_1 = require(4);\nclass KateCartFS {\n    #channel;\n    constructor(channel) {\n        this.#channel = channel;\n    }\n    read_file(path0) {\n        const path = util_1.Pathname.from_string(path0)\n            .normalise()\n            .make_absolute()\n            .as_string();\n        return this.#channel.call(\"kate:cart.read-file\", { path });\n    }\n    async get_file_url(path) {\n        const file = await this.read_file(path);\n        const blob = new Blob([file.bytes], { type: file.mime });\n        return URL.createObjectURL(blob);\n    }\n}\nexports.KateCartFS = KateCartFS;\n\n});\n\n// packages\\kate-api\\build\\cart-manager.js\nrequire.define(9, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\cart-manager.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.KateCartManager = void 0;\nclass KateCartManager {\n    #channel;\n    constructor(channel) {\n        this.#channel = channel;\n    }\n    async install(cartridge) {\n        await this.#channel.call(\"kate:cart-manager.install\", { cartridge }, [\n            cartridge.buffer,\n        ]);\n    }\n}\nexports.KateCartManager = KateCartManager;\n\n});\n\n// packages\\kate-api\\build\\channel.js\nrequire.define(10, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\channel.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.KateIPC = void 0;\nconst util_1 = require(4);\nclass KateIPC {\n    #secret;\n    #pending;\n    #initialised;\n    #server;\n    events = {\n        input_state_changed: new util_1.EventStream(),\n        key_pressed: new util_1.EventStream(),\n        take_screenshot: new util_1.EventStream(),\n        start_recording: new util_1.EventStream(),\n        stop_recording: new util_1.EventStream(),\n        paused: new util_1.EventStream(),\n    };\n    constructor(secret, server) {\n        this.#secret = secret;\n        this.#pending = new Map();\n        this.#initialised = false;\n        this.#server = server;\n    }\n    #make_id() {\n        let id = new Uint8Array(16);\n        crypto.getRandomValues(id);\n        return Array.from(id)\n            .map((x) => x.toString(16).padStart(2, \"0\"))\n            .join(\"\");\n    }\n    setup() {\n        if (this.#initialised) {\n            throw new Error(`setup() called twice`);\n        }\n        this.#initialised = true;\n        window.addEventListener(\"message\", this.handle_message);\n    }\n    #do_send(id, type, payload, transfer = []) {\n        this.#server.postMessage({\n            type: type,\n            secret: this.#secret,\n            id: id,\n            payload: payload,\n        }, \"*\", transfer);\n    }\n    async call(type, payload, transfer = []) {\n        const deferred = (0, util_1.defer)();\n        const id = this.#make_id();\n        this.#pending.set(id, deferred);\n        this.#do_send(id, type, payload, transfer);\n        return deferred.promise;\n    }\n    async send_and_ignore_result(type, payload, transfer = []) {\n        this.#do_send(this.#make_id(), type, payload);\n    }\n    handle_message = (ev) => {\n        switch (ev.data.type) {\n            case \"kate:reply\": {\n                const pending = this.#pending.get(ev.data.id);\n                if (pending != null) {\n                    this.#pending.delete(ev.data.id);\n                    if (ev.data.ok) {\n                        pending.resolve(ev.data.value);\n                    }\n                    else {\n                        pending.reject(ev.data.value);\n                    }\n                }\n                break;\n            }\n            case \"kate:input-state-changed\": {\n                this.events.input_state_changed.emit({\n                    key: ev.data.key,\n                    is_down: ev.data.is_down,\n                });\n                break;\n            }\n            case \"kate:input-key-pressed\": {\n                this.events.key_pressed.emit(ev.data.key);\n                break;\n            }\n            case \"kate:paused\": {\n                this.events.paused.emit(ev.data.state);\n                break;\n            }\n            case \"kate:take-screenshot\": {\n                this.events.take_screenshot.emit({ token: ev.data.token });\n                break;\n            }\n            case \"kate:start-recording\": {\n                this.events.start_recording.emit({ token: ev.data.token });\n                break;\n            }\n            case \"kate:stop-recording\": {\n                this.events.stop_recording.emit();\n                break;\n            }\n        }\n    };\n}\nexports.KateIPC = KateIPC;\n\n});\n\n// packages\\kate-api\\build\\device-file.js\nrequire.define(11, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\device-file.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.DeviceFileHandle = exports.KateDeviceFileAccess = void 0;\nconst util_1 = require(4);\nclass KateDeviceFileAccess {\n    #channel;\n    constructor(channel) {\n        this.#channel = channel;\n    }\n    async request_file(options) {\n        const handles = (await this.#channel.call(\"kate:device-fs.request-file\", options));\n        return handles.map((x) => {\n            return new DeviceFileHandle(this.#channel, x.id, x.path);\n        });\n    }\n    async request_directory() {\n        const handles = (await this.#channel.call(\"kate:device-fs.request-directory\", {}));\n        return handles.map((x) => new DeviceFileHandle(this.#channel, x.id, x.path));\n    }\n}\nexports.KateDeviceFileAccess = KateDeviceFileAccess;\nclass DeviceFileHandle {\n    _id;\n    #channel;\n    relative_path;\n    constructor(channel, _id, path) {\n        this._id = _id;\n        this.#channel = channel;\n        this.relative_path = util_1.Pathname.from_string(path);\n    }\n    async read() {\n        return await this.#channel.call(\"kate:device-fs.read-file\", {\n            id: this._id,\n        });\n    }\n}\nexports.DeviceFileHandle = DeviceFileHandle;\n\n});\n\n// packages\\kate-api\\build\\dialog.js\nrequire.define(12, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\dialog.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.KateDialogs = void 0;\nclass KateDialogs {\n    #channel;\n    constructor(channel) {\n        this.#channel = channel;\n    }\n    async text_input(message, options) {\n        return await this.#channel.call(\"kate:dialog.text-input\", {\n            message,\n            initial_value: options.initial_value,\n            max_length: options.max_length,\n            type: options.type,\n            placeholder: options.placeholder,\n        });\n    }\n    async message(message) {\n        await this.#channel.call(\"kate:dialog.message\", { message });\n    }\n}\nexports.KateDialogs = KateDialogs;\n\n});\n\n// packages\\kate-api\\build\\input.js\nrequire.define(13, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\input.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.KateInput = void 0;\nconst util_1 = require(4);\nclass KateInput {\n    timer;\n    #channel;\n    on_key_pressed = new util_1.EventStream();\n    on_extended_key_pressed = new util_1.EventStream();\n    _paused = false;\n    _state = Object.assign(Object.create(null), {\n        up: 0,\n        right: 0,\n        down: 0,\n        left: 0,\n        menu: 0,\n        capture: 0,\n        x: 0,\n        o: 0,\n        ltrigger: 0,\n        rtrigger: 0,\n    });\n    _changed = new Set();\n    _keys = Object.keys(this._state);\n    constructor(channel, timer) {\n        this.timer = timer;\n        this.#channel = channel;\n    }\n    get is_paused() {\n        return this._paused;\n    }\n    setup() {\n        this.#channel.events.input_state_changed.listen(({ key, is_down }) => {\n            if (!this._paused) {\n                if (is_down) {\n                    if (this._state[key] <= 0) {\n                        this._changed.add(key);\n                        this.on_key_pressed.emit(key);\n                    }\n                    this._state[key] = Math.max(1, this._state[key]);\n                }\n                else {\n                    if (this._state[key] > 0) {\n                        this._changed.add(key);\n                    }\n                    this._state[key] = -1;\n                }\n            }\n        });\n        this.#channel.events.paused.listen((state) => {\n            this._paused = state;\n            for (const key of this._keys) {\n                this._state[key] = 0;\n            }\n        });\n        this.#channel.events.key_pressed.listen((key) => this.on_extended_key_pressed.emit(key));\n        this.timer.on_tick.listen(this.update_key_state);\n    }\n    update_key_state = () => {\n        for (const key of this._keys) {\n            if (this._state[key] !== 0 && !this._changed.has(key)) {\n                this._state[key] += 1;\n                if (this._state[key] >= 65536) {\n                    this._state[key] = 2;\n                }\n            }\n        }\n        this._changed.clear();\n    };\n    is_pressed(key) {\n        return this._state[key] > 0;\n    }\n    frames_pressed(key) {\n        if (this._state[key] <= 0) {\n            return 0;\n        }\n        else {\n            return this._state[key];\n        }\n    }\n    is_just_pressed(key) {\n        return this._state[key] === 1;\n    }\n    is_just_released(key) {\n        return this._state[key] === -1;\n    }\n}\nexports.KateInput = KateInput;\n\n});\n\n// packages\\kate-api\\build\\object-store.js\nrequire.define(14, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\object-store.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.KateObjectStore = void 0;\nclass KateObjectStore {\n    #channel;\n    special_keys = {\n        local_storage: \"kate:local-storage\",\n    };\n    constructor(channel) {\n        this.#channel = channel;\n    }\n    versioned() {\n        return new OSCartridge(this.#channel, true);\n    }\n    unversioned() {\n        return new OSCartridge(this.#channel, false);\n    }\n}\nexports.KateObjectStore = KateObjectStore;\nclass OSCartridge {\n    versioned;\n    #channel;\n    constructor(channel, versioned) {\n        this.versioned = versioned;\n        this.#channel = channel;\n    }\n    async list_buckets(count) {\n        const buckets = (await this.#channel.call(\"kate:store.list-buckets\", {\n            versioned: this.versioned,\n            count: count,\n        }));\n        return buckets.map((x) => new OSBucket(this.#channel, this.versioned, x.name));\n    }\n    async add_bucket(name) {\n        await this.#channel.call(\"kate:store.add-bucket\", {\n            versioned: this.versioned,\n            name,\n        });\n        return new OSBucket(this.#channel, this.versioned, name);\n    }\n    async ensure_bucket(name) {\n        await this.#channel.call(\"kate:store.ensure-bucket\", {\n            versioned: this.versioned,\n            name,\n        });\n        return new OSBucket(this.#channel, this.versioned, name);\n    }\n    async get_bucket(name) {\n        return new OSBucket(this.#channel, this.versioned, name);\n    }\n    async get_special_bucket() {\n        return new OSBucket(this.#channel, this.versioned, \"kate:special\");\n    }\n    async get_local_storage() {\n        const bucket = await this.get_special_bucket();\n        return (bucket.try_read(\"kate:local-storage\") ?? Object.create(null));\n    }\n    async update_local_storage(data) {\n        const bucket = await this.get_special_bucket();\n        await bucket.write(\"kate:local-storage\", {\n            type: \"kate::structured\",\n            metadata: {},\n            data: data,\n        });\n    }\n    async delete_bucket(name) {\n        await this.#channel.call(\"kate:store.delete-bucket\", {\n            versioned: this.versioned,\n            name,\n        });\n    }\n    async usage() {\n        return this.#channel.call(\"kate:store.usage\", {\n            versioned: this.versioned,\n        });\n    }\n}\nclass OSBucket {\n    versioned;\n    name;\n    #channel;\n    constructor(channel, versioned, name) {\n        this.versioned = versioned;\n        this.name = name;\n        this.#channel = channel;\n    }\n    async count() {\n        return this.#channel.call(\"kate:store.count-entries\", {\n            versioned: this.versioned,\n            bucket_name: this.name,\n        });\n    }\n    async list(count) {\n        return this.#channel.call(\"kate:store.list-entries\", {\n            versioned: this.versioned,\n            bucket_name: this.name,\n            count: count,\n        });\n    }\n    async read(key) {\n        return this.#channel.call(\"kate:store.read\", {\n            versioned: this.versioned,\n            bucket_name: this.name,\n            key: key,\n        });\n    }\n    async read_data(key) {\n        return (await this.read(key)).data;\n    }\n    async try_read(key) {\n        return this.#channel.call(\"kate:store.try-read\", {\n            versioned: this.versioned,\n            bucket_name: this.name,\n            key: key,\n        });\n    }\n    async try_read_data(key) {\n        return (await this.try_read(key))?.data ?? null;\n    }\n    async write(key, entry) {\n        return this.#channel.call(\"kate:store.write\", {\n            versioned: this.versioned,\n            bucket_name: this.name,\n            key: key,\n            type: entry.type,\n            metadata: entry.metadata,\n            data: entry.data,\n        });\n    }\n    async write_structured(key, data, metadata = {}) {\n        await this.write(key, { type: \"kate::structured\", metadata, data });\n    }\n    async create(key, entry) {\n        return this.#channel.call(\"kate:store.create\", {\n            versioned: this.versioned,\n            bucket_name: this.name,\n            key: key,\n            type: entry.type,\n            metadata: entry.metadata,\n            data: entry.data,\n        });\n    }\n    async create_structured(key, data, metadata = {}) {\n        return await this.create(key, { type: \"kate::structured\", metadata, data });\n    }\n    async delete(key) {\n        return this.#channel.call(\"kate:store.delete\", {\n            versioned: this.versioned,\n            bucket_name: this.name,\n            key: key,\n        });\n    }\n}\n\n});\n\n// packages\\kate-api\\build\\pointer-input.js\nrequire.define(15, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\pointer-input.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.KatePointerInput = void 0;\nconst util_1 = require(4);\nclass KatePointerInput {\n    timer;\n    on_moved = new util_1.EventStream();\n    on_clicked = new util_1.EventStream();\n    on_alternate = new util_1.EventStream();\n    on_down = new util_1.EventStream();\n    on_up = new util_1.EventStream();\n    _started = false;\n    _location = {\n        x: 0,\n        y: 0,\n    };\n    _buttons = new Map();\n    constructor(timer) {\n        this.timer = timer;\n    }\n    get x() {\n        return this._location.x;\n    }\n    get y() {\n        return this._location.y;\n    }\n    get location() {\n        return { x: this.x, y: this.y };\n    }\n    frames_pressed(button) {\n        return this._buttons.get(button) ?? 0;\n    }\n    is_pressed(button) {\n        return (this._buttons.get(button) ?? 0) > 0;\n    }\n    is_just_pressed(button) {\n        return (this._buttons.get(button) ?? 0) === 1;\n    }\n    is_just_released(button) {\n        return (this._buttons.get(button) ?? 0) === -1;\n    }\n    monitor(cover) {\n        if (this._started) {\n            throw new Error(`monitor() called twice`);\n        }\n        this._started = true;\n        cover.addEventListener(\"mousemove\", (ev) => {\n            this._location.x = ev.pageX;\n            this._location.y = ev.pageY;\n            this.on_moved.emit({ x: ev.pageX, y: ev.pageY });\n        });\n        cover.addEventListener(\"mousedown\", (ev) => {\n            this._buttons.set(ev.button, 1);\n            this.on_down.emit({\n                location: this.location,\n                button: ev.button,\n            });\n        });\n        cover.addEventListener(\"mouseup\", (ev) => {\n            this._buttons.set(ev.button, -1);\n            this.on_up.emit({\n                location: this.location,\n                button: ev.button,\n            });\n        });\n        cover.addEventListener(\"click\", (ev) => {\n            ev.preventDefault();\n            this.on_clicked.emit({\n                location: this.location,\n                button: ev.button,\n            });\n        });\n        cover.addEventListener(\"contextmenu\", (ev) => {\n            ev.preventDefault();\n            this.on_alternate.emit({\n                location: this.location,\n                button: ev.button,\n            });\n        });\n        this.timer.on_tick.listen(this.update_state);\n    }\n    update_state = () => {\n        for (const [button, frames0] of this._buttons.entries()) {\n            if (frames0 === 0) {\n                continue;\n            }\n            let frames = Math.min(255, frames0 + 1);\n            if (frames !== frames0) {\n                this._buttons.set(button, frames);\n            }\n        }\n    };\n}\nexports.KatePointerInput = KatePointerInput;\n\n});\n\n// packages\\kate-api\\build\\timer.js\nrequire.define(16, \"packages\\\\kate-api\\\\build\", \"packages\\\\kate-api\\\\build\\\\timer.js\", (module, exports, __dirname, __filename) => {\n\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.KateTimer = void 0;\nconst util_1 = require(4);\nclass KateTimer {\n    on_tick = new util_1.EventStream();\n    _last_time = null;\n    _timer_id = null;\n    MAX_FPS = 30;\n    ONE_FRAME = Math.ceil(1000 / 30);\n    _fps = 30;\n    setup() {\n        cancelAnimationFrame(this._timer_id);\n        this._last_time = null;\n        this._timer_id = requestAnimationFrame(this.tick);\n    }\n    get fps() {\n        return this._fps;\n    }\n    tick = (time) => {\n        if (this._last_time == null) {\n            this._last_time = time;\n            this._fps = this.MAX_FPS;\n            this.on_tick.emit(time);\n            this._timer_id = requestAnimationFrame(this.tick);\n        }\n        else {\n            const elapsed = time - this._last_time;\n            if (elapsed < this.ONE_FRAME) {\n                this._timer_id = requestAnimationFrame(this.tick);\n            }\n            else {\n                this._last_time = time;\n                this._fps = (1000 / elapsed) | 0;\n                this.on_tick.emit(time);\n                this._timer_id = requestAnimationFrame(this.tick);\n            }\n        }\n    };\n}\nexports.KateTimer = KateTimer;\n\n});\n\nmodule.exports = require(1);\n}((() => {\n  if (typeof require !== \"undefined\" && typeof module !== \"undefined\") {\n    return [module, module.exports, require];\n  } else if (typeof window !== \"undefined\") {\n    const module = Object.create(null);\n    module.exports = Object.create(null);\n    Object.defineProperty(window, \"KateAPI\", {\n      get() { return module.exports },\n      set(v) { module.exports = v }\n    });\n    return [module, module.exports, (id) => {\n      throw new Error(\"Cannot load \" + JSON.stringify(id) + \" because node modules are not supported.\");\n    }];\n  } else {\n    throw new Error(\"Unsupported environment\");\n  }\n})());",
    "kate-bridge.js": "(function(f){if(typeof exports===\"object\"&&typeof module!==\"undefined\"){module.exports=f()}else if(typeof define===\"function\"&&define.amd){define([],f)}else{var g;if(typeof window!==\"undefined\"){g=window}else if(typeof global!==\"undefined\"){g=global}else if(typeof self!==\"undefined\"){g=self}else{g=this}g.KateAPI = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c=\"function\"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error(\"Cannot find module '\"+i+\"'\");throw a.code=\"MODULE_NOT_FOUND\",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u=\"function\"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateAudioChannel = exports.KateAudioSource = exports.KateAudio = void 0;\r\nclass KateAudio {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    async create_channel(name) {\r\n        const { id, volume } = await this.#channel.call(\"kate:audio.create-channel\", {});\r\n        return new KateAudioChannel(this, name, id, volume);\r\n    }\r\n    async resume_channel(channel) {\r\n        await this.#channel.call(\"kate:audio.resume-channel\", { id: channel.id });\r\n    }\r\n    async pause_channel(channel) {\r\n        await this.#channel.call(\"kate:audio.pause-channel\", { id: channel.id });\r\n    }\r\n    async change_channel_volume(channel, value) {\r\n        await this.#channel.call(\"kate:audio.change-volume\", {\r\n            id: channel.id,\r\n            volume: value,\r\n        });\r\n    }\r\n    async load_audio(mime, bytes) {\r\n        const audio = await this.#channel.call(\"kate:audio.load\", {\r\n            mime,\r\n            bytes,\r\n        });\r\n        return new KateAudioSource(this, audio);\r\n    }\r\n    async play(channel, audio, loop) {\r\n        await this.#channel.call(\"kate:audio.play\", {\r\n            channel: channel.id,\r\n            source: audio.id,\r\n            loop: loop,\r\n        });\r\n    }\r\n}\r\nexports.KateAudio = KateAudio;\r\nclass KateAudioSource {\r\n    audio;\r\n    id;\r\n    constructor(audio, id) {\r\n        this.audio = audio;\r\n        this.id = id;\r\n    }\r\n}\r\nexports.KateAudioSource = KateAudioSource;\r\nclass KateAudioChannel {\r\n    audio;\r\n    name;\r\n    id;\r\n    _volume;\r\n    constructor(audio, name, id, _volume) {\r\n        this.audio = audio;\r\n        this.name = name;\r\n        this.id = id;\r\n        this._volume = _volume;\r\n    }\r\n    get volume() {\r\n        return this._volume;\r\n    }\r\n    async set_volume(value) {\r\n        if (value < 0 || value > 1) {\r\n            throw new Error(`Invalid volume value ${value}`);\r\n        }\r\n        this._volume = value;\r\n        this.audio.change_channel_volume(this, value);\r\n    }\r\n    async resume() {\r\n        return this.audio.resume_channel(this);\r\n    }\r\n    async pause() {\r\n        return this.audio.pause_channel(this);\r\n    }\r\n    async play(source, loop) {\r\n        return this.audio.play(this, source, loop);\r\n    }\r\n}\r\nexports.KateAudioChannel = KateAudioChannel;\r\n\n},{}],2:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateCartFS = void 0;\r\nclass KateCartFS {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    read_file(path0) {\r\n        const path = new URL(path0, \"http://localhost\").pathname;\r\n        return this.#channel.call(\"kate:cart.read-file\", { path });\r\n    }\r\n    async get_file_url(path) {\r\n        const file = await this.read_file(path);\r\n        const blob = new Blob([file.bytes], { type: file.mime });\r\n        return URL.createObjectURL(blob);\r\n    }\r\n}\r\nexports.KateCartFS = KateCartFS;\r\n\n},{}],3:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateIPC = void 0;\r\nconst events_1 = require(\"../../util/build/events\");\r\nconst promise_1 = require(\"../../util/build/promise\");\r\nclass KateIPC {\r\n    #secret;\r\n    #pending;\r\n    #initialised;\r\n    #server;\r\n    events = {\r\n        input_state_changed: new events_1.EventStream(),\r\n        key_pressed: new events_1.EventStream(),\r\n        paused: new events_1.EventStream(),\r\n    };\r\n    constructor(secret, server) {\r\n        this.#secret = secret;\r\n        this.#pending = new Map();\r\n        this.#initialised = false;\r\n        this.#server = server;\r\n    }\r\n    make_id() {\r\n        let id = new Uint8Array(16);\r\n        crypto.getRandomValues(id);\r\n        return Array.from(id)\r\n            .map((x) => x.toString(16).padStart(2, \"0\"))\r\n            .join(\"\");\r\n    }\r\n    setup() {\r\n        if (this.#initialised) {\r\n            throw new Error(`setup() called twice`);\r\n        }\r\n        this.#initialised = true;\r\n        window.addEventListener(\"message\", this.handle_message);\r\n    }\r\n    do_send(id, type, payload) {\r\n        this.#server.postMessage({\r\n            type: type,\r\n            secret: this.#secret,\r\n            id: id,\r\n            payload: payload,\r\n        }, \"*\");\r\n    }\r\n    async call(type, payload) {\r\n        const deferred = (0, promise_1.defer)();\r\n        const id = this.make_id();\r\n        this.#pending.set(id, deferred);\r\n        this.do_send(id, type, payload);\r\n        return deferred.promise;\r\n    }\r\n    async send_and_ignore_result(type, payload) {\r\n        this.do_send(this.make_id(), type, payload);\r\n    }\r\n    handle_message = (ev) => {\r\n        switch (ev.data.type) {\r\n            case \"kate:reply\": {\r\n                const pending = this.#pending.get(ev.data.id);\r\n                if (pending != null) {\r\n                    this.#pending.delete(ev.data.id);\r\n                    if (ev.data.ok) {\r\n                        pending.resolve(ev.data.value);\r\n                    }\r\n                    else {\r\n                        pending.reject(ev.data.value);\r\n                    }\r\n                }\r\n                break;\r\n            }\r\n            case \"kate:input-state-changed\": {\r\n                this.events.input_state_changed.emit({\r\n                    key: ev.data.key,\r\n                    is_down: ev.data.is_down,\r\n                });\r\n                break;\r\n            }\r\n            case \"kate:input-key-pressed\": {\r\n                this.events.key_pressed.emit(ev.data.key);\r\n                break;\r\n            }\r\n            case \"kate:paused\": {\r\n                this.events.paused.emit(ev.data.state);\r\n                break;\r\n            }\r\n        }\r\n    };\r\n}\r\nexports.KateIPC = KateIPC;\r\n\n},{\"../../util/build/events\":8,\"../../util/build/promise\":9}],4:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.timer = exports.audio = exports.input = exports.kv_store = exports.cart_fs = exports.events = void 0;\r\nconst audio_1 = require(\"./audio\");\r\nconst cart_fs_1 = require(\"./cart-fs\");\r\nconst channel_1 = require(\"./channel\");\r\nconst input_1 = require(\"./input\");\r\nconst kv_store_1 = require(\"./kv-store\");\r\nconst timer_1 = require(\"./timer\");\r\nconst channel = new channel_1.KateIPC(KATE_SECRET, window.parent);\r\nchannel.setup();\r\nexports.events = channel.events;\r\nexports.cart_fs = new cart_fs_1.KateCartFS(channel);\r\nexports.kv_store = new kv_store_1.KateKVStore(channel);\r\nexports.input = new input_1.KateInput(channel);\r\nexports.input.setup();\r\nexports.audio = new audio_1.KateAudio(channel);\r\nexports.timer = new timer_1.KateTimer();\r\nexports.timer.setup();\r\n\n},{\"./audio\":1,\"./cart-fs\":2,\"./channel\":3,\"./input\":5,\"./kv-store\":6,\"./timer\":7}],5:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateInput = void 0;\r\nconst events_1 = require(\"../../util/build/events\");\r\nclass KateInput {\r\n    #channel;\r\n    on_key_pressed = new events_1.EventStream();\r\n    _state = Object.assign(Object.create(null), {\r\n        up: false,\r\n        right: false,\r\n        down: false,\r\n        left: false,\r\n        menu: false,\r\n        capture: false,\r\n        x: false,\r\n        o: false,\r\n        ltrigger: false,\r\n        rtrigger: false,\r\n    });\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    setup() {\r\n        this.#channel.events.input_state_changed.listen(({ key, is_down }) => {\r\n            this._state[key] = is_down;\r\n        });\r\n        this.#channel.events.key_pressed.listen((key) => {\r\n            this.on_key_pressed.emit(key);\r\n        });\r\n    }\r\n    is_down(key) {\r\n        return this._state[key];\r\n    }\r\n}\r\nexports.KateInput = KateInput;\r\n\n},{\"../../util/build/events\":8}],6:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateKVStore = void 0;\r\nclass KateKVStore {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    async read_all() {\r\n        return await this.#channel.call(\"kate:kv-store.read-all\", {});\r\n    }\r\n    async replace_all(value) {\r\n        await this.#channel.call(\"kate:kv-store.update-all\", { value });\r\n    }\r\n    async get(key) {\r\n        return await this.#channel.call(\"kate:kv-store.get\", { key });\r\n    }\r\n    async set(key, value) {\r\n        await this.#channel.call(\"kate:kv-store.set\", { key, value });\r\n    }\r\n    async delete(key) {\r\n        await this.#channel.call(\"kate:kv-store.delete\", { key });\r\n    }\r\n    async delete_all() {\r\n        await this.replace_all({});\r\n    }\r\n}\r\nexports.KateKVStore = KateKVStore;\r\n\n},{}],7:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateTimer = void 0;\r\nconst events_1 = require(\"../../util/build/events\");\r\nclass KateTimer {\r\n    on_tick = new events_1.EventStream();\r\n    _last_time = null;\r\n    _timer_id = null;\r\n    MAX_FPS = 30;\r\n    ONE_FRAME = Math.ceil(1000 / 30);\r\n    _fps = 30;\r\n    setup() {\r\n        cancelAnimationFrame(this._timer_id);\r\n        this._last_time = null;\r\n        this._timer_id = requestAnimationFrame(this.tick);\r\n    }\r\n    get fps() {\r\n        return this._fps;\r\n    }\r\n    tick = (time) => {\r\n        if (this._last_time == null) {\r\n            this._last_time = time;\r\n            this._fps = this.MAX_FPS;\r\n            this.on_tick.emit(time);\r\n            this._timer_id = requestAnimationFrame(this.tick);\r\n        }\r\n        else {\r\n            const elapsed = time - this._last_time;\r\n            if (elapsed < this.ONE_FRAME) {\r\n                this._timer_id = requestAnimationFrame(this.tick);\r\n            }\r\n            else {\r\n                this._last_time = time;\r\n                this._fps = (1000 / elapsed) | 0;\r\n                this.on_tick.emit(time);\r\n                this._timer_id = requestAnimationFrame(this.tick);\r\n            }\r\n        }\r\n    };\r\n}\r\nexports.KateTimer = KateTimer;\r\n\n},{\"../../util/build/events\":8}],8:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.EventStream = void 0;\r\nclass EventStream {\r\n    subscribers = [];\r\n    on_dispose = () => { };\r\n    listen(fn) {\r\n        this.remove(fn);\r\n        this.subscribers.push(fn);\r\n        return fn;\r\n    }\r\n    remove(fn) {\r\n        this.subscribers = this.subscribers.filter((x) => x !== fn);\r\n        return this;\r\n    }\r\n    emit(ev) {\r\n        for (const fn of this.subscribers) {\r\n            fn(ev);\r\n        }\r\n    }\r\n    dispose() {\r\n        this.on_dispose();\r\n    }\r\n    filter(fn) {\r\n        const stream = new EventStream();\r\n        const subscriber = this.listen((ev) => {\r\n            if (fn(ev)) {\r\n                stream.emit(ev);\r\n            }\r\n        });\r\n        stream.on_dispose = () => {\r\n            this.remove(subscriber);\r\n        };\r\n        return stream;\r\n    }\r\n    map(fn) {\r\n        const stream = new EventStream();\r\n        const subscriber = this.listen((ev) => {\r\n            stream.emit(fn(ev));\r\n        });\r\n        stream.on_dispose = () => {\r\n            this.remove(subscriber);\r\n        };\r\n        return stream;\r\n    }\r\n}\r\nexports.EventStream = EventStream;\r\n\n},{}],9:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.sleep = exports.defer = void 0;\r\nfunction defer() {\r\n    const p = Object.create(null);\r\n    p.promise = new Promise((resolve, reject) => {\r\n        p.resolve = resolve;\r\n        p.reject = reject;\r\n    });\r\n    return p;\r\n}\r\nexports.defer = defer;\r\nfunction sleep(ms) {\r\n    return new Promise((resolve, reject) => {\r\n        setTimeout(() => resolve(), ms);\r\n    });\r\n}\r\nexports.sleep = sleep;\r\n\n},{}]},{},[4])(4)\n});\n",
    "local-storage.js": "\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nvoid (function () {\n    const { store } = KateAPI;\n    let contents = { ...(KATE_LOCAL_STORAGE ?? {}) };\n    const unversioned_store = store.unversioned();\n    let timer = null;\n    function persist(contents) {\n        clearTimeout(timer);\n        timer = setTimeout(() => {\n            unversioned_store.update_local_storage(contents).catch((e) => {\n                console.error(\"[Kate] Failed to update local storage\", e);\n            });\n        });\n    }\n    class KateStorage {\n        __contents;\n        __persistent;\n        constructor(contents, persistent) {\n            this.__contents = contents;\n            this.__persistent = persistent;\n        }\n        _persist() {\n            if (this.__persistent) {\n                persist(this.__contents);\n            }\n        }\n        getItem(name) {\n            return this.__contents[name] ?? null;\n        }\n        setItem(name, value) {\n            this.__contents[name] = String(value);\n            this._persist();\n        }\n        removeItem(name) {\n            delete this.__contents[name];\n            this._persist();\n        }\n        clear() {\n            this.__contents = Object.create(null);\n            this._persist();\n        }\n        key(index) {\n            return this.getItem(Object.keys(this.__contents)[index]) ?? null;\n        }\n        get length() {\n            return Object.keys(this.__contents).length;\n        }\n    }\n    function proxy_storage(storage, key) {\n        const exposed = [\"getItem\", \"setItem\", \"removeItem\", \"clear\", \"key\"];\n        Object.defineProperty(window, key, {\n            value: new Proxy(storage, {\n                get(target, prop, receiver) {\n                    return exposed.includes(prop)\n                        ? storage[prop].bind(storage)\n                        : storage.getItem(prop);\n                },\n                has(target, prop) {\n                    return exposed.includes(prop) || prop in contents;\n                },\n                set(target, prop, value) {\n                    storage.setItem(prop, value);\n                    return true;\n                },\n                deleteProperty(target, prop) {\n                    storage.removeItem(prop);\n                    return true;\n                },\n            }),\n        });\n    }\n    const storage = new KateStorage(contents, true);\n    proxy_storage(storage, \"localStorage\");\n    const session_storage = new KateStorage({}, false);\n    proxy_storage(session_storage, \"sessionStorage\");\n})();\n",
    "pointer-input.js": "\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nvoid (function () {\n    const MAX_RETRIES = 60;\n    function try_monitor(retries) {\n        const element = document.querySelector(SELECTOR);\n        if (element instanceof HTMLElement) {\n            do_monitor(element);\n        }\n        else if (retries > 0) {\n            setTimeout(() => try_monitor(retries - 1), 1_000);\n        }\n        else {\n            console.warn(`[Kate] could not find '${SELECTOR}' to proxy pointer events in ${MAX_RETRIES} seconds. Giving up.`);\n        }\n    }\n    function do_monitor(element) {\n        const pointer = KateAPI.pointer_input;\n        const bounds = element.getBoundingClientRect();\n        function translate_location(ev) {\n            return {\n                x: ev.x - bounds.x,\n                y: ev.y - bounds.y,\n            };\n        }\n        function make_move_event(ev0) {\n            const ev = translate_location(ev0);\n            return new MouseEvent(\"mousemove\", {\n                screenX: ev.x,\n                screenY: ev.y,\n                clientX: ev.x,\n                clientY: ev.y,\n            });\n        }\n        function make_press_event(type, ev0) {\n            const loc = translate_location(ev0.location);\n            return new MouseEvent(type, {\n                screenX: loc.x,\n                screenY: loc.y,\n                clientX: loc.x,\n                clientY: loc.y,\n                button: ev0.button,\n            });\n        }\n        if (HIDE_CURSOR) {\n            element.style.cursor = \"none\";\n        }\n        pointer.on_moved.listen((ev0) => {\n            const ev = make_move_event(ev0);\n            element.dispatchEvent(ev);\n        });\n        pointer.on_down.listen((ev0) => {\n            element.dispatchEvent(make_press_event(\"mousedown\", ev0));\n        });\n        pointer.on_up.listen((ev0) => {\n            element.dispatchEvent(make_press_event(\"mouseup\", ev0));\n        });\n        pointer.on_clicked.listen((ev0) => {\n            element.dispatchEvent(make_press_event(\"click\", ev0));\n        });\n        pointer.on_alternate.listen((ev0) => {\n            element.dispatchEvent(make_press_event(\"contextmenu\", ev0));\n        });\n    }\n    try_monitor(MAX_RETRIES);\n})();\n",
    "preserve-render.js": "\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\n// Make sure canvas WebGL contexts are instantiated to preserve buffers\n// after drawing, since screenshot and video capture cannot be synchronised\n// currently.\nvoid (function () {\n    const old_get_context = HTMLCanvasElement.prototype.getContext;\n    HTMLCanvasElement.prototype.getContext = function (context, options0) {\n        if (context === \"webgl\" || context === \"webgl2\") {\n            const options = Object.assign({}, options0, {\n                preserveDrawingBuffer: true,\n            });\n            return old_get_context.call(this, context, options);\n        }\n        else {\n            return old_get_context.call(this, context, options0);\n        }\n    };\n})();\n",
    "renpy-web-tweaks.js": "\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\nvoid (function () {\n    function hide_hamburger_menu() {\n        switch (VERSION.major) {\n            case 7:\n            case 8: {\n                const css = document.createElement(\"style\");\n                css.textContent = `\r\n        #ContextContainer {\r\n          display: none !important;\r\n        }\r\n        `;\n                document.head.appendChild(css);\n                break;\n            }\n            default:\n                console.warn(`Unsupported Ren'Py version ${VERSION.major}`);\n        }\n    }\n    hide_hamburger_menu();\n})();\n",
    "renpy.js": "\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nlet paused = false;\r\nconst { events } = KateAPI;\r\nconst add_event_listener = window.addEventListener;\r\nconst key_mapping = {\r\n    up: [\"ArrowUp\", \"ArrowUp\", 38],\r\n    right: [\"ArrowRight\", \"ArrowRight\", 39],\r\n    down: [\"ArrowDown\", \"ArrowDown\", 40],\r\n    left: [\"ArrowLeft\", \"ArrowLeft\", 37],\r\n    x: [\"Escape\", \"Escape\", 27],\r\n    o: [\"Enter\", \"Enter\", 13],\r\n    ltrigger: [\"PageUp\", \"PageUp\", 33],\r\n    rtrigger: [\"PageDown\", \"PageDown\", 34],\r\n};\r\nconst down_listeners = [];\r\nconst up_listeners = [];\r\nevents.input_state_changed.listen(({ key: kate_key, is_down }) => {\r\n    if (!paused) {\r\n        const data = key_mapping[kate_key];\r\n        if (data) {\r\n            const listeners = is_down ? down_listeners : up_listeners;\r\n            const type = is_down ? \"keydown\" : \"keyup\";\r\n            const [key, code, keyCode] = data;\r\n            const key_ev = new KeyboardEvent(type, { key, code, keyCode });\r\n            for (const fn of listeners) {\r\n                fn.call(document, key_ev);\r\n            }\r\n        }\r\n    }\r\n});\r\nevents.paused.listen((state) => {\r\n    paused = state;\r\n});\r\nfunction listen(type, listener, options) {\r\n    if (type === \"keydown\") {\r\n        down_listeners.push(listener);\r\n    }\r\n    else if (type === \"keyup\") {\r\n        up_listeners.push(listener);\r\n    }\r\n    else {\r\n        add_event_listener.call(this, type, listener, options);\r\n    }\r\n}\r\nwindow.addEventListener = listen;\r\ndocument.addEventListener = listen;\r\n",
    "rpgmk-mv.js": "\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nlet paused = false;\r\nconst { events } = KateAPI;\r\n// Disable RPGMkMV's handling of gamepads to avoid double-input handling.\r\nInput._updateGamepadState = () => { };\r\n// Ensure RPGMkMV uses ogg files (Kate will handle the decoding).\r\nWebAudio.canPlayOgg = () => true;\r\nWebAudio.canPlayM4a = () => false;\r\nAudioManager.audioFileExt = () => \".ogg\";\r\n// Patch RPGMkMV's keyboard input handling directly\r\nconst key_mapping = {\r\n    up: \"up\",\r\n    right: \"right\",\r\n    down: \"down\",\r\n    left: \"left\",\r\n    x: \"cancel\",\r\n    o: \"ok\",\r\n    menu: \"menu\",\r\n    rtrigger: \"shift\",\r\n};\r\nevents.input_state_changed.listen(({ key, is_down }) => {\r\n    if (!paused) {\r\n        const name = key_mapping[key];\r\n        if (name) {\r\n            Input._currentState[name] = is_down;\r\n        }\r\n    }\r\n});\r\nevents.paused.listen((state) => {\r\n    paused = state;\r\n    if (state) {\r\n        for (const key of Object.values(key_mapping)) {\r\n            Input._currentState[key] = false;\r\n        }\r\n    }\r\n});\r\n",
    "standard-network.js": "\"use strict\";\n/*\n * This Source Code Form is subject to the terms of the Mozilla Public\n * License, v. 2.0. If a copy of the MPL was not distributed with this\n * file, You can obtain one at https://mozilla.org/MPL/2.0/.\n */\n// Resolve GETs on the same domain to reads from the cartridge files.\n// This handles fetch, XMLHttpRequest, IMG, Audio, and Video.\nvoid (function () {\n    const { cart_fs } = KateAPI;\n    function is_data_url(x) {\n        if (typeof x !== \"string\") {\n            return false;\n        }\n        else {\n            return /^data:\\w+\\/\\w+;base64,/.test(x) || /^blob:/.test(x);\n        }\n    }\n    function fix_url(url0) {\n        if (is_data_url(url0)) {\n            return url0;\n        }\n        const url = new URL(url0, \"https://cartridge.kate.qteati.me\");\n        if (url.hostname !== \"cartridge.kate.qteati.me\") {\n            console.warn(`[Kate] Non-proxyable URL:`, url0);\n            return url0;\n        }\n        else {\n            return decodeURIComponent(url.pathname);\n        }\n    }\n    // -- Arbitrary fetching\n    const old_fetch = window.fetch;\n    window.fetch = async function (request, options) {\n        let url;\n        let method;\n        if (Object(request) === request && request.url) {\n            url = fix_url(request.url);\n            method = request.method;\n        }\n        else {\n            url = fix_url(request);\n            method = options?.method ?? \"GET\";\n        }\n        if (method !== \"GET\") {\n            return new Promise((_, reject) => reject(new Error(`Non-GET requests are not supported.`)));\n        }\n        if (is_data_url(url)) {\n            return old_fetch(url);\n        }\n        return new Promise(async (resolve, reject) => {\n            try {\n                const file = await cart_fs.get_file_url(String(url));\n                const result = await old_fetch(file);\n                resolve(result);\n            }\n            catch (error) {\n                console.error(`[Kate] failed to fetch ${url}`);\n                reject(error);\n            }\n        });\n    };\n    const old_xhr_open = XMLHttpRequest.prototype.open;\n    const old_xhr_send = XMLHttpRequest.prototype.send;\n    XMLHttpRequest.prototype.open = function (method, url) {\n        if (method !== \"GET\") {\n            throw new Error(`Non-GET requests are not supported.`);\n        }\n        this.__waiting_open = true;\n        void (async () => {\n            try {\n                const real_url = await cart_fs.get_file_url(fix_url(String(url)));\n                old_xhr_open.call(this, \"GET\", real_url, true);\n                this.__maybe_send();\n            }\n            catch (error) {\n                console.error(`[Kate] failed to fetch with XHR ${url}`);\n                old_xhr_open.call(this, \"GET\", \"not-found\", true);\n                this.__maybe_send();\n            }\n        })();\n    };\n    XMLHttpRequest.prototype.__maybe_send = function () {\n        this.__waiting_open = false;\n        if (this.__waiting_send) {\n            this.__waiting_send = false;\n            this.send();\n        }\n    };\n    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {\n        // Do nothing, there's no HTTP server handling these.\n    };\n    XMLHttpRequest.prototype.send = function () {\n        if (this.__waiting_open) {\n            this.__waiting_send = true;\n            return;\n        }\n        else {\n            return old_xhr_send.call(this);\n        }\n    };\n    // -- Image loading\n    const old_img_src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, \"src\");\n    Object.defineProperty(HTMLImageElement.prototype, \"src\", {\n        enumerable: old_img_src.enumerable,\n        configurable: old_img_src.configurable,\n        get() {\n            return this.__src ?? old_img_src.get.call(this);\n        },\n        set(url0) {\n            const url = fix_url(url0);\n            this.__src = url;\n            if (is_data_url(url)) {\n                old_img_src.set.call(this, url);\n                return;\n            }\n            void (async () => {\n                try {\n                    const real_url = await cart_fs.get_file_url(String(url));\n                    old_img_src.set.call(this, real_url);\n                }\n                catch (error) {\n                    console.error(`[Kate] failed to load image ${url}`);\n                    old_img_src.set.call(this, \"not-found\");\n                }\n            })();\n        },\n    });\n    // -- Script loading\n    const old_script_src = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, \"src\");\n    Object.defineProperty(HTMLScriptElement.prototype, \"src\", {\n        enumerable: old_script_src.enumerable,\n        configurable: old_script_src.configurable,\n        get() {\n            return this.__src ?? old_script_src.get.call(this);\n        },\n        set(url0) {\n            const url = fix_url(url0);\n            this.__src = url;\n            if (is_data_url(url)) {\n                old_script_src.set.call(this, url);\n                return;\n            }\n            void (async () => {\n                try {\n                    const real_url = await cart_fs.get_file_url(String(url));\n                    old_script_src.set.call(this, real_url);\n                }\n                catch (error) {\n                    console.error(`[Kate] failed to load script ${url}`);\n                    old_script_src.set.call(this, \"not-found\");\n                }\n            })();\n        },\n    });\n    // -- Media loading\n    const old_media_src = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, \"src\");\n    Object.defineProperty(HTMLMediaElement.prototype, \"src\", {\n        enumerable: old_media_src.enumerable,\n        configurable: old_media_src.configurable,\n        get() {\n            return this.__src ?? old_media_src.get.call(this);\n        },\n        set(url0) {\n            const url = fix_url(url0);\n            this.__src = url;\n            if (is_data_url(url)) {\n                old_media_src.set.call(this, url);\n                return;\n            }\n            void (async () => {\n                try {\n                    const real_url = await cart_fs.get_file_url(String(url));\n                    old_media_src.set.call(this, real_url);\n                }\n                catch (error) {\n                    console.error(`[Kate] failed to load media ${url}`);\n                    old_media_src.set.call(this, \"not-found\");\n                }\n            })();\n        },\n    });\n})();\n"
};

});

// packages\kate-core\build\kernel\gamepad.js
require.define(26, "packages\\kate-core\\build\\kernel", "packages\\kate-core\\build\\kernel\\gamepad.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamepadInput = void 0;
class GamepadInput {
    console;
    attached = false;
    _paired = null;
    gamepad = null;
    mapping = [];
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
            this.select_gamepad();
        });
        window.addEventListener("gamepaddisconnected", (ev) => {
            this.select_gamepad();
        });
    }
    get current() {
        return this.gamepad;
    }
    pair(id) {
        this._paired = id;
        this.select_gamepad();
    }
    unpair() {
        this._paired = null;
        this.select_gamepad();
    }
    find_active_gamepad() {
        const gamepads = navigator.getGamepads();
        return gamepads
            .flatMap((x) => (x == null || !x.connected ? [] : [x]))
            .sort((a, b) => b.timestamp - a.timestamp)
            .find((_) => true);
    }
    pause() {
        this.gamepad?.pause();
    }
    unpause() {
        this.gamepad?.unpause();
    }
    remap(mapping) {
        this.mapping = mapping;
        if (this.gamepad != null) {
            this.gamepad.remap(mapping);
        }
    }
    use_gamepad(gamepad) {
        if (gamepad != null) {
            this.gamepad = new GamepadAdaptor(gamepad, this.mapping, this.console);
            this.schedule_update();
        }
        else {
            this.gamepad = null;
        }
    }
    select_gamepad() {
        const gamepads = navigator.getGamepads();
        if (this._paired != null) {
            const gamepad = gamepads.find((x) => x?.id === this._paired) ?? null;
            this.use_gamepad(gamepad);
        }
        else {
            const gamepad = this.find_active_gamepad() ?? null;
            this.use_gamepad(gamepad);
        }
    }
    schedule_update() {
        if (this.gamepad != null) {
            cancelAnimationFrame(this.timer_id);
            this.timer_id = requestAnimationFrame(this.update_virtual_state);
        }
    }
    update_virtual_state = (time) => {
        this.gamepad?.update_virtual_state(time);
        this.schedule_update();
    };
}
exports.GamepadInput = GamepadInput;
class GamepadAdaptor {
    _raw_static;
    mapping;
    console;
    _last_update = null;
    _paused = false;
    constructor(_raw_static, mapping, console) {
        this._raw_static = _raw_static;
        this.mapping = mapping;
        this.console = console;
    }
    is_same(gamepad) {
        return this._raw_static.id === gamepad.id;
    }
    get raw() {
        const gamepads = navigator.getGamepads();
        return gamepads.find((x) => x?.id === this._raw_static.id) ?? null;
    }
    remap(mapping) {
        this.mapping = mapping;
    }
    pause() {
        this._paused = true;
    }
    unpause() {
        this._paused = false;
    }
    resolve_gamepad() {
        return (navigator.getGamepads().find((x) => x?.id === this._raw_static.id) ?? null);
    }
    update_virtual_state(time) {
        if (this._paused) {
            return;
        }
        const g = this.resolve_gamepad();
        if (g == null) {
            return;
        }
        if (this._last_update != null && this._last_update > g.timestamp) {
            return;
        }
        this._last_update = time;
        const changes = new Map();
        const update_state = (key, value) => {
            if (key != null) {
                changes.set(key, changes.get(key) || value);
            }
        };
        for (const mapping of this.mapping) {
            switch (mapping.type) {
                case "button": {
                    update_state(mapping.pressed, g.buttons[mapping.index].pressed);
                    break;
                }
                case "axis": {
                    const axis = g.axes[mapping.index];
                    if (axis < -0.5) {
                        update_state(mapping.negative, true);
                        update_state(mapping.positive, false);
                    }
                    else if (axis > 0.5) {
                        update_state(mapping.negative, false);
                        update_state(mapping.positive, true);
                    }
                    else {
                        update_state(mapping.negative, false);
                        update_state(mapping.positive, false);
                    }
                    break;
                }
            }
        }
        for (const [key, change] of changes) {
            this.console.update_virtual_key(key, change);
        }
    }
}

});

// packages\kate-core\build\kernel\input.js
require.define(27, "packages\\kate-core\\build\\kernel", "packages\\kate-core\\build\\kernel\\input.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
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
        capture: "KeyC",
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
    remap(mapping) {
        const map = Object.create(null);
        for (const { key, button } of mapping) {
            map[key] = button;
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
                const key = this.physical_map[ev.code];
                this.console.update_virtual_key(key, false);
            }
        });
    }
}
exports.KeyboardInput = KeyboardInput;

});

// packages\kate-core\build\kernel\virtual.js
require.define(28, "packages\\kate-core\\build\\kernel", "packages\\kate-core\\build\\kernel\\virtual.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualConsole = void 0;
const utils_1 = require(5);
const pkg = require(29);
class VirtualConsole {
    root;
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
    _case;
    body;
    device_display;
    hud;
    os_root;
    version_container;
    resources_container;
    version = pkg?.version == null ? null : `v${pkg.version}`;
    on_input_changed = new utils_1.EventStream();
    on_key_pressed = new utils_1.EventStream();
    on_virtual_button_touched = new utils_1.EventStream();
    on_tick = new utils_1.EventStream();
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
        this.root = root;
        this.options = options;
        this._case = options.case;
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
    get case() {
        return Case.from_configuration(this._case);
    }
    get raw_case() {
        return this._case;
    }
    get active() {
        return (this.options.mode === "native" ||
            (navigator.userActivation?.isActive ?? true));
    }
    get sticky_active() {
        return (this.options.mode === "native" ||
            (navigator.userActivation?.hasBeenActive ?? true));
    }
    vibrate(pattern) {
        if (navigator.vibrate != null && this.sticky_active) {
            navigator.vibrate(pattern);
        }
    }
    listen() {
        if (this.is_listening) {
            throw new Error(`listen called twice`);
        }
        this.is_listening = true;
        window.addEventListener("load", () => this.update_scale(null));
        window.addEventListener("resize", () => this.update_scale(null));
        window.addEventListener("orientationchange", () => this.update_scale(null));
        screen.addEventListener?.("orientationchange", () => this.update_scale(null));
        this.update_scale(null);
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
                this.on_virtual_button_touched.emit(key);
                this.update_virtual_key(key, true);
            }, { passive: false });
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
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                this.reset_all_keys();
            }
        });
        this.start_ticking();
        this.on_tick.listen(this.key_update_loop);
    }
    set_case(kase) {
        const old_case = this.case;
        this._case = kase;
        this.body.classList.toggle("scale-to-fit", kase.scale_to_fit);
        this.update_scale(old_case);
    }
    update_scale(old_case) {
        this.case.transition(old_case, this.root);
        window.scrollTo({ left: 0, top: 0 });
        document.body.scroll({ left: 0, top: 0 });
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
    reset_all_keys() {
        for (const key of this.keys) {
            this.update_virtual_key(key, false);
        }
    }
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
    is_resource_taken(resource) {
        return (this.resources.get(resource) ?? 0) > 0;
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
class Case {
    resolution;
    static BASE_HEIGHT = 480;
    static BASE_WIDTH = 800;
    constructor(resolution) {
        this.resolution = resolution;
    }
    get screen_scale() {
        return this.resolution / Case.BASE_HEIGHT;
    }
    get screen_width() {
        return Case.BASE_WIDTH * this.screen_scale;
    }
    get screen_height() {
        return Case.BASE_HEIGHT * this.screen_scale;
    }
    get width() {
        return this.screen_width + this.padding.horizontal;
    }
    get height() {
        return this.screen_height + this.padding.vertical;
    }
    static from_configuration(kase) {
        switch (kase.type) {
            case "handheld":
                return new HandheldCase(kase.resolution);
            case "tv":
                return new TvCase(kase.resolution);
            case "fullscreen":
                return new FullscreenCase(kase.resolution);
            default:
                throw (0, utils_1.unreachable)(kase.type, "console case type");
        }
    }
    async transition(old, root) {
        if (old != null) {
            await old.exit();
            await this.enter();
        }
        this.resize(root);
    }
    resize(root) {
        const width = this.width;
        const height = this.height;
        const ww = window.innerWidth;
        const wh = window.innerHeight;
        const scale = Math.min(ww / width, wh / height);
        const screen_scale = this.screen_height / Case.BASE_HEIGHT;
        root.setAttribute("data-case-type", this.case_type);
        root.setAttribute("data-resolution", String(this.screen_height));
        root.style.setProperty("--case-scale", String(scale));
        root.style.setProperty("--case-downscale", String(Math.min(1, scale)));
        root.style.setProperty("--screen-scale", String(screen_scale));
        root.style.setProperty("--screen-width", `${this.screen_width}px`);
        root.style.setProperty("--screen-height", `${this.screen_height}px`);
        if (KateNative != null) {
            KateNative.resize({ width, height });
        }
    }
    async enter() { }
    async exit() { }
}
class HandheldCase extends Case {
    case_type = "handheld";
    screen_bevel = 10;
    case_padding = 25;
    side_padding = 250;
    depth_padding = 10;
    shoulder_padding = 20;
    get screen_scale() {
        return Case.BASE_HEIGHT / this.resolution;
    }
    get padding() {
        return {
            horizontal: this.screen_bevel * 2 + this.side_padding * 2,
            vertical: this.screen_bevel * 2 +
                this.case_padding * 2 +
                this.depth_padding +
                this.shoulder_padding,
        };
    }
}
class TvCase extends Case {
    case_type = "tv";
    screen_bevel = 10;
    case_padding = 32;
    depth_padding = 10;
    get padding() {
        return {
            horizontal: this.screen_bevel * 2 + this.case_padding * 2,
            vertical: this.screen_bevel * 2 + this.case_padding * 2 + this.depth_padding,
        };
    }
}
class FullscreenCase extends Case {
    case_type = "fullscreen";
    get padding() {
        return {
            horizontal: 0,
            vertical: 0,
        };
    }
    async enter() {
        if (KateNative == null && document.fullscreenEnabled) {
            await document.documentElement
                .requestFullscreen({
                navigationUI: "hide",
            })
                .catch(() => { });
        }
    }
    async exit() {
        if (KateNative == null && document.fullscreenElement != null) {
            await document.exitFullscreen().catch(() => { });
        }
    }
}

});

// packages\kate-core\package.json
require.define(29, "", "", (module, exports, __dirname, __filename) => {
  module.exports = {"name":"@qteatime/kate-core","version":"0.23.10-a1","description":"The Kate emulator --- a fantasy console for 2d story games.","main":"build/index.js","repository":{"type":"git","url":"git+https://github.com/qteatime/kate.git"},"author":"Q.","license":"MPL-2.0","bugs":{"url":"https://github.com/qteatime/kate/issues"},"homepage":"https://github.com/qteatime/kate#readme"};
})

// packages\kate-core\build\os\index.js
require.define(30, "packages\\kate-core\\build\\os", "packages\\kate-core\\build\\os\\index.js", (module, exports, __dirname, __filename) => {
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
exports.apps = void 0;
__exportStar(require(31), exports);
__exportStar(require(52), exports);
__exportStar(require(59), exports);
__exportStar(require(118), exports);
__exportStar(require(130), exports);
exports.apps = require(103);

});

// packages\kate-core\build\os\os.js
require.define(31, "packages\\kate-core\\build\\os", "packages\\kate-core\\build\\os\\os.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateOS = void 0;
const KateDb = require(32);
const utils_1 = require(5);
const time_1 = require(52);
const boot_1 = require(53);
const home_1 = require(56);
const cart_manager_1 = require(63);
const processes_1 = require(95);
const context_menu_1 = require(98);
const notification_1 = require(114);
const drop_installer_1 = require(115);
const focus_handler_1 = require(116);
const status_bar_1 = require(117);
const ipc_1 = require(118);
const apis_1 = require(130);
const dialog_1 = require(136);
const capture_1 = require(137);
const sfx_1 = require(138);
const settings_1 = require(133);
const storage_manager_1 = require(134);
const play_habits_1 = require(139);
const app_resources_1 = require(140);
const browse_1 = require(141);
const capability_supervisor_1 = require(142);
const audit_supervisor_1 = require(143);
const device_file_1 = require(135);
const fairness_supervisor_1 = require(144);
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
    storage_manager;
    play_habits;
    app_resources;
    browser;
    device_file;
    // Services
    capability_supervisor;
    audit_supervisor;
    fairness_supervisor;
    events = {
        on_cart_inserted: new utils_1.EventStream(),
        on_cart_removed: new utils_1.EventStream(),
        on_cart_archived: new utils_1.EventStream(),
        on_cart_changed: new utils_1.EventStream(),
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
        this.capture = new capture_1.KateCapture(this);
        this.play_habits = new play_habits_1.KatePlayHabits(this);
        this.storage_manager = new storage_manager_1.KateStorageManager(this);
        this.storage_manager.setup();
        this.app_resources = new app_resources_1.KateAppResources(this);
        this.browser = new browse_1.KateBrowser(this);
        this.device_file = new device_file_1.KateDeviceFile(this);
        this.capability_supervisor = new capability_supervisor_1.KateCapabilitySupervisor(this);
        this.audit_supervisor = new audit_supervisor_1.KateAuditSupervisor(this);
        this.fairness_supervisor = new fairness_supervisor_1.KateFairnessSupervisor(this);
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
        scene.canvas.classList.remove("kate-os-leaving");
        scene.canvas.classList.add("kate-os-entering");
        this.focus_handler.push_root(scene.canvas);
        (0, time_1.wait)(300).then((_) => scene.canvas.classList.remove("kate-os-entering"));
    }
    pop_scene(scene0) {
        const popped_scene = this._current_scene === scene0
            ? this._current_scene
            : this._scene_stack.find((x) => x === scene0);
        if (popped_scene == null) {
            console.warn(`[Kate] pop_scene() called with inactive scene`, scene0);
            return;
        }
        this.focus_handler.pop_root(popped_scene.canvas);
        if (this._current_scene === popped_scene) {
            popped_scene.canvas.classList.remove("kate-os-entering");
            popped_scene.canvas.classList.add("kate-os-leaving");
            (0, time_1.wait)(250).then(() => {
                popped_scene.detach();
                popped_scene.canvas.classList.remove("kate-os-leaving");
            });
            this._current_scene = this._scene_stack.pop() ?? null;
        }
        else {
            popped_scene.detach();
            this._scene_stack = this._scene_stack.filter((x) => x !== popped_scene);
        }
    }
    replace_scene(old, scene) {
        this.pop_scene(old);
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
    handle_virtual_button_feedback = (key) => {
        const settings = this.settings.get("input");
        if (settings.haptic_feedback_for_virtual_button) {
            this.kernel.console.vibrate(30);
        }
    };
    set_os_animation(enabled) {
        this.display.classList.toggle("disable-animation", !enabled);
    }
    static async boot(kernel, x = {}) {
        // Setup OS
        const sfx = await sfx_1.KateSfx.make(kernel);
        const { db, old_version } = await KateDb.kate.open(x.database);
        const settings = await settings_1.KateSettings.load(db);
        const os = new KateOS(kernel, db, sfx, settings);
        kernel.console.on_virtual_button_touched.listen(os.handle_virtual_button_feedback);
        kernel.keyboard.remap(settings.get("input").keyboard_mapping);
        kernel.gamepad.remap(settings.get("input").gamepad_mapping.standard);
        kernel.gamepad.pair(settings.get("input").paired_gamepad);
        sfx.set_enabled(settings.get("ui").sound_feedback);
        os.set_os_animation(settings.get("ui").animation_effects);
        if (x.set_case_mode !== false) {
            kernel.console.set_case(settings.get("ui").case_type);
        }
        const min_boot_time = (0, time_1.wait)(1000);
        const boot_screen = new boot_1.SceneBoot(os, true);
        // Perform boot operations (migrations, etc)
        await request_persistent_storage(os);
        os.push_scene(boot_screen);
        await KateDb.kate.run_data_migration(old_version, db, (migration, current, total) => {
            boot_screen.set_message(`Updating database (${current} of ${total}): ${migration.description}`);
        });
        await os.audit_supervisor.start();
        boot_screen.set_message("");
        await min_boot_time;
        boot_screen.close();
        // Show start screen
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
require.define(32, "packages\\kate-core\\build\\data", "packages\\kate-core\\build\\data\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(33), exports);
__exportStar(require(38), exports);
__exportStar(require(39), exports);
__exportStar(require(40), exports);
__exportStar(require(41), exports);
__exportStar(require(42), exports);
__exportStar(require(43), exports);
__exportStar(require(44), exports);
__exportStar(require(49), exports);
require(50);

});

// packages\kate-core\build\data\db.js
require.define(33, "packages\\kate-core\\build\\data", "packages\\kate-core\\build\\data\\db.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.kate = void 0;
const Db = require(34);
exports.kate = new Db.DatabaseSchema("kate", 14);

});

// packages\kate-core\build\db-schema.js
require.define(34, "packages\\kate-core\\build", "packages\\kate-core\\build\\db-schema.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(35), exports);

});

// packages\db-schema\build\index.js
require.define(35, "packages\\db-schema\\build", "packages\\db-schema\\build\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(36), exports);
__exportStar(require(37), exports);

});

// packages\db-schema\build\schema.js
require.define(36, "packages\\db-schema\\build", "packages\\db-schema\\build\\schema.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataMigration = exports.IndexSchema2 = exports.IndexSchema1 = exports.TableSchema3 = exports.TableSchema2 = exports.TableSchema1 = exports.TableSchema = exports.DatabaseSchema = void 0;
const core_1 = require(37);
class DatabaseSchema {
    name;
    version;
    tables = [];
    data_migrations = [];
    constructor(name, version) {
        this.name = name;
        this.version = version;
    }
    async open(override_name) {
        const name = override_name ?? this.name;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(name, this.version);
            let old_version = this.version;
            request.onerror = (ev) => {
                console.error(`[Kate] failed to open database`, request.error);
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
    needs_data_migration(old_version) {
        return this.data_migrations.some((x) => x.is_needed(old_version, this.version));
    }
    async run_data_migration(old_version, db, progress) {
        const migrations = this.data_migrations.filter((x) => x.is_needed(old_version, this.version));
        let current = 1;
        for (const migration of migrations) {
            progress(migration, current, migrations.length);
            await migration.run(old_version, db);
            current += 1;
        }
    }
    data_migration(x) {
        this.data_migrations.push(new DataMigration(x.id, x.since, x.description, x.process));
        this.data_migrations.sort((a, b) => a.id - b.id);
    }
    table1(x) {
        const table = new TableSchema1(x.since, x.name, {
            path: x.path,
            auto_increment: x.auto_increment,
        }, x.deleted_since);
        this.tables.push(table);
        return table;
    }
    table2(x) {
        const table = new TableSchema2(x.since, x.name, {
            path: x.path,
            auto_increment: x.auto_increment,
        }, x.deleted_since);
        this.tables.push(table);
        return table;
    }
    table3(x) {
        const table = new TableSchema3(x.since, x.name, {
            path: x.path,
            auto_increment: x.auto_increment,
        }, x.deleted_since);
        this.tables.push(table);
        return table;
    }
}
exports.DatabaseSchema = DatabaseSchema;
class TableSchema {
    version;
    name;
    key;
    deleted_since;
    indexes = [];
    constructor(version, name, key, deleted_since) {
        this.version = version;
        this.name = name;
        this.key = key;
        this.deleted_since = deleted_since;
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
        if (this.deleted_since != null && old_version >= this.deleted_since) {
            db.deleteObjectStore(this.name);
        }
    }
    index1(x) {
        const id = new IndexSchema1(this, x.since, x.name, x.path, {
            unique: x.unique ?? true,
            multi_entry: x.multi_entry ?? false,
        }, x.deleted_since);
        this.indexes.push(id);
        return id;
    }
    index2(x) {
        const id = new IndexSchema2(this, x.since, x.name, x.path, {
            unique: x.unique ?? true,
            multi_entry: x.multi_entry ?? false,
        }, x.deleted_since);
        this.indexes.push(id);
        return id;
    }
}
exports.TableSchema = TableSchema;
class TableSchema1 extends TableSchema {
    __schema1;
    __k1;
    __kt1;
    constructor(version, name, key, deleted_since) {
        super(version, name, key, deleted_since);
    }
}
exports.TableSchema1 = TableSchema1;
class TableSchema2 extends TableSchema {
    __schema2;
    __k1;
    __kt1;
    __k2;
    __kt2;
    constructor(version, name, key, deleted_since) {
        super(version, name, key, deleted_since);
    }
}
exports.TableSchema2 = TableSchema2;
class TableSchema3 extends TableSchema {
    __schema3;
    __k1;
    __kt1;
    __k2;
    __kt2;
    __k3;
    __kt3;
    constructor(version, name, key, deleted_since) {
        super(version, name, key, deleted_since);
    }
}
exports.TableSchema3 = TableSchema3;
class IndexSchema {
    table;
    version;
    name;
    key;
    options;
    deleted_since;
    constructor(table, version, name, key, options, deleted_since) {
        this.table = table;
        this.version = version;
        this.name = name;
        this.key = key;
        this.options = options;
        this.deleted_since = deleted_since;
    }
    upgrade(transaction, old_version) {
        if (this.version > old_version) {
            const store = transaction.objectStore(this.table.name);
            store.createIndex(this.name, this.key, {
                unique: this.options.unique,
                multiEntry: this.options.multi_entry,
            });
        }
        if (this.deleted_since != null && old_version >= this.deleted_since) {
            const store = transaction.objectStore(this.table.name);
            store.deleteIndex(this.name);
        }
    }
}
class IndexSchema1 extends IndexSchema {
    __schema1;
    __k1;
    __kt1;
    constructor(table, version, name, key, options, deleted_since) {
        super(table, version, name, key, options, deleted_since);
    }
}
exports.IndexSchema1 = IndexSchema1;
class IndexSchema2 extends IndexSchema {
    __schema2;
    __k1;
    __kt1;
    __k2;
    __kt2;
    constructor(table, version, name, key, options, deleted_since) {
        super(table, version, name, key, options, deleted_since);
    }
}
exports.IndexSchema2 = IndexSchema2;
class DataMigration {
    id;
    version;
    description;
    process;
    constructor(id, version, description, process) {
        this.id = id;
        this.version = version;
        this.description = description;
        this.process = process;
    }
    done() {
        return JSON.parse(localStorage["kate:migrations:done"] ?? "[]");
    }
    mark_done() {
        const done = new Set(this.done());
        done.add(this.id);
        localStorage["kate:migrations:done"] = JSON.stringify([...done]);
    }
    is_needed(old_version, new_version) {
        const processed = this.done();
        if (processed.includes(this.id)) {
            return false;
        }
        return old_version <= this.version && this.version <= new_version;
    }
    async run(old_version, db) {
        if (this.is_needed(old_version, db.version)) {
            await this.process(db);
            this.mark_done();
        }
    }
}
exports.DataMigration = DataMigration;

});

// packages\db-schema\build\core.js
require.define(37, "packages\\db-schema\\build", "packages\\db-schema\\build\\core.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Index = exports.Table = exports.Transaction = exports.Database = exports.Range = void 0;
function lift_request(req) {
    return new Promise((resolve, reject) => {
        req.onerror = (_) => reject(req.error);
        req.onsuccess = (_) => resolve(req.result);
    });
}
class Range {
    static from(key, x = { inclusive: true }) {
        return IDBKeyRange.lowerBound(key, !x.inclusive);
    }
    static to(key, x = { inclusive: true }) {
        return IDBKeyRange.upperBound(key, !x.inclusive);
    }
    static between(lower, upper, x = {
        lower_inclusive: true,
        upper_inclusive: true,
    }) {
        return IDBKeyRange.bound(lower, upper, !x.lower_inclusive, !x.upper_inclusive);
    }
    static exactly(key) {
        return IDBKeyRange.only(key);
    }
}
exports.Range = Range;
class Database {
    db;
    constructor(db) {
        this.db = db;
    }
    get version() {
        return this.db.version;
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
                const error = request.error ?? null;
                const message = error?.stack ?? String(error ?? "Unknown error");
                reject(new Error(`cannot start transaction: ${message}`));
            };
            request.onabort = (ev) => {
                const error = request.error ?? null;
                const message = error?.stack ?? String(error ?? "Unknown error");
                reject(new Error(`transaction aborted: ${message}`));
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
                console.error(`[Kate] internal error while running transaction:`, error, request.error);
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
    get_table3(table) {
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
        if (value === undefined) {
            throw new Error(`'undefined' is not supported as a value`);
        }
        return (await lift_request(this.store.add(value)));
    }
    async put(value) {
        if (value === undefined) {
            throw new Error(`'undefined' is not supported as a value`);
        }
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
        const result = await lift_request(this.store.get(query));
        if (result === undefined) {
            throw new Error(`key not found: ${query}`);
        }
        return result;
    }
    async get_all(query, count) {
        return await lift_request(this.store.getAll(query, count));
    }
    async try_get(query) {
        const value = await lift_request(this.store.get(query));
        if (value === undefined) {
            return null;
        }
        else {
            return value;
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

// packages\kate-core\build\data\cartridge.js
require.define(38, "packages\\kate-core\\build\\data", "packages\\kate-core\\build\\data\\cartridge.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartStore = exports.cart_files = exports.idx_cart_by_status = exports.cart_meta = void 0;
const utils_1 = require(5);
const db_1 = require(33);
exports.cart_meta = db_1.kate.table1({
    since: 3,
    name: "cart_meta_v2",
    path: "id",
    auto_increment: false,
});
exports.idx_cart_by_status = exports.cart_meta.index1({
    since: 13,
    name: "by_status_v2",
    path: "status",
    multi_entry: false,
    unique: false,
});
exports.cart_files = db_1.kate.table2({
    since: 3,
    name: "cart_files_v2",
    path: ["id", "file_id"],
    auto_increment: false,
});
class CartStore {
    transaction;
    constructor(transaction) {
        this.transaction = transaction;
    }
    static transaction(db, kind, mode, fn) {
        return db.transaction(CartStore.tables_by_kind(kind), mode, async (txn) => {
            return await fn(new CartStore(txn));
        });
    }
    static tables = [exports.cart_meta, exports.cart_files];
    static tables_by_kind(kind) {
        switch (kind) {
            case "meta":
                return [exports.cart_meta];
            case "files":
                return [exports.cart_files];
            case "all":
                return CartStore.tables;
            default:
                throw (0, utils_1.unreachable)(kind, "transaction kind");
        }
    }
    get meta() {
        return this.transaction.get_table1(exports.cart_meta);
    }
    get meta_by_status() {
        return this.transaction.get_index1(exports.idx_cart_by_status);
    }
    get files() {
        return this.transaction.get_table2(exports.cart_files);
    }
    async remove_files(cart_id) {
        const meta = await this.meta.get(cart_id);
        for (const file of meta.files) {
            await this.files.delete([cart_id, file.id]);
        }
        return meta;
    }
    async archive(cart_id) {
        const meta = await this.remove_files(cart_id);
        await this.meta.put({
            ...meta,
            files: [],
            updated_at: new Date(),
            status: "archived",
        });
    }
    async install_files(cart) {
        let nodes = [];
        for (const node of cart.files) {
            const id = (0, utils_1.make_id)();
            await this.files.put({
                id: cart.id,
                file_id: id,
                mime: node.mime,
                data: node.data,
            });
            nodes.push({
                id: id,
                path: node.path,
                size: node.data.byteLength,
            });
        }
        return nodes;
    }
    async insert(cart, thumbnail_url, banner_url) {
        const now = new Date();
        const files = await this.install_files(cart);
        const old_meta = await this.meta.try_get(cart.id);
        await this.meta.put({
            id: cart.id,
            version: cart.version,
            release_date: cart.release_date,
            format_version: "v4",
            thumbnail_dataurl: thumbnail_url,
            banner_dataurl: banner_url,
            metadata: cart.metadata,
            runtime: cart.runtime,
            security: cart.security,
            files: files,
            installed_at: old_meta?.installed_at ?? now,
            updated_at: now,
            status: "active",
        });
    }
    async remove(cart_id) {
        await this.remove_files(cart_id);
        await this.meta.delete(cart_id);
    }
    async list() {
        return this.meta.get_all();
    }
    async list_by_status(status) {
        return this.meta_by_status.get_all(status ? status : undefined);
    }
}
exports.CartStore = CartStore;

});

// packages\kate-core\build\data\settings.js
require.define(39, "packages\\kate-core\\build\\data", "packages\\kate-core\\build\\data\\settings.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.settings = void 0;
const db_1 = require(33);
exports.settings = db_1.kate.table1({
    since: 7,
    name: "settings",
    path: "key",
    auto_increment: false,
});

});

// packages\kate-core\build\data\notifications.js
require.define(40, "packages\\kate-core\\build\\data", "packages\\kate-core\\build\\data\\notifications.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifications = void 0;
const db_1 = require(33);
exports.notifications = db_1.kate.table1({
    since: 1,
    name: "notifications",
    path: "id",
    auto_increment: true,
});

});

// packages\kate-core\build\data\play-habits.js
require.define(41, "packages\\kate-core\\build\\data", "packages\\kate-core\\build\\data\\play-habits.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayHabitsStore = exports.play_habits = void 0;
const db_1 = require(33);
exports.play_habits = db_1.kate.table1({
    since: 5,
    name: "play_habits",
    path: "id",
    auto_increment: false,
});
class PlayHabitsStore {
    transaction;
    constructor(transaction) {
        this.transaction = transaction;
    }
    static transaction(db, mode, fn) {
        return db.transaction(PlayHabitsStore.tables, mode, async (txn) => {
            return await fn(new PlayHabitsStore(txn));
        });
    }
    static tables = [exports.play_habits];
    get habits() {
        return this.transaction.get_table1(exports.play_habits);
    }
    async remove(cart_id) {
        await this.habits.delete(cart_id);
    }
    async reset(cart_id) {
        await this.habits.put({
            id: cart_id,
            last_played: null,
            play_time: 0,
        });
    }
    async reset_all() {
        for (const habit of await this.habits.get_all()) {
            await this.reset(habit.id);
        }
    }
    async initialise(cart_id) {
        const old_habits = await this.habits.try_get(cart_id);
        if (old_habits == null) {
            await this.habits.add({
                id: cart_id,
                last_played: null,
                play_time: 0,
            });
        }
    }
}
exports.PlayHabitsStore = PlayHabitsStore;

});

// packages\kate-core\build\data\media.js
require.define(42, "packages\\kate-core\\build\\data", "packages\\kate-core\\build\\data\\media.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.media_files = exports.idx_media_store_by_cart = exports.media_store = void 0;
const db_1 = require(33);
exports.media_store = db_1.kate.table1({
    since: 4,
    name: "media_store_v2",
    path: "id",
    auto_increment: false,
});
exports.idx_media_store_by_cart = exports.media_store.index1({
    since: 13,
    name: "by_cart_v2",
    path: "cart_id",
    unique: false,
});
exports.media_files = db_1.kate.table1({
    since: 4,
    name: "media_files",
    path: "id",
    auto_increment: false,
});

});

// packages\kate-core\build\data\object-storage.js
require.define(43, "packages\\kate-core\\build\\data", "packages\\kate-core\\build\\data\\object-storage.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectStorage = exports.EQuotaExceeded = exports.idx_os_quota_by_cartridge = exports.cartridge_quota = exports.os_data = exports.idx_entry_by_bucket = exports.os_entry = exports.idx_os_partition_by_version = exports.idx_os_partition_by_cartridge = exports.os_partition = void 0;
const utils_1 = require(5);
const db_1 = require(33);
exports.os_partition = db_1.kate.table3({
    since: 9,
    name: "object_store_partition",
    path: ["cartridge_id", "version_id", "bucket_name"],
    auto_increment: false,
});
exports.idx_os_partition_by_cartridge = exports.os_partition.index1({
    since: 13,
    name: "by_cartridge_v2",
    path: "cartridge_id",
    unique: false,
    multi_entry: false,
});
exports.idx_os_partition_by_version = exports.os_partition.index2({
    since: 9,
    name: "by_version",
    path: ["cartridge_id", "version_id"],
    unique: false,
    multi_entry: false,
});
exports.os_entry = db_1.kate.table2({
    since: 9,
    name: "os_entry",
    path: ["unique_bucket_id", "key"],
    auto_increment: false,
});
exports.idx_entry_by_bucket = exports.os_entry.index1({
    since: 13,
    name: "by_bucket_v2",
    path: "unique_bucket_id",
    multi_entry: false,
    unique: false,
});
exports.os_data = db_1.kate.table2({
    since: 9,
    name: "os_data",
    path: ["unique_bucket_id", "key"],
    auto_increment: false,
});
exports.cartridge_quota = db_1.kate.table2({
    since: 9,
    name: "cartridge_quota",
    path: ["cartridge_id", "version_id"],
    auto_increment: false,
});
exports.idx_os_quota_by_cartridge = exports.cartridge_quota.index1({
    since: 13,
    name: "by_cartridge_v2",
    path: "cartridge_id",
    multi_entry: false,
    unique: false,
});
// -- Errors -------------------------------------------------------------------
class EQuotaExceeded extends Error {
    cartridge_id;
    version_id;
    type;
    quota;
    current;
    constructor(cartridge_id, version_id, type, quota, current) {
        super(`${cartridge_id}@${version_id} exceeded the ${type} quota. Maximum: ${quota}, Current: ${current}`);
        this.cartridge_id = cartridge_id;
        this.version_id = version_id;
        this.type = type;
        this.quota = quota;
        this.current = current;
    }
}
exports.EQuotaExceeded = EQuotaExceeded;
// -- Accessors ----------------------------------------------------------------
class ObjectStorage {
    transaction;
    constructor(transaction) {
        this.transaction = transaction;
    }
    static transaction(db, mode, fn) {
        return db.transaction(ObjectStorage.tables, mode, async (txn) => {
            return await fn(new ObjectStorage(txn));
        });
    }
    static tables = [exports.os_partition, exports.os_entry, exports.os_data, exports.cartridge_quota];
    get partitions() {
        return this.transaction.get_table3(exports.os_partition);
    }
    get partitions_by_version() {
        return this.transaction.get_index2(exports.idx_os_partition_by_version);
    }
    get partitions_by_cartridge() {
        return this.transaction.get_index1(exports.idx_os_partition_by_cartridge);
    }
    get entries() {
        return this.transaction.get_table2(exports.os_entry);
    }
    get entries_by_bucket() {
        return this.transaction.get_index1(exports.idx_entry_by_bucket);
    }
    get data() {
        return this.transaction.get_table2(exports.os_data);
    }
    get quota() {
        return this.transaction.get_table2(exports.cartridge_quota);
    }
    get quota_by_cartridge() {
        return this.transaction.get_index1(exports.idx_os_quota_by_cartridge);
    }
    async add_bucket(cartridge_id, version, name) {
        const id = (0, utils_1.make_id)();
        const bucket = {
            cartridge_id: cartridge_id,
            version_id: version,
            bucket_name: name,
            created_at: new Date(),
            unique_bucket_id: id,
        };
        await this.partitions.add(bucket);
        const quota = await this.quota.get([cartridge_id, version]);
        const new_items = quota.current_buckets_in_storage + 1;
        if (new_items > quota.maximum_buckets_in_storage) {
            throw new EQuotaExceeded(cartridge_id, version, "buckets", quota.maximum_buckets_in_storage, new_items);
        }
        await this.quota.put({ ...quota, current_buckets_in_storage: new_items });
        return bucket;
    }
    async remove_bucket(cartridge_id, version_id, name) {
        const bucket = await this.partitions.get([cartridge_id, version_id, name]);
        const entries = await this.entries_by_bucket.get_all(bucket.unique_bucket_id);
        for (const entry of entries) {
            await this.delete_entry(cartridge_id, version_id, bucket.bucket_name, entry.key);
        }
        await this.partitions.delete([cartridge_id, version_id, name]);
        const quota = await this.quota.get([cartridge_id, version_id]);
        await this.quota.put({
            ...quota,
            current_buckets_in_storage: quota.current_buckets_in_storage - 1,
        });
    }
    async delete_entry(cartridge_id, version_id, bucket_id, key) {
        const entry = await this.entries.get([bucket_id, key]);
        await this.entries.delete([bucket_id, key]);
        await this.data.delete([bucket_id, key]);
        const quota = await this.quota.get([cartridge_id, version_id]);
        await this.quota.put({
            ...quota,
            current_items_in_storage: quota.current_items_in_storage - 1,
            current_size_in_bytes: quota.current_size_in_bytes - entry.size,
        });
    }
    async add_entry(cartridge_id, version_id, bucket_id, entry) {
        await this.entries.add({
            unique_bucket_id: bucket_id,
            key: entry.key,
            created_at: new Date(),
            updated_at: new Date(),
            size: entry.size,
            type: entry.type,
            metadata: entry.metadata,
        });
        await this.data.add({
            unique_bucket_id: bucket_id,
            key: entry.key,
            data: entry.data,
        });
        const quota = await this.quota.get([cartridge_id, version_id]);
        const new_items = quota.current_items_in_storage + 1;
        const new_size = quota.current_size_in_bytes + entry.size;
        if (new_items > quota.maximum_items_in_storage) {
            throw new EQuotaExceeded(cartridge_id, version_id, "entries", quota.maximum_items_in_storage, new_items);
        }
        if (new_size > quota.maximum_size_in_bytes) {
            throw new EQuotaExceeded(cartridge_id, version_id, "size", quota.maximum_size_in_bytes, new_size);
        }
        await this.quota.put({
            ...quota,
            current_items_in_storage: new_items,
            current_size_in_bytes: new_size,
        });
    }
    async write_entry(cartridge_id, version_id, bucket_id, entry) {
        const previous_entry = await this.entries.try_get([bucket_id, entry.key]);
        const now = new Date();
        const previous_created_at = previous_entry?.created_at ?? now;
        const previous_size = previous_entry?.size ?? 0;
        await this.entries.put({
            unique_bucket_id: bucket_id,
            key: entry.key,
            created_at: previous_created_at,
            updated_at: now,
            size: entry.size,
            type: entry.type,
            metadata: entry.metadata,
        });
        await this.data.put({
            unique_bucket_id: bucket_id,
            key: entry.key,
            data: entry.data,
        });
        const quota = await this.quota.get([cartridge_id, version_id]);
        const new_size = quota.current_size_in_bytes + entry.size - previous_size;
        if (new_size > quota.maximum_size_in_bytes) {
            throw new EQuotaExceeded(cartridge_id, version_id, "size", quota.maximum_size_in_bytes, new_size);
        }
        await this.quota.put({
            ...quota,
            current_size_in_bytes: new_size,
        });
    }
    async initialise_partitions(cartridge_id, version_id) {
        const quota = await this.quota.try_get([cartridge_id, version_id]);
        if (quota == null) {
            this.partitions.add({
                cartridge_id,
                version_id,
                created_at: new Date(),
                bucket_name: "kate:special",
                unique_bucket_id: (0, utils_1.make_id)(),
            });
            this.quota.add({
                cartridge_id: cartridge_id,
                version_id: version_id,
                current_buckets_in_storage: 1,
                current_items_in_storage: 0,
                current_size_in_bytes: 0,
                maximum_buckets_in_storage: 1_000,
                maximum_items_in_storage: 10_000,
                maximum_size_in_bytes: (0, utils_1.mb)(64),
            });
        }
        const unversioned_quota = await this.quota.try_get([
            cartridge_id,
            "<unversioned>",
        ]);
        if (unversioned_quota == null) {
            this.partitions.add({
                cartridge_id,
                version_id: "<unversioned>",
                created_at: new Date(),
                bucket_name: "kate:special",
                unique_bucket_id: (0, utils_1.make_id)(),
            });
            this.quota.add({
                cartridge_id: cartridge_id,
                version_id: "<unversioned>",
                current_buckets_in_storage: 1,
                current_items_in_storage: 0,
                current_size_in_bytes: 0,
                maximum_buckets_in_storage: 1_000,
                maximum_items_in_storage: 10_000,
                maximum_size_in_bytes: (0, utils_1.mb)(64),
            });
        }
    }
    async delete_partitions_and_quota(cart_id) {
        const partitions = await this.partitions_by_cartridge.get_all(cart_id);
        for (const partition of partitions) {
            for (const entry of await this.entries_by_bucket.get_all(partition.unique_bucket_id)) {
                await this.entries.delete([partition.unique_bucket_id, entry.key]);
                await this.data.delete([partition.unique_bucket_id, entry.key]);
            }
            await this.partitions.delete([
                cart_id,
                partition.version_id,
                partition.bucket_name,
            ]);
        }
        for (const quota of await this.quota_by_cartridge.get_all(cart_id)) {
            await this.quota.delete([cart_id, quota.version_id]);
        }
    }
}
exports.ObjectStorage = ObjectStorage;

});

// packages\kate-core\build\data\capability.js
require.define(44, "packages\\kate-core\\build\\data", "packages\\kate-core\\build\\data\\capability.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapabilityStore = exports.idx_capabilities_by_cart = exports.capability_grant = void 0;
const db_1 = require(33);
const Capability = require(45);
exports.capability_grant = db_1.kate.table2({
    since: 12,
    name: "capability_grants",
    path: ["cart_id", "name"],
    auto_increment: false,
});
exports.idx_capabilities_by_cart = exports.capability_grant.index1({
    since: 13,
    name: "by_cart_v2",
    path: "cart_id",
    multi_entry: false,
    unique: false,
});
class CapabilityStore {
    transaction;
    constructor(transaction) {
        this.transaction = transaction;
    }
    static transaction(db, kind, mode, fn) {
        return db.transaction(CapabilityStore.tables_by_kind(kind), mode, async (txn) => {
            return await fn(new CapabilityStore(txn));
        });
    }
    get grants() {
        return this.transaction.get_table2(exports.capability_grant);
    }
    get grants_by_cartridge() {
        return this.transaction.get_index1(exports.idx_capabilities_by_cart);
    }
    static tables = [exports.capability_grant];
    static tables_by_kind(kind) {
        switch (kind) {
            case "capability": {
                return [exports.capability_grant];
            }
        }
    }
    async read_all_grants(cart_id) {
        const grants = await this.grants_by_cartridge.get_all(cart_id);
        return grants.map(Capability.parse);
    }
    async read_grant(cart_id, name) {
        const grant = await this.grants.try_get([cart_id, name]);
        if (grant == null) {
            return null;
        }
        else {
            return Capability.parse(grant);
        }
    }
    async update_grant(cart_id, capability) {
        if (capability.cart_id !== cart_id) {
            throw new Error(`Inconsistent cartridge for capability ${capability.type}`);
        }
        const changes = capability.serialise();
        const new_value = {
            cart_id: cart_id,
            name: changes.name,
            granted: changes.granted,
            updated_at: new Date(),
        };
        await this.grants.put(new_value);
    }
    async initialise_grants(cart_id, grants) {
        if (grants.some((x) => x.cart_id !== cart_id)) {
            throw new Error(`Some capabilities does not match cartridge`);
        }
        for (const grant of grants) {
            const serialised = grant.serialise();
            const old_grant = await this.grants.try_get([cart_id, grant.type]);
            if (old_grant == null) {
                await this.grants.add({
                    cart_id: cart_id,
                    name: serialised.name,
                    granted: serialised.granted,
                    updated_at: new Date(),
                });
            }
        }
    }
}
exports.CapabilityStore = CapabilityStore;

});

// packages\kate-core\build\capabilities\index.js
require.define(45, "packages\\kate-core\\build\\capabilities", "packages\\kate-core\\build\\capabilities\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(46), exports);
__exportStar(require(47), exports);
__exportStar(require(48), exports);

});

// packages\kate-core\build\capabilities\definitions.js
require.define(46, "packages\\kate-core\\build\\capabilities", "packages\\kate-core\\build\\capabilities\\definitions.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowDialogs = exports.DownloadFiles = exports.InstallCartridges = exports.RequestDeviceFiles = exports.OpenURLs = exports.SwitchCapability = exports.Capability = void 0;
class Capability {
}
exports.Capability = Capability;
class SwitchCapability extends Capability {
    grant_type = "switch";
    is_allowed(configuration) {
        return this.grant_configuration;
    }
    serialise() {
        return {
            name: this.type,
            cart_id: this.cart_id,
            granted: { type: "switch", value: this.grant_configuration },
        };
    }
}
exports.SwitchCapability = SwitchCapability;
class OpenURLs extends SwitchCapability {
    cart_id;
    _grant_configuration;
    type = "open-urls";
    title = "Navigate to external URLs";
    description = `
    Allow the cartridge to request opening a URL on your device's browser.
  `;
    get grant_configuration() {
        return this._grant_configuration;
    }
    constructor(cart_id, _grant_configuration) {
        super();
        this.cart_id = cart_id;
        this._grant_configuration = _grant_configuration;
    }
    static parse(grant) {
        if (grant.name !== "open-urls" || grant.granted.type !== "switch") {
            throw new Error(`Unexpected capability: ${grant.name}`);
        }
        return new OpenURLs(grant.cart_id, grant.granted.value);
    }
    static from_metadata(cart_id, capability) {
        if (capability.type !== "open-urls") {
            throw new Error(`Unexpected capability: ${capability.type}`);
        }
        return new OpenURLs(cart_id, true);
    }
    update(grant) {
        this._grant_configuration = grant;
    }
    risk_category() {
        return this.grant_configuration ? "low" : "none";
    }
}
exports.OpenURLs = OpenURLs;
class RequestDeviceFiles extends SwitchCapability {
    cart_id;
    _grant_configuration;
    type = "request-device-files";
    title = "Ask to access your files";
    description = `
    Allow the cartridge to request access to files and directories on your device.
  `;
    get grant_configuration() {
        return this._grant_configuration;
    }
    constructor(cart_id, _grant_configuration) {
        super();
        this.cart_id = cart_id;
        this._grant_configuration = _grant_configuration;
    }
    static parse(grant) {
        if (grant.name !== "request-device-files" ||
            grant.granted.type !== "switch") {
            throw new Error(`Unexpected capability: ${grant.name}`);
        }
        return new RequestDeviceFiles(grant.cart_id, grant.granted.value);
    }
    static from_metadata(cart_id, capability) {
        if (capability.type !== "request-device-files") {
            throw new Error(`Unexpected capability: ${capability.type}`);
        }
        return new RequestDeviceFiles(cart_id, true);
    }
    update(grant) {
        this._grant_configuration = grant;
    }
    risk_category() {
        return this.grant_configuration ? "high" : "none";
    }
}
exports.RequestDeviceFiles = RequestDeviceFiles;
class InstallCartridges extends SwitchCapability {
    cart_id;
    _grant_configuration;
    type = "install-cartridges";
    title = "Ask to install cartridges";
    description = `
    Allow the cartridge to request installation of other cartridges.
  `;
    get grant_configuration() {
        return this._grant_configuration;
    }
    constructor(cart_id, _grant_configuration) {
        super();
        this.cart_id = cart_id;
        this._grant_configuration = _grant_configuration;
    }
    static parse(grant) {
        if (grant.name !== "install-cartridges" ||
            grant.granted.type !== "switch") {
            throw new Error(`Unexpected capability: ${grant.name}`);
        }
        return new InstallCartridges(grant.cart_id, grant.granted.value);
    }
    static from_metadata(cart_id, capability) {
        if (capability.type !== "install-cartridges") {
            throw new Error(`Unexpected capability: ${capability.type}`);
        }
        return new InstallCartridges(cart_id, true);
    }
    update(grant) {
        this._grant_configuration = grant;
    }
    risk_category() {
        return this.grant_configuration ? "critical" : "none";
    }
}
exports.InstallCartridges = InstallCartridges;
class DownloadFiles extends SwitchCapability {
    cart_id;
    _grant_configuration;
    type = "download-files";
    title = "Ask to download files";
    description = `
    Allow the cartridge to ask to save files to your device's file system.
  `;
    get grant_configuration() {
        return this._grant_configuration;
    }
    constructor(cart_id, _grant_configuration) {
        super();
        this.cart_id = cart_id;
        this._grant_configuration = _grant_configuration;
    }
    static parse(grant) {
        if (grant.name !== "download-files" || grant.granted.type !== "switch") {
            throw new Error(`Unexpected capability: ${grant.name}`);
        }
        return new DownloadFiles(grant.cart_id, grant.granted.value);
    }
    static from_metadata(cart_id, capability) {
        if (capability.type !== "download-files") {
            throw new Error(`Unexpected capability: ${capability.type}`);
        }
        return new DownloadFiles(cart_id, true);
    }
    update(grant) {
        this._grant_configuration = grant;
    }
    risk_category() {
        return this.grant_configuration ? "critical" : "none";
    }
}
exports.DownloadFiles = DownloadFiles;
class ShowDialogs extends SwitchCapability {
    cart_id;
    _grant_configuration;
    type = "show-dialogs";
    title = "Show modal dialogs";
    description = `
    Allow the cartridge to show modal dialogs.
  `;
    get grant_configuration() {
        return this._grant_configuration;
    }
    constructor(cart_id, _grant_configuration) {
        super();
        this.cart_id = cart_id;
        this._grant_configuration = _grant_configuration;
    }
    static parse(grant) {
        if (grant.name !== "show-dialogs" || grant.granted.type !== "switch") {
            throw new Error(`Unexpected capability: ${grant.name}`);
        }
        return new ShowDialogs(grant.cart_id, grant.granted.value);
    }
    static from_metadata(cart_id, capability) {
        if (capability.type !== "show-dialogs") {
            throw new Error(`Unexpected capability: ${capability.type}`);
        }
        return new ShowDialogs(cart_id, true);
    }
    update(grant) {
        this._grant_configuration = grant;
    }
    risk_category() {
        return this.grant_configuration ? "low" : "none";
    }
}
exports.ShowDialogs = ShowDialogs;

});

// packages\kate-core\build\capabilities\serialisation.js
require.define(47, "packages\\kate-core\\build\\capabilities", "packages\\kate-core\\build\\capabilities\\serialisation.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialise = exports.grants_from_cartridge = exports.from_metadata = exports.parse = void 0;
const utils_1 = require(5);
const definitions_1 = require(46);
function parse(grant) {
    switch (grant.name) {
        case "open-urls": {
            return definitions_1.OpenURLs.parse(grant);
        }
        case "request-device-files": {
            return definitions_1.RequestDeviceFiles.parse(grant);
        }
        case "install-cartridges": {
            return definitions_1.InstallCartridges.parse(grant);
        }
        case "download-files": {
            return definitions_1.DownloadFiles.parse(grant);
        }
        case "show-dialogs": {
            return definitions_1.ShowDialogs.parse(grant);
        }
        default:
            throw (0, utils_1.unreachable)(grant.name, "grant");
    }
}
exports.parse = parse;
function from_metadata(cart_id, capability) {
    switch (capability.type) {
        case "open-urls": {
            return definitions_1.OpenURLs.from_metadata(cart_id, capability);
        }
        case "request-device-files": {
            return definitions_1.RequestDeviceFiles.from_metadata(cart_id, capability);
        }
        case "install-cartridges": {
            return definitions_1.InstallCartridges.from_metadata(cart_id, capability);
        }
        case "download-files": {
            return definitions_1.DownloadFiles.from_metadata(cart_id, capability);
        }
        case "show-dialogs": {
            return definitions_1.ShowDialogs.from_metadata(cart_id, capability);
        }
        default:
            throw (0, utils_1.unreachable)(capability, "capability");
    }
}
exports.from_metadata = from_metadata;
function grants_from_cartridge(cart) {
    const contextual = cart.security.contextual_capabilities.map((x) => from_metadata(cart.id, x.capability));
    return contextual;
}
exports.grants_from_cartridge = grants_from_cartridge;
function serialise(capability) {
    return capability.serialise();
}
exports.serialise = serialise;

});

// packages\kate-core\build\capabilities\risk.js
require.define(48, "packages\\kate-core\\build\\capabilities", "packages\\kate-core\\build\\capabilities\\risk.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare_risk = exports.combine_risk = exports.risk_from_grants = exports.risk_from_cartridge = void 0;
const serialisation_1 = require(47);
function risk_from_cartridge(cart) {
    const capabilities = (0, serialisation_1.grants_from_cartridge)(cart);
    return capabilities
        .map((x) => x.risk_category())
        .reduce(combine_risk, "none");
}
exports.risk_from_cartridge = risk_from_cartridge;
function risk_from_grants(grants) {
    return grants.map((x) => x.risk_category()).reduce(combine_risk, "none");
}
exports.risk_from_grants = risk_from_grants;
function combine_risk(a, b) {
    return compare_risk(a, b) < 0 ? a : b;
}
exports.combine_risk = combine_risk;
function compare_risk(a, b) {
    const risks = ["none", "low", "medium", "high", "critical"];
    const aindex = risks.indexOf(a);
    const bindex = risks.indexOf(b);
    return bindex > aindex ? 1 : aindex > bindex ? -1 : 0;
}
exports.compare_risk = compare_risk;

});

// packages\kate-core\build\data\audit.js
require.define(49, "packages\\kate-core\\build\\data", "packages\\kate-core\\build\\data\\audit.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditStore = exports.idx_by_process = exports.audit = void 0;
const db_1 = require(33);
exports.audit = db_1.kate.table1({
    since: 14,
    name: "audit",
    path: "id",
    auto_increment: true,
});
exports.idx_by_process = exports.audit.index1({
    since: 14,
    name: "by_process",
    path: "process_id",
    unique: false,
    multi_entry: false,
});
class AuditStore {
    transaction;
    constructor(transaction) {
        this.transaction = transaction;
    }
    static transaction(db, mode, fn) {
        return db.transaction(AuditStore.tables, mode, async (txn) => {
            return await fn(new AuditStore(txn));
        });
    }
    static tables = [exports.audit];
    get logs() {
        return this.transaction.get_table1(exports.audit);
    }
    get logs_by_process() {
        return this.transaction.get_index1(exports.idx_by_process);
    }
    async log(message) {
        return this.logs.add(message);
    }
    async count_all() {
        return await this.logs.count();
    }
    async read_recent(limit) {
        return (await this.logs.get_all()).reverse().slice(0, limit);
    }
    async remove(id) {
        const log = await this.logs.get(id);
        await this.logs.put({
            ...log,
            message: "*deleted*",
            extra: null,
        });
    }
    async garbage_collect_logs(retention, pressure_mark) {
        if (!Number.isFinite(retention)) {
            return 0;
        }
        const now = new Date();
        const min_diff = retention * 24 * 60 * 60 * 1000;
        const candidates0 = await this.logs.get_all();
        if (candidates0.length < pressure_mark) {
            return 0;
        }
        const candidates = candidates0.filter((x) => now.getTime() - x.time.getTime() > min_diff);
        for (const entry of candidates) {
            await this.logs.delete(entry.id);
        }
        return candidates.length;
    }
}
exports.AuditStore = AuditStore;

});

// packages\kate-core\build\data\migrations\index.js
require.define(50, "packages\\kate-core\\build\\data\\migrations", "packages\\kate-core\\build\\data\\migrations\\index.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
require(51);

});

// packages\kate-core\build\data\migrations\v13.js
require.define(51, "packages\\kate-core\\build\\data\\migrations", "packages\\kate-core\\build\\data\\migrations\\v13.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const capability_1 = require(44);
const cartridge_1 = require(38);
const media_1 = require(42);
const object_storage_1 = require(43);
capability_1.capability_grant.index1({
    since: 12,
    deleted_since: 13,
    name: "by_cart",
    path: "cart_id",
    multi_entry: false,
    unique: false,
});
cartridge_1.cart_meta.index1({
    since: 10,
    deleted_since: 13,
    name: "by_status",
    path: "status",
    multi_entry: false,
    unique: false,
});
media_1.media_store.index1({
    since: 3,
    deleted_since: 13,
    name: "by_cart",
    path: "cart_id",
    unique: false,
});
object_storage_1.os_partition.index1({
    since: 9,
    deleted_since: 13,
    name: "by_cartridge",
    path: "cartridge_id",
    unique: false,
    multi_entry: false,
});
object_storage_1.os_entry.index1({
    since: 9,
    deleted_since: 13,
    name: "by_bucket",
    path: "unique_bucket_id",
    multi_entry: false,
    unique: false,
});
object_storage_1.cartridge_quota.index1({
    since: 10,
    deleted_since: 13,
    name: "by_cartridge",
    path: "cartridge_id",
    multi_entry: false,
    unique: false,
});

});

// packages\kate-core\build\os\time.js
require.define(52, "packages\\kate-core\\build\\os", "packages\\kate-core\\build\\os\\time.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.wait = void 0;
async function wait(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(), ms));
}
exports.wait = wait;

});

// packages\kate-core\build\os\apps\boot.js
require.define(53, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\boot.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneBoot = void 0;
const widget_1 = require(54);
const scenes_1 = require(55);
class SceneBoot extends scenes_1.Scene {
    render() {
        return (0, widget_1.h)("div", { class: "kate-os-logo" }, [
            (0, widget_1.h)("div", { class: "kate-os-logo-image" }, [
                (0, widget_1.h)("div", { class: "kate-os-logo-name" }, ["Kate"]),
                (0, widget_1.h)("div", { class: "kate-os-boot-message" }, []),
            ]),
        ]);
    }
    set_message(message) {
        this.canvas.querySelector(".kate-os-boot-message").textContent = message;
    }
}
exports.SceneBoot = SceneBoot;

});

// packages\kate-core\build\os\ui\widget.js
require.define(54, "packages\\kate-core\\build\\os\\ui", "packages\\kate-core\\build\\os\\ui\\widget.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.simple_screen = exports.stringify = exports.scroll = exports.statusbar = exports.link_card = exports.legible_bg = exports.toggle = exports.toggle_cell = exports.button_panel = exports.info_cell = exports.info_line = exports.focusable_container = exports.fa_icon = exports.status_bar = exports.button_icon = exports.icon = exports.Icon = exports.chip = exports.strong = exports.mono_text = exports.meta_text = exports.text = exports.text_button = exports.fa_icon_button = exports.icon_button = exports.image = exports.link = exports.Button = exports.when = exports.If = exports.Menu_list = exports.Section_title = exports.Space = exports.Title_bar = exports.vbox = exports.VBox = exports.stack = exports.paragraph = exports.flow = exports.hbox = exports.HBox = exports.WithClass = exports.to_node = exports.append = exports.render = exports.svg = exports.klass = exports.h = exports.fragment = exports.Widget = void 0;
exports.text_ellipsis = exports.line_field = exports.cartridge_chip = exports.no_thumbnail = exports.stack_bar = exports.section = exports.menu_separator = exports.choice_button = exports.hchoices = exports.dynamic = exports.centered_container = exports.padded_container = exports.interactive = exports.vdivider = exports.hspace = exports.vspace = exports.button = exports.p = exports.padding = exports.text_panel = void 0;
const __1 = require(1);
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
function set_attr(element, key, value) {
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
}
function h(tag, attrs, children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        set_attr(element, key, value);
    }
    for (const child of children) {
        append(child, element);
    }
    return element;
}
exports.h = h;
function klass(name, children) {
    return h("div", { class: name }, children);
}
exports.klass = klass;
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
function to_node(x) {
    let content = x instanceof Widget ? render(x) : x;
    if (typeof content === "string") {
        return document.createTextNode(content);
    }
    else if (content != null) {
        return content;
    }
    else {
        return document.createDocumentFragment();
    }
}
exports.to_node = to_node;
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
        return h("div", { class: "kate-ui-hbox", style: `gap: ${this.gap}rem` }, this.children);
    }
}
exports.HBox = HBox;
function hbox(gap, children) {
    return new HBox(gap, children);
}
exports.hbox = hbox;
function flow(children) {
    return h("div", { class: "kate-ui-flow" }, children);
}
exports.flow = flow;
function paragraph(children) {
    return h("div", { class: "kate-ui-paragraph" }, [flow(children)]);
}
exports.paragraph = paragraph;
function stack(children) {
    return h("div", { class: "kate-ui-stack" }, children);
}
exports.stack = stack;
class VBox extends Widget {
    gap;
    children;
    constructor(gap, children) {
        super();
        this.gap = gap;
        this.children = children;
    }
    render() {
        return h("div", { class: "kate-ui-vbox", style: `gap: ${this.gap}rem` }, this.children);
    }
}
exports.VBox = VBox;
function vbox(gap, children) {
    return new VBox(gap, children);
}
exports.vbox = vbox;
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
    display;
    constructor(x, display) {
        super();
        this.x = x;
        this.display = display;
    }
    render() {
        return h("div", {
            class: "kate-ui-space",
            style: `width: ${this.x.width ?? 0}px; height: ${this.x.height ?? 0}px; display: ${this.display}`,
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
function link(os, text, x) {
    return interactive(os, h("a", {
        class: "kate-ui-button-link kate-ui-focus-target",
        href: x.href ?? "#",
        target: x.target ?? "",
        title: x.title ?? "",
        rel: x.rel ?? "",
    }, [text]), [
        {
            key: ["o"],
            on_click: true,
            label: x.status_label ?? "Ok",
            handler: () => x.on_click?.(),
        },
    ]);
}
exports.link = link;
function image(src) {
    return h("img", { src: src }, []);
}
exports.image = image;
function icon_button(icon, text) {
    if (typeof icon === "string") {
        return new Button([new HBox(0.5, [new Icon(icon), text])]).focus_target(false);
    }
    else {
        return new Button([
            new HBox(0.5, [...icon.map((x) => new Icon(x)), text]),
        ]).focus_target(false);
    }
}
exports.icon_button = icon_button;
function fa_icon_button(name, text, spacing = 0.5) {
    return new Button([new HBox(spacing, [fa_icon(name), text])]);
}
exports.fa_icon_button = fa_icon_button;
function text_button(os, text, x) {
    return interactive(os, h("button", {
        class: "kate-ui-button kate-ui-text-button",
        "data-dangerous": x.dangerous ?? false,
        "data-primary": x.primary ?? false,
    }, [text]), [
        {
            key: ["o"],
            label: x.status_label ?? "Ok",
            on_click: true,
            handler: () => x.on_click(),
            enabled: () => x.enabled?.value ?? true,
        },
    ], {
        enabled: x.enabled,
    });
}
exports.text_button = text_button;
function text(x) {
    return h("div", { class: "kate-ui-text" }, x);
}
exports.text = text;
function meta_text(x) {
    return h("div", { class: "kate-ui-meta-text" }, x);
}
exports.meta_text = meta_text;
function mono_text(x) {
    return h("div", { class: "kate-ui-mono-text" }, x);
}
exports.mono_text = mono_text;
function strong(x) {
    return h("strong", {}, x);
}
exports.strong = strong;
function chip(x) {
    return h("div", { class: "kate-ui-chip" }, x);
}
exports.chip = chip;
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
function icon(x) {
    return new Icon(x);
}
exports.icon = icon;
function button_icon(x) {
    if (!/^[a-z\-]+$/.test(x)) {
        throw new Error(`Invalid name`);
    }
    return h("div", { class: "kate-button-icon", "data-icon": x }, [
        h("img", { src: `img/buttons/${x}.png` }, []),
    ]);
}
exports.button_icon = button_icon;
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
function button_panel(os, x) {
    return interactive(os, h("button", {
        class: "kate-ui-button-panel",
        "data-dangerous": x.dangerous ?? false,
    }, [
        h("div", { class: "kate-ui-button-panel-title" }, [x.title]),
        h("div", { class: "kate-ui-button-panel-description" }, [
            x.description ?? "",
        ]),
    ]), [
        {
            key: ["o"],
            label: x.status_label ?? "Ok",
            on_click: true,
            handler: () => x.on_click(),
        },
    ], {
        dangerous: x.dangerous,
    });
}
exports.button_panel = button_panel;
function toggle_cell(os, x) {
    const checked = utils_1.Observable.from(x.value);
    const mutate = typeof x.value === "boolean"
        ? (v) => (checked.value = v)
        : () => { };
    const container = h("div", { class: "kate-ui-toggle-container" }, [
        h("div", { class: "kate-ui-toggle-view" }, [
            h("div", { class: "kate-ui-toggle-bullet" }, []),
        ]),
        h("div", { class: "kate-ui-toggle-label-yes" }, [x.on_label ?? "ON "]),
        h("div", { class: "kate-ui-toggle-label-no" }, [x.off_label ?? "OFF"]),
    ]);
    container.classList.toggle("active", checked.value);
    checked.stream.listen((x) => {
        container.classList.toggle("active", x);
    });
    return interactive(os, h("div", { class: "kate-ui-info-line" }, [
        h("div", { class: "kate-ui-info-line-label" }, [
            text_panel({ title: x.title, description: x.description }),
        ]),
        h("div", { class: "kate-ui-info-line-data" }, [container]),
    ]), [
        {
            key: ["o"],
            label: "Toggle",
            on_click: true,
            handler: () => {
                const value = !checked.value;
                x.on_changed?.(value);
                mutate(value);
            },
        },
    ]);
}
exports.toggle_cell = toggle_cell;
function toggle(os, value, x = {}) {
    let checked = value;
    const container = h("div", { class: "kate-ui-toggle-container kate-ui-focus-target" }, [
        h("div", { class: "kate-ui-toggle-view" }, [
            h("div", { class: "kate-ui-toggle-bullet" }, []),
        ]),
        h("div", { class: "kate-ui-toggle-label-yes" }, [x.enabled ?? "YES"]),
        h("div", { class: "kate-ui-toggle-label-no" }, [x.disabled ?? "NO "]),
    ]);
    container.classList.toggle("active", checked);
    return interactive(os, container, [
        {
            key: ["o"],
            label: "Toggle",
            on_click: true,
            handler: () => {
                checked = !checked;
                container.classList.toggle("active", checked);
                x.on_changed?.(checked);
            },
        },
    ]);
}
exports.toggle = toggle;
function legible_bg(children) {
    return h("div", { class: "kate-ui-legible-bg" }, [...children]);
}
exports.legible_bg = legible_bg;
function link_card(os, x) {
    const element = h("div", { class: "kate-ui-link-card kate-ui-focus-target" }, [
        h("div", { class: "kate-ui-link-card-icon" }, [
            x.icon == null
                ? null
                : typeof x.icon === "string"
                    ? fa_icon(x.icon, "2x")
                    : x.icon,
        ]),
        h("div", { class: "kate-ui-link-card-text" }, [
            h("div", { class: "kate-ui-link-card-title" }, [x.title]),
            h("div", { class: "kate-ui-link-card-description" }, [
                x.description ?? null,
            ]),
        ]),
        h("div", { class: "kate-ui-link-card-value" }, [x.value ?? null]),
        h("div", {
            class: "kate-ui-link-card-arrow",
            "data-value-suffix": x.value != null,
        }, [
            x.arrow != null
                ? fa_icon(x.arrow, x.value == null ? "xl" : "1x")
                : fa_icon("chevron-right", x.value == null ? "xl" : "1x"),
        ]),
    ]);
    if (x.on_click) {
        element.classList.add("kate-ui-link-card-clickable");
        element.classList.remove("kate-ui-focus-target");
        return interactive(os, element, [
            {
                key: ["o"],
                on_click: true,
                label: x.click_label ?? "Ok",
                handler: () => x.on_click?.(),
            },
        ]);
    }
    else {
        return element;
    }
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
function stringify(children) {
    const element = document.createElement("div");
    for (const child of children) {
        append(child, element);
    }
    return element.textContent ?? "";
}
exports.stringify = stringify;
function simple_screen(x) {
    return h("div", { class: "kate-os-simple-screen", "data-title": stringify(x.title) }, [
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
    return new Space({ height: x }, "block");
}
exports.vspace = vspace;
function hspace(x) {
    return new Space({ width: x }, "inline-block");
}
exports.hspace = hspace;
function vdivider() {
    return h("div", { class: "kate-ui-vertical-divider" }, []);
}
exports.vdivider = vdivider;
function interactive(os, child, interactions, x) {
    const as_element = (child) => {
        if (!(child instanceof HTMLElement)) {
            throw new Error("invalid element for interactive");
        }
        return child;
    };
    let element;
    if (x?.replace) {
        element = as_element(child);
        element.classList.add("kate-ui-interactive");
        element.classList.add("kate-ui-focus-target");
    }
    else {
        element = document.createElement("div");
        element.className = "kate-ui-interactive kate-ui-focus-target";
        append(child, element);
    }
    if (x?.default_focus_indicator === false) {
        element.setAttribute("data-custom-focus", "custom-focus");
    }
    if (x?.dangerous === true) {
        element.setAttribute("data-dangerous", "dangerous");
    }
    if (x?.focused === true) {
        element.classList.add("focus");
    }
    os.focus_handler.register_interactive(element, { handlers: interactions });
    const click_handler = interactions.find((x) => x.on_click);
    if (click_handler != null) {
        element.addEventListener("click", (ev) => {
            ev.preventDefault();
            if (click_handler.enabled?.() !== false) {
                click_handler.handler("o", false);
            }
        });
    }
    const menu_handler = interactions.find((x) => x.on_menu);
    if (menu_handler != null) {
        element.addEventListener("contextmenu", (ev) => {
            ev.preventDefault();
            if (menu_handler.enabled?.() !== false) {
                menu_handler.handler("menu", false);
            }
        });
    }
    if (x?.enabled != null) {
        set_attr(element, "disabled", !x.enabled.value);
        x.enabled.stream.listen((enabled) => {
            set_attr(element, "disabled", !enabled);
        });
    }
    return element;
}
exports.interactive = interactive;
function padded_container(padding, children) {
    return h("div", { class: "kate-ui-padded-container", "data-padding": padding }, [...children]);
}
exports.padded_container = padded_container;
function centered_container(child) {
    return h("div", { class: "kate-ui-centered-container" }, [child]);
}
exports.centered_container = centered_container;
function dynamic(x) {
    let installed = false;
    const canvas = document.createElement("div");
    canvas.className = "kate-ui-dynamic";
    append(x.value, canvas);
    x.stream.listen((widget) => {
        if (canvas.isConnected) {
            installed = true;
            canvas.textContent = "";
            append(widget, canvas);
        }
        else if (!installed) {
            canvas.textContent = "";
            append(widget, canvas);
        }
    });
    return canvas;
}
exports.dynamic = dynamic;
function hchoices(gap, choices) {
    return h("div", { class: "kate-ui-hchoices", style: `gap: ${gap}rem` }, choices);
}
exports.hchoices = hchoices;
function choice_button(os, content, x) {
    const element = h("div", { class: "kate-ui-choice-button" }, [content]);
    element.classList.toggle("active", x?.selected?.value ?? false);
    x?.selected?.stream.listen((active) => {
        element.classList.toggle("active", active);
    });
    return interactive(os, element, [
        {
            key: ["o"],
            on_click: true,
            label: "Select",
            handler: () => {
                x?.on_select?.();
            },
        },
    ]);
}
exports.choice_button = choice_button;
function menu_separator() {
    return h("div", { class: "kate-ui-menu-separator" }, []);
}
exports.menu_separator = menu_separator;
function section(x) {
    return h("div", { class: "kate-ui-section" }, [
        h("h3", { class: "kate-ui-section-heading" }, [x.title]),
        h("div", { class: "kate-ui-section-contents" }, x.contents),
    ]);
}
exports.section = section;
function stack_bar(x) {
    const colours = [
        "var(--color-1)",
        "var(--color-2)",
        "var(--color-3)",
        "var(--color-4)",
        "var(--color-5)",
    ];
    const skip_zero = x.skip_zero_value !== false;
    const components = x.components.filter((x) => skip_zero ? x.value > 0 : true);
    return h("div", { class: "kate-ui-stack-bar-container stack-horizontal" }, [
        h("div", { class: "kate-ui-stack-bar" }, [
            ...components.map((a, i) => h("div", {
                class: "kate-ui-stack-bar-component",
                style: `--stack-bar-color: ${colours[i % colours.length]}; --stack-bar-size: ${Math.max(x.minimum_component_size ?? 0, a.value / x.total)};`,
                title: a.title,
            }, [])),
        ]),
        h("div", { class: "kate-ui-stack-bar-legend" }, [
            ...components.map((a, i) => h("div", {
                class: "kate-ui-stack-bar-legend-item",
                style: `--stack-bar-color: ${colours[i % colours.length]};`,
            }, [`${a.title} (${a.display_value})`])),
            x.free
                ? h("div", {
                    class: "kate-ui-stack-bar-legend-item",
                    style: `--stack-bar-color: var(--color-border-d1)`,
                }, [`${x.free.title} (${x.free.display_value})`])
                : null,
        ]),
    ]);
}
exports.stack_bar = stack_bar;
function no_thumbnail(text = "") {
    return h("div", { class: "kate-no-thumbnail" }, [text]);
}
exports.no_thumbnail = no_thumbnail;
function cartridge_chip(cart) {
    const risk = __1.capabilities.risk_from_cartridge(cart);
    const thumbnail_url = cart.metadata.presentation.thumbnail_path;
    const thumbnail_file = thumbnail_url == null
        ? null
        : cart.files?.find((x) => x.path === thumbnail_url) ??
            null;
    return h("div", { class: "kate-ui-cartridge-chip", "data-risk": risk }, [
        h("div", { class: "kate-ui-cartridge-chip-thumbnail" }, [
            thumbnail_file == null
                ? no_thumbnail()
                : (0, utils_1.load_image_from_bytes)("application/octet-stream", thumbnail_file.data),
        ]),
        h("div", { class: "kate-ui-cartridge-chip-info" }, [
            h("div", { class: "kate-ui-cartridge-chip-title" }, [
                cart.metadata.presentation.title,
            ]),
            h("div", { class: "kate-ui-cartridge-chip-id" }, [cart.id]),
            h("div", { class: "kate-ui-cartridge-chip-meta" }, [
                line_field("Version:", cart.version),
            ]),
            h("div", { class: "kate-ui-cartridge-chip-risk" }, [
                line_field("Risk:", risk),
            ]),
        ]),
    ]);
}
exports.cartridge_chip = cartridge_chip;
function line_field(title, value) {
    return hbox(1, [strong([title]), value]);
}
exports.line_field = line_field;
function text_ellipsis(text) {
    return klass("kate-ui-text-ellipsis", text);
}
exports.text_ellipsis = text_ellipsis;

});

// packages\kate-core\build\os\ui\scenes.js
require.define(55, "packages\\kate-core\\build\\os\\ui", "packages\\kate-core\\build\\os\\ui\\scenes.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleScene = exports.Scene = void 0;
const utils_1 = require(5);
const widget_1 = require(54);
class Scene {
    os;
    canvas;
    constructor(os, upscaled) {
        this.os = os;
        this.canvas = (0, widget_1.h)("div", { class: `kate-os-screen ${upscaled ? "upscaled" : ""}` }, []);
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
    close() {
        this.os.pop_scene(this);
    }
}
exports.Scene = Scene;
class SimpleScene extends Scene {
    subtitle = null;
    actions = [
        {
            key: ["x"],
            label: "Return",
            handler: () => this.on_return(),
        },
    ];
    _previous_traps = null;
    on_close = new utils_1.EventStream();
    constructor(os) {
        super(os, true);
    }
    on_return = () => {
        this.close();
    };
    render() {
        const body = this.body();
        const body_element = body instanceof Promise
            ? [
                (0, widget_1.h)("div", { class: "kate-ui-screen-loading-indicator" }, [
                    (0, widget_1.fa_icon)("circle-notch", "2x", "solid", "spin"),
                    "Loading...",
                ]),
            ]
            : body;
        const canvas = (0, widget_1.simple_screen)({
            icon: this.icon,
            title: this.title,
            subtitle: this.subtitle,
            body: this.body_container(body_element),
            status: [...this.actions.map((x) => this.render_action(x))],
        });
        if (body instanceof Promise) {
            const container = body_element[0];
            body.then((els) => {
                container.replaceWith(...els.map((x) => (0, widget_1.to_node)(x)));
            }, (error) => {
                console.error(`(Error rendering screen)`, error);
                this.os.audit_supervisor.log("kate:ui", {
                    resources: ["kate:ui", "error"],
                    risk: "high",
                    type: "kate.ui.rendering.error",
                    message: `Error rendering screen`,
                    extra: { error: (0, utils_1.serialise_error)(error) },
                });
                container.replaceWith(`(Error rendering screen)`);
            });
        }
        return canvas;
    }
    body_container(body) {
        return (0, widget_1.scroll)([
            (0, widget_1.h)("div", { class: "kate-os-content kate-os-screen-body" }, body),
        ]);
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
    async refresh() {
        const body = (async () => this.body())();
        this.replace_body(await body.catch(async (e) => {
            console.error("Error rendering screen:", e);
            this.os.audit_supervisor.log("kate:ui", {
                resources: ["kate:ui", "error"],
                risk: "high",
                type: "kate.ui.rendering.error",
                message: `Error rendering screen`,
                extra: { error: (0, utils_1.serialise_error)(e) },
            });
            return ["Error rendering screen"];
        }));
    }
    render_action(action) {
        return (0, widget_1.icon_button)(action.key, action.label).on_clicked(() => action.handler(action.key[0], false));
    }
    on_attached() {
        this.canvas.setAttribute("data-title", (0, widget_1.stringify)(this.title));
        this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
        this.os.focus_handler.on_traps_changed.listen(this.update_status_with_traps);
    }
    on_detached() {
        this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
        this.os.focus_handler.on_traps_changed.remove(this.update_status_with_traps);
        this.on_close.emit();
    }
    update_status_with_traps = (traps) => {
        if (this._previous_traps == null && traps == null) {
            return;
        }
        const handlers = traps?.handlers ?? [];
        if (this._previous_traps != null) {
            const new_keys = new Set(handlers.map((x) => `${x.key.join(",")}:${x.label}`));
            const old_keys = new Set(this._previous_traps.handlers.map((x) => `${x.key.join(" ")}:${x.label}`));
            if (utils_1.Sets.same_set(new_keys, old_keys)) {
                return;
            }
        }
        this._previous_traps = traps;
        const status = this.canvas.querySelector(".kate-os-statusbar") ?? null;
        if (status != null) {
            status.textContent = "";
            for (const action of this.actions) {
                (0, widget_1.append)(this.render_action(action), status);
            }
            for (const handler of handlers) {
                (0, widget_1.append)((0, widget_1.icon_button)(handler.key, handler.label).on_clicked(() => {
                    handler.handler(handler.key[0], false);
                }), status);
            }
        }
    };
    handle_key_pressed = (x) => {
        if (x.is_repeat) {
            return false;
        }
        const handler = this.actions.find((h) => h.key.includes(x.key));
        if (handler != null) {
            handler.handler(x.key, x.is_repeat);
            return true;
        }
        return false;
    };
}
exports.SimpleScene = SimpleScene;

});

// packages\kate-core\build\os\apps\home.js
require.define(56, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\home.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneHome = void 0;
const widget_1 = require(54);
const UI = require(54);
const utils_1 = require(5);
const scenes_1 = require(55);
const text_file_1 = require(57);
const storage_1 = require(58);
const permissions_1 = require(62);
class SceneHome extends scenes_1.SimpleScene {
    icon = "diamond";
    title = ["Start"];
    subtitle = "Recently played and favourites";
    actions = [];
    cart_map = new Map();
    render_cart(x) {
        return UI.interactive(this.os, (0, widget_1.h)("div", { class: "kate-os-carts-box" }, [
            (0, widget_1.h)("div", { class: "kate-os-carts-image" }, [
                x.thumbnail_dataurl
                    ? (0, widget_1.h)("img", { src: x.thumbnail_dataurl }, [])
                    : UI.no_thumbnail(x.metadata.presentation.title),
                (0, widget_1.h)("div", {
                    class: "kate-os-carts-release-type",
                    "data-release-type": x.metadata.presentation.release_type,
                }, [pretty_release_type(x.metadata.presentation.release_type)]),
                (0, widget_1.h)("div", {
                    class: "kate-os-carts-rating",
                    "data-rating": x.metadata.classification.rating,
                }, [rating_icon(x.metadata.classification.rating)]),
            ]),
            (0, widget_1.h)("div", { class: "kate-os-carts-title" }, [
                x.metadata.presentation.title,
            ]),
        ]), [
            {
                key: ["o"],
                on_click: true,
                label: "Play",
                handler: () => this.play(x.id),
            },
            {
                key: ["menu"],
                on_menu: true,
                label: "Options",
                handler: () => this.show_pop_menu(x),
            },
        ], {
            default_focus_indicator: false,
        });
    }
    async show_carts(list) {
        const recency = (cart, habits_map) => {
            const habits = habits_map.get(cart.id);
            return Math.max(habits?.last_played?.getTime() ?? 0, cart.updated_at.getTime());
        };
        try {
            const carts0 = await this.os.cart_manager.list_by_status("active");
            const habits = await this.os.play_habits.try_get_all(carts0.map((x) => x.id));
            const carts = carts0.sort((a, b) => recency(b, habits) - recency(a, habits));
            list.textContent = "";
            this.cart_map = new Map();
            for (const x of carts) {
                const child = this.render_cart(x);
                this.cart_map.set(child, x);
                list.appendChild(child);
            }
            this.os.focus_handler.focus(list.querySelector(".kate-ui-focus-target") ??
                list.firstElementChild ??
                null);
            const qs = this.canvas.querySelector(".kate-os-quickstart");
            qs.classList.toggle("hidden", carts.length !== 0);
        }
        catch (error) {
            console.error("[Kate] Failed to load cartridges", error);
            this.os.audit_supervisor.log("kate:home", {
                resources: ["kate:cartridge", "error"],
                risk: "high",
                type: "kate.home.load-failed",
                message: `Failed to load games: internal error`,
                extra: { error: (0, utils_1.serialise_error)(error) },
            });
            this.os.notifications.push_transient("kate:home", "Failed to load games", `An internal error happened while loading.`);
        }
    }
    async show_pop_menu(cart) {
        const result = await this.os.dialog.pop_menu("kate:home", cart.metadata.presentation.title, [
            ...(cart.metadata.legal.licence_path != null
                ? [{ label: "Legal notices", value: "legal" }]
                : []),
            ...(cart.metadata.legal.privacy_policy_path != null
                ? [{ label: "Privacy policy", value: "privacy" }]
                : []),
            { label: "Storage usage", value: "manage-data" },
            { label: "Permissions", value: "permissions" },
        ], "close");
        switch (result) {
            case "manage-data": {
                const app = await this.os.storage_manager.try_estimate_cartridge(cart.id);
                if (app != null) {
                    this.os.push_scene(new storage_1.SceneCartridgeStorageSettings(this.os, app));
                }
                else {
                    await this.os.dialog.message("kate:home", {
                        title: "Failed to read cartridge",
                        message: "An unknown error happened while reading the cartridge details.",
                    });
                }
                break;
            }
            case "permissions": {
                this.os.push_scene(new permissions_1.SceneCartridgePermissions(this.os, cart));
                break;
            }
            case "close": {
                break;
            }
            case "legal": {
                this.show_legal_notice("Legal notices", cart, cart.metadata.legal.licence_path);
                break;
            }
            case "privacy": {
                this.show_legal_notice("Privacy policy", cart, cart.metadata.legal.privacy_policy_path);
                break;
            }
            default: {
                throw (0, utils_1.unreachable)(result);
            }
        }
    }
    async show_legal_notice(title, cart, path) {
        if (path == null) {
            return;
        }
        const licence_file = await this.os.cart_manager.read_file_by_path(cart.id, path);
        const decoder = new TextDecoder();
        const licence = decoder.decode(licence_file.data);
        const legal = new text_file_1.SceneTextFile(this.os, title, cart.metadata.presentation.title, licence);
        this.os.push_scene(legal);
    }
    body_container(body) {
        return (0, widget_1.h)("div", { class: "kate-os-carts-scroll" }, [
            (0, widget_1.h)("div", { class: "kate-os-carts" }, []),
            (0, widget_1.h)("div", { class: "kate-os-quickstart hidden" }, [
                (0, widget_1.h)("h2", { class: "kate-os-quickstart-title" }, ["No cartridges :("]),
                (0, widget_1.h)("div", { class: "kate-os-quickstart-description" }, [
                    "Drag and drop a ",
                    (0, widget_1.h)("tt", {}, [".kart"]),
                    " file here ",
                    "to install it.\n",
                    "Or hold ",
                    UI.icon("menu"),
                    " (Menu) and choose ",
                    (0, widget_1.h)("tt", {}, ["Install Cartridge..."]),
                ]),
            ]),
        ]);
    }
    body() {
        return [];
    }
    on_attached() {
        super.on_attached();
        this.update_carts();
        this.os.events.on_cart_changed.listen(this.update_carts);
    }
    on_detached() {
        this.os.events.on_cart_changed.remove(this.update_carts);
        super.on_detached();
    }
    update_carts = async () => {
        const home = this.canvas;
        const carts = home.querySelector(".kate-os-carts");
        await this.show_carts(carts);
    };
    async play(id) {
        await this.os.processes.run(id);
        await this.update_carts();
    }
}
exports.SceneHome = SceneHome;
function pretty_release_type(x) {
    switch (x) {
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

});

// packages\kate-core\build\os\apps\text-file.js
require.define(57, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\text-file.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneTextFile = void 0;
const widget_1 = require(54);
const UI = require(54);
const scenes_1 = require(55);
class SceneTextFile extends scenes_1.Scene {
    title;
    app_title;
    text;
    constructor(os, title, app_title, text) {
        super(os, true);
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
                right: UI.text_ellipsis([this.app_title]),
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
        this.close();
    };
}
exports.SceneTextFile = SceneTextFile;

});

// packages\kate-core\build\os\apps\settings\storage.js
require.define(58, "packages\\kate-core\\build\\os\\apps\\settings", "packages\\kate-core\\build\\os\\apps\\settings\\storage.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneCartridgeStorageSettings = exports.SceneStorageSettings = void 0;
const utils_1 = require(5);
const UI = require(59);
const media_1 = require(60);
class SceneStorageSettings extends UI.SimpleScene {
    icon = "hard-drive";
    title = ["Storage"];
    on_attached() {
        super.on_attached();
        this.os.events.on_cart_changed.listen(this.reload);
    }
    on_detached() {
        this.os.events.on_cart_changed.remove(this.reload);
        super.on_detached();
    }
    reload = async (x) => {
        const body = await this.body();
        const container = this.canvas.querySelector(".kate-os-screen-body");
        container.textContent = "";
        container.append(UI.fragment(body));
    };
    async body() {
        const estimates = await this.os.storage_manager.estimate();
        const cartridges0 = Array.from(estimates.cartridges.values());
        const cartridges = cartridges0.sort((a, b) => {
            return b.usage.total_in_bytes - a.usage.total_in_bytes;
        });
        const used_total = estimates.totals.used;
        return [
            UI.section({
                title: `Storage summary (${(0, utils_1.from_bytes)(estimates.totals.quota ?? used_total)})`,
                contents: [
                    UI.stack_bar({
                        total: estimates.totals.quota ?? used_total,
                        minimum_component_size: 0.005,
                        free: estimates.totals.quota != null
                            ? {
                                title: "Free",
                                display_value: (0, utils_1.from_bytes)(estimates.totals.quota - estimates.totals.used),
                            }
                            : undefined,
                        components: [
                            {
                                title: "System",
                                value: estimates.totals.system,
                                display_value: (0, utils_1.from_bytes)(estimates.totals.system),
                            },
                            {
                                title: "Media",
                                value: estimates.totals.media,
                                display_value: (0, utils_1.from_bytes)(estimates.totals.media),
                            },
                            {
                                title: "Cartridges",
                                value: estimates.totals.applications,
                                display_value: (0, utils_1.from_bytes)(estimates.totals.applications),
                            },
                            {
                                title: "Saves",
                                value: estimates.totals.save_data,
                                display_value: (0, utils_1.from_bytes)(estimates.totals.save_data),
                            },
                        ],
                    }),
                ],
            }),
            ...cartridges.map((x) => this.render_cartridge_summary(x)),
        ];
    }
    render_cartridge_summary(x) {
        return UI.link_card(this.os, {
            icon: x.icon_url ? UI.image(x.icon_url) : UI.no_thumbnail(),
            title: x.title,
            click_label: "Details",
            value: (0, utils_1.from_bytes)(x.usage.total_in_bytes),
            description: `Last used: ${(0, utils_1.relative_date)(x.dates.last_used)} | Last updated: ${(0, utils_1.relative_date)(x.dates.last_modified)}`,
            on_click: () => {
                this.os.push_scene(new SceneCartridgeStorageSettings(this.os, x));
            },
        });
    }
}
exports.SceneStorageSettings = SceneStorageSettings;
class SceneCartridgeStorageSettings extends UI.SimpleScene {
    app;
    icon = "hard-drive";
    get title() {
        return [this.app.title];
    }
    on_attached() {
        super.on_attached();
        this.os.events.on_cart_changed.listen(this.reload);
    }
    on_detached() {
        this.os.events.on_cart_changed.remove(this.reload);
        super.on_detached();
    }
    reload = async (x) => {
        if (x.id !== this.app.id) {
            return;
        }
        const app = await this.os.storage_manager.try_estimate_cartridge(this.app.id);
        let body;
        if (app != null) {
            this.app = app;
            body = this.body();
        }
        else {
            this.app = { ...this.app, status: "inactive" };
            body = [cartridge_summary(this.app, "deleted")];
        }
        const container = this.canvas.querySelector(".kate-os-screen-body");
        container.textContent = "";
        container.append(UI.fragment(body));
    };
    constructor(os, app) {
        super(os);
        this.app = app;
    }
    body() {
        return [
            cartridge_summary(this.app),
            UI.vspace(16),
            UI.focusable_container([this.storage_summary()]),
            UI.vspace(16),
            UI.link_card(this.os, {
                icon: "images",
                title: "Manage videos and screenshots",
                description: `${this.app.usage.media.count} files (${(0, utils_1.from_bytes)(this.app.usage.media.size_in_bytes)})`,
                click_label: "Manage",
                on_click: () => {
                    this.os.push_scene(new media_1.SceneMedia(this.os, { id: this.app.id, title: this.app.title }));
                },
            }),
            UI.link_card(this.os, {
                icon: "hard-drive",
                title: "Manage save data",
                description: `${(0, utils_1.from_bytes)(this.app.usage.data.size_in_bytes +
                    this.app.usage.shared_data.size_in_bytes)}`,
                click_label: "Manage",
                on_click: () => {
                    this.os.push_scene(new SceneCartridgeSaveDataSettings(this.os, this.app));
                },
            }),
            UI.when(this.os.kernel.console.options.mode !== "single", [
                UI.vspace(32),
                this.data_actions(),
            ]),
        ];
    }
    data_actions() {
        return UI.section({
            title: "Actions",
            contents: [
                UI.when(!this.os.processes.is_running(this.app.id), [
                    UI.meta_text([
                        `Here you can remove the cartridge files to free up space.
             If you want to delete only save data, or only captured media,
             you can do it from one of the screens above.`,
                    ]),
                ]),
                UI.when(this.os.processes.is_running(this.app.id), [
                    UI.meta_text([
                        `
            The cartridge is currently running. To manage this cartridge's
            data you'll need to close the cartridge first.
          `,
                    ]),
                ]),
                UI.when(this.app.status === "active" &&
                    !this.os.processes.is_running(this.app.id), [
                    UI.vspace(16),
                    UI.button_panel(this.os, {
                        title: "Archive cartridge",
                        description: `Cartridge files will be deleted, save data and media will be kept.
                            Reinstalling the cartridge will bring it back to the current state`,
                        dangerous: true,
                        on_click: () => this.archive_cartridge(),
                    }),
                ]),
                UI.when(this.app.status !== "inactive" &&
                    !this.os.processes.is_running(this.app.id), [
                    UI.vspace(16),
                    UI.button_panel(this.os, {
                        title: "Delete all data",
                        description: `Cartridge files and save data will be deleted, media will be kept.
                            Reinstalling will not restore the save data.`,
                        dangerous: true,
                        on_click: () => this.delete_all_data(),
                    }),
                ]),
            ],
        });
    }
    async archive_cartridge() {
        const ok = await this.os.dialog.confirm("kate:settings", {
            title: `Archive ${this.app.title}?`,
            message: `This will delete all cartridge files for it, and hide the
                cartridge from the Start screen. Save data and media
                will be kept, and you can re-install the cartridge
                later to play it again.`,
            dangerous: true,
            cancel: "Cancel",
            ok: "Archive cartridge",
        });
        if (ok) {
            await this.os.cart_manager.archive(this.app.id);
            await this.os.audit_supervisor.log("kate:settings", {
                resources: ["kate:storage"],
                risk: "low",
                type: "kate.storage.archived-cartridge",
                message: `Archived cartridge ${this.app.id} v${this.app.version_id}`,
                extra: { cartridge: this.app.id, version: this.app.version_id },
            });
            await this.os.notifications.push_transient("kate:settings", "Archived cartridge", `Archived ${this.app.id} v${this.app.version_id}`);
        }
    }
    async delete_all_data() {
        const ok = await this.os.dialog.confirm("kate:settings", {
            title: `Delete ${this.app.title}?`,
            message: `This will delete all cartridge files and save data. This is
                an irreversible operation; save data cannot be restored.
                Media files will not be removed.`,
            dangerous: true,
            cancel: "Cancel",
            ok: "Delete all cartridge data",
        });
        if (ok) {
            await this.os.cart_manager.delete_all_data(this.app.id);
            await this.os.audit_supervisor.log("kate:settings", {
                resources: ["kate:storage"],
                risk: "low",
                type: "kate.storage.deleted-cartridge",
                message: `Deleted cartridge ${this.app.id} v${this.app.version_id}`,
                extra: { cartridge: this.app.id, version: this.app.version_id },
            });
            await this.os.notifications.push_transient("kate:settings", "Deleted cartridge", `Deleted ${this.app.id} v${this.app.version_id}`);
        }
    }
    storage_summary() {
        return UI.section({
            title: `Storage summary (${(0, utils_1.from_bytes)(this.app.usage.total_in_bytes)})`,
            contents: [
                UI.stack_bar({
                    total: this.app.usage.total_in_bytes,
                    minimum_component_size: 0.01,
                    components: [
                        component("Cartridge", this.app.usage.cartridge_size_in_bytes),
                        component("Saves", this.app.usage.data.size_in_bytes +
                            this.app.usage.shared_data.size_in_bytes),
                        component("Media", this.app.usage.media.size_in_bytes),
                    ],
                }),
            ],
        });
    }
}
exports.SceneCartridgeStorageSettings = SceneCartridgeStorageSettings;
class SceneCartridgeSaveDataSettings extends UI.SimpleScene {
    app;
    icon = "hard-drive";
    get title() {
        return [this.app.title];
    }
    on_attached() {
        super.on_attached();
        this.os.events.on_cart_changed.listen(this.reload);
    }
    on_detached() {
        this.os.events.on_cart_changed.remove(this.reload);
        super.on_detached();
    }
    reload = async (x) => {
        if (x.id !== this.app.id) {
            return;
        }
        const app = await this.os.storage_manager.try_estimate_cartridge(this.app.id);
        let body;
        if (app != null) {
            this.app = app;
            body = this.body();
        }
        else {
            this.app = { ...this.app, status: "inactive" };
            body = [cartridge_summary(this.app, "deleted")];
        }
        const container = this.canvas.querySelector(".kate-os-screen-body");
        container.textContent = "";
        container.append(UI.fragment(body));
    };
    constructor(os, app) {
        super(os);
        this.app = app;
    }
    body() {
        return [
            cartridge_summary(this.app),
            UI.vspace(16),
            this.save_data_summary(),
            UI.vspace(32),
            UI.button_panel(this.os, {
                title: "Delete all save data",
                description: [
                    `The cartridge will work as a freshly installed one after this.`,
                    this.os.processes.is_running(this.app.id)
                        ? " The cartridge is running, so it will be restarted."
                        : "",
                ].join(""),
                on_click: () => this.delete_save_data(),
                dangerous: true,
            }),
        ];
    }
    save_data_summary() {
        return UI.section({
            title: `Summary`,
            contents: [
                UI.focusable_container([
                    UI.strong([`Specific to this version (${this.app.version_id})`]),
                    UI.vspace(4),
                    UI.stack_bar({
                        total: this.app.quota.data.size_in_bytes,
                        skip_zero_value: false,
                        free: {
                            title: "Free",
                            display_value: (0, utils_1.from_bytes)(this.app.quota.data.size_in_bytes -
                                this.app.usage.data.size_in_bytes),
                        },
                        components: [
                            component("In use", this.app.usage.data.size_in_bytes),
                        ],
                    }),
                ]),
                UI.vspace(16),
                UI.focusable_container([
                    UI.strong(["Shared by all versions"]),
                    UI.vspace(4),
                    UI.stack_bar({
                        total: this.app.quota.shared_data.size_in_bytes,
                        skip_zero_value: false,
                        free: {
                            title: "Free",
                            display_value: (0, utils_1.from_bytes)(this.app.quota.shared_data.size_in_bytes -
                                this.app.usage.shared_data.size_in_bytes),
                        },
                        components: [
                            component("In use", this.app.usage.shared_data.size_in_bytes),
                        ],
                    }),
                ]),
            ],
        });
    }
    async delete_save_data() {
        const ok = await this.os.dialog.confirm("kate:settings", {
            title: `Delete save data for ${this.app.title}?`,
            message: `This will remove all save data for the cartridge. Save data
                cannot be recovered.`,
            dangerous: true,
            cancel: "Cancel",
            ok: "Delete save data",
        });
        if (ok) {
            await this.os.processes.terminate(this.app.id, "kate:settings", "Deleted save data.");
            await this.os.object_store.delete_cartridge_data(this.app.id, this.app.version_id);
            await this.os.audit_supervisor.log("kate:settings", {
                resources: ["kate:storage"],
                risk: "low",
                type: "kate.storage.deleted-save-data.one",
                message: `Deleted save data for ${this.app.title} v${this.app.version_id}`,
                extra: { cartridge: this.app.id, version: this.app.version_id },
            });
            await this.os.notifications.push_transient("kate:settings", "Deleted save data", `Deleted save data for ${this.app.title}`);
            if (this.os.kernel.console.options.mode === "single") {
                location.reload();
            }
        }
    }
}
function cartridge_summary(app, override_status) {
    return UI.hbox(0.5, [
        UI.mono_text([app.id]),
        UI.meta_text(["|"]),
        UI.mono_text([`v${app.version_id}`]),
        UI.meta_text(["|"]),
        UI.mono_text([`${override_status ?? app.status}`]),
    ]);
}
function component(title, bytes) {
    return {
        title,
        value: bytes,
        display_value: (0, utils_1.from_bytes)(bytes),
    };
}

});

// packages\kate-core\build\os\ui\index.js
require.define(59, "packages\\kate-core\\build\\os\\ui", "packages\\kate-core\\build\\os\\ui\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(54), exports);
__exportStar(require(55), exports);

});

// packages\kate-core\build\os\apps\media.js
require.define(60, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\media.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneMedia = void 0;
const widget_1 = require(54);
const UI = require(54);
const scenes_1 = require(55);
const view_media_1 = require(61);
class SceneMedia extends scenes_1.SimpleScene {
    filter;
    icon = "images";
    title = ["Media gallery"];
    subtitle = (0, widget_1.h)("div", { class: "kate-os-media-status" }, []);
    media = new Map();
    constructor(os, filter) {
        super(os);
        this.filter = filter;
    }
    body_container(body) {
        return (0, widget_1.h)("div", { class: "kate-os-scroll" }, [
            (0, widget_1.h)("div", { class: "kate-os-media-items" }, [...body]),
        ]);
    }
    body() {
        return [];
    }
    on_attached() {
        super.on_attached();
        this.load_media();
    }
    async get_media_filtered() {
        const media0 = (await this.os.capture.list()).sort((a, b) => b.time.getTime() - a.time.getTime());
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
            container.append(button);
            this.media.set(button, meta);
        }
    }
    async make_button(x) {
        return UI.interactive(this.os, (0, widget_1.h)("div", { class: "kate-os-media-thumbnail" }, [
            (0, widget_1.h)("img", { src: x.thumbnail_dataurl }, []),
            this.make_video_length(x.video_length),
        ]), [
            {
                key: ["o"],
                label: "View",
                on_click: true,
                handler: () => this.view(x),
            },
        ]);
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
require.define(61, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\view-media.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneViewMedia = void 0;
const widget_1 = require(54);
const UI = require(54);
const utils_1 = require(5);
const scenes_1 = require(55);
class SceneViewMedia extends scenes_1.Scene {
    media_list;
    media;
    url = null;
    constructor(os, media_list, media) {
        super(os, true);
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
            await this.os.audit_supervisor.log("kate:media", {
                resources: ["kate:capture"],
                risk: "low",
                type: "kate.capture.deleted",
                message: `Media deleted`,
                extra: { id: this.media.id },
            });
            await this.os.notifications.push_transient("kate:media", `Media deleted`, "");
            this.media_list.mark_deleted(this.media.id);
            this.close();
        }
    };
    handle_close = () => {
        this.close();
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

// packages\kate-core\build\os\apps\settings\permissions.js
require.define(62, "packages\\kate-core\\build\\os\\apps\\settings", "packages\\kate-core\\build\\os\\apps\\settings\\permissions.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneCartridgePermissions = exports.ScenePermissions = void 0;
const utils_1 = require(5);
const Capability = require(45);
const UI = require(59);
class ScenePermissions extends UI.SimpleScene {
    icon = "key";
    title = ["Permissions"];
    on_attached() {
        super.on_attached();
        this.os.events.on_cart_changed.listen(this.reload);
    }
    on_detached() {
        super.on_detached();
        this.os.events.on_cart_changed.listen(this.reload);
    }
    reload = async (x) => {
        const body = await this.body();
        const container = this.canvas.querySelector(".kate-os-screen-body");
        container.textContent = "";
        container.append(UI.fragment(body));
    };
    async body() {
        const cartridges0 = await this.os.cart_manager.list_all();
        const cartridges1 = await Promise.all(cartridges0.map(async (x) => {
            const grants = await this.os.capability_supervisor.all_grants(x.id);
            const risk = Capability.risk_from_grants(grants);
            return {
                cart: x,
                grants,
                risk,
                potential_risk: Capability.risk_from_cartridge(x),
            };
        }));
        const cartridges = cartridges1.sort((a, b) => Capability.compare_risk(a.risk, b.risk));
        const security = new utils_1.Observable(this.os.settings.get("security"));
        return [
            UI.section({
                title: "Risk profile",
                contents: [
                    "We'll use this to make permission popups more relevant to you.",
                    UI.vspace(8),
                    UI.link_card(this.os, {
                        arrow: "pencil",
                        click_label: "Change",
                        title: "Prompt me for features with this risk:",
                        description: `
              We'll ask permission for higher risk features, and just summarise
              others when you install/update a cartridge.
            `,
                        value: UI.dynamic(security.map((x) => x.prompt_for)),
                        on_click: () => {
                            this.select_prompt_for(security);
                        },
                    }),
                ],
            }),
            ...cartridges.map((x) => this.render_cartridge_summary(x)),
        ];
    }
    render_cartridge_summary(x) {
        return UI.link_card(this.os, {
            icon: x.cart.thumbnail_dataurl
                ? UI.image(x.cart.thumbnail_dataurl)
                : UI.no_thumbnail(),
            title: x.cart.metadata.presentation.title,
            click_label: "Details",
            value: x.risk,
            description: `Potential risk: ${x.potential_risk} | Current risk: ${x.risk}`,
            on_click: () => {
                const scene = new SceneCartridgePermissions(this.os, x.cart);
                scene.on_close.listen(() => this.refresh());
                this.os.push_scene(scene);
            },
        });
    }
    async select_prompt_for(current) {
        const result = await this.os.dialog.pop_menu("kate:settings", "Prompt me features at least:", [
            { label: "Low risk", value: "low" },
            { label: "Medium risk", value: "medium" },
            { label: "High risk", value: "high" },
            { label: "Critical risk", value: "critical" },
        ], null);
        if (result == null) {
            return;
        }
        this.set_security(current, { prompt_for: result });
    }
    async set_security(current, changes) {
        current.value = { ...current.value, ...changes };
        await this.os.settings.update("security", (_) => current.value);
        await this.os.audit_supervisor.log("kate:settings", {
            resources: ["kate:settings"],
            risk: "high",
            type: "kate.settings.security.updated",
            message: `Updated security settings`,
            extra: changes,
        });
    }
}
exports.ScenePermissions = ScenePermissions;
class SceneCartridgePermissions extends UI.SimpleScene {
    os;
    cart;
    icon = "key";
    get title() {
        return [this.cart.metadata.presentation.title];
    }
    constructor(os, cart) {
        super(os);
        this.os = os;
        this.cart = cart;
    }
    async body() {
        const grants0 = await this.os.capability_supervisor.all_grants(this.cart.id);
        const grants = grants0.sort((a, b) => Capability.compare_risk(a.risk_category(), b.risk_category()));
        return [
            UI.hbox(0.5, [
                UI.mono_text([this.cart.id]),
                UI.meta_text(["|"]),
                UI.mono_text([`v${this.cart.version}`]),
            ]),
            UI.vspace(16),
            ...grants.map((x) => this.render_grant(x)),
        ];
    }
    render_grant(x) {
        if (x instanceof Capability.SwitchCapability) {
            return UI.toggle_cell(this.os, {
                title: x.title,
                description: x.description,
                value: x.grant_configuration,
                on_changed: (new_value) => {
                    this.grant_switch(x, new_value);
                },
            });
        }
        else {
            throw new Error(`Invalid capability: ${x.type}`);
        }
    }
    async grant_switch(x, value) {
        x.update(value);
        await this.os.capability_supervisor.update_grant(this.cart.id, x);
        await this.os.audit_supervisor.log("kate:settings", {
            resources: ["kate:permissions"],
            risk: x.risk_category(),
            type: "kate.security.permissions.updated",
            message: `Updated security permissions for ${this.cart.id}`,
            extra: { cartridge: this.cart.id, permission: x.type, granted: value },
        });
    }
}
exports.SceneCartridgePermissions = SceneCartridgePermissions;

});

// packages\kate-core\build\os\apis\cart-manager.js
require.define(63, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\cart-manager.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartManager = void 0;
const Cart = require(64);
const Capability = require(45);
const Db = require(32);
const utils_1 = require(5);
class CartManager {
    os;
    CARTRIDGE_SIZE_LIMIT = (0, utils_1.gb)(1.4);
    THUMBNAIL_WIDTH = 400;
    THUMBNAIL_HEIGHT = 700;
    BANNER_WIDTH = 1280;
    BANNER_HEIGHT = 200;
    constructor(os) {
        this.os = os;
    }
    async list_all() {
        return await Db.CartStore.transaction(this.os.db, "meta", "readonly", async (store) => {
            return store.list();
        });
    }
    async list_by_status(status) {
        return await Db.CartStore.transaction(this.os.db, "meta", "readonly", async (store) => {
            return store.list_by_status(status);
        });
    }
    // -- Retrieval
    async read_files_by_cart(id) {
        return await Db.CartStore.transaction(this.os.db, "all", "readonly", async (store) => {
            const cart_meta = await store.meta.get(id);
            const cart_files = await Promise.all(cart_meta.files.map((x) => [x.path, store.files.get([id, x.id])]));
            return new Map(cart_files);
        });
    }
    async read_file_by_path(cart_id, path) {
        return await Db.CartStore.transaction(this.os.db, "all", "readonly", async (store) => {
            const cart = await store.meta.get(cart_id);
            const file_id = cart.files.find((x) => x.path === path)?.id;
            if (file_id == null) {
                throw new Error(`File not found: ${path}`);
            }
            return store.files.get([cart_id, file_id]);
        });
    }
    async read_file_by_id(id, file_id) {
        return await Db.CartStore.transaction(this.os.db, "files", "readonly", async (store) => {
            return store.files.get([id, file_id]);
        });
    }
    async try_read_metadata(id) {
        return await Db.CartStore.transaction(this.os.db, "meta", "readonly", async (store) => {
            return store.meta.try_get(id);
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
            this.os.notifications.push_transient("kate:cart-manager", "Installation failed", `${file.name} (${(0, utils_1.from_bytes)(file.size)}) exceeds the ${(0, utils_1.from_bytes)(this.CARTRIDGE_SIZE_LIMIT)} cartridge size limit.`);
            return;
        }
        const estimated_unpacked_size = file.size + this.os.object_store.default_quota.maximum_size * 2;
        if (!(await this.os.storage_manager.can_fit(estimated_unpacked_size))) {
            this.os.notifications.push_transient("kate:cart-manager", "Installation failed", `${file.name} (${(0, utils_1.from_bytes)(estimated_unpacked_size)}) exceeds the storage capacity.`);
            return;
        }
        try {
            const buffer = await file.arrayBuffer();
            const cart = Cart.parse(new Uint8Array(buffer));
            const errors = await Cart.verify_integrity(cart);
            if (errors.length !== 0) {
                console.error(`Corrupted cartridge ${cart.id}`, errors);
                throw new Error(`Corrupted cartridge ${cart.id}`);
            }
            await this.install(cart);
        }
        catch (error) {
            console.error(`Failed to install ${file.name}:`, error);
            await this.os.audit_supervisor.log("kate:cart-manager", {
                resources: ["kate:storage", "error"],
                risk: "high",
                type: "kate.storage.installation-failed",
                message: `Failed to install ${file.name}`,
                extra: { error: (0, utils_1.serialise_error)(error) },
            });
            await this.os.notifications.push_transient("kate:cart-manager", "Installation failed", `${file.name} could not be installed.`);
        }
    }
    async install(cart) {
        if (this.os.kernel.console.options.mode === "single") {
            throw new Error(`Cartridge installation is not available in single mode.`);
        }
        const old_meta = await this.try_read_metadata(cart.id);
        if (old_meta != null) {
            const version = cart.version;
            const title = cart.metadata.presentation.title;
            const old_title = old_meta.metadata.presentation.title;
            const old_version = old_meta.version;
            if (old_meta.status === "active") {
                if (old_version === version &&
                    !this.os.settings.get("developer").allow_version_overwrite) {
                    await this.os.notifications.push_transient("kate:cart-manager", `Cartridge not installed`, `${title} (${cart.id}) is already installed at version v${old_version}`);
                    return false;
                }
                else {
                    const should_update = await this.os.dialog.confirm("kate:installer", {
                        title: `Update ${old_title}?`,
                        message: `A cartridge already exists for ${cart.id} (${old_title} v${old_version}).
                      Update it to ${title} v${version}?`,
                        ok: "Update",
                        cancel: "Keep old version",
                        dangerous: true,
                    });
                    if (!should_update) {
                        return false;
                    }
                }
            }
        }
        const grants = Capability.grants_from_cartridge(cart);
        const thumbnail = await maybe_make_file_url(cart.metadata.presentation.thumbnail_path, cart, this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT);
        const banner = await maybe_make_file_url(cart.metadata.presentation.banner_path, cart, this.BANNER_WIDTH, this.BANNER_HEIGHT);
        await this.os.db.transaction([
            ...Db.CartStore.tables,
            ...Db.PlayHabitsStore.tables,
            ...Db.ObjectStorage.tables,
            ...Db.CapabilityStore.tables,
        ], "readwrite", async (t) => {
            const carts = new Db.CartStore(t);
            const habits = new Db.PlayHabitsStore(t);
            const object_store = new Db.ObjectStorage(t);
            const capabilities = new Db.CapabilityStore(t);
            const old_meta = await carts.meta.try_get(cart.id);
            if (old_meta != null) {
                await carts.archive(old_meta.id);
            }
            await carts.insert(cart, thumbnail, banner);
            await habits.initialise(cart.id);
            await object_store.initialise_partitions(cart.id, cart.version);
            await capabilities.initialise_grants(cart.id, grants);
        });
        await this.os.audit_supervisor.log("kate:cart-manager", {
            resources: ["kate:storage"],
            risk: "low",
            type: "kate.storage.cartridge-installed",
            message: `Installed cartridge ${cart.id} v${cart.version}`,
            extra: {
                cartridge: cart.id,
                version: cart.version,
                title: cart.metadata.presentation.title,
                grants: grants.map((x) => x.serialise()),
                potential_risk: Capability.risk_from_grants(grants),
            },
        });
        await this.os.notifications.push_transient("kate:cart-manager", `New game installed`, `${cart.metadata.presentation.title} is ready to play!`);
        this.os.events.on_cart_inserted.emit(cart);
        this.os.events.on_cart_changed.emit({
            id: cart.id,
            reason: "installed",
        });
        return true;
    }
    async archive(cart_id) {
        if (this.os.processes.is_running(cart_id)) {
            throw new Error(`archive() called while cartridge is running.`);
        }
        await Db.CartStore.transaction(this.os.db, "all", "readwrite", async (store) => {
            await store.archive(cart_id);
        });
        this.os.events.on_cart_archived.emit(cart_id);
        this.os.events.on_cart_changed.emit({ id: cart_id, reason: "archived" });
    }
    async delete_all_data(cart_id) {
        if (this.os.processes.is_running(cart_id)) {
            throw new Error(`delete_all_data() called while cartridge is running.`);
        }
        const meta = await this.read_metadata(cart_id);
        await this.os.db.transaction([
            ...Db.CartStore.tables,
            ...Db.ObjectStorage.tables,
            ...Db.PlayHabitsStore.tables,
        ], "readwrite", async (txn) => {
            await new Db.CartStore(txn).remove(cart_id);
            await new Db.ObjectStorage(txn).delete_partitions_and_quota(cart_id);
            await new Db.PlayHabitsStore(txn).remove(cart_id);
        });
        this.os.events.on_cart_removed.emit({
            id: cart_id,
            title: meta.metadata.presentation.title,
        });
        this.os.events.on_cart_changed.emit({ id: cart_id, reason: "removed" });
    }
    // Usage estimation
    async usage_estimates() {
        const cartridges = await this.list_all();
        const result = new Map();
        for (const cart of cartridges) {
            const size = cart.files.reduce((total, file) => total + file.size, 0);
            result.set(cart.id, {
                meta: cart,
                version_id: cart.version,
                status: cart.status,
                thumbnail_url: cart.thumbnail_dataurl,
                banner_url: cart.banner_dataurl,
                size: size,
            });
        }
        return result;
    }
}
exports.CartManager = CartManager;
function maybe_make_file_url(path, cart, width, height) {
    if (path == null) {
        return null;
    }
    else {
        const file = cart.files.find((x) => x.path === path);
        if (file == null) {
            throw new Error(`File not found: ${path}`);
        }
        return (0, utils_1.make_thumbnail_from_bytes)(width, height, file.mime, file.data);
    }
}

});

// packages\kate-core\build\cart\index.js
require.define(64, "packages\\kate-core\\build\\cart", "packages\\kate-core\\build\\cart\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(65), exports);
__exportStar(require(66), exports);

});

// packages\kate-core\build\cart\cart-type.js
require.define(65, "packages\\kate-core\\build\\cart", "packages\\kate-core\\build\\cart\\cart-type.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });

});

// packages\kate-core\build\cart\parser.js
require.define(66, "packages\\kate-core\\build\\cart", "packages\\kate-core\\build\\cart\\parser.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify_integrity = exports.parse = exports.try_parse = void 0;
const v4_1 = require(67);
const v5_1 = require(86);
const parsers = [v5_1.parse_v5, v4_1.parse_v4];
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
async function verify_integrity(cart) {
    const errors = [
        ...check_file_exists(cart.metadata.presentation.thumbnail_path, cart),
        ...check_file_exists(cart.metadata.presentation.banner_path, cart),
        ...check_file_exists(cart.metadata.legal.licence_path, cart),
        ...check_file_exists(cart.metadata.legal.privacy_policy_path, cart),
        ...check_file_exists(cart.runtime.html_path, cart),
    ];
    for (const file of cart.files) {
        if (!(await check_file_integrity(file))) {
            errors.push(`Corrupted file: ${file.path}`);
        }
    }
    return errors;
}
exports.verify_integrity = verify_integrity;
async function check_file_integrity(file) {
    const hash = await crypto.subtle.digest(file.integrity_hash_algorithm, file.data.buffer);
    return byte_equals(new Uint8Array(hash), file.integrity_hash);
}
function check_file_exists(path, cart) {
    if (path == null) {
        return [];
    }
    else {
        const file = cart.files.find((x) => x.path === path);
        if (file == null) {
            return [`File not found: ${path}`];
        }
        else {
            return [];
        }
    }
}
function byte_equals(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

});

// packages\kate-core\build\cart\v4\v4.js
require.define(67, "packages\\kate-core\\build\\cart\\v4", "packages\\kate-core\\build\\cart\\v4\\v4.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_v4_metadata = exports.parse_v4 = exports.Cart_v4 = void 0;
const Cart_v4 = require(68);
exports.Cart_v4 = Cart_v4;
const parser_utils_1 = require(80);
const Metadata = require(81);
const Runtime = require(82);
const Files = require(84);
const Security = require(85);
const utils_1 = require(5);
const MAGIC = Number("0x" +
    "KART"
        .split("")
        .map((x) => x.charCodeAt(0).toString(16))
        .join(""));
const valid_id = (0, parser_utils_1.regex)("id", /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\/[a-z0-9\-]+(\.[a-z0-9\-]+)*$/);
function version_string(version) {
    return `${version.major}.${version.minor}`;
}
function date(x) {
    return new Date(x.year, x.month - 1, x.day, 0, 0, 0, 0);
}
function parse_v4(x) {
    const view = new DataView(x.buffer);
    const magic_header = view.getUint32(0, false);
    if (magic_header !== MAGIC) {
        return null;
    }
    const version = view.getUint32(4, true);
    if (version !== 4) {
        return null;
    }
    const cart = Cart_v4.decode(x);
    const meta = Metadata.parse_metadata(cart);
    const runtime = Runtime.parse_runtime(cart);
    const security = Security.parse_security(cart);
    const files = Files.parse_files(cart);
    return {
        id: (0, parser_utils_1.str)(valid_id(cart.id), 255),
        version: version_string(cart.version),
        release_date: date(cart["release-date"]),
        metadata: meta,
        security: security,
        runtime: runtime,
        files: files,
    };
}
exports.parse_v4 = parse_v4;
function parse_v4_metadata(x) {
    if (x.length > (0, utils_1.mb)(64)) {
        console.warn(`v4 cartridge too big for parsing metadata`);
    }
    return parse_v4(x);
}
exports.parse_v4_metadata = parse_v4_metadata;

});

// packages\schema\build\kart-v4.js
require.define(68, "packages\\schema\\build", "packages\\schema\\build\\kart-v4.js", (module, exports, __dirname, __filename) => {
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
exports.encode = exports.decode = void 0;
const LJT = require(69);
const source = require(78);
const Cart = require(79);
__exportStar(require(79), exports);
const schema = LJT.parse(source);
function decode(bytes) {
    return LJT.decode(bytes, schema, Cart.Cartridge.tag);
}
exports.decode = decode;
function encode(value) {
    return LJT.encode(value, schema, Cart.Cartridge.tag);
}
exports.encode = encode;

});

// packages\ljt-vm\build\index.js
require.define(69, "packages\\ljt-vm\\build", "packages\\ljt-vm\\build\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(70), exports);
__exportStar(require(71), exports);
__exportStar(require(75), exports);
__exportStar(require(72), exports);
__exportStar(require(76), exports);

});

// packages\ljt-vm\build\ast.js
require.define(70, "packages\\ljt-vm\\build", "packages\\ljt-vm\\build\\ast.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });

});

// packages\ljt-vm\build\encoder.js
require.define(71, "packages\\ljt-vm\\build", "packages\\ljt-vm\\build\\encoder.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.encode_magicless = exports.encode = exports.magic_size = exports.Encoder = void 0;
const schema_1 = require(72);
const util_1 = require(73);
const MAX_UINT8 = 2 ** 8;
const MAX_UINT16 = 2 ** 16;
const MAX_UINT32 = 2 ** 32;
const MIN_INT8 = -(MAX_UINT8 / 2);
const MAX_INT8 = MAX_UINT8 / 2 - 1;
const MIN_INT16 = -(MAX_UINT16 / 2);
const MAX_INT16 = MAX_UINT16 / 2 - 1;
const MIN_INT32 = -(MAX_UINT32 / 2);
const MAX_INT32 = MAX_UINT32 / 2 - 1;
class Encoder {
    buffers = [];
    bool(x) {
        this.buffers.push(new Uint8Array([x ? 0x01 : 0x00]));
        return this;
    }
    int8(x) {
        if (x < MIN_INT8 || x > MAX_INT8) {
            throw new RangeError(`Invalid int8 value: ${x}`);
        }
        const a = new Uint8Array(1);
        const v = new DataView(a.buffer);
        v.setInt8(0, x);
        this.buffers.push(a);
        return this;
    }
    int16(x) {
        if (x < MIN_INT16 || x > MAX_INT16) {
            throw new RangeError(`Invalid int16 value: ${x}`);
        }
        const a = new Uint8Array(2);
        const v = new DataView(a.buffer);
        v.setInt16(0, x, true);
        this.buffers.push(a);
        return this;
    }
    int32(x) {
        if (x < MIN_INT32 || x > MAX_INT32) {
            throw new RangeError(`Invalid int32 value: ${x}`);
        }
        const a = new Uint8Array(4);
        const v = new DataView(a.buffer);
        v.setInt32(0, x, true);
        this.buffers.push(a);
        return this;
    }
    uint8(x) {
        if (x < 0 || x >= MAX_UINT8) {
            throw new RangeError(`Invalid uint8 value: ${x}`);
        }
        const a = new Uint8Array(1);
        const v = new DataView(a.buffer);
        v.setUint8(0, x);
        this.buffers.push(a);
        return this;
    }
    uint16(x) {
        if (x < 0 || x >= MAX_UINT16) {
            throw new RangeError(`Invalid uint16 value: ${x}`);
        }
        const a = new Uint8Array(2);
        const v = new DataView(a.buffer);
        v.setUint16(0, x, true);
        this.buffers.push(a);
        return this;
    }
    uint32(x) {
        if (x < 0 || x >= MAX_UINT32) {
            throw new RangeError(`Invalid uint32 value: ${x}`);
        }
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
    bigint(x) {
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
    raw_bytes(x) {
        this.buffers.push(x);
        return this;
    }
    array(xs, f) {
        this.uint32(xs.length);
        for (const x of xs) {
            f(this, x);
        }
        return this;
    }
    map(x, fk, fv) {
        this.uint32(x.size);
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
exports.Encoder = Encoder;
function magic_size(schema) {
    return schema.magic.length + 4; // magic + version
}
exports.magic_size = magic_size;
function encode(value, schema, root) {
    const encoder = new Encoder();
    encoder.raw_bytes(schema.magic);
    encoder.uint32(schema.version);
    return do_encode(value, { op: "record", id: root }, encoder, schema).to_bytes();
}
exports.encode = encode;
function encode_magicless(value, schema, root) {
    const encoder = new Encoder();
    return do_encode(value, { op: "record", id: root }, encoder, schema).to_bytes();
}
exports.encode_magicless = encode_magicless;
function do_encode(value, op, encoder, schema) {
    switch (op.op) {
        case "bool": {
            if (typeof value !== "boolean") {
                throw new Error(`Expected boolean, got ${typeof value}`);
            }
            return encoder.bool(value);
        }
        case "int8": {
            if (typeof value !== "number") {
                throw new Error(`Expected number, got ${typeof value}`);
            }
            return encoder.int8(value);
        }
        case "int16": {
            if (typeof value !== "number") {
                throw new Error(`Expected number, got ${typeof value}`);
            }
            return encoder.int16(value);
        }
        case "int32": {
            if (typeof value !== "number") {
                throw new Error(`Expected number, got ${typeof value}`);
            }
            return encoder.int32(value);
        }
        case "uint8": {
            if (typeof value !== "number") {
                throw new Error(`Expected number, got ${typeof value}`);
            }
            return encoder.uint8(value);
        }
        case "uint16": {
            if (typeof value !== "number") {
                throw new Error(`Expected number, got ${typeof value}`);
            }
            return encoder.uint16(value);
        }
        case "uint32": {
            if (typeof value !== "number") {
                throw new Error(`Expected number, got ${typeof value}`);
            }
            return encoder.uint32(value);
        }
        case "integer": {
            if (typeof value !== "bigint") {
                throw new Error(`Expected bigint, got ${typeof value}`);
            }
            return encoder.bigint(value);
        }
        case "float32": {
            if (typeof value !== "number") {
                throw new Error(`Expected number, got ${typeof value}`);
            }
            return encoder.float32(value);
        }
        case "float64": {
            if (typeof value !== "number") {
                throw new Error(`Expected number, got ${typeof value}`);
            }
            return encoder.float64(value);
        }
        case "text": {
            if (typeof value !== "string") {
                throw new Error(`Expected string, got ${typeof value}`);
            }
            return encoder.text(value);
        }
        case "bytes": {
            if (!(value instanceof Uint8Array)) {
                throw new Error(`Expected Uint8Array`);
            }
            return encoder.bytes(value);
        }
        case "constant": {
            if (!(value instanceof Uint8Array)) {
                throw new Error(`Expected Uint8Array`);
            }
            if (!(0, util_1.byte_equals)(value, op.value)) {
                throw new Error(`Unexpected constant: ${(0, util_1.bytes_to_hex)(value)}`);
            }
            return encoder.raw_bytes(op.value);
        }
        case "array": {
            if (!Array.isArray(value)) {
                throw new Error(`Expected array`);
            }
            return encoder.array(value, (encoder, x) => {
                do_encode(x, op.items, encoder, schema);
            });
        }
        case "map": {
            if (!(value instanceof Map)) {
                throw new Error(`Expected map`);
            }
            return encoder.map(value, (encoder, key) => {
                do_encode(key, op.keys, encoder, schema);
            }, (encoder, value) => {
                do_encode(value, op.values, encoder, schema);
            });
        }
        case "optional": {
            return encoder.optional(value, (encoder, value) => {
                do_encode(value, op.value, encoder, schema);
            });
        }
        case "record": {
            if (value == null || typeof value !== "object") {
                throw new Error(`Expected record`);
            }
            const record = schema.resolve(op.id);
            if (!(record instanceof schema_1.Record)) {
                throw new Error(`Expected record, got union`);
            }
            const version = record.find_version(value);
            encoder.uint32(version.id);
            encoder.uint32(version.version);
            for (const [field, op] of version.fields) {
                do_encode(value[field], op, encoder, schema);
            }
            return encoder;
        }
        case "union": {
            if (value == null ||
                typeof value !== "object" ||
                typeof value["@variant"] !== "number") {
                throw new Error(`Expected union`);
            }
            const union = schema.resolve(op.id);
            if (!(union instanceof schema_1.Union)) {
                throw new Error(`Expected union, got record`);
            }
            const version = union.find_version(value);
            const variant_tag = value["@variant"];
            const variant = version.variant(variant_tag);
            encoder.uint32(version.id);
            encoder.uint32(version.version);
            encoder.uint32(variant.tag);
            for (const [field, op] of variant.fields) {
                do_encode(value[field], op, encoder, schema);
            }
            return encoder;
        }
        default:
            throw (0, util_1.unreachable)(op, "LJT Op");
    }
}

});

// packages\ljt-vm\build\schema.js
require.define(72, "packages\\ljt-vm\\build", "packages\\ljt-vm\\build\\schema.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionedRecord = exports.Record = exports.Variant = exports.VersionedUnion = exports.Union = exports.Entity = exports.Schema = void 0;
class Schema {
    magic;
    version;
    entities = new Map();
    constructor(magic, version) {
        this.magic = magic;
        this.version = version;
    }
    add(entity) {
        if (this.entities.has(entity.id)) {
            throw new Error(`Duplicated entity ${entity.id}`);
        }
        this.entities.set(entity.id, entity);
    }
    resolve(id) {
        const entity = this.entities.get(id);
        if (entity == null) {
            throw new Error(`Undefined entity ${id}`);
        }
        return entity;
    }
}
exports.Schema = Schema;
class Entity {
}
exports.Entity = Entity;
class Union extends Entity {
    id;
    name;
    versions;
    constructor(id, name, versions) {
        super();
        this.id = id;
        this.name = name;
        this.versions = versions;
    }
    version(v) {
        if (v < 0 || v >= this.versions.length) {
            throw new Error(`Invalid version for ${this.name}(${this.id}): ${v}`);
        }
        return this.versions[v];
    }
    find_version(data) {
        for (let i = this.versions.length - 1; i >= 0; --i) {
            const version = this.versions[i];
            if (version.accepts(data)) {
                return version;
            }
        }
        throw new Error(`No version of ${this.name}(${this.id}) matched`);
    }
}
exports.Union = Union;
class VersionedUnion {
    id;
    version;
    name;
    variants;
    constructor(id, version, name, variants) {
        this.id = id;
        this.version = version;
        this.name = name;
        this.variants = variants;
    }
    variant(v) {
        if (v < 0 || v >= this.variants.length) {
            throw new Error(`Invalid variant for ${this.name}(${this.id}): ${v}`);
        }
        return this.variants[v];
    }
    reify(value) {
        value["@id"] = this.id;
        value["@version"] = this.version;
        value["@name"] = this.name;
        return value;
    }
    accepts(data) {
        const tag = data["@variant"];
        if (typeof tag !== "number" || tag < 0 || tag >= this.variants.length) {
            return false;
        }
        const variant = this.variants[tag];
        return variant.accepts(data);
    }
}
exports.VersionedUnion = VersionedUnion;
class Variant {
    name;
    tag;
    fields;
    constructor(name, tag, fields) {
        this.name = name;
        this.tag = tag;
        this.fields = fields;
    }
    reify(value) {
        value["@variant"] = this.tag;
        value["@variant-name"] = this.name;
        return value;
    }
    accepts(data) {
        for (const [field, _] of this.fields) {
            if (!(field in data)) {
                return false;
            }
        }
        return true;
    }
}
exports.Variant = Variant;
class Record extends Entity {
    id;
    name;
    versions;
    constructor(id, name, versions) {
        super();
        this.id = id;
        this.name = name;
        this.versions = versions;
    }
    version(v) {
        if (v < 0 || v >= this.versions.length) {
            throw new Error(`Invalid version for ${this.name}(${this.id}): ${v}`);
        }
        return this.versions[v];
    }
    find_version(data) {
        for (let i = this.versions.length - 1; i >= 0; --i) {
            const version = this.versions[i];
            if (version.accepts(data)) {
                return version;
            }
        }
        throw new Error(`No version of ${this.name}(${this.id}) matched`);
    }
}
exports.Record = Record;
class VersionedRecord {
    id;
    version;
    name;
    fields;
    constructor(id, version, name, fields) {
        this.id = id;
        this.version = version;
        this.name = name;
        this.fields = fields;
    }
    reify(value) {
        value["@id"] = this.id;
        value["@version"] = this.version;
        value["@name"] = this.name;
        return value;
    }
    accepts(data) {
        for (const [field, _] of this.fields) {
            if (!(field in data)) {
                return false;
            }
        }
        return true;
    }
}
exports.VersionedRecord = VersionedRecord;

});

// packages\ljt-vm\build\util.js
require.define(73, "packages\\ljt-vm\\build", "packages\\ljt-vm\\build\\util.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(74), exports);
__exportStar(require(6), exports);
__exportStar(require(19), exports);

});

// packages\util\build\binary.js
require.define(74, "packages\\util\\build", "packages\\util\\build\\binary.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bytes_to_hex = exports.byte_equals = exports.concat_all = void 0;
const iterable_1 = require(19);
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

});

// packages\ljt-vm\build\decoder.js
require.define(75, "packages\\ljt-vm\\build", "packages\\ljt-vm\\build\\decoder.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.SchemaDecoder = exports.Decoder = void 0;
const schema_1 = require(72);
const util_1 = require(73);
class Decoder {
    view;
    offset = 0;
    constructor(view) {
        this.view = view;
    }
    static from_bytes(bytes) {
        return new Decoder(new DataView(bytes.buffer));
    }
    seek(offset) {
        this.offset = offset;
        return this;
    }
    slice(offset, size) {
        const bytes = new Uint8Array(this.view.buffer).slice(offset, offset + size);
        return Decoder.from_bytes(bytes);
    }
    get current_offset() {
        return this.view.byteOffset + this.offset;
    }
    get remaining_bytes() {
        return this.view.byteLength - (this.view.byteOffset + this.offset);
    }
    clone() {
        return new Decoder(this.view).seek(this.offset);
    }
    peek(f) {
        return f(this.clone());
    }
    fail(code, reason) {
        throw new Error(`(${code}): decoding failed at 0x${this.offset.toString(16)}: ${reason}`);
    }
    int8() {
        const value = this.view.getInt8(this.offset);
        this.offset += 1;
        return value;
    }
    int16() {
        const value = this.view.getInt16(this.offset, true);
        this.offset += 2;
        return value;
    }
    int32() {
        const value = this.view.getInt32(this.offset, true);
        this.offset += 32;
        return value;
    }
    uint8() {
        const value = this.view.getUint8(this.offset);
        this.offset += 1;
        return value;
    }
    uint16() {
        const value = this.view.getUint16(this.offset, true);
        this.offset += 2;
        return value;
    }
    uint32() {
        const value = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }
    float32() {
        const value = this.view.getFloat32(this.offset, true);
        this.offset += 4;
        return value;
    }
    float64() {
        const value = this.view.getFloat64(this.offset, true);
        this.offset += 8;
        return value;
    }
    bool() {
        return this.uint8() > 0;
    }
    bigint() {
        const negative = this.bool();
        const size = this.uint32();
        const buffer = [];
        for (let i = 0; i < size; ++i) {
            buffer[i] = this.uint8().toString(16).padStart(2, "0");
        }
        const result = BigInt(`0x${buffer.join("")}`);
        return negative ? -result : result;
    }
    text() {
        const size = this.uint32();
        const decoder = new TextDecoder("utf-8");
        const text_view = new DataView(this.view.buffer, this.offset, size);
        const result = decoder.decode(text_view);
        this.offset += size;
        return result;
    }
    bytes() {
        const size = this.uint32();
        return this.raw_bytes(size);
    }
    raw_bytes(size) {
        if (size > this.remaining_bytes) {
            throw this.fail("invalid-size", `Size out of bounds: ${size}`);
        }
        const result = new Uint8Array(size);
        for (let i = 0; i < result.length; ++i) {
            result[i] = this.view.getUint8(this.offset + i);
        }
        this.offset += size;
        return result;
    }
    array(f) {
        const size = this.uint32();
        const result = [];
        for (let i = 0; i < size; ++i) {
            result[i] = f();
        }
        return result;
    }
    map(k, v) {
        const size = this.uint32();
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
}
exports.Decoder = Decoder;
class SchemaDecoder {
    schema;
    decoder;
    constructor(schema, decoder) {
        this.schema = schema;
        this.decoder = decoder;
    }
    static from_bytes(bytes, schema) {
        return new SchemaDecoder(schema, Decoder.from_bytes(bytes));
    }
    clone() {
        return new SchemaDecoder(this.schema, this.decoder.clone());
    }
    seek(offset) {
        return new SchemaDecoder(this.schema, this.decoder.seek(offset));
    }
    slice(offset, size) {
        return new SchemaDecoder(this.schema, this.decoder.slice(offset, size));
    }
    assert_magic() {
        const magic = this.decoder.raw_bytes(this.schema.magic.length);
        if (!(0, util_1.byte_equals)(magic, this.schema.magic)) {
            throw new Error(`Invalid schema magic header: ${(0, util_1.bytes_to_hex)(magic)}`);
        }
        const version = this.decoder.uint32();
        if (version > this.schema.version) {
            throw new Error(`Encoded version (${version}) is higher than the schema version (${this.schema.version}). Decoding is not possible.`);
        }
        return this;
    }
    record(root) {
        const tag = this.decoder.peek((d) => d.uint32());
        if (tag !== root) {
            throw new Error(`Unexpected record ${tag}`);
        }
        return do_decode({ op: "record", id: tag }, this.decoder, this.schema);
    }
}
exports.SchemaDecoder = SchemaDecoder;
function decode(bytes, schema, root) {
    const decoder = SchemaDecoder.from_bytes(bytes, schema);
    decoder.assert_magic();
    return decoder.record(root);
}
exports.decode = decode;
function do_decode(op, decoder, schema) {
    switch (op.op) {
        case "bool":
            return decoder.bool();
        case "int8":
            return decoder.int8();
        case "int16":
            return decoder.int16();
        case "int32":
            return decoder.int32();
        case "uint8":
            return decoder.uint8();
        case "uint16":
            return decoder.uint16();
        case "uint32":
            return decoder.uint32();
        case "integer":
            return decoder.bigint();
        case "float32":
            return decoder.float32();
        case "float64":
            return decoder.float64();
        case "text":
            return decoder.text();
        case "bytes":
            return decoder.bytes();
        case "constant": {
            const value = decoder.raw_bytes(op.value.length);
            if (!(0, util_1.byte_equals)(value, op.value)) {
                throw decoder.fail("constant-mismatch", `Expected byte constant: ${(0, util_1.bytes_to_hex)(op.value)}`);
            }
            return value;
        }
        case "array": {
            return decoder.array(() => {
                return do_decode(op.items, decoder, schema);
            });
        }
        case "map": {
            return decoder.map(() => {
                return do_decode(op.keys, decoder, schema);
            }, () => {
                return do_decode(op.values, decoder, schema);
            });
        }
        case "optional": {
            return decoder.optional(() => {
                return do_decode(op.value, decoder, schema);
            });
        }
        case "record": {
            const tag = decoder.uint32();
            if (tag !== op.id) {
                throw decoder.fail("tag-mismatch", `Expected tag: ${op.id}`);
            }
            const record = schema.resolve(op.id);
            if (!(record instanceof schema_1.Record)) {
                throw decoder.fail("entity-mismatch", `Expected record, got union: ${op.id}`);
            }
            const version_tag = decoder.uint32();
            const version = record.version(version_tag);
            const result = Object.create(null);
            for (const [field, extractor] of version.fields) {
                result[field] = do_decode(extractor, decoder, schema);
            }
            return version.reify(result);
        }
        case "union": {
            const tag = decoder.uint32();
            if (tag !== op.id) {
                throw decoder.fail("tag-mismatch", `Expected tag: ${op.id}`);
            }
            const union = schema.resolve(op.id);
            if (!(union instanceof schema_1.Union)) {
                throw decoder.fail("entity-mismatch", `Expected union, got record: ${op.id}`);
            }
            const version_tag = decoder.uint32();
            const version = union.version(version_tag);
            const variant_tag = decoder.uint32();
            const variant = version.variant(variant_tag);
            const result = Object.create(null);
            for (const [field, extractor] of variant.fields) {
                result[field] = do_decode(extractor, decoder, schema);
            }
            variant.reify(result);
            version.reify(result);
            return result;
        }
        default:
            throw (0, util_1.unreachable)(op, `LJT Op`);
    }
}

});

// packages\ljt-vm\build\parser.js
require.define(76, "packages\\ljt-vm\\build", "packages\\ljt-vm\\build\\parser.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const T = require(77);
const schema_1 = require(72);
const util_1 = require(73);
const top = T.tagged_choice("op", {
    bool: T.spec({ op: T.constant("bool") }),
    int8: T.spec({ op: T.constant("int8") }),
    int16: T.spec({ op: T.constant("int16") }),
    int32: T.spec({ op: T.constant("int32") }),
    uint8: T.spec({ op: T.constant("uint8") }),
    uint16: T.spec({ op: T.constant("uint16") }),
    uint32: T.spec({ op: T.constant("uint32") }),
    integer: T.spec({ op: T.constant("integer") }),
    float32: T.spec({ op: T.constant("float32") }),
    float64: T.spec({ op: T.constant("float64") }),
    text: T.spec({ op: T.constant("text") }),
    bytes: T.spec({ op: T.constant("bytes") }),
    constant: T.spec({
        op: T.constant("constant"),
        value: T.seq2(T.list_of(T.byte), (x) => new Uint8Array(x)),
    }),
    array: T.spec({
        op: T.constant("array"),
        items: T.lazy((x) => top(x)),
    }),
    map: T.spec({
        op: T.constant("map"),
        keys: T.lazy((x) => top(x)),
        values: T.lazy((x) => top(x)),
    }),
    optional: T.spec({
        op: T.constant("optional"),
        value: T.lazy((x) => top(x)),
    }),
    record: T.spec({
        op: T.constant("record"),
        id: T.int,
    }),
    union: T.spec({
        op: T.constant("union"),
        id: T.int,
    }),
});
const trecord_field = T.spec({
    name: T.str,
    type: top,
});
const trecord_version = T.spec({
    fields: T.list_of(trecord_field),
});
const trecord = T.spec({
    type: T.constant("record"),
    name: T.str,
    id: T.int,
    versions: T.list_of(trecord_version),
});
const tvariant = T.spec({
    name: T.str,
    fields: T.list_of(trecord_field),
});
const tunion_version = T.spec({
    variants: T.list_of(tvariant),
});
const tunion = T.spec({
    type: T.constant("union"),
    name: T.str,
    id: T.int,
    versions: T.list_of(tunion_version),
});
const tentity = T.tagged_choice("type", {
    record: trecord,
    union: tunion,
});
const tschema = T.spec({
    magic: T.seq2(T.list_of(T.byte), (x) => new Uint8Array(x)),
    version: T.int,
    entities: T.list_of(tentity),
});
function parse(json) {
    const schema0 = T.parse(tschema, json);
    const schema = new schema_1.Schema(schema0.magic, schema0.version);
    for (const entity0 of schema0.entities) {
        const entity = reify_entity(entity0);
        schema.add(entity);
    }
    return schema;
}
exports.parse = parse;
function reify_entity(entity) {
    switch (entity.type) {
        case "record":
            return reify_record(entity);
        case "union":
            return reify_union(entity);
        default:
            throw (0, util_1.unreachable)(entity, `Entity`);
    }
}
function reify_record(record0) {
    const versions = [];
    const record = new schema_1.Record(record0.id, record0.name, versions);
    for (const [version_id, version] of (0, util_1.enumerate)(record0.versions)) {
        versions.push(new schema_1.VersionedRecord(record.id, version_id, record.name, version.fields.map((x) => [x.name, x.type])));
    }
    return record;
}
function reify_union(union0) {
    const versions = [];
    const union = new schema_1.Union(union0.id, union0.name, versions);
    for (const [version_id, version] of (0, util_1.enumerate)(union0.versions)) {
        const variants = [];
        versions.push(new schema_1.VersionedUnion(union.id, version_id, union.name, variants));
        for (const [tag, variant] of (0, util_1.enumerate)(version.variants)) {
            variants.push(new schema_1.Variant(variant.name, tag, variant.fields.map((x) => [x.name, x.type])));
        }
    }
    return union;
}

});

// packages\ljt-vm\build\deps\object-spec.js
require.define(77, "packages\\ljt-vm\\build\\deps", "packages\\ljt-vm\\build\\deps\\object-spec.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(15), exports);

});

// packages\schema\build\generated\kart-v4.json
require.define(78, "", "", (module, exports, __dirname, __filename) => {
  module.exports = {"magic":[75,65,82,84],"version":4,"entities":[{"type":"union","name":"Content-rating","id":8,"versions":[{"variants":[{"name":"General","fields":[]},{"name":"Teen-and-up","fields":[]},{"name":"Mature","fields":[]},{"name":"Explicit","fields":[]},{"name":"Unknown","fields":[]}]}]},{"type":"record","name":"Cartridge","id":0,"versions":[{"fields":[{"name":"id","type":{"op":"text"}},{"name":"version","type":{"op":"record","id":5}},{"name":"release-date","type":{"op":"record","id":6}},{"name":"metadata","type":{"op":"array","items":{"op":"union","id":1}}},{"name":"runtime","type":{"op":"union","id":3}},{"name":"security","type":{"op":"record","id":2}},{"name":"files","type":{"op":"array","items":{"op":"record","id":4}}}]}]},{"type":"union","name":"Metadata","id":1,"versions":[{"variants":[{"name":"Presentation","fields":[{"name":"title","type":{"op":"text"}},{"name":"author","type":{"op":"text"}},{"name":"tagline","type":{"op":"text"}},{"name":"description","type":{"op":"text"}},{"name":"release-type","type":{"op":"union","id":9}},{"name":"thumbnail-path","type":{"op":"optional","value":{"op":"text"}}},{"name":"banner-path","type":{"op":"optional","value":{"op":"text"}}}]},{"name":"Classification","fields":[{"name":"genre","type":{"op":"array","items":{"op":"union","id":7}}},{"name":"tags","type":{"op":"array","items":{"op":"text"}}},{"name":"rating","type":{"op":"union","id":8}},{"name":"warnings","type":{"op":"optional","value":{"op":"text"}}}]},{"name":"Legal","fields":[{"name":"derivative-policy","type":{"op":"union","id":10}},{"name":"licence-path","type":{"op":"optional","value":{"op":"text"}}},{"name":"privacy-policy-path","type":{"op":"optional","value":{"op":"text"}}}]},{"name":"Accessibility","fields":[{"name":"input-methods","type":{"op":"array","items":{"op":"union","id":11}}},{"name":"languages","type":{"op":"array","items":{"op":"record","id":12}}},{"name":"provisions","type":{"op":"array","items":{"op":"union","id":13}}},{"name":"average-completion-seconds","type":{"op":"optional","value":{"op":"uint32"}}},{"name":"average-session-seconds","type":{"op":"optional","value":{"op":"uint32"}}}]}]}]},{"type":"record","name":"Security","id":2,"versions":[{"fields":[{"name":"capabilities","type":{"op":"array","items":{"op":"union","id":17}}}]}]},{"type":"union","name":"Runtime","id":3,"versions":[{"variants":[{"name":"Web-archive","fields":[{"name":"html-path","type":{"op":"text"}},{"name":"bridges","type":{"op":"array","items":{"op":"union","id":14}}}]}]}]},{"type":"record","name":"File","id":4,"versions":[{"fields":[{"name":"path","type":{"op":"text"}},{"name":"mime","type":{"op":"text"}},{"name":"integrity","type":{"op":"bytes"}},{"name":"data","type":{"op":"bytes"}}]}]},{"type":"record","name":"Version","id":5,"versions":[{"fields":[{"name":"major","type":{"op":"uint32"}},{"name":"minor","type":{"op":"uint32"}}]}]},{"type":"record","name":"Date","id":6,"versions":[{"fields":[{"name":"year","type":{"op":"uint32"}},{"name":"month","type":{"op":"uint8"}},{"name":"day","type":{"op":"uint8"}}]}]},{"type":"union","name":"Genre","id":7,"versions":[{"variants":[{"name":"Not-specified","fields":[]},{"name":"Action","fields":[]},{"name":"Platformer","fields":[]},{"name":"Shooter","fields":[]},{"name":"Racing","fields":[]},{"name":"Fighting","fields":[]},{"name":"Rhythm","fields":[]},{"name":"Adventure","fields":[]},{"name":"Interactive-fiction","fields":[]},{"name":"Visual-novel","fields":[]},{"name":"Puzzle","fields":[]},{"name":"RPG","fields":[]},{"name":"Simulation","fields":[]},{"name":"Strategy","fields":[]},{"name":"Sports","fields":[]},{"name":"Tool","fields":[]},{"name":"Other","fields":[]}]}]},{"type":"union","name":"Release-type","id":9,"versions":[{"variants":[{"name":"Prototype","fields":[]},{"name":"Early-access","fields":[]},{"name":"Beta","fields":[]},{"name":"Demo","fields":[]},{"name":"Regular","fields":[]},{"name":"Unofficial","fields":[]}]}]},{"type":"union","name":"Derivative-policy","id":10,"versions":[{"variants":[{"name":"Not-allowed","fields":[]},{"name":"Personal-use","fields":[]},{"name":"Non-commercial-use","fields":[]},{"name":"Commercial-use","fields":[]}]}]},{"type":"union","name":"Input-method","id":11,"versions":[{"variants":[{"name":"Buttons","fields":[]},{"name":"Pointer","fields":[]}]}]},{"type":"record","name":"Language","id":12,"versions":[{"fields":[{"name":"iso-code","type":{"op":"text"}},{"name":"interface","type":{"op":"bool"}},{"name":"audio","type":{"op":"bool"}},{"name":"text","type":{"op":"bool"}}]}]},{"type":"union","name":"Accessibility-provision","id":13,"versions":[{"variants":[{"name":"High-contrast","fields":[]},{"name":"Subtitles","fields":[]},{"name":"Image-captions","fields":[]},{"name":"Voiced-text","fields":[]},{"name":"Configurable-difficulty","fields":[]},{"name":"Skippable-content","fields":[]}]}]},{"type":"union","name":"Bridge","id":14,"versions":[{"variants":[{"name":"Network-proxy","fields":[]},{"name":"Local-storage-proxy","fields":[]},{"name":"Input-proxy","fields":[{"name":"mapping","type":{"op":"map","keys":{"op":"union","id":15},"values":{"op":"record","id":16}}}]},{"name":"Preserve-WebGL-render","fields":[]},{"name":"Capture-canvas","fields":[{"name":"selector","type":{"op":"text"}}]},{"name":"Pointer-input-proxy","fields":[{"name":"selector","type":{"op":"text"}},{"name":"hide-cursor","type":{"op":"bool"}}]},{"name":"IndexedDB-proxy","fields":[{"name":"versioned","type":{"op":"bool"}}]},{"name":"Renpy-web-tweaks","fields":[{"name":"version","type":{"op":"record","id":5}}]},{"name":"External-URL-handler","fields":[]}]}]},{"type":"union","name":"Virtual-key","id":15,"versions":[{"variants":[{"name":"Up","fields":[]},{"name":"Right","fields":[]},{"name":"Down","fields":[]},{"name":"Left","fields":[]},{"name":"Menu","fields":[]},{"name":"Capture","fields":[]},{"name":"X","fields":[]},{"name":"O","fields":[]},{"name":"L-trigger","fields":[]},{"name":"R-trigger","fields":[]}]}]},{"type":"record","name":"Keyboard-key","id":16,"versions":[{"fields":[{"name":"code","type":{"op":"text"}}]}]},{"type":"union","name":"Capability","id":17,"versions":[{"variants":[{"name":"Contextual","fields":[{"name":"capability","type":{"op":"union","id":18}},{"name":"reason","type":{"op":"text"}}]}]}]},{"type":"union","name":"Contextual-capability","id":18,"versions":[{"variants":[{"name":"Open-URLs","fields":[]},{"name":"Request-device-files","fields":[]},{"name":"Install-cartridges","fields":[]},{"name":"Download-files","fields":[]},{"name":"Show-dialogs","fields":[]}]}]}]};
})

// packages\schema\build\generated\kart-v4.js
require.define(79, "packages\\schema\\build\\generated", "packages\\schema\\build\\generated\\kart-v4.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contextual_capability = exports.Capability = exports.Keyboard_key = exports.Virtual_key = exports.Bridge = exports.Accessibility_provision = exports.Language = exports.Input_method = exports.Derivative_policy = exports.Release_type = exports.Genre = exports.Date = exports.Version = exports.File = exports.Runtime = exports.Security = exports.Metadata = exports.Cartridge = exports.Content_rating = void 0;
var Content_rating;
(function (Content_rating) {
    Content_rating.tag = 8;
    function General(x) {
        return {
            '@name': 'Content-rating',
            '@tag': 8,
            '@version': 0,
            '@variant': 0 /* $Tags.General */,
            '@variant-name': 'General',
            ...x
        };
    }
    Content_rating.General = General;
    function Teen_and_up(x) {
        return {
            '@name': 'Content-rating',
            '@tag': 8,
            '@version': 0,
            '@variant': 1 /* $Tags.Teen_and_up */,
            '@variant-name': 'Teen-and-up',
            ...x
        };
    }
    Content_rating.Teen_and_up = Teen_and_up;
    function Mature(x) {
        return {
            '@name': 'Content-rating',
            '@tag': 8,
            '@version': 0,
            '@variant': 2 /* $Tags.Mature */,
            '@variant-name': 'Mature',
            ...x
        };
    }
    Content_rating.Mature = Mature;
    function Explicit(x) {
        return {
            '@name': 'Content-rating',
            '@tag': 8,
            '@version': 0,
            '@variant': 3 /* $Tags.Explicit */,
            '@variant-name': 'Explicit',
            ...x
        };
    }
    Content_rating.Explicit = Explicit;
    function Unknown(x) {
        return {
            '@name': 'Content-rating',
            '@tag': 8,
            '@version': 0,
            '@variant': 4 /* $Tags.Unknown */,
            '@variant-name': 'Unknown',
            ...x
        };
    }
    Content_rating.Unknown = Unknown;
})(Content_rating || (exports.Content_rating = Content_rating = {}));
function Cartridge(x) {
    return {
        '@name': 'Cartridge',
        '@tag': 0,
        '@version': 0,
        ...x
    };
}
exports.Cartridge = Cartridge;
Cartridge.tag = 0;
var Metadata;
(function (Metadata) {
    Metadata.tag = 1;
    function Presentation(x) {
        return {
            '@name': 'Metadata',
            '@tag': 1,
            '@version': 0,
            '@variant': 0 /* $Tags.Presentation */,
            '@variant-name': 'Presentation',
            ...x
        };
    }
    Metadata.Presentation = Presentation;
    function Classification(x) {
        return {
            '@name': 'Metadata',
            '@tag': 1,
            '@version': 0,
            '@variant': 1 /* $Tags.Classification */,
            '@variant-name': 'Classification',
            ...x
        };
    }
    Metadata.Classification = Classification;
    function Legal(x) {
        return {
            '@name': 'Metadata',
            '@tag': 1,
            '@version': 0,
            '@variant': 2 /* $Tags.Legal */,
            '@variant-name': 'Legal',
            ...x
        };
    }
    Metadata.Legal = Legal;
    function Accessibility(x) {
        return {
            '@name': 'Metadata',
            '@tag': 1,
            '@version': 0,
            '@variant': 3 /* $Tags.Accessibility */,
            '@variant-name': 'Accessibility',
            ...x
        };
    }
    Metadata.Accessibility = Accessibility;
})(Metadata || (exports.Metadata = Metadata = {}));
function Security(x) {
    return {
        '@name': 'Security',
        '@tag': 2,
        '@version': 0,
        ...x
    };
}
exports.Security = Security;
Security.tag = 2;
var Runtime;
(function (Runtime) {
    Runtime.tag = 3;
    function Web_archive(x) {
        return {
            '@name': 'Runtime',
            '@tag': 3,
            '@version': 0,
            '@variant': 0 /* $Tags.Web_archive */,
            '@variant-name': 'Web-archive',
            ...x
        };
    }
    Runtime.Web_archive = Web_archive;
})(Runtime || (exports.Runtime = Runtime = {}));
function File(x) {
    return {
        '@name': 'File',
        '@tag': 4,
        '@version': 0,
        ...x
    };
}
exports.File = File;
File.tag = 4;
function Version(x) {
    return {
        '@name': 'Version',
        '@tag': 5,
        '@version': 0,
        ...x
    };
}
exports.Version = Version;
Version.tag = 5;
function Date(x) {
    return {
        '@name': 'Date',
        '@tag': 6,
        '@version': 0,
        ...x
    };
}
exports.Date = Date;
Date.tag = 6;
var Genre;
(function (Genre) {
    Genre.tag = 7;
    function Not_specified(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 0 /* $Tags.Not_specified */,
            '@variant-name': 'Not-specified',
            ...x
        };
    }
    Genre.Not_specified = Not_specified;
    function Action(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 1 /* $Tags.Action */,
            '@variant-name': 'Action',
            ...x
        };
    }
    Genre.Action = Action;
    function Platformer(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 2 /* $Tags.Platformer */,
            '@variant-name': 'Platformer',
            ...x
        };
    }
    Genre.Platformer = Platformer;
    function Shooter(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 3 /* $Tags.Shooter */,
            '@variant-name': 'Shooter',
            ...x
        };
    }
    Genre.Shooter = Shooter;
    function Racing(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 4 /* $Tags.Racing */,
            '@variant-name': 'Racing',
            ...x
        };
    }
    Genre.Racing = Racing;
    function Fighting(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 5 /* $Tags.Fighting */,
            '@variant-name': 'Fighting',
            ...x
        };
    }
    Genre.Fighting = Fighting;
    function Rhythm(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 6 /* $Tags.Rhythm */,
            '@variant-name': 'Rhythm',
            ...x
        };
    }
    Genre.Rhythm = Rhythm;
    function Adventure(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 7 /* $Tags.Adventure */,
            '@variant-name': 'Adventure',
            ...x
        };
    }
    Genre.Adventure = Adventure;
    function Interactive_fiction(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 8 /* $Tags.Interactive_fiction */,
            '@variant-name': 'Interactive-fiction',
            ...x
        };
    }
    Genre.Interactive_fiction = Interactive_fiction;
    function Visual_novel(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 9 /* $Tags.Visual_novel */,
            '@variant-name': 'Visual-novel',
            ...x
        };
    }
    Genre.Visual_novel = Visual_novel;
    function Puzzle(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 10 /* $Tags.Puzzle */,
            '@variant-name': 'Puzzle',
            ...x
        };
    }
    Genre.Puzzle = Puzzle;
    function RPG(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 11 /* $Tags.RPG */,
            '@variant-name': 'RPG',
            ...x
        };
    }
    Genre.RPG = RPG;
    function Simulation(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 12 /* $Tags.Simulation */,
            '@variant-name': 'Simulation',
            ...x
        };
    }
    Genre.Simulation = Simulation;
    function Strategy(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 13 /* $Tags.Strategy */,
            '@variant-name': 'Strategy',
            ...x
        };
    }
    Genre.Strategy = Strategy;
    function Sports(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 14 /* $Tags.Sports */,
            '@variant-name': 'Sports',
            ...x
        };
    }
    Genre.Sports = Sports;
    function Tool(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 15 /* $Tags.Tool */,
            '@variant-name': 'Tool',
            ...x
        };
    }
    Genre.Tool = Tool;
    function Other(x) {
        return {
            '@name': 'Genre',
            '@tag': 7,
            '@version': 0,
            '@variant': 16 /* $Tags.Other */,
            '@variant-name': 'Other',
            ...x
        };
    }
    Genre.Other = Other;
})(Genre || (exports.Genre = Genre = {}));
var Release_type;
(function (Release_type) {
    Release_type.tag = 9;
    function Prototype(x) {
        return {
            '@name': 'Release-type',
            '@tag': 9,
            '@version': 0,
            '@variant': 0 /* $Tags.Prototype */,
            '@variant-name': 'Prototype',
            ...x
        };
    }
    Release_type.Prototype = Prototype;
    function Early_access(x) {
        return {
            '@name': 'Release-type',
            '@tag': 9,
            '@version': 0,
            '@variant': 1 /* $Tags.Early_access */,
            '@variant-name': 'Early-access',
            ...x
        };
    }
    Release_type.Early_access = Early_access;
    function Beta(x) {
        return {
            '@name': 'Release-type',
            '@tag': 9,
            '@version': 0,
            '@variant': 2 /* $Tags.Beta */,
            '@variant-name': 'Beta',
            ...x
        };
    }
    Release_type.Beta = Beta;
    function Demo(x) {
        return {
            '@name': 'Release-type',
            '@tag': 9,
            '@version': 0,
            '@variant': 3 /* $Tags.Demo */,
            '@variant-name': 'Demo',
            ...x
        };
    }
    Release_type.Demo = Demo;
    function Regular(x) {
        return {
            '@name': 'Release-type',
            '@tag': 9,
            '@version': 0,
            '@variant': 4 /* $Tags.Regular */,
            '@variant-name': 'Regular',
            ...x
        };
    }
    Release_type.Regular = Regular;
    function Unofficial(x) {
        return {
            '@name': 'Release-type',
            '@tag': 9,
            '@version': 0,
            '@variant': 5 /* $Tags.Unofficial */,
            '@variant-name': 'Unofficial',
            ...x
        };
    }
    Release_type.Unofficial = Unofficial;
})(Release_type || (exports.Release_type = Release_type = {}));
var Derivative_policy;
(function (Derivative_policy) {
    Derivative_policy.tag = 10;
    function Not_allowed(x) {
        return {
            '@name': 'Derivative-policy',
            '@tag': 10,
            '@version': 0,
            '@variant': 0 /* $Tags.Not_allowed */,
            '@variant-name': 'Not-allowed',
            ...x
        };
    }
    Derivative_policy.Not_allowed = Not_allowed;
    function Personal_use(x) {
        return {
            '@name': 'Derivative-policy',
            '@tag': 10,
            '@version': 0,
            '@variant': 1 /* $Tags.Personal_use */,
            '@variant-name': 'Personal-use',
            ...x
        };
    }
    Derivative_policy.Personal_use = Personal_use;
    function Non_commercial_use(x) {
        return {
            '@name': 'Derivative-policy',
            '@tag': 10,
            '@version': 0,
            '@variant': 2 /* $Tags.Non_commercial_use */,
            '@variant-name': 'Non-commercial-use',
            ...x
        };
    }
    Derivative_policy.Non_commercial_use = Non_commercial_use;
    function Commercial_use(x) {
        return {
            '@name': 'Derivative-policy',
            '@tag': 10,
            '@version': 0,
            '@variant': 3 /* $Tags.Commercial_use */,
            '@variant-name': 'Commercial-use',
            ...x
        };
    }
    Derivative_policy.Commercial_use = Commercial_use;
})(Derivative_policy || (exports.Derivative_policy = Derivative_policy = {}));
var Input_method;
(function (Input_method) {
    Input_method.tag = 11;
    function Buttons(x) {
        return {
            '@name': 'Input-method',
            '@tag': 11,
            '@version': 0,
            '@variant': 0 /* $Tags.Buttons */,
            '@variant-name': 'Buttons',
            ...x
        };
    }
    Input_method.Buttons = Buttons;
    function Pointer(x) {
        return {
            '@name': 'Input-method',
            '@tag': 11,
            '@version': 0,
            '@variant': 1 /* $Tags.Pointer */,
            '@variant-name': 'Pointer',
            ...x
        };
    }
    Input_method.Pointer = Pointer;
})(Input_method || (exports.Input_method = Input_method = {}));
function Language(x) {
    return {
        '@name': 'Language',
        '@tag': 12,
        '@version': 0,
        ...x
    };
}
exports.Language = Language;
Language.tag = 12;
var Accessibility_provision;
(function (Accessibility_provision) {
    Accessibility_provision.tag = 13;
    function High_contrast(x) {
        return {
            '@name': 'Accessibility-provision',
            '@tag': 13,
            '@version': 0,
            '@variant': 0 /* $Tags.High_contrast */,
            '@variant-name': 'High-contrast',
            ...x
        };
    }
    Accessibility_provision.High_contrast = High_contrast;
    function Subtitles(x) {
        return {
            '@name': 'Accessibility-provision',
            '@tag': 13,
            '@version': 0,
            '@variant': 1 /* $Tags.Subtitles */,
            '@variant-name': 'Subtitles',
            ...x
        };
    }
    Accessibility_provision.Subtitles = Subtitles;
    function Image_captions(x) {
        return {
            '@name': 'Accessibility-provision',
            '@tag': 13,
            '@version': 0,
            '@variant': 2 /* $Tags.Image_captions */,
            '@variant-name': 'Image-captions',
            ...x
        };
    }
    Accessibility_provision.Image_captions = Image_captions;
    function Voiced_text(x) {
        return {
            '@name': 'Accessibility-provision',
            '@tag': 13,
            '@version': 0,
            '@variant': 3 /* $Tags.Voiced_text */,
            '@variant-name': 'Voiced-text',
            ...x
        };
    }
    Accessibility_provision.Voiced_text = Voiced_text;
    function Configurable_difficulty(x) {
        return {
            '@name': 'Accessibility-provision',
            '@tag': 13,
            '@version': 0,
            '@variant': 4 /* $Tags.Configurable_difficulty */,
            '@variant-name': 'Configurable-difficulty',
            ...x
        };
    }
    Accessibility_provision.Configurable_difficulty = Configurable_difficulty;
    function Skippable_content(x) {
        return {
            '@name': 'Accessibility-provision',
            '@tag': 13,
            '@version': 0,
            '@variant': 5 /* $Tags.Skippable_content */,
            '@variant-name': 'Skippable-content',
            ...x
        };
    }
    Accessibility_provision.Skippable_content = Skippable_content;
})(Accessibility_provision || (exports.Accessibility_provision = Accessibility_provision = {}));
var Bridge;
(function (Bridge) {
    Bridge.tag = 14;
    function Network_proxy(x) {
        return {
            '@name': 'Bridge',
            '@tag': 14,
            '@version': 0,
            '@variant': 0 /* $Tags.Network_proxy */,
            '@variant-name': 'Network-proxy',
            ...x
        };
    }
    Bridge.Network_proxy = Network_proxy;
    function Local_storage_proxy(x) {
        return {
            '@name': 'Bridge',
            '@tag': 14,
            '@version': 0,
            '@variant': 1 /* $Tags.Local_storage_proxy */,
            '@variant-name': 'Local-storage-proxy',
            ...x
        };
    }
    Bridge.Local_storage_proxy = Local_storage_proxy;
    function Input_proxy(x) {
        return {
            '@name': 'Bridge',
            '@tag': 14,
            '@version': 0,
            '@variant': 2 /* $Tags.Input_proxy */,
            '@variant-name': 'Input-proxy',
            ...x
        };
    }
    Bridge.Input_proxy = Input_proxy;
    function Preserve_WebGL_render(x) {
        return {
            '@name': 'Bridge',
            '@tag': 14,
            '@version': 0,
            '@variant': 3 /* $Tags.Preserve_WebGL_render */,
            '@variant-name': 'Preserve-WebGL-render',
            ...x
        };
    }
    Bridge.Preserve_WebGL_render = Preserve_WebGL_render;
    function Capture_canvas(x) {
        return {
            '@name': 'Bridge',
            '@tag': 14,
            '@version': 0,
            '@variant': 4 /* $Tags.Capture_canvas */,
            '@variant-name': 'Capture-canvas',
            ...x
        };
    }
    Bridge.Capture_canvas = Capture_canvas;
    function Pointer_input_proxy(x) {
        return {
            '@name': 'Bridge',
            '@tag': 14,
            '@version': 0,
            '@variant': 5 /* $Tags.Pointer_input_proxy */,
            '@variant-name': 'Pointer-input-proxy',
            ...x
        };
    }
    Bridge.Pointer_input_proxy = Pointer_input_proxy;
    function IndexedDB_proxy(x) {
        return {
            '@name': 'Bridge',
            '@tag': 14,
            '@version': 0,
            '@variant': 6 /* $Tags.IndexedDB_proxy */,
            '@variant-name': 'IndexedDB-proxy',
            ...x
        };
    }
    Bridge.IndexedDB_proxy = IndexedDB_proxy;
    function Renpy_web_tweaks(x) {
        return {
            '@name': 'Bridge',
            '@tag': 14,
            '@version': 0,
            '@variant': 7 /* $Tags.Renpy_web_tweaks */,
            '@variant-name': 'Renpy-web-tweaks',
            ...x
        };
    }
    Bridge.Renpy_web_tweaks = Renpy_web_tweaks;
    function External_URL_handler(x) {
        return {
            '@name': 'Bridge',
            '@tag': 14,
            '@version': 0,
            '@variant': 8 /* $Tags.External_URL_handler */,
            '@variant-name': 'External-URL-handler',
            ...x
        };
    }
    Bridge.External_URL_handler = External_URL_handler;
})(Bridge || (exports.Bridge = Bridge = {}));
var Virtual_key;
(function (Virtual_key) {
    Virtual_key.tag = 15;
    function Up(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 15,
            '@version': 0,
            '@variant': 0 /* $Tags.Up */,
            '@variant-name': 'Up',
            ...x
        };
    }
    Virtual_key.Up = Up;
    function Right(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 15,
            '@version': 0,
            '@variant': 1 /* $Tags.Right */,
            '@variant-name': 'Right',
            ...x
        };
    }
    Virtual_key.Right = Right;
    function Down(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 15,
            '@version': 0,
            '@variant': 2 /* $Tags.Down */,
            '@variant-name': 'Down',
            ...x
        };
    }
    Virtual_key.Down = Down;
    function Left(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 15,
            '@version': 0,
            '@variant': 3 /* $Tags.Left */,
            '@variant-name': 'Left',
            ...x
        };
    }
    Virtual_key.Left = Left;
    function Menu(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 15,
            '@version': 0,
            '@variant': 4 /* $Tags.Menu */,
            '@variant-name': 'Menu',
            ...x
        };
    }
    Virtual_key.Menu = Menu;
    function Capture(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 15,
            '@version': 0,
            '@variant': 5 /* $Tags.Capture */,
            '@variant-name': 'Capture',
            ...x
        };
    }
    Virtual_key.Capture = Capture;
    function X(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 15,
            '@version': 0,
            '@variant': 6 /* $Tags.X */,
            '@variant-name': 'X',
            ...x
        };
    }
    Virtual_key.X = X;
    function O(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 15,
            '@version': 0,
            '@variant': 7 /* $Tags.O */,
            '@variant-name': 'O',
            ...x
        };
    }
    Virtual_key.O = O;
    function L_trigger(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 15,
            '@version': 0,
            '@variant': 8 /* $Tags.L_trigger */,
            '@variant-name': 'L-trigger',
            ...x
        };
    }
    Virtual_key.L_trigger = L_trigger;
    function R_trigger(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 15,
            '@version': 0,
            '@variant': 9 /* $Tags.R_trigger */,
            '@variant-name': 'R-trigger',
            ...x
        };
    }
    Virtual_key.R_trigger = R_trigger;
})(Virtual_key || (exports.Virtual_key = Virtual_key = {}));
function Keyboard_key(x) {
    return {
        '@name': 'Keyboard-key',
        '@tag': 16,
        '@version': 0,
        ...x
    };
}
exports.Keyboard_key = Keyboard_key;
Keyboard_key.tag = 16;
var Capability;
(function (Capability) {
    Capability.tag = 17;
    function Contextual(x) {
        return {
            '@name': 'Capability',
            '@tag': 17,
            '@version': 0,
            '@variant': 0 /* $Tags.Contextual */,
            '@variant-name': 'Contextual',
            ...x
        };
    }
    Capability.Contextual = Contextual;
})(Capability || (exports.Capability = Capability = {}));
var Contextual_capability;
(function (Contextual_capability) {
    Contextual_capability.tag = 18;
    function Open_URLs(x) {
        return {
            '@name': 'Contextual-capability',
            '@tag': 18,
            '@version': 0,
            '@variant': 0 /* $Tags.Open_URLs */,
            '@variant-name': 'Open-URLs',
            ...x
        };
    }
    Contextual_capability.Open_URLs = Open_URLs;
    function Request_device_files(x) {
        return {
            '@name': 'Contextual-capability',
            '@tag': 18,
            '@version': 0,
            '@variant': 1 /* $Tags.Request_device_files */,
            '@variant-name': 'Request-device-files',
            ...x
        };
    }
    Contextual_capability.Request_device_files = Request_device_files;
    function Install_cartridges(x) {
        return {
            '@name': 'Contextual-capability',
            '@tag': 18,
            '@version': 0,
            '@variant': 2 /* $Tags.Install_cartridges */,
            '@variant-name': 'Install-cartridges',
            ...x
        };
    }
    Contextual_capability.Install_cartridges = Install_cartridges;
    function Download_files(x) {
        return {
            '@name': 'Contextual-capability',
            '@tag': 18,
            '@version': 0,
            '@variant': 3 /* $Tags.Download_files */,
            '@variant-name': 'Download-files',
            ...x
        };
    }
    Contextual_capability.Download_files = Download_files;
    function Show_dialogs(x) {
        return {
            '@name': 'Contextual-capability',
            '@tag': 18,
            '@version': 0,
            '@variant': 4 /* $Tags.Show_dialogs */,
            '@variant-name': 'Show-dialogs',
            ...x
        };
    }
    Contextual_capability.Show_dialogs = Show_dialogs;
})(Contextual_capability || (exports.Contextual_capability = Contextual_capability = {}));

});

// packages\kate-core\build\cart\parser-utils.js
require.define(80, "packages\\kate-core\\build\\cart", "packages\\kate-core\\build\\cart\\parser-utils.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
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

// packages\kate-core\build\cart\v4\metadata.js
require.define(81, "packages\\kate-core\\build\\cart\\v4", "packages\\kate-core\\build\\cart\\v4\\metadata.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_metadata = exports.default_metadata = void 0;
const v4_1 = require(67);
const utils_1 = require(5);
const parser_utils_1 = require(80);
function default_metadata(id) {
    return {
        presentation: {
            title: id,
            author: "",
            tagline: "",
            description: "",
            release_type: "regular",
            thumbnail_path: null,
            banner_path: null,
        },
        classification: {
            genre: new Set(),
            tags: new Set(),
            rating: "unknown",
            content_warning: null,
        },
        legal: {
            derivative_policy: "personal-use",
            licence_path: null,
            privacy_policy_path: null,
        },
        accessibility: {
            input_methods: new Set(),
            languages: [],
            provisions: new Set(),
            average_completion_seconds: null,
            average_session_seconds: null,
        },
    };
}
exports.default_metadata = default_metadata;
function parse_metadata(cart) {
    let result = default_metadata(cart.id);
    let collected = Object.create(null);
    for (const meta of cart.metadata) {
        switch (meta["@variant"]) {
            case 0 /* Cart_v4.Metadata.$Tags.Presentation */:
                assign(collected, "presentation", parse_presentation(meta));
                break;
            case 1 /* Cart_v4.Metadata.$Tags.Classification */:
                assign(collected, "classification", parse_classification(meta));
                break;
            case 2 /* Cart_v4.Metadata.$Tags.Legal */:
                assign(collected, "legal", parse_legal(meta));
                break;
            case 3 /* Cart_v4.Metadata.$Tags.Accessibility */:
                assign(collected, "accessibility", parse_accessibility(meta));
                break;
            default:
                throw (0, utils_1.unreachable)(meta, "Metadata");
        }
    }
    return { ...result, ...collected };
}
exports.parse_metadata = parse_metadata;
function parse_presentation(block) {
    return {
        title: (0, parser_utils_1.str)(block.title, 255),
        author: (0, parser_utils_1.str)(block.author, 255),
        tagline: (0, parser_utils_1.str)(block.tagline, 255),
        description: (0, parser_utils_1.str)(block.description, 10_000),
        release_type: release_kind(block["release-type"]),
        thumbnail_path: block["thumbnail-path"]
            ? (0, parser_utils_1.str)(block["thumbnail-path"], 1_024)
            : null,
        banner_path: block["banner-path"] ? (0, parser_utils_1.str)(block["banner-path"], 1_024) : null,
    };
}
function parse_classification(block) {
    return {
        genre: new Set(block.genre.map((x) => genre(x))),
        tags: new Set((0, parser_utils_1.list)(block.tags.map((x) => tag(x)), 10)),
        rating: content_rating(block.rating),
        content_warning: block.warnings ? (0, parser_utils_1.str)(block.warnings, 1_000) : null,
    };
}
function parse_legal(block) {
    return {
        derivative_policy: derivative_policy(block["derivative-policy"]),
        licence_path: block["licence-path"]
            ? (0, parser_utils_1.str)(block["licence-path"], 1_024)
            : null,
        privacy_policy_path: block["privacy-policy-path"]
            ? (0, parser_utils_1.str)(block["privacy-policy-path"], 1_024)
            : null,
    };
}
function parse_accessibility(block) {
    return {
        input_methods: new Set(block["input-methods"].map(input_method)),
        languages: (0, parser_utils_1.list)(block.languages.map(language), 255),
        provisions: new Set(block.provisions.map(accessibility_provision)),
        average_completion_seconds: block["average-completion-seconds"],
        average_session_seconds: block["average-session-seconds"],
    };
}
function release_kind(x) {
    switch (x["@variant"]) {
        case 2 /* Cart_v4.Release_type.$Tags.Beta */:
            return "beta";
        case 3 /* Cart_v4.Release_type.$Tags.Demo */:
            return "demo";
        case 1 /* Cart_v4.Release_type.$Tags.Early_access */:
            return "early-access";
        case 4 /* Cart_v4.Release_type.$Tags.Regular */:
            return "regular";
        case 0 /* Cart_v4.Release_type.$Tags.Prototype */:
            return "prototype";
        case 5 /* Cart_v4.Release_type.$Tags.Unofficial */:
            return "unofficial";
        default:
            throw (0, utils_1.unreachable)(x);
    }
}
function genre(x) {
    switch (x["@variant"]) {
        case 1 /* Cart_v4.Genre.$Tags.Action */:
            return "action";
        case 5 /* Cart_v4.Genre.$Tags.Fighting */:
            return "fighting";
        case 7 /* Cart_v4.Genre.$Tags.Adventure */:
            return "adventure";
        case 9 /* Cart_v4.Genre.$Tags.Visual_novel */:
            return "visual-novel";
        case 8 /* Cart_v4.Genre.$Tags.Interactive_fiction */:
            return "interactive-fiction";
        case 2 /* Cart_v4.Genre.$Tags.Platformer */:
            return "platformer";
        case 10 /* Cart_v4.Genre.$Tags.Puzzle */:
            return "puzzle";
        case 4 /* Cart_v4.Genre.$Tags.Racing */:
            return "racing";
        case 6 /* Cart_v4.Genre.$Tags.Rhythm */:
            return "rhythm";
        case 11 /* Cart_v4.Genre.$Tags.RPG */:
            return "rpg";
        case 12 /* Cart_v4.Genre.$Tags.Simulation */:
            return "simulation";
        case 3 /* Cart_v4.Genre.$Tags.Shooter */:
            return "shooter";
        case 14 /* Cart_v4.Genre.$Tags.Sports */:
            return "sports";
        case 13 /* Cart_v4.Genre.$Tags.Strategy */:
            return "strategy";
        case 15 /* Cart_v4.Genre.$Tags.Tool */:
            return "tool";
        case 16 /* Cart_v4.Genre.$Tags.Other */:
            return "other";
        case 0 /* Cart_v4.Genre.$Tags.Not_specified */:
            return "not-specified";
        default:
            throw (0, utils_1.unreachable)(x, "genre");
    }
}
function content_rating(x) {
    switch (x["@variant"]) {
        case 0 /* Cart_v4.Content_rating.$Tags.General */:
            return "general";
        case 1 /* Cart_v4.Content_rating.$Tags.Teen_and_up */:
            return "teen-and-up";
        case 2 /* Cart_v4.Content_rating.$Tags.Mature */:
            return "mature";
        case 3 /* Cart_v4.Content_rating.$Tags.Explicit */:
            return "explicit";
        case 4 /* Cart_v4.Content_rating.$Tags.Unknown */:
            return "unknown";
        default:
            throw (0, utils_1.unreachable)(x, "content rating");
    }
}
function derivative_policy(x) {
    switch (x["@variant"]) {
        case 0 /* Cart_v4.Derivative_policy.$Tags.Not_allowed */:
            return "not-allowed";
        case 1 /* Cart_v4.Derivative_policy.$Tags.Personal_use */:
            return "personal-use";
        case 2 /* Cart_v4.Derivative_policy.$Tags.Non_commercial_use */:
            return "non-commercial-use";
        case 3 /* Cart_v4.Derivative_policy.$Tags.Commercial_use */:
            return "commercial-use";
        default:
            throw (0, utils_1.unreachable)(x, "derivative policy");
    }
}
function accessibility_provision(x) {
    switch (x["@variant"]) {
        case 4 /* Cart_v4.Accessibility_provision.$Tags.Configurable_difficulty */:
            return "configurable-difficulty";
        case 0 /* Cart_v4.Accessibility_provision.$Tags.High_contrast */:
            return "high-contrast";
        case 2 /* Cart_v4.Accessibility_provision.$Tags.Image_captions */:
            return "image-captions";
        case 5 /* Cart_v4.Accessibility_provision.$Tags.Skippable_content */:
            return "skippable-content";
        case 1 /* Cart_v4.Accessibility_provision.$Tags.Subtitles */:
            return "subtitles";
        case 3 /* Cart_v4.Accessibility_provision.$Tags.Voiced_text */:
            return "voiced-text";
        default:
            throw (0, utils_1.unreachable)(x);
    }
}
function input_method(x) {
    switch (x["@variant"]) {
        case 0 /* Cart_v4.Input_method.$Tags.Buttons */:
            return "buttons";
        case 1 /* Cart_v4.Input_method.$Tags.Pointer */:
            return "pointer";
        default:
            throw (0, utils_1.unreachable)(x);
    }
}
const valid_language = (0, parser_utils_1.regex)("language iso-code", /^[a-z]{2}(?:[\-_][a-zA-Z_]{2,})?$/);
function language(x) {
    return {
        iso_code: valid_language((0, parser_utils_1.str)(x["iso-code"], 255)),
        audio: x.audio,
        interface: x.interface,
        text: x.text,
    };
}
const tag = (0, parser_utils_1.regex)("tag", /^[a-z\-]+$/);
function assign(result, key, value) {
    if (key in result) {
        throw new Error(`Duplicated metadata block: ${key}`);
    }
    result[key] = value;
    return result;
}

});

// packages\kate-core\build\cart\v4\runtime.js
require.define(82, "packages\\kate-core\\build\\cart\\v4", "packages\\kate-core\\build\\cart\\v4\\runtime.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_runtime = void 0;
const v4_1 = require(67);
const utils_1 = require(5);
const keymap = require(83);
function parse_runtime(cart) {
    const platform = cart.runtime;
    switch (platform["@variant"]) {
        case 0 /* Cart_v4.Runtime.$Tags.Web_archive */: {
            return {
                type: "web-archive",
                bridges: platform.bridges.map(bridge),
                html_path: str(platform["html-path"], 1_024),
            };
        }
    }
}
exports.parse_runtime = parse_runtime;
function bridge(x) {
    switch (x["@variant"]) {
        case 2 /* Cart_v4.Bridge.$Tags.Input_proxy */: {
            return {
                type: "input-proxy",
                mapping: map_map(x.mapping, (a, b) => [
                    virtual_key(a),
                    keyboard_key(b),
                ]),
            };
        }
        case 1 /* Cart_v4.Bridge.$Tags.Local_storage_proxy */: {
            return { type: "local-storage-proxy" };
        }
        case 0 /* Cart_v4.Bridge.$Tags.Network_proxy */: {
            return { type: "network-proxy" };
        }
        case 3 /* Cart_v4.Bridge.$Tags.Preserve_WebGL_render */: {
            return { type: "preserve-render" };
        }
        case 4 /* Cart_v4.Bridge.$Tags.Capture_canvas */: {
            return { type: "capture-canvas", selector: str(x.selector, 255) };
        }
        case 5 /* Cart_v4.Bridge.$Tags.Pointer_input_proxy */: {
            return {
                type: "pointer-input-proxy",
                selector: str(x.selector, 255),
                hide_cursor: x["hide-cursor"],
            };
        }
        case 6 /* Cart_v4.Bridge.$Tags.IndexedDB_proxy */: {
            return { type: "indexeddb-proxy", versioned: x.versioned };
        }
        case 7 /* Cart_v4.Bridge.$Tags.Renpy_web_tweaks */: {
            return { type: "renpy-web-tweaks", version: x.version };
        }
        case 8 /* Cart_v4.Bridge.$Tags.External_URL_handler */: {
            return { type: "external-url-handler" };
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
    switch (key["@variant"]) {
        case 5 /* Cart_v4.Virtual_key.$Tags.Capture */:
            return "capture";
        case 4 /* Cart_v4.Virtual_key.$Tags.Menu */:
            return "menu";
        case 0 /* Cart_v4.Virtual_key.$Tags.Up */:
            return "up";
        case 1 /* Cart_v4.Virtual_key.$Tags.Right */:
            return "right";
        case 2 /* Cart_v4.Virtual_key.$Tags.Down */:
            return "down";
        case 3 /* Cart_v4.Virtual_key.$Tags.Left */:
            return "left";
        case 7 /* Cart_v4.Virtual_key.$Tags.O */:
            return "o";
        case 6 /* Cart_v4.Virtual_key.$Tags.X */:
            return "x";
        case 8 /* Cart_v4.Virtual_key.$Tags.L_trigger */:
            return "ltrigger";
        case 9 /* Cart_v4.Virtual_key.$Tags.R_trigger */:
            return "rtrigger";
        default:
            throw (0, utils_1.unreachable)(key);
    }
}
function keyboard_key(key) {
    const mapping = keymap[key.code];
    if (mapping == null) {
        throw new Error(`Invalid keycode ${key}`);
    }
    return mapping;
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

// packages\kate-tools\assets\keymap.json
require.define(83, "", "", (module, exports, __dirname, __filename) => {
  module.exports = {"ArrowLeft":{"key":"ArrowLeft","code":"ArrowLeft","key_code":37},"ArrowUp":{"key":"ArrowUp","code":"ArrowUp","key_code":38},"ArrowRight":{"key":"ArrowRight","code":"ArrowRight","key_code":39},"ArrowDown":{"key":"ArrowDown","code":"ArrowDown","key_code":40},"KeyQ":{"key":"q","code":"KeyQ","key_code":81},"KeyW":{"key":"w","code":"KeyW","key_code":87},"KeyE":{"key":"e","code":"KeyE","key_code":69},"KeyR":{"key":"r","code":"KeyR","key_code":82},"KeyT":{"key":"t","code":"KeyT","key_code":84},"KeyY":{"key":"y","code":"KeyY","key_code":89},"KeyU":{"key":"u","code":"KeyU","key_code":85},"KeyI":{"key":"i","code":"KeyI","key_code":73},"KeyO":{"key":"o","code":"KeyO","key_code":79},"KeyP":{"key":"p","code":"KeyP","key_code":80},"KeyA":{"key":"a","code":"KeyA","key_code":65},"KeyS":{"key":"s","code":"KeyS","key_code":83},"KeyD":{"key":"d","code":"KeyD","key_code":68},"KeyF":{"key":"f","code":"KeyF","key_code":70},"KeyG":{"key":"g","code":"KeyG","key_code":71},"KeyH":{"key":"h","code":"KeyH","key_code":72},"KeyJ":{"key":"j","code":"KeyJ","key_code":74},"KeyL":{"key":"l","code":"KeyL","key_code":76},"KeyK":{"key":"k","code":"KeyK","key_code":75},"Enter":{"key":"Enter","code":"Enter","key_code":13},"Backspace":{"key":"Backspace","code":"Backspace","key_code":8},"Digit0":{"key":"0","code":"Digit0","key_code":48},"Digit9":{"key":"9","code":"Digit9","key_code":57},"Digit8":{"key":"8","code":"Digit8","key_code":56},"Digit7":{"key":"7","code":"Digit7","key_code":55},"Digit6":{"key":"6","code":"Digit6","key_code":54},"Digit5":{"key":"5","code":"Digit5","key_code":53},"Digit4":{"key":"4","code":"Digit4","key_code":52},"Digit3":{"key":"3","code":"Digit3","key_code":51},"Digit2":{"key":"2","code":"Digit2","key_code":50},"Digit1":{"key":"1","code":"Digit1","key_code":49},"Tab":{"key":"Tab","code":"Tab","key_code":9},"CapsLock":{"key":"CapsLock","code":"CapsLock","key_code":20},"ShiftLeft":{"key":"Shift","code":"ShiftLeft","key_code":16},"ControlLeft":{"key":"Control","code":"ControlLeft","key_code":17},"MetaLeft":{"key":"Meta","code":"MetaLeft","key_code":91},"AltLeft":{"key":"Alt","code":"AltLeft","key_code":18},"Space":{"key":" ","code":"Space","key_code":32},"AltRight":{"key":"AltGraph","code":"AltRight","key_code":18},"ControlRight":{"key":"Control","code":"ControlRight","key_code":17},"ContextMenu":{"key":"ContextMenu","code":"ContextMenu","key_code":93},"ShiftRight":{"key":"Shift","code":"ShiftRight","key_code":16},"KeyN":{"key":"n","code":"KeyN","key_code":78},"KeyM":{"key":"m","code":"KeyM","key_code":77},"KeyB":{"key":"b","code":"KeyB","key_code":66},"KeyV":{"key":"v","code":"KeyV","key_code":86},"KeyC":{"key":"c","code":"KeyC","key_code":67},"KeyX":{"key":"x","code":"KeyX","key_code":88},"KeyZ":{"key":"z","code":"KeyZ","key_code":90},"Delete":{"key":"Delete","code":"Delete","key_code":46},"End":{"key":"End","code":"End","key_code":35},"PageDown":{"key":"PageDown","code":"PageDown","key_code":34},"Insert":{"key":"Insert","code":"Insert","key_code":45},"Home":{"key":"Home","code":"Home","key_code":36},"PageUp":{"key":"PageUp","code":"PageUp","key_code":33},"Numpad0":{"key":"0","code":"Numpad0","key_code":96},"NumpadDecimal":{"key":",","code":"NumpadDecimal","key_code":110},"Numpad1":{"key":"1","code":"Numpad1","key_code":97},"Numpad2":{"key":"2","code":"Numpad2","key_code":98},"Numpad3":{"key":"3","code":"Numpad3","key_code":99},"NumpadEnter":{"key":"Enter","code":"NumpadEnter","key_code":13},"Numpad4":{"key":"4","code":"Numpad4","key_code":100},"Numpad5":{"key":"5","code":"Numpad5","key_code":101},"Numpad6":{"key":"6","code":"Numpad6","key_code":102},"NumpadAdd":{"key":"+","code":"NumpadAdd","key_code":107},"Numpad7":{"key":"7","code":"Numpad7","key_code":103},"Numpad8":{"key":"8","code":"Numpad8","key_code":104},"Numpad9":{"key":"9","code":"Numpad9","key_code":105},"NumpadDivide":{"key":"/","code":"NumpadDivide","key_code":111},"NumpadMultiply":{"key":"*","code":"NumpadMultiply","key_code":106},"NumpadSubtract":{"key":"-","code":"NumpadSubtract","key_code":109},"F1":{"key":"F1","code":"F1","key_code":112},"F2":{"key":"F2","code":"F2","key_code":113},"F3":{"key":"F3","code":"F3","key_code":114},"F4":{"key":"F4","code":"F4","key_code":115},"F5":{"key":"F5","code":"F5","key_code":116},"F6":{"key":"F6","code":"F6","key_code":117},"F7":{"key":"F7","code":"F7","key_code":118},"F8":{"key":"F8","code":"F8","key_code":119},"F9":{"key":"F9","code":"F9","key_code":120},"F10":{"key":"F10","code":"F10","key_code":121},"F11":{"key":"F11","code":"F11","key_code":122},"F12":{"key":"F12","code":"F12","key_code":123},"Escape":{"key":"Escape","code":"Escape","key_code":27}};
})

// packages\kate-core\build\cart\v4\files.js
require.define(84, "packages\\kate-core\\build\\cart\\v4", "packages\\kate-core\\build\\cart\\v4\\files.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_file = exports.parse_files = void 0;
const parser_utils_1 = require(80);
function parse_files(cart) {
    return cart.files.map(parse_file);
}
exports.parse_files = parse_files;
function parse_file(file) {
    return {
        path: (0, parser_utils_1.str)(file.path, 1_024),
        mime: (0, parser_utils_1.str)(file.mime, 255),
        integrity_hash: file.integrity,
        integrity_hash_algorithm: "SHA-256",
        data: file.data,
    };
}
exports.parse_file = parse_file;

});

// packages\kate-core\build\cart\v4\security.js
require.define(85, "packages\\kate-core\\build\\cart\\v4", "packages\\kate-core\\build\\cart\\v4\\security.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_security = void 0;
const utils_1 = require(5);
const v4_1 = require(67);
function parse_security(cart) {
    return {
        contextual_capabilities: cart.security.capabilities.map(parse_capability),
    };
}
exports.parse_security = parse_security;
function parse_capability(capability) {
    return {
        reason: capability.reason,
        capability: parse_contextual_capability(capability.capability),
    };
}
function parse_contextual_capability(capability) {
    switch (capability["@variant"]) {
        case 0 /* Cart_v4.Contextual_capability.$Tags.Open_URLs */: {
            return {
                type: "open-urls",
            };
        }
        case 1 /* Cart_v4.Contextual_capability.$Tags.Request_device_files */: {
            return {
                type: "request-device-files",
            };
        }
        case 2 /* Cart_v4.Contextual_capability.$Tags.Install_cartridges */: {
            return {
                type: "install-cartridges",
            };
        }
        case 3 /* Cart_v4.Contextual_capability.$Tags.Download_files */: {
            return {
                type: "download-files",
            };
        }
        case 4 /* Cart_v4.Contextual_capability.$Tags.Show_dialogs */: {
            return {
                type: "show-dialogs",
            };
        }
        default:
            throw (0, utils_1.unreachable)(capability, "capability");
    }
}

});

// packages\kate-core\build\cart\v5\v5.js
require.define(86, "packages\\kate-core\\build\\cart\\v5", "packages\\kate-core\\build\\cart\\v5\\v5.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_v4_metadata = exports.parse_v5 = exports.Cart_v5 = void 0;
const Cart_v5 = require(87);
exports.Cart_v5 = Cart_v5;
const parser_utils_1 = require(80);
const Metadata = require(91);
const Runtime = require(92);
const Files = require(93);
const Security = require(94);
const MAGIC = Number("0x" +
    "KART"
        .split("")
        .map((x) => x.charCodeAt(0).toString(16))
        .join(""));
const valid_id = (0, parser_utils_1.regex)("id", /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\/[a-z0-9\-]+(\.[a-z0-9\-]+)*$/);
function version_string(version) {
    return `${version.major}.${version.minor}`;
}
function date(x) {
    return new Date(x.year, x.month - 1, x.day, 0, 0, 0, 0);
}
function parse_v5(x) {
    if (!check_header(x)) {
        return null;
    }
    const cart = Cart_v5.decode(x);
    const meta = Metadata.parse_metadata(cart.metadata);
    const runtime = Runtime.parse_runtime(cart.metadata);
    const security = Security.parse_security(cart.metadata);
    const files = Files.parse_files(cart.files);
    return {
        id: (0, parser_utils_1.str)(valid_id(cart.metadata.identification.id), 255),
        version: version_string(cart.metadata.identification.version),
        release_date: date(cart.metadata.identification["release-date"]),
        metadata: meta,
        security: security,
        runtime: runtime,
        files: files,
    };
}
exports.parse_v5 = parse_v5;
function parse_v4_metadata(x) {
    if (!check_header(x)) {
        return null;
    }
    const header = Cart_v5.decode_header(x);
    const metadata = Cart_v5.decode_metadata(x, header);
    const meta = Metadata.parse_metadata(metadata);
    const runtime = Runtime.parse_runtime(metadata);
    const security = Security.parse_security(metadata);
    return {
        id: (0, parser_utils_1.str)(valid_id(metadata.identification.id), 255),
        version: version_string(metadata.identification.version),
        release_date: date(metadata.identification["release-date"]),
        metadata: meta,
        security: security,
        runtime: runtime,
    };
}
exports.parse_v4_metadata = parse_v4_metadata;
function check_header(x) {
    const view = new DataView(x.buffer);
    const magic_header = view.getUint32(0, false);
    if (magic_header !== MAGIC) {
        return false;
    }
    const version = view.getUint32(4, true);
    if (version !== 5) {
        return false;
    }
    return true;
}

});

// packages\schema\build\kart-v5.js
require.define(87, "packages\\schema\\build", "packages\\schema\\build\\kart-v5.js", (module, exports, __dirname, __filename) => {
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
exports.encode = exports.decode = exports.decode_files = exports.decode_metadata = exports.decode_header = void 0;
const LJT = require(69);
const source = require(88);
const Cart = require(89);
__exportStar(require(89), exports);
const util_1 = require(90);
const schema = LJT.parse(source);
// == Cartridge decoder
function decode_header(bytes) {
    const decoder = LJT.SchemaDecoder.from_bytes(bytes, schema);
    decoder.assert_magic();
    const header = decoder.record(Cart.Header.tag);
    const meta_loc = header["metadata-location"];
    const file_loc = header["content-location"];
    if (slice_intersect(meta_loc, file_loc)) {
        throw new Error(`Invalid cartridge file: overlapping sections`);
    }
    return header;
}
exports.decode_header = decode_header;
function decode_metadata_record(bytes) {
    const decoder = LJT.SchemaDecoder.from_bytes(bytes, schema);
    return decoder.record(Cart.Metadata.tag);
}
function decode_files_record(bytes) {
    const decoder = LJT.SchemaDecoder.from_bytes(bytes, schema);
    const result = [];
    const size = decoder.decoder.uint32();
    for (let i = 0; i < size; ++i) {
        result.push(decoder.record(Cart.File.tag));
    }
    return result;
}
function decode_metadata(bytes, header) {
    const meta_loc = header["metadata-location"];
    const metadata_bytes = bytes.slice(meta_loc.offset, meta_loc.offset + meta_loc.size);
    return decode_metadata_record(metadata_bytes);
}
exports.decode_metadata = decode_metadata;
function decode_files(bytes, header) {
    const file_loc = header["content-location"];
    return decode_files_record(bytes.slice(file_loc.offset, file_loc.offset + file_loc.size));
}
exports.decode_files = decode_files;
function decode(bytes) {
    const header = decode_header(bytes);
    const metadata = decode_metadata(bytes, header);
    const files = decode_files(bytes, header);
    return Cart.Cartridge({ header, metadata, files });
}
exports.decode = decode;
function encode(options) {
    const meta_bytes = LJT.encode_magicless(options.metadata, schema, Cart.Metadata.tag);
    const file_list = options.files.map((x) => LJT.encode_magicless(x, schema, Cart.File.tag));
    const file_size = new Uint8Array(4);
    new DataView(file_size.buffer).setUint32(0, file_list.length, true);
    const file_bytes = (0, util_1.concat_all)([file_size, ...file_list]);
    const header = Cart.Header({
        "minimum-kate-version": options.kate_version,
        "metadata-location": Cart.Binary_location({
            offset: 0,
            size: meta_bytes.length,
        }),
        "content-location": Cart.Binary_location({
            offset: 0,
            size: file_bytes.length,
        }),
    });
    const header_size = LJT.encode(header, schema, Cart.Header.tag).length;
    header["metadata-location"].offset = header_size;
    header["content-location"].offset = header_size + meta_bytes.length;
    const header_bytes = LJT.encode(header, schema, Cart.Header.tag);
    return (0, util_1.concat_all)([header_bytes, meta_bytes, file_bytes]);
}
exports.encode = encode;
function slice_intersect(a, b) {
    if (a.offset + a.size <= b.offset)
        return false;
    if (a.offset >= b.offset + b.size)
        return false;
    return true;
}

});

// packages\schema\build\generated\kart-v5.json
require.define(88, "", "", (module, exports, __dirname, __filename) => {
  module.exports = {"magic":[75,65,82,84],"version":5,"entities":[{"type":"record","name":"Security","id":8,"versions":[{"fields":[{"name":"capabilities","type":{"op":"array","items":{"op":"union","id":27}}}]}]},{"type":"record","name":"Cartridge","id":0,"versions":[{"fields":[{"name":"header","type":{"op":"record","id":1}},{"name":"metadata","type":{"op":"record","id":2}},{"name":"files","type":{"op":"array","items":{"op":"record","id":10}}}]}]},{"type":"record","name":"Header","id":1,"versions":[{"fields":[{"name":"minimum-kate-version","type":{"op":"record","id":14}},{"name":"metadata-location","type":{"op":"record","id":15}},{"name":"content-location","type":{"op":"record","id":15}}]}]},{"type":"record","name":"Metadata","id":2,"versions":[{"fields":[{"name":"identification","type":{"op":"record","id":3}},{"name":"presentation","type":{"op":"record","id":4}},{"name":"classification","type":{"op":"record","id":5}},{"name":"legal","type":{"op":"record","id":6}},{"name":"accessibility","type":{"op":"record","id":7}},{"name":"security","type":{"op":"record","id":8}},{"name":"runtime","type":{"op":"union","id":9}},{"name":"signature","type":{"op":"optional","value":{"op":"record","id":11}}},{"name":"signed-by","type":{"op":"array","items":{"op":"text"}}}]}]},{"type":"record","name":"Meta-identification","id":3,"versions":[{"fields":[{"name":"id","type":{"op":"text"}},{"name":"version","type":{"op":"record","id":13}},{"name":"release-date","type":{"op":"record","id":16}}]}]},{"type":"record","name":"Meta-presentation","id":4,"versions":[{"fields":[{"name":"title","type":{"op":"text"}},{"name":"author","type":{"op":"text"}},{"name":"tagline","type":{"op":"text"}},{"name":"description","type":{"op":"text"}},{"name":"release-type","type":{"op":"union","id":19}},{"name":"thumbnail-path","type":{"op":"optional","value":{"op":"text"}}},{"name":"banner-path","type":{"op":"optional","value":{"op":"text"}}}]}]},{"type":"record","name":"Meta-classification","id":5,"versions":[{"fields":[{"name":"genre","type":{"op":"array","items":{"op":"union","id":17}}},{"name":"tags","type":{"op":"array","items":{"op":"text"}}},{"name":"rating","type":{"op":"union","id":18}},{"name":"warnings","type":{"op":"optional","value":{"op":"text"}}}]}]},{"type":"record","name":"Meta-legal","id":6,"versions":[{"fields":[{"name":"derivative-policy","type":{"op":"union","id":20}},{"name":"licence-path","type":{"op":"optional","value":{"op":"text"}}},{"name":"privacy-policy-path","type":{"op":"optional","value":{"op":"text"}}}]}]},{"type":"record","name":"Meta-accessibility","id":7,"versions":[{"fields":[{"name":"input-methods","type":{"op":"array","items":{"op":"union","id":21}}},{"name":"languages","type":{"op":"array","items":{"op":"record","id":22}}},{"name":"provisions","type":{"op":"array","items":{"op":"union","id":23}}},{"name":"average-completion-seconds","type":{"op":"optional","value":{"op":"uint32"}}},{"name":"average-session-seconds","type":{"op":"optional","value":{"op":"uint32"}}}]}]},{"type":"union","name":"Runtime","id":9,"versions":[{"variants":[{"name":"Web-archive","fields":[{"name":"html-path","type":{"op":"text"}},{"name":"bridges","type":{"op":"array","items":{"op":"union","id":24}}}]}]}]},{"type":"record","name":"File","id":10,"versions":[{"fields":[{"name":"path","type":{"op":"text"}},{"name":"mime","type":{"op":"text"}},{"name":"integrity","type":{"op":"bytes"}},{"name":"data","type":{"op":"bytes"}},{"name":"signature","type":{"op":"optional","value":{"op":"record","id":11}}}]}]},{"type":"record","name":"Signature-block","id":11,"versions":[{"fields":[{"name":"purpose","type":{"op":"text"}},{"name":"signatures","type":{"op":"array","items":{"op":"record","id":12}}}]}]},{"type":"record","name":"Signature","id":12,"versions":[{"fields":[{"name":"signed-by","type":{"op":"text"}},{"name":"signature","type":{"op":"bytes"}}]}]},{"type":"record","name":"Version","id":13,"versions":[{"fields":[{"name":"major","type":{"op":"uint32"}},{"name":"minor","type":{"op":"uint32"}}]}]},{"type":"record","name":"Kate-version","id":14,"versions":[{"fields":[{"name":"major","type":{"op":"uint32"}},{"name":"minor","type":{"op":"uint32"}},{"name":"patch","type":{"op":"uint32"}}]}]},{"type":"record","name":"Binary-location","id":15,"versions":[{"fields":[{"name":"offset","type":{"op":"uint32"}},{"name":"size","type":{"op":"uint32"}}]}]},{"type":"record","name":"Date","id":16,"versions":[{"fields":[{"name":"year","type":{"op":"uint32"}},{"name":"month","type":{"op":"uint8"}},{"name":"day","type":{"op":"uint8"}}]}]},{"type":"union","name":"Genre","id":17,"versions":[{"variants":[{"name":"Not-specified","fields":[]},{"name":"Action","fields":[]},{"name":"Platformer","fields":[]},{"name":"Shooter","fields":[]},{"name":"Racing","fields":[]},{"name":"Fighting","fields":[]},{"name":"Rhythm","fields":[]},{"name":"Adventure","fields":[]},{"name":"Interactive-fiction","fields":[]},{"name":"Visual-novel","fields":[]},{"name":"Puzzle","fields":[]},{"name":"RPG","fields":[]},{"name":"Simulation","fields":[]},{"name":"Strategy","fields":[]},{"name":"Sports","fields":[]},{"name":"Tool","fields":[]},{"name":"Other","fields":[]}]}]},{"type":"union","name":"Content-rating","id":18,"versions":[{"variants":[{"name":"General","fields":[]},{"name":"Teen-and-up","fields":[]},{"name":"Mature","fields":[]},{"name":"Explicit","fields":[]},{"name":"Unknown","fields":[]}]}]},{"type":"union","name":"Release-type","id":19,"versions":[{"variants":[{"name":"Prototype","fields":[]},{"name":"Early-access","fields":[]},{"name":"Beta","fields":[]},{"name":"Demo","fields":[]},{"name":"Regular","fields":[]},{"name":"Unofficial","fields":[]}]}]},{"type":"union","name":"Derivative-policy","id":20,"versions":[{"variants":[{"name":"Not-allowed","fields":[]},{"name":"Personal-use","fields":[]},{"name":"Non-commercial-use","fields":[]},{"name":"Commercial-use","fields":[]}]}]},{"type":"union","name":"Input-method","id":21,"versions":[{"variants":[{"name":"Buttons","fields":[]},{"name":"Pointer","fields":[]}]}]},{"type":"record","name":"Language","id":22,"versions":[{"fields":[{"name":"iso-code","type":{"op":"text"}},{"name":"interface","type":{"op":"bool"}},{"name":"audio","type":{"op":"bool"}},{"name":"text","type":{"op":"bool"}}]}]},{"type":"union","name":"Accessibility-provision","id":23,"versions":[{"variants":[{"name":"High-contrast","fields":[]},{"name":"Subtitles","fields":[]},{"name":"Image-captions","fields":[]},{"name":"Voiced-text","fields":[]},{"name":"Configurable-difficulty","fields":[]},{"name":"Skippable-content","fields":[]}]}]},{"type":"union","name":"Bridge","id":24,"versions":[{"variants":[{"name":"Network-proxy","fields":[]},{"name":"Local-storage-proxy","fields":[]},{"name":"Input-proxy","fields":[{"name":"mapping","type":{"op":"map","keys":{"op":"union","id":25},"values":{"op":"record","id":26}}}]},{"name":"Preserve-WebGL-render","fields":[]},{"name":"Capture-canvas","fields":[{"name":"selector","type":{"op":"text"}}]},{"name":"Pointer-input-proxy","fields":[{"name":"selector","type":{"op":"text"}},{"name":"hide-cursor","type":{"op":"bool"}}]},{"name":"IndexedDB-proxy","fields":[{"name":"versioned","type":{"op":"bool"}}]},{"name":"Renpy-web-tweaks","fields":[{"name":"version","type":{"op":"record","id":13}}]},{"name":"External-URL-handler","fields":[]}]}]},{"type":"union","name":"Virtual-key","id":25,"versions":[{"variants":[{"name":"Up","fields":[]},{"name":"Right","fields":[]},{"name":"Down","fields":[]},{"name":"Left","fields":[]},{"name":"Menu","fields":[]},{"name":"Capture","fields":[]},{"name":"X","fields":[]},{"name":"O","fields":[]},{"name":"L-trigger","fields":[]},{"name":"R-trigger","fields":[]}]}]},{"type":"record","name":"Keyboard-key","id":26,"versions":[{"fields":[{"name":"code","type":{"op":"text"}}]}]},{"type":"union","name":"Capability","id":27,"versions":[{"variants":[{"name":"Contextual","fields":[{"name":"capability","type":{"op":"union","id":28}},{"name":"reason","type":{"op":"text"}}]}]}]},{"type":"union","name":"Contextual-capability","id":28,"versions":[{"variants":[{"name":"Open-URLs","fields":[]},{"name":"Request-device-files","fields":[]},{"name":"Install-cartridges","fields":[]},{"name":"Download-files","fields":[]},{"name":"Show-dialogs","fields":[]}]}]}]};
})

// packages\schema\build\generated\kart-v5.js
require.define(89, "packages\\schema\\build\\generated", "packages\\schema\\build\\generated\\kart-v5.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contextual_capability = exports.Capability = exports.Keyboard_key = exports.Virtual_key = exports.Bridge = exports.Accessibility_provision = exports.Language = exports.Input_method = exports.Derivative_policy = exports.Release_type = exports.Content_rating = exports.Genre = exports.Date = exports.Binary_location = exports.Kate_version = exports.Version = exports.Signature = exports.Signature_block = exports.File = exports.Runtime = exports.Meta_accessibility = exports.Meta_legal = exports.Meta_classification = exports.Meta_presentation = exports.Meta_identification = exports.Metadata = exports.Header = exports.Cartridge = exports.Security = void 0;
function Security(x) {
    return {
        '@name': 'Security',
        '@tag': 8,
        '@version': 0,
        ...x
    };
}
exports.Security = Security;
Security.tag = 8;
function Cartridge(x) {
    return {
        '@name': 'Cartridge',
        '@tag': 0,
        '@version': 0,
        ...x
    };
}
exports.Cartridge = Cartridge;
Cartridge.tag = 0;
function Header(x) {
    return {
        '@name': 'Header',
        '@tag': 1,
        '@version': 0,
        ...x
    };
}
exports.Header = Header;
Header.tag = 1;
function Metadata(x) {
    return {
        '@name': 'Metadata',
        '@tag': 2,
        '@version': 0,
        ...x
    };
}
exports.Metadata = Metadata;
Metadata.tag = 2;
function Meta_identification(x) {
    return {
        '@name': 'Meta-identification',
        '@tag': 3,
        '@version': 0,
        ...x
    };
}
exports.Meta_identification = Meta_identification;
Meta_identification.tag = 3;
function Meta_presentation(x) {
    return {
        '@name': 'Meta-presentation',
        '@tag': 4,
        '@version': 0,
        ...x
    };
}
exports.Meta_presentation = Meta_presentation;
Meta_presentation.tag = 4;
function Meta_classification(x) {
    return {
        '@name': 'Meta-classification',
        '@tag': 5,
        '@version': 0,
        ...x
    };
}
exports.Meta_classification = Meta_classification;
Meta_classification.tag = 5;
function Meta_legal(x) {
    return {
        '@name': 'Meta-legal',
        '@tag': 6,
        '@version': 0,
        ...x
    };
}
exports.Meta_legal = Meta_legal;
Meta_legal.tag = 6;
function Meta_accessibility(x) {
    return {
        '@name': 'Meta-accessibility',
        '@tag': 7,
        '@version': 0,
        ...x
    };
}
exports.Meta_accessibility = Meta_accessibility;
Meta_accessibility.tag = 7;
var Runtime;
(function (Runtime) {
    Runtime.tag = 9;
    function Web_archive(x) {
        return {
            '@name': 'Runtime',
            '@tag': 9,
            '@version': 0,
            '@variant': 0 /* $Tags.Web_archive */,
            '@variant-name': 'Web-archive',
            ...x
        };
    }
    Runtime.Web_archive = Web_archive;
})(Runtime || (exports.Runtime = Runtime = {}));
function File(x) {
    return {
        '@name': 'File',
        '@tag': 10,
        '@version': 0,
        ...x
    };
}
exports.File = File;
File.tag = 10;
function Signature_block(x) {
    return {
        '@name': 'Signature-block',
        '@tag': 11,
        '@version': 0,
        ...x
    };
}
exports.Signature_block = Signature_block;
Signature_block.tag = 11;
function Signature(x) {
    return {
        '@name': 'Signature',
        '@tag': 12,
        '@version': 0,
        ...x
    };
}
exports.Signature = Signature;
Signature.tag = 12;
function Version(x) {
    return {
        '@name': 'Version',
        '@tag': 13,
        '@version': 0,
        ...x
    };
}
exports.Version = Version;
Version.tag = 13;
function Kate_version(x) {
    return {
        '@name': 'Kate-version',
        '@tag': 14,
        '@version': 0,
        ...x
    };
}
exports.Kate_version = Kate_version;
Kate_version.tag = 14;
function Binary_location(x) {
    return {
        '@name': 'Binary-location',
        '@tag': 15,
        '@version': 0,
        ...x
    };
}
exports.Binary_location = Binary_location;
Binary_location.tag = 15;
function Date(x) {
    return {
        '@name': 'Date',
        '@tag': 16,
        '@version': 0,
        ...x
    };
}
exports.Date = Date;
Date.tag = 16;
var Genre;
(function (Genre) {
    Genre.tag = 17;
    function Not_specified(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 0 /* $Tags.Not_specified */,
            '@variant-name': 'Not-specified',
            ...x
        };
    }
    Genre.Not_specified = Not_specified;
    function Action(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 1 /* $Tags.Action */,
            '@variant-name': 'Action',
            ...x
        };
    }
    Genre.Action = Action;
    function Platformer(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 2 /* $Tags.Platformer */,
            '@variant-name': 'Platformer',
            ...x
        };
    }
    Genre.Platformer = Platformer;
    function Shooter(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 3 /* $Tags.Shooter */,
            '@variant-name': 'Shooter',
            ...x
        };
    }
    Genre.Shooter = Shooter;
    function Racing(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 4 /* $Tags.Racing */,
            '@variant-name': 'Racing',
            ...x
        };
    }
    Genre.Racing = Racing;
    function Fighting(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 5 /* $Tags.Fighting */,
            '@variant-name': 'Fighting',
            ...x
        };
    }
    Genre.Fighting = Fighting;
    function Rhythm(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 6 /* $Tags.Rhythm */,
            '@variant-name': 'Rhythm',
            ...x
        };
    }
    Genre.Rhythm = Rhythm;
    function Adventure(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 7 /* $Tags.Adventure */,
            '@variant-name': 'Adventure',
            ...x
        };
    }
    Genre.Adventure = Adventure;
    function Interactive_fiction(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 8 /* $Tags.Interactive_fiction */,
            '@variant-name': 'Interactive-fiction',
            ...x
        };
    }
    Genre.Interactive_fiction = Interactive_fiction;
    function Visual_novel(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 9 /* $Tags.Visual_novel */,
            '@variant-name': 'Visual-novel',
            ...x
        };
    }
    Genre.Visual_novel = Visual_novel;
    function Puzzle(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 10 /* $Tags.Puzzle */,
            '@variant-name': 'Puzzle',
            ...x
        };
    }
    Genre.Puzzle = Puzzle;
    function RPG(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 11 /* $Tags.RPG */,
            '@variant-name': 'RPG',
            ...x
        };
    }
    Genre.RPG = RPG;
    function Simulation(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 12 /* $Tags.Simulation */,
            '@variant-name': 'Simulation',
            ...x
        };
    }
    Genre.Simulation = Simulation;
    function Strategy(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 13 /* $Tags.Strategy */,
            '@variant-name': 'Strategy',
            ...x
        };
    }
    Genre.Strategy = Strategy;
    function Sports(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 14 /* $Tags.Sports */,
            '@variant-name': 'Sports',
            ...x
        };
    }
    Genre.Sports = Sports;
    function Tool(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 15 /* $Tags.Tool */,
            '@variant-name': 'Tool',
            ...x
        };
    }
    Genre.Tool = Tool;
    function Other(x) {
        return {
            '@name': 'Genre',
            '@tag': 17,
            '@version': 0,
            '@variant': 16 /* $Tags.Other */,
            '@variant-name': 'Other',
            ...x
        };
    }
    Genre.Other = Other;
})(Genre || (exports.Genre = Genre = {}));
var Content_rating;
(function (Content_rating) {
    Content_rating.tag = 18;
    function General(x) {
        return {
            '@name': 'Content-rating',
            '@tag': 18,
            '@version': 0,
            '@variant': 0 /* $Tags.General */,
            '@variant-name': 'General',
            ...x
        };
    }
    Content_rating.General = General;
    function Teen_and_up(x) {
        return {
            '@name': 'Content-rating',
            '@tag': 18,
            '@version': 0,
            '@variant': 1 /* $Tags.Teen_and_up */,
            '@variant-name': 'Teen-and-up',
            ...x
        };
    }
    Content_rating.Teen_and_up = Teen_and_up;
    function Mature(x) {
        return {
            '@name': 'Content-rating',
            '@tag': 18,
            '@version': 0,
            '@variant': 2 /* $Tags.Mature */,
            '@variant-name': 'Mature',
            ...x
        };
    }
    Content_rating.Mature = Mature;
    function Explicit(x) {
        return {
            '@name': 'Content-rating',
            '@tag': 18,
            '@version': 0,
            '@variant': 3 /* $Tags.Explicit */,
            '@variant-name': 'Explicit',
            ...x
        };
    }
    Content_rating.Explicit = Explicit;
    function Unknown(x) {
        return {
            '@name': 'Content-rating',
            '@tag': 18,
            '@version': 0,
            '@variant': 4 /* $Tags.Unknown */,
            '@variant-name': 'Unknown',
            ...x
        };
    }
    Content_rating.Unknown = Unknown;
})(Content_rating || (exports.Content_rating = Content_rating = {}));
var Release_type;
(function (Release_type) {
    Release_type.tag = 19;
    function Prototype(x) {
        return {
            '@name': 'Release-type',
            '@tag': 19,
            '@version': 0,
            '@variant': 0 /* $Tags.Prototype */,
            '@variant-name': 'Prototype',
            ...x
        };
    }
    Release_type.Prototype = Prototype;
    function Early_access(x) {
        return {
            '@name': 'Release-type',
            '@tag': 19,
            '@version': 0,
            '@variant': 1 /* $Tags.Early_access */,
            '@variant-name': 'Early-access',
            ...x
        };
    }
    Release_type.Early_access = Early_access;
    function Beta(x) {
        return {
            '@name': 'Release-type',
            '@tag': 19,
            '@version': 0,
            '@variant': 2 /* $Tags.Beta */,
            '@variant-name': 'Beta',
            ...x
        };
    }
    Release_type.Beta = Beta;
    function Demo(x) {
        return {
            '@name': 'Release-type',
            '@tag': 19,
            '@version': 0,
            '@variant': 3 /* $Tags.Demo */,
            '@variant-name': 'Demo',
            ...x
        };
    }
    Release_type.Demo = Demo;
    function Regular(x) {
        return {
            '@name': 'Release-type',
            '@tag': 19,
            '@version': 0,
            '@variant': 4 /* $Tags.Regular */,
            '@variant-name': 'Regular',
            ...x
        };
    }
    Release_type.Regular = Regular;
    function Unofficial(x) {
        return {
            '@name': 'Release-type',
            '@tag': 19,
            '@version': 0,
            '@variant': 5 /* $Tags.Unofficial */,
            '@variant-name': 'Unofficial',
            ...x
        };
    }
    Release_type.Unofficial = Unofficial;
})(Release_type || (exports.Release_type = Release_type = {}));
var Derivative_policy;
(function (Derivative_policy) {
    Derivative_policy.tag = 20;
    function Not_allowed(x) {
        return {
            '@name': 'Derivative-policy',
            '@tag': 20,
            '@version': 0,
            '@variant': 0 /* $Tags.Not_allowed */,
            '@variant-name': 'Not-allowed',
            ...x
        };
    }
    Derivative_policy.Not_allowed = Not_allowed;
    function Personal_use(x) {
        return {
            '@name': 'Derivative-policy',
            '@tag': 20,
            '@version': 0,
            '@variant': 1 /* $Tags.Personal_use */,
            '@variant-name': 'Personal-use',
            ...x
        };
    }
    Derivative_policy.Personal_use = Personal_use;
    function Non_commercial_use(x) {
        return {
            '@name': 'Derivative-policy',
            '@tag': 20,
            '@version': 0,
            '@variant': 2 /* $Tags.Non_commercial_use */,
            '@variant-name': 'Non-commercial-use',
            ...x
        };
    }
    Derivative_policy.Non_commercial_use = Non_commercial_use;
    function Commercial_use(x) {
        return {
            '@name': 'Derivative-policy',
            '@tag': 20,
            '@version': 0,
            '@variant': 3 /* $Tags.Commercial_use */,
            '@variant-name': 'Commercial-use',
            ...x
        };
    }
    Derivative_policy.Commercial_use = Commercial_use;
})(Derivative_policy || (exports.Derivative_policy = Derivative_policy = {}));
var Input_method;
(function (Input_method) {
    Input_method.tag = 21;
    function Buttons(x) {
        return {
            '@name': 'Input-method',
            '@tag': 21,
            '@version': 0,
            '@variant': 0 /* $Tags.Buttons */,
            '@variant-name': 'Buttons',
            ...x
        };
    }
    Input_method.Buttons = Buttons;
    function Pointer(x) {
        return {
            '@name': 'Input-method',
            '@tag': 21,
            '@version': 0,
            '@variant': 1 /* $Tags.Pointer */,
            '@variant-name': 'Pointer',
            ...x
        };
    }
    Input_method.Pointer = Pointer;
})(Input_method || (exports.Input_method = Input_method = {}));
function Language(x) {
    return {
        '@name': 'Language',
        '@tag': 22,
        '@version': 0,
        ...x
    };
}
exports.Language = Language;
Language.tag = 22;
var Accessibility_provision;
(function (Accessibility_provision) {
    Accessibility_provision.tag = 23;
    function High_contrast(x) {
        return {
            '@name': 'Accessibility-provision',
            '@tag': 23,
            '@version': 0,
            '@variant': 0 /* $Tags.High_contrast */,
            '@variant-name': 'High-contrast',
            ...x
        };
    }
    Accessibility_provision.High_contrast = High_contrast;
    function Subtitles(x) {
        return {
            '@name': 'Accessibility-provision',
            '@tag': 23,
            '@version': 0,
            '@variant': 1 /* $Tags.Subtitles */,
            '@variant-name': 'Subtitles',
            ...x
        };
    }
    Accessibility_provision.Subtitles = Subtitles;
    function Image_captions(x) {
        return {
            '@name': 'Accessibility-provision',
            '@tag': 23,
            '@version': 0,
            '@variant': 2 /* $Tags.Image_captions */,
            '@variant-name': 'Image-captions',
            ...x
        };
    }
    Accessibility_provision.Image_captions = Image_captions;
    function Voiced_text(x) {
        return {
            '@name': 'Accessibility-provision',
            '@tag': 23,
            '@version': 0,
            '@variant': 3 /* $Tags.Voiced_text */,
            '@variant-name': 'Voiced-text',
            ...x
        };
    }
    Accessibility_provision.Voiced_text = Voiced_text;
    function Configurable_difficulty(x) {
        return {
            '@name': 'Accessibility-provision',
            '@tag': 23,
            '@version': 0,
            '@variant': 4 /* $Tags.Configurable_difficulty */,
            '@variant-name': 'Configurable-difficulty',
            ...x
        };
    }
    Accessibility_provision.Configurable_difficulty = Configurable_difficulty;
    function Skippable_content(x) {
        return {
            '@name': 'Accessibility-provision',
            '@tag': 23,
            '@version': 0,
            '@variant': 5 /* $Tags.Skippable_content */,
            '@variant-name': 'Skippable-content',
            ...x
        };
    }
    Accessibility_provision.Skippable_content = Skippable_content;
})(Accessibility_provision || (exports.Accessibility_provision = Accessibility_provision = {}));
var Bridge;
(function (Bridge) {
    Bridge.tag = 24;
    function Network_proxy(x) {
        return {
            '@name': 'Bridge',
            '@tag': 24,
            '@version': 0,
            '@variant': 0 /* $Tags.Network_proxy */,
            '@variant-name': 'Network-proxy',
            ...x
        };
    }
    Bridge.Network_proxy = Network_proxy;
    function Local_storage_proxy(x) {
        return {
            '@name': 'Bridge',
            '@tag': 24,
            '@version': 0,
            '@variant': 1 /* $Tags.Local_storage_proxy */,
            '@variant-name': 'Local-storage-proxy',
            ...x
        };
    }
    Bridge.Local_storage_proxy = Local_storage_proxy;
    function Input_proxy(x) {
        return {
            '@name': 'Bridge',
            '@tag': 24,
            '@version': 0,
            '@variant': 2 /* $Tags.Input_proxy */,
            '@variant-name': 'Input-proxy',
            ...x
        };
    }
    Bridge.Input_proxy = Input_proxy;
    function Preserve_WebGL_render(x) {
        return {
            '@name': 'Bridge',
            '@tag': 24,
            '@version': 0,
            '@variant': 3 /* $Tags.Preserve_WebGL_render */,
            '@variant-name': 'Preserve-WebGL-render',
            ...x
        };
    }
    Bridge.Preserve_WebGL_render = Preserve_WebGL_render;
    function Capture_canvas(x) {
        return {
            '@name': 'Bridge',
            '@tag': 24,
            '@version': 0,
            '@variant': 4 /* $Tags.Capture_canvas */,
            '@variant-name': 'Capture-canvas',
            ...x
        };
    }
    Bridge.Capture_canvas = Capture_canvas;
    function Pointer_input_proxy(x) {
        return {
            '@name': 'Bridge',
            '@tag': 24,
            '@version': 0,
            '@variant': 5 /* $Tags.Pointer_input_proxy */,
            '@variant-name': 'Pointer-input-proxy',
            ...x
        };
    }
    Bridge.Pointer_input_proxy = Pointer_input_proxy;
    function IndexedDB_proxy(x) {
        return {
            '@name': 'Bridge',
            '@tag': 24,
            '@version': 0,
            '@variant': 6 /* $Tags.IndexedDB_proxy */,
            '@variant-name': 'IndexedDB-proxy',
            ...x
        };
    }
    Bridge.IndexedDB_proxy = IndexedDB_proxy;
    function Renpy_web_tweaks(x) {
        return {
            '@name': 'Bridge',
            '@tag': 24,
            '@version': 0,
            '@variant': 7 /* $Tags.Renpy_web_tweaks */,
            '@variant-name': 'Renpy-web-tweaks',
            ...x
        };
    }
    Bridge.Renpy_web_tweaks = Renpy_web_tweaks;
    function External_URL_handler(x) {
        return {
            '@name': 'Bridge',
            '@tag': 24,
            '@version': 0,
            '@variant': 8 /* $Tags.External_URL_handler */,
            '@variant-name': 'External-URL-handler',
            ...x
        };
    }
    Bridge.External_URL_handler = External_URL_handler;
})(Bridge || (exports.Bridge = Bridge = {}));
var Virtual_key;
(function (Virtual_key) {
    Virtual_key.tag = 25;
    function Up(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 25,
            '@version': 0,
            '@variant': 0 /* $Tags.Up */,
            '@variant-name': 'Up',
            ...x
        };
    }
    Virtual_key.Up = Up;
    function Right(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 25,
            '@version': 0,
            '@variant': 1 /* $Tags.Right */,
            '@variant-name': 'Right',
            ...x
        };
    }
    Virtual_key.Right = Right;
    function Down(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 25,
            '@version': 0,
            '@variant': 2 /* $Tags.Down */,
            '@variant-name': 'Down',
            ...x
        };
    }
    Virtual_key.Down = Down;
    function Left(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 25,
            '@version': 0,
            '@variant': 3 /* $Tags.Left */,
            '@variant-name': 'Left',
            ...x
        };
    }
    Virtual_key.Left = Left;
    function Menu(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 25,
            '@version': 0,
            '@variant': 4 /* $Tags.Menu */,
            '@variant-name': 'Menu',
            ...x
        };
    }
    Virtual_key.Menu = Menu;
    function Capture(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 25,
            '@version': 0,
            '@variant': 5 /* $Tags.Capture */,
            '@variant-name': 'Capture',
            ...x
        };
    }
    Virtual_key.Capture = Capture;
    function X(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 25,
            '@version': 0,
            '@variant': 6 /* $Tags.X */,
            '@variant-name': 'X',
            ...x
        };
    }
    Virtual_key.X = X;
    function O(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 25,
            '@version': 0,
            '@variant': 7 /* $Tags.O */,
            '@variant-name': 'O',
            ...x
        };
    }
    Virtual_key.O = O;
    function L_trigger(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 25,
            '@version': 0,
            '@variant': 8 /* $Tags.L_trigger */,
            '@variant-name': 'L-trigger',
            ...x
        };
    }
    Virtual_key.L_trigger = L_trigger;
    function R_trigger(x) {
        return {
            '@name': 'Virtual-key',
            '@tag': 25,
            '@version': 0,
            '@variant': 9 /* $Tags.R_trigger */,
            '@variant-name': 'R-trigger',
            ...x
        };
    }
    Virtual_key.R_trigger = R_trigger;
})(Virtual_key || (exports.Virtual_key = Virtual_key = {}));
function Keyboard_key(x) {
    return {
        '@name': 'Keyboard-key',
        '@tag': 26,
        '@version': 0,
        ...x
    };
}
exports.Keyboard_key = Keyboard_key;
Keyboard_key.tag = 26;
var Capability;
(function (Capability) {
    Capability.tag = 27;
    function Contextual(x) {
        return {
            '@name': 'Capability',
            '@tag': 27,
            '@version': 0,
            '@variant': 0 /* $Tags.Contextual */,
            '@variant-name': 'Contextual',
            ...x
        };
    }
    Capability.Contextual = Contextual;
})(Capability || (exports.Capability = Capability = {}));
var Contextual_capability;
(function (Contextual_capability) {
    Contextual_capability.tag = 28;
    function Open_URLs(x) {
        return {
            '@name': 'Contextual-capability',
            '@tag': 28,
            '@version': 0,
            '@variant': 0 /* $Tags.Open_URLs */,
            '@variant-name': 'Open-URLs',
            ...x
        };
    }
    Contextual_capability.Open_URLs = Open_URLs;
    function Request_device_files(x) {
        return {
            '@name': 'Contextual-capability',
            '@tag': 28,
            '@version': 0,
            '@variant': 1 /* $Tags.Request_device_files */,
            '@variant-name': 'Request-device-files',
            ...x
        };
    }
    Contextual_capability.Request_device_files = Request_device_files;
    function Install_cartridges(x) {
        return {
            '@name': 'Contextual-capability',
            '@tag': 28,
            '@version': 0,
            '@variant': 2 /* $Tags.Install_cartridges */,
            '@variant-name': 'Install-cartridges',
            ...x
        };
    }
    Contextual_capability.Install_cartridges = Install_cartridges;
    function Download_files(x) {
        return {
            '@name': 'Contextual-capability',
            '@tag': 28,
            '@version': 0,
            '@variant': 3 /* $Tags.Download_files */,
            '@variant-name': 'Download-files',
            ...x
        };
    }
    Contextual_capability.Download_files = Download_files;
    function Show_dialogs(x) {
        return {
            '@name': 'Contextual-capability',
            '@tag': 28,
            '@version': 0,
            '@variant': 4 /* $Tags.Show_dialogs */,
            '@variant-name': 'Show-dialogs',
            ...x
        };
    }
    Contextual_capability.Show_dialogs = Show_dialogs;
})(Contextual_capability || (exports.Contextual_capability = Contextual_capability = {}));

});

// packages\schema\build\util.js
require.define(90, "packages\\schema\\build", "packages\\schema\\build\\util.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(74), exports);

});

// packages\kate-core\build\cart\v5\metadata.js
require.define(91, "packages\\kate-core\\build\\cart\\v5", "packages\\kate-core\\build\\cart\\v5\\metadata.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_metadata = void 0;
const v5_1 = require(86);
const utils_1 = require(5);
const parser_utils_1 = require(80);
function parse_metadata(meta) {
    return {
        presentation: parse_presentation(meta.presentation),
        classification: parse_classification(meta.classification),
        legal: parse_legal(meta.legal),
        accessibility: parse_accessibility(meta.accessibility),
    };
}
exports.parse_metadata = parse_metadata;
function parse_presentation(block) {
    return {
        title: (0, parser_utils_1.str)(block.title, 255),
        author: (0, parser_utils_1.str)(block.author, 255),
        tagline: (0, parser_utils_1.str)(block.tagline, 255),
        description: (0, parser_utils_1.str)(block.description, 10_000),
        release_type: release_kind(block["release-type"]),
        thumbnail_path: block["thumbnail-path"]
            ? (0, parser_utils_1.str)(block["thumbnail-path"], 1_024)
            : null,
        banner_path: block["banner-path"] ? (0, parser_utils_1.str)(block["banner-path"], 1_024) : null,
    };
}
function parse_classification(block) {
    return {
        genre: new Set(block.genre.map((x) => genre(x))),
        tags: new Set((0, parser_utils_1.list)(block.tags.map((x) => tag(x)), 10)),
        rating: content_rating(block.rating),
        content_warning: block.warnings ? (0, parser_utils_1.str)(block.warnings, 1_000) : null,
    };
}
function parse_legal(block) {
    return {
        derivative_policy: derivative_policy(block["derivative-policy"]),
        licence_path: block["licence-path"]
            ? (0, parser_utils_1.str)(block["licence-path"], 1_024)
            : null,
        privacy_policy_path: block["privacy-policy-path"]
            ? (0, parser_utils_1.str)(block["privacy-policy-path"], 1_024)
            : null,
    };
}
function parse_accessibility(block) {
    return {
        input_methods: new Set(block["input-methods"].map(input_method)),
        languages: (0, parser_utils_1.list)(block.languages.map(language), 255),
        provisions: new Set(block.provisions.map(accessibility_provision)),
        average_completion_seconds: block["average-completion-seconds"],
        average_session_seconds: block["average-session-seconds"],
    };
}
function release_kind(x) {
    switch (x["@variant"]) {
        case 2 /* Cart_v5.Release_type.$Tags.Beta */:
            return "beta";
        case 3 /* Cart_v5.Release_type.$Tags.Demo */:
            return "demo";
        case 1 /* Cart_v5.Release_type.$Tags.Early_access */:
            return "early-access";
        case 4 /* Cart_v5.Release_type.$Tags.Regular */:
            return "regular";
        case 0 /* Cart_v5.Release_type.$Tags.Prototype */:
            return "prototype";
        case 5 /* Cart_v5.Release_type.$Tags.Unofficial */:
            return "unofficial";
        default:
            throw (0, utils_1.unreachable)(x);
    }
}
function genre(x) {
    switch (x["@variant"]) {
        case 1 /* Cart_v5.Genre.$Tags.Action */:
            return "action";
        case 5 /* Cart_v5.Genre.$Tags.Fighting */:
            return "fighting";
        case 7 /* Cart_v5.Genre.$Tags.Adventure */:
            return "adventure";
        case 9 /* Cart_v5.Genre.$Tags.Visual_novel */:
            return "visual-novel";
        case 8 /* Cart_v5.Genre.$Tags.Interactive_fiction */:
            return "interactive-fiction";
        case 2 /* Cart_v5.Genre.$Tags.Platformer */:
            return "platformer";
        case 10 /* Cart_v5.Genre.$Tags.Puzzle */:
            return "puzzle";
        case 4 /* Cart_v5.Genre.$Tags.Racing */:
            return "racing";
        case 6 /* Cart_v5.Genre.$Tags.Rhythm */:
            return "rhythm";
        case 11 /* Cart_v5.Genre.$Tags.RPG */:
            return "rpg";
        case 12 /* Cart_v5.Genre.$Tags.Simulation */:
            return "simulation";
        case 3 /* Cart_v5.Genre.$Tags.Shooter */:
            return "shooter";
        case 14 /* Cart_v5.Genre.$Tags.Sports */:
            return "sports";
        case 13 /* Cart_v5.Genre.$Tags.Strategy */:
            return "strategy";
        case 15 /* Cart_v5.Genre.$Tags.Tool */:
            return "tool";
        case 16 /* Cart_v5.Genre.$Tags.Other */:
            return "other";
        case 0 /* Cart_v5.Genre.$Tags.Not_specified */:
            return "not-specified";
        default:
            throw (0, utils_1.unreachable)(x, "genre");
    }
}
function content_rating(x) {
    switch (x["@variant"]) {
        case 0 /* Cart_v5.Content_rating.$Tags.General */:
            return "general";
        case 1 /* Cart_v5.Content_rating.$Tags.Teen_and_up */:
            return "teen-and-up";
        case 2 /* Cart_v5.Content_rating.$Tags.Mature */:
            return "mature";
        case 3 /* Cart_v5.Content_rating.$Tags.Explicit */:
            return "explicit";
        case 4 /* Cart_v5.Content_rating.$Tags.Unknown */:
            return "unknown";
        default:
            throw (0, utils_1.unreachable)(x, "content rating");
    }
}
function derivative_policy(x) {
    switch (x["@variant"]) {
        case 0 /* Cart_v5.Derivative_policy.$Tags.Not_allowed */:
            return "not-allowed";
        case 1 /* Cart_v5.Derivative_policy.$Tags.Personal_use */:
            return "personal-use";
        case 2 /* Cart_v5.Derivative_policy.$Tags.Non_commercial_use */:
            return "non-commercial-use";
        case 3 /* Cart_v5.Derivative_policy.$Tags.Commercial_use */:
            return "commercial-use";
        default:
            throw (0, utils_1.unreachable)(x, "derivative policy");
    }
}
function accessibility_provision(x) {
    switch (x["@variant"]) {
        case 4 /* Cart_v5.Accessibility_provision.$Tags.Configurable_difficulty */:
            return "configurable-difficulty";
        case 0 /* Cart_v5.Accessibility_provision.$Tags.High_contrast */:
            return "high-contrast";
        case 2 /* Cart_v5.Accessibility_provision.$Tags.Image_captions */:
            return "image-captions";
        case 5 /* Cart_v5.Accessibility_provision.$Tags.Skippable_content */:
            return "skippable-content";
        case 1 /* Cart_v5.Accessibility_provision.$Tags.Subtitles */:
            return "subtitles";
        case 3 /* Cart_v5.Accessibility_provision.$Tags.Voiced_text */:
            return "voiced-text";
        default:
            throw (0, utils_1.unreachable)(x);
    }
}
function input_method(x) {
    switch (x["@variant"]) {
        case 0 /* Cart_v5.Input_method.$Tags.Buttons */:
            return "buttons";
        case 1 /* Cart_v5.Input_method.$Tags.Pointer */:
            return "pointer";
        default:
            throw (0, utils_1.unreachable)(x);
    }
}
const valid_language = (0, parser_utils_1.regex)("language iso-code", /^[a-z]{2}(?:[\-_][a-zA-Z_]{2,})?$/);
function language(x) {
    return {
        iso_code: valid_language((0, parser_utils_1.str)(x["iso-code"], 255)),
        audio: x.audio,
        interface: x.interface,
        text: x.text,
    };
}
const tag = (0, parser_utils_1.regex)("tag", /^[a-z\-]+$/);
function assign(result, key, value) {
    if (key in result) {
        throw new Error(`Duplicated metadata block: ${key}`);
    }
    result[key] = value;
    return result;
}

});

// packages\kate-core\build\cart\v5\runtime.js
require.define(92, "packages\\kate-core\\build\\cart\\v5", "packages\\kate-core\\build\\cart\\v5\\runtime.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_runtime = void 0;
const v5_1 = require(86);
const utils_1 = require(5);
const keymap = require(83);
function parse_runtime(metadata) {
    const platform = metadata.runtime;
    switch (platform["@variant"]) {
        case 0 /* Cart_v5.Runtime.$Tags.Web_archive */: {
            return {
                type: "web-archive",
                bridges: platform.bridges.map(bridge),
                html_path: str(platform["html-path"], 1_024),
            };
        }
    }
}
exports.parse_runtime = parse_runtime;
function bridge(x) {
    switch (x["@variant"]) {
        case 2 /* Cart_v5.Bridge.$Tags.Input_proxy */: {
            return {
                type: "input-proxy",
                mapping: map_map(x.mapping, (a, b) => [
                    virtual_key(a),
                    keyboard_key(b),
                ]),
            };
        }
        case 1 /* Cart_v5.Bridge.$Tags.Local_storage_proxy */: {
            return { type: "local-storage-proxy" };
        }
        case 0 /* Cart_v5.Bridge.$Tags.Network_proxy */: {
            return { type: "network-proxy" };
        }
        case 3 /* Cart_v5.Bridge.$Tags.Preserve_WebGL_render */: {
            return { type: "preserve-render" };
        }
        case 4 /* Cart_v5.Bridge.$Tags.Capture_canvas */: {
            return { type: "capture-canvas", selector: str(x.selector, 255) };
        }
        case 5 /* Cart_v5.Bridge.$Tags.Pointer_input_proxy */: {
            return {
                type: "pointer-input-proxy",
                selector: str(x.selector, 255),
                hide_cursor: x["hide-cursor"],
            };
        }
        case 6 /* Cart_v5.Bridge.$Tags.IndexedDB_proxy */: {
            return { type: "indexeddb-proxy", versioned: x.versioned };
        }
        case 7 /* Cart_v5.Bridge.$Tags.Renpy_web_tweaks */: {
            return { type: "renpy-web-tweaks", version: x.version };
        }
        case 8 /* Cart_v5.Bridge.$Tags.External_URL_handler */: {
            return { type: "external-url-handler" };
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
    switch (key["@variant"]) {
        case 5 /* Cart_v5.Virtual_key.$Tags.Capture */:
            return "capture";
        case 4 /* Cart_v5.Virtual_key.$Tags.Menu */:
            return "menu";
        case 0 /* Cart_v5.Virtual_key.$Tags.Up */:
            return "up";
        case 1 /* Cart_v5.Virtual_key.$Tags.Right */:
            return "right";
        case 2 /* Cart_v5.Virtual_key.$Tags.Down */:
            return "down";
        case 3 /* Cart_v5.Virtual_key.$Tags.Left */:
            return "left";
        case 7 /* Cart_v5.Virtual_key.$Tags.O */:
            return "o";
        case 6 /* Cart_v5.Virtual_key.$Tags.X */:
            return "x";
        case 8 /* Cart_v5.Virtual_key.$Tags.L_trigger */:
            return "ltrigger";
        case 9 /* Cart_v5.Virtual_key.$Tags.R_trigger */:
            return "rtrigger";
        default:
            throw (0, utils_1.unreachable)(key);
    }
}
function keyboard_key(key) {
    const mapping = keymap[key.code];
    if (mapping == null) {
        throw new Error(`Invalid keycode ${key}`);
    }
    return mapping;
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

// packages\kate-core\build\cart\v5\files.js
require.define(93, "packages\\kate-core\\build\\cart\\v5", "packages\\kate-core\\build\\cart\\v5\\files.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_file = exports.parse_files = void 0;
const parser_utils_1 = require(80);
function parse_files(files) {
    return files.map(parse_file);
}
exports.parse_files = parse_files;
function parse_file(file) {
    return {
        path: (0, parser_utils_1.str)(file.path, 1_024),
        mime: (0, parser_utils_1.str)(file.mime, 255),
        integrity_hash: file.integrity,
        integrity_hash_algorithm: "SHA-256",
        data: file.data,
    };
}
exports.parse_file = parse_file;

});

// packages\kate-core\build\cart\v5\security.js
require.define(94, "packages\\kate-core\\build\\cart\\v5", "packages\\kate-core\\build\\cart\\v5\\security.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_security = void 0;
const utils_1 = require(5);
const v5_1 = require(86);
function parse_security(metadata) {
    return {
        contextual_capabilities: metadata.security.capabilities.map(parse_capability),
    };
}
exports.parse_security = parse_security;
function parse_capability(capability) {
    return {
        reason: capability.reason,
        capability: parse_contextual_capability(capability.capability),
    };
}
function parse_contextual_capability(capability) {
    switch (capability["@variant"]) {
        case 0 /* Cart_v5.Contextual_capability.$Tags.Open_URLs */: {
            return {
                type: "open-urls",
            };
        }
        case 1 /* Cart_v5.Contextual_capability.$Tags.Request_device_files */: {
            return {
                type: "request-device-files",
            };
        }
        case 2 /* Cart_v5.Contextual_capability.$Tags.Install_cartridges */: {
            return {
                type: "install-cartridges",
            };
        }
        case 3 /* Cart_v5.Contextual_capability.$Tags.Download_files */: {
            return {
                type: "download-files",
            };
        }
        case 4 /* Cart_v5.Contextual_capability.$Tags.Show_dialogs */: {
            return {
                type: "show-dialogs",
            };
        }
        default:
            throw (0, utils_1.unreachable)(capability, "capability");
    }
}

});

// packages\kate-core\build\os\apis\processes.js
require.define(95, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\processes.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateProcess = exports.KateProcesses = void 0;
const Cart = require(64);
const game_1 = require(96);
const load_screen_1 = require(97);
const utils_1 = require(5);
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
        const storage = await this.os.object_store
            .cartridge(cart, false)
            .get_local_storage();
        const runtime = this.os.kernel.runtimes.from_cartridge(cart, {
            console: this.os.kernel.console,
            cart: cart,
            local_storage: storage,
            async read_file(path) {
                const file = file_map.get(path);
                if (file == null) {
                    throw new Error(`File not found in ${cart.id}: ${path}`);
                }
                return file;
            },
            on_playtime_update: () => { },
            is_foreground: (cart) => this.is_foreground(cart.id),
        });
        return await this.display_process(cart, runtime);
    }
    async display_process(cart, runtime) {
        const scene = new game_1.SceneGame(this.os, () => process);
        const process = new KateProcess(this, cart, await runtime.run(this.os), scene);
        this._running = process;
        this.os.push_scene(scene);
        return process;
    }
    is_running(cart_id) {
        return this.running?.cart.id === cart_id;
    }
    is_foreground(cart_id) {
        if (this.running == null || this.running.cart.id != cart_id) {
            return false;
        }
        else if (this.os.current_scene == null) {
            return false;
        }
        else if (this.os.current_scene instanceof game_1.SceneGame) {
            return this.os.current_scene.process().cart.id === cart_id;
        }
        else {
            return false;
        }
    }
    async terminate(id, requester, reason) {
        if (this._running != null && this._running.cart.id === id) {
            await this.os.audit_supervisor.log(requester, {
                resources: ["kate:cartridge", "error"],
                risk: "high",
                type: "kate.process.terminated",
                message: `Terminated process ${id} for ${reason}`,
                extra: { cartridge: id, reason: reason },
            });
            await this.os.notifications.push_transient(requester, "Process terminated", `${id} was terminated for ${reason}.`);
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
            const storage = await this.os.object_store
                .cartridge(cart, false)
                .get_local_storage();
            const runtime = this.os.kernel.runtimes.from_cartridge(cart, {
                console: this.os.kernel.console,
                cart: cart,
                local_storage: storage,
                read_file: async (path) => {
                    const file_id = file_map.get(path);
                    if (file_id == null) {
                        throw new Error(`File not found in ${cart.id}: ${path}`);
                    }
                    const file = await this.os.cart_manager.read_file_by_id(id, file_id);
                    return { mime: file.mime, data: file.data, path: path };
                },
                on_playtime_update: async (time) => {
                    await this.os.play_habits.increase_play_time(id, time);
                },
                is_foreground: (cart) => this.is_foreground(cart.id),
            });
            await this.os.play_habits.update_last_played(id, new Date());
            return this.display_process(cart, runtime);
        }
        catch (error) {
            this._running = null;
            console.error(`Failed to run cartridge ${id}:`, error);
            await this.os.audit_supervisor.log("kate:process", {
                resources: ["kate:cartridge", "error"],
                risk: "high",
                type: "kate.process.execution-failed",
                message: `Failed to run ${id}`,
                extra: { error: (0, utils_1.serialise_error)(error) },
            });
            await this.os.notifications.push_transient("kate:process", `Failed to run`, `Cartridge may be corrupted or not compatible with this version.`);
        }
        finally {
            this.os.hide_hud(loading);
        }
    }
    notify_exit(process) {
        if (process === this._running) {
            this._running = null;
            process.scene.close();
        }
    }
}
exports.KateProcesses = KateProcesses;
class KateProcess {
    manager;
    cart;
    runtime;
    scene;
    _paused = false;
    constructor(manager, cart, runtime, scene) {
        this.manager = manager;
        this.cart = cart;
        this.runtime = runtime;
        this.scene = scene;
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
require.define(96, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\game.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneGame = void 0;
const widget_1 = require(54);
const scenes_1 = require(55);
class SceneGame extends scenes_1.Scene {
    process;
    constructor(os, process) {
        super(os, false);
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
                this.process().unpause();
            });
        }
        else {
            this.process().pause();
        }
    };
    focus_frame = (ev) => {
        ev.preventDefault();
        const node = this.process().runtime.node;
        if (node instanceof HTMLIFrameElement) {
            node.focus();
        }
    };
    render() {
        return (0, widget_1.h)("div", { class: "kate-os-game" }, [this.process().runtime.node]);
    }
}
exports.SceneGame = SceneGame;

});

// packages\kate-core\build\os\apps\load-screen.js
require.define(97, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\load-screen.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_LoadIndicator = void 0;
const widget_1 = require(54);
const scenes_1 = require(55);
class HUD_LoadIndicator extends scenes_1.Scene {
    constructor(os) {
        super(os, true);
    }
    render() {
        return (0, widget_1.h)("div", { class: "kate-hud-load-screen" }, ["Loading..."]);
    }
}
exports.HUD_LoadIndicator = HUD_LoadIndicator;

});

// packages\kate-core\build\os\apis\context_menu.js
require.define(98, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\context_menu.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_ContextMenu = exports.KateContextMenu = void 0;
const scenes_1 = require(55);
const about_kate_1 = require(99);
const media_1 = require(60);
const text_file_1 = require(57);
const UI = require(59);
const utils_1 = require(5);
const apps_1 = require(103);
const storage_1 = require(58);
const permissions_1 = require(62);
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
        super(os, true);
        this.os = os;
        this.context = context;
    }
    render() {
        const fullscreen_button = () => UI.when(emulator.options.mode !== "native", [
            UI.fa_icon_button("expand", "Fullscreen").on_clicked(this.on_toggle_fullscreen),
        ]);
        const emulator = this.os.kernel.console;
        const cart = this.os.processes.running?.cart;
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
                            UI.when(cart?.metadata.legal.licence_path != null, [
                                UI.fa_icon_button("circle-info", "Legal notices").on_clicked(() => this.on_legal_notices("Legal notices", cart?.metadata.legal.licence_path ?? null)),
                            ]),
                            UI.when(cart?.metadata.legal.privacy_policy_path != null, [
                                UI.fa_icon_button("circle-info", "Privacy policy").on_clicked(() => this.on_legal_notices("Privacy policy", cart?.metadata.legal.privacy_policy_path ?? null)),
                            ]),
                            UI.fa_icon_button("images", "Media gallery").on_clicked(this.on_media_gallery),
                            UI.fa_icon_button("hard-drive", "Storage").on_clicked(this.on_manage_data),
                            UI.fa_icon_button("key", "Permissions").on_clicked(this.on_permissions),
                            UI.menu_separator(),
                            UI.fa_icon_button("cat", "About Kate").on_clicked(this.on_about_kate),
                            UI.fa_icon_button("gear", "Settings").on_clicked(this.on_settings),
                        ]),
                        else: new UI.Menu_list([
                            UI.when(emulator.options.mode === "native", [
                                UI.fa_icon_button("power-off", "Power off").on_clicked(this.on_power_off),
                            ]),
                            fullscreen_button(),
                            UI.fa_icon_button("download", "Install cartridge").on_clicked(this.on_install_from_file),
                            UI.fa_icon_button("images", "Media gallery").on_clicked(() => {
                                this.on_media_gallery();
                            }),
                            UI.fa_icon_button("cat", "About Kate").on_clicked(() => {
                                this.on_about_kate();
                            }),
                            UI.fa_icon_button("gear", "Settings").on_clicked(() => {
                                this.on_settings();
                            }),
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
        this.canvas.setAttribute("data-title", "Context Menu");
        this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
        const backdrop = this.canvas.querySelector(".kate-os-hud-context-menu-backdrop");
        backdrop.addEventListener("click", (ev) => {
            ev.preventDefault();
            this.on_return();
        });
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
        if (process != null) {
            const media = new media_1.SceneMedia(this.os, {
                id: process.cart.id,
                title: process.cart.metadata.presentation.title,
            });
            this.os.push_scene(media);
        }
        else {
            const media = new media_1.SceneMedia(this.os, null);
            this.os.push_scene(media);
        }
    };
    on_manage_data = async () => {
        const process = this.os.processes.running;
        if (process == null) {
            throw new Error(`on_manage_data() called without a running process`);
        }
        const app = await this.os.storage_manager.try_estimate_live_cartridge(process.cart);
        this.os.push_scene(new storage_1.SceneCartridgeStorageSettings(this.os, app));
    };
    on_permissions = async () => {
        const process = this.os.processes.running;
        if (process == null) {
            throw new Error(`on_permissions() called without a running process`);
        }
        this.os.push_scene(new permissions_1.SceneCartridgePermissions(this.os, process.cart));
    };
    on_legal_notices = async (title, path) => {
        const process = this.os.processes.running;
        if (path == null) {
            console.error(`Cartridge has no legal notices`);
            return;
        }
        const licence_file = await process.runtime.read_file(path);
        const decoder = new TextDecoder();
        const licence = decoder.decode(licence_file.data);
        const legal = new text_file_1.SceneTextFile(this.os, title, process.cart.metadata.presentation.title, licence);
        this.os.push_scene(legal);
    };
    on_about_kate = () => {
        this.os.push_scene(new about_kate_1.SceneAboutKate(this.os));
    };
    on_settings = () => {
        this.os.push_scene(new apps_1.SceneSettings(this.os));
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
        super.close();
        this.on_close.emit();
    }
    on_install_from_file = async () => {
        this.close();
        await new Promise((resolve, reject) => {
            const installer = document.querySelector("#kate-installer");
            const teardown = () => {
                installer.onchange = () => { };
                installer.onerror = () => { };
                installer.onabort = () => { };
            };
            installer.onchange = async (ev) => {
                const status = this.os.status_bar.show("");
                try {
                    const file = installer.files.item(0);
                    status.update(`Installing ${file.name}...`);
                    await this.os.cart_manager.install_from_file(file);
                    teardown();
                    resolve();
                }
                catch (error) {
                    teardown();
                    reject(error);
                }
                finally {
                    status.hide();
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

// packages\kate-core\build\os\apps\about-kate.js
require.define(99, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\about-kate.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneAboutKate = exports.bool_text = void 0;
const widget_1 = require(54);
const UI = require(54);
const Legal = require(100);
const text_file_1 = require(57);
const scenes_1 = require(55);
const utils_1 = require(5);
const release_notes = require(102);
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
class SceneAboutKate extends scenes_1.SimpleScene {
    icon = "cat";
    title = ["About Kate"];
    body_container(body) {
        return (0, widget_1.h)("div", { class: "kate-os-scroll kate-os-content kate-about-bg" }, [
            ...body,
        ]);
    }
    body() {
        const sysinfo = (0, widget_1.h)("div", { class: "kate-os-system-information" }, []);
        this.render_sysinfo(sysinfo);
        const update_button = (0, widget_1.h)("div", { class: "kate-os-update-button" }, [
            (0, widget_1.h)("h2", {}, ["Updates"]),
            "Checking for updates...",
        ]);
        this.check_for_updates(update_button);
        return [
            (0, widget_1.h)("div", { class: "kate-os-about-box" }, [
                (0, widget_1.h)("div", { class: "kate-os-about-content" }, [
                    (0, widget_1.h)("h2", {}, ["Kate", UI.hspace(10), this.os.kernel.console.version]),
                    (0, widget_1.h)("div", { class: "kt-meta" }, ["Copyright (c) 2023 Q."]),
                    UI.vspace(32),
                    UI.vbox(0.5, [
                        UI.text_button(this.os, "Licensing information", {
                            status_label: "Open",
                            on_click: this.handle_licence,
                        }),
                        UI.text_button(this.os, "Release notes", {
                            status_label: "Open",
                            on_click: this.handle_release_notes,
                        }),
                    ]),
                    UI.vspace(24),
                    update_button,
                    UI.vspace(32),
                    sysinfo,
                ]),
            ]),
        ];
    }
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
                        os: `${info.os.name} ${info.os.version}\n(${info.os.extended_version === info.os.version
                            ? ""
                            : info.os.extended_version})`,
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
            (0, widget_1.h)("h3", {}, ["System"]),
            UI.info_line("Kate version", [x.kate.version]),
            UI.info_line("Kate mode", [x.kate.mode]),
            (0, widget_1.h)("h3", {}, ["Host"]),
            UI.info_line("Browser", [
                new UI.VBox(0.5, [
                    ...x.host.browser.map((x) => UI.h("div", {}, [x])),
                ]),
            ]),
            UI.info_line("OS", [x.host.os]),
            UI.info_line("Architecture", [x.host.architecture]),
            UI.info_line("x64/ARM64 translation?", [
                bool_text(x.host.arm64_translation),
            ]),
            UI.info_line("Device", [x.host.device]),
            (0, widget_1.h)("h3", {}, ["Hardware"]),
            UI.info_line("CPU model", [x.hardware.cpu_model]),
            UI.info_line("CPU logical cores", [
                String(x.hardware.cpu_logical_cores),
            ]),
            UI.info_line("CPU frequency", [x.hardware.cpu_frequency]),
            UI.info_line("Memory", [x.hardware.memory]),
        ]));
    }
    handle_licence = () => {
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
        const channel_button = UI.when(this.os.kernel.console.options.mode === "web", [
            UI.link_card(this.os, {
                arrow: "pencil",
                title: "Release channel",
                description: UI.vbox(0.3, [
                    "Frequency and stability of Kate's updates",
                    UI.meta_text(["(the emulator will reload when changing this)"]),
                ]),
                value: channel,
                click_label: "Change",
                on_click: () => this.handle_change_channel(container, versions),
            }),
        ]);
        if (available.length > 0) {
            const current_index = available.findIndex((x) => x.version === current.version) ?? 0;
            if (current_index < available.length - 1) {
                const latest = available.at(-1);
                container.textContent = "";
                container.append((0, widget_1.h)("div", {}, [
                    UI.vbox(0.5, [
                        channel_button,
                        UI.hbox(0.5, [
                            `Version ${latest.version} is available!`,
                            UI.link(this.os, "(Release Notes)", {
                                status_label: "Open",
                                on_click: () => this.handle_release_notes_for_version(latest),
                            }),
                        ]),
                        UI.text_button(this.os, `Update to ${latest.version}`, {
                            status_label: "Update",
                            on_click: () => this.handle_update_to_version(latest),
                        }),
                    ]),
                ]));
                return;
            }
        }
        container.textContent = "";
        container.append((0, widget_1.h)("div", {}, [UI.vbox(0.5, [channel_button, "You're up to date!"])]));
    }
    async handle_change_channel(container, versions) {
        const channel = await this.os.dialog.pop_menu("kate:about", "Kate release channel", [
            { label: "Preview (updates monthly)", value: "preview" },
            { label: "Nightly (untested releases)", value: "nightly" },
        ], null);
        if (channel != null) {
            const current_channel = localStorage["kate-channel"];
            if (current_channel === channel) {
                return;
            }
            const channel_pointer = versions.channels[current_channel];
            const current_version = JSON.parse(localStorage["kate-version"]);
            const available_versions = versions.versions.filter((x) => x.channels.includes(channel));
            const version = available_versions.find((x) => x.version === current_version.version) ??
                available_versions.find((x) => x.version === channel_pointer) ??
                available_versions.at(-1);
            if (available_versions.length === 0 || version == null) {
                await this.os.dialog.message("kate:about", {
                    title: "Failed to update channel",
                    message: `No releases available for channel ${channel}`,
                });
                return;
            }
            const old_version_index = versions.versions.findIndex((x) => x.version === current_version.version);
            const new_version_index = versions.versions.findIndex((x) => x.version === version.version);
            if (old_version_index === -1 ||
                new_version_index === -1 ||
                new_version_index < old_version_index) {
                const ok = await this.os.dialog.confirm("kate:about", {
                    title: `Downgrade to ${version.version}?`,
                    message: `Kate does not support graceful downgrades. Proceeding will erase all Kate data
                    and then switch to the new version.`,
                    cancel: "Cancel",
                    ok: "Erase all data and downgrade",
                    dangerous: true,
                });
                if (!ok) {
                    return;
                }
                else {
                    await this.os.app_resources.refresh_cache();
                    await this.os.db.delete_database();
                    await this.os.audit_supervisor.log("kate:about", {
                        risk: "low",
                        resources: ["kate:version"],
                        type: "kate.update.channel",
                        message: `Kate updated to ${version.version} (on ${channel})`,
                        extra: { channel, version: version.version },
                    });
                }
            }
            localStorage["kate-channel"] = channel;
            localStorage["kate-version"] = JSON.stringify(version);
            location.reload();
        }
    }
    async handle_release_notes_for_version(version) {
        const text = await fetch(version.release_notes).then((x) => x.text());
        this.os.push_scene(new text_file_1.SceneTextFile(this.os, `Release notes v${version.version}`, "Kate", text));
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
            await this.os.app_resources.refresh_cache();
            await this.os.audit_supervisor.log("kate:about", {
                resources: ["kate:version"],
                risk: "low",
                type: "kate.update.version",
                message: `Kate updated to ${version.version}`,
                extra: { version: version.version },
            });
            localStorage["kate-version"] = JSON.stringify(version);
            window.location.reload();
        }
    }
}
exports.SceneAboutKate = SceneAboutKate;

});

// packages\kate-core\build\legal.js
require.define(100, "packages\\kate-core\\build", "packages\\kate-core\\build\\legal.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notice = void 0;
exports.notice = require(101);

});

// packages\kate-core\LICENCES.txt
require.define(101, "", "", (module, exports, __dirname, __filename) => {
  module.exports = "Kate is made possible thanks to the amazing work of other people\r\nshared under permissive licenses. The software and assets that\r\nmake up Kate are listed here.\r\n\r\n-------------------------------------------------------------------------------\r\n\r\n## Kate's licence and your rights\r\n\r\nKate is released under the terms of the Mozilla Public Licence, v2.0. \r\nA copy of the MPL is included in this file, but you can also obtain\r\none at https://mozilla.org/MPL/2.0/.\r\n\r\nYou may get a copy of the source code at https://github.com/qteatime/kate.\r\nInformation on how to build Kate from the source code is also\r\nincluded there. Official releases will always be distributed at\r\nhttps://github.com/qteatime/kate, and you're encouraged to audit any\r\nmodifications if you've got your copy of Kate elsewhere.\r\n\r\nThere are other components that make up the Kate Importer project and which\r\nare available under different terms. Full text for all relevant licences is\r\nincluded here, after attributions, in the goal of making them offline-friendly.\r\n\r\nThis software contains portions of code, fonts, images, and sounds by\r\nthird-parties, specified below.\r\n\r\n_______________________________________________________________________________\r\n\r\n## Fonts:\r\n\r\nFont Awesome 6 Free (c) 2023 Fonticons, Inc. (https://fontawesome.com)\r\nLicensed under the SIL Open Font License (font files),\r\nCreative Commons 4.0 Attribution International license (icons), and\r\nMIT (CSS source code).\r\n\r\n---\r\n\r\nPoppins (c) 2020 The Poppins Project Authors\r\n(https://github.com/itfoundry/Poppins)\r\nLicensed under the SIL Open Font License.\r\n\r\n---\r\n\r\nRoboto and Roboto Mono (c) Google\r\n(https://fonts.google.com/specimen/Roboto/about)\r\nLicensed under the Apache License 2.0.\r\n\r\n_______________________________________________________________________________\r\n\r\n## Themes\r\n\r\nThe Candy Pop colour theme for Kate is based on a the Pollen8 palette\r\nby Conker (https://lospec.com/palette-list/pollen8)\r\n\r\n_______________________________________________________________________________\r\n\r\n## SIL Open Font License\r\n\r\nThis license is copied below, and is also available with a FAQ at:\r\nhttp://scripts.sil.org/OFL\r\n\r\n\r\n-----------------------------------------------------------\r\nSIL OPEN FONT LICENSE Version 1.1 - 26 February 2007\r\n-----------------------------------------------------------\r\n\r\nPREAMBLE\r\nThe goals of the Open Font License (OFL) are to stimulate worldwide\r\ndevelopment of collaborative font projects, to support the font creation\r\nefforts of academic and linguistic communities, and to provide a free and\r\nopen framework in which fonts may be shared and improved in partnership\r\nwith others.\r\n\r\nThe OFL allows the licensed fonts to be used, studied, modified and\r\nredistributed freely as long as they are not sold by themselves. The\r\nfonts, including any derivative works, can be bundled, embedded, \r\nredistributed and/or sold with any software provided that any reserved\r\nnames are not used by derivative works. The fonts and derivatives,\r\nhowever, cannot be released under any other type of license. The\r\nrequirement for fonts to remain under this license does not apply\r\nto any document created using the fonts or their derivatives.\r\n\r\nDEFINITIONS\r\n\"Font Software\" refers to the set of files released by the Copyright\r\nHolder(s) under this license and clearly marked as such. This may\r\ninclude source files, build scripts and documentation.\r\n\r\n\"Reserved Font Name\" refers to any names specified as such after the\r\ncopyright statement(s).\r\n\r\n\"Original Version\" refers to the collection of Font Software components as\r\ndistributed by the Copyright Holder(s).\r\n\r\n\"Modified Version\" refers to any derivative made by adding to, deleting,\r\nor substituting -- in part or in whole -- any of the components of the\r\nOriginal Version, by changing formats or by porting the Font Software to a\r\nnew environment.\r\n\r\n\"Author\" refers to any designer, engineer, programmer, technical\r\nwriter or other person who contributed to the Font Software.\r\n\r\nPERMISSION & CONDITIONS\r\nPermission is hereby granted, free of charge, to any person obtaining\r\na copy of the Font Software, to use, study, copy, merge, embed, modify,\r\nredistribute, and sell modified and unmodified copies of the Font\r\nSoftware, subject to the following conditions:\r\n\r\n1) Neither the Font Software nor any of its individual components,\r\nin Original or Modified Versions, may be sold by itself.\r\n\r\n2) Original or Modified Versions of the Font Software may be bundled,\r\nredistributed and/or sold with any software, provided that each copy\r\ncontains the above copyright notice and this license. These can be\r\nincluded either as stand-alone text files, human-readable headers or\r\nin the appropriate machine-readable metadata fields within text or\r\nbinary files as long as those fields can be easily viewed by the user.\r\n\r\n3) No Modified Version of the Font Software may use the Reserved Font\r\nName(s) unless explicit written permission is granted by the corresponding\r\nCopyright Holder. This restriction only applies to the primary font name as\r\npresented to the users.\r\n\r\n4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font\r\nSoftware shall not be used to promote, endorse or advertise any\r\nModified Version, except to acknowledge the contribution(s) of the\r\nCopyright Holder(s) and the Author(s) or with their explicit written\r\npermission.\r\n\r\n5) The Font Software, modified or unmodified, in part or in whole,\r\nmust be distributed entirely under this license, and must not be\r\ndistributed under any other license. The requirement for fonts to\r\nremain under this license does not apply to any document created\r\nusing the Font Software.\r\n\r\nTERMINATION\r\nThis license becomes null and void if any of the above conditions are\r\nnot met.\r\n\r\nDISCLAIMER\r\nTHE FONT SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND,\r\nEXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF\r\nMERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT\r\nOF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE\r\nCOPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,\r\nINCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL\r\nDAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING\r\nFROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM\r\nOTHER DEALINGS IN THE FONT SOFTWARE.\r\n\r\n_______________________________________________________________________________\r\n\r\n## Apache License 2.0\r\n\r\nApache License\r\nVersion 2.0, January 2004\r\nhttp://www.apache.org/licenses/\r\n\r\nTERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION\r\n\r\n1. Definitions.\r\n\r\n\"License\" shall mean the terms and conditions for use, reproduction,\r\nand distribution as defined by Sections 1 through 9 of this document.\r\n\r\n\"Licensor\" shall mean the copyright owner or entity authorized by\r\nthe copyright owner that is granting the License.\r\n\r\n\"Legal Entity\" shall mean the union of the acting entity and all\r\nother entities that control, are controlled by, or are under common\r\ncontrol with that entity. For the purposes of this definition,\r\n\"control\" means (i) the power, direct or indirect, to cause the\r\ndirection or management of such entity, whether by contract or\r\notherwise, or (ii) ownership of fifty percent (50%) or more of the\r\noutstanding shares, or (iii) beneficial ownership of such entity.\r\n\r\n\"You\" (or \"Your\") shall mean an individual or Legal Entity\r\nexercising permissions granted by this License.\r\n\r\n\"Source\" form shall mean the preferred form for making modifications,\r\nincluding but not limited to software source code, documentation\r\nsource, and configuration files.\r\n\r\n\"Object\" form shall mean any form resulting from mechanical\r\ntransformation or translation of a Source form, including but\r\nnot limited to compiled object code, generated documentation,\r\nand conversions to other media types.\r\n\r\n\"Work\" shall mean the work of authorship, whether in Source or\r\nObject form, made available under the License, as indicated by a\r\ncopyright notice that is included in or attached to the work\r\n(an example is provided in the Appendix below).\r\n\r\n\"Derivative Works\" shall mean any work, whether in Source or Object\r\nform, that is based on (or derived from) the Work and for which the\r\neditorial revisions, annotations, elaborations, or other modifications\r\nrepresent, as a whole, an original work of authorship. For the purposes\r\nof this License, Derivative Works shall not include works that remain\r\nseparable from, or merely link (or bind by name) to the interfaces of,\r\nthe Work and Derivative Works thereof.\r\n\r\n\"Contribution\" shall mean any work of authorship, including\r\nthe original version of the Work and any modifications or additions\r\nto that Work or Derivative Works thereof, that is intentionally\r\nsubmitted to Licensor for inclusion in the Work by the copyright owner\r\nor by an individual or Legal Entity authorized to submit on behalf of\r\nthe copyright owner. For the purposes of this definition, \"submitted\"\r\nmeans any form of electronic, verbal, or written communication sent\r\nto the Licensor or its representatives, including but not limited to\r\ncommunication on electronic mailing lists, source code control systems,\r\nand issue tracking systems that are managed by, or on behalf of, the\r\nLicensor for the purpose of discussing and improving the Work, but\r\nexcluding communication that is conspicuously marked or otherwise\r\ndesignated in writing by the copyright owner as \"Not a Contribution.\"\r\n\r\n\"Contributor\" shall mean Licensor and any individual or Legal Entity\r\non behalf of whom a Contribution has been received by Licensor and\r\nsubsequently incorporated within the Work.\r\n\r\n2. Grant of Copyright License. Subject to the terms and conditions of\r\nthis License, each Contributor hereby grants to You a perpetual,\r\nworldwide, non-exclusive, no-charge, royalty-free, irrevocable\r\ncopyright license to reproduce, prepare Derivative Works of,\r\npublicly display, publicly perform, sublicense, and distribute the\r\nWork and such Derivative Works in Source or Object form.\r\n\r\n3. Grant of Patent License. Subject to the terms and conditions of\r\nthis License, each Contributor hereby grants to You a perpetual,\r\nworldwide, non-exclusive, no-charge, royalty-free, irrevocable\r\n(except as stated in this section) patent license to make, have made,\r\nuse, offer to sell, sell, import, and otherwise transfer the Work,\r\nwhere such license applies only to those patent claims licensable\r\nby such Contributor that are necessarily infringed by their\r\nContribution(s) alone or by combination of their Contribution(s)\r\nwith the Work to which such Contribution(s) was submitted. If You\r\ninstitute patent litigation against any entity (including a\r\ncross-claim or counterclaim in a lawsuit) alleging that the Work\r\nor a Contribution incorporated within the Work constitutes direct\r\nor contributory patent infringement, then any patent licenses\r\ngranted to You under this License for that Work shall terminate\r\nas of the date such litigation is filed.\r\n\r\n4. Redistribution. You may reproduce and distribute copies of the\r\nWork or Derivative Works thereof in any medium, with or without\r\nmodifications, and in Source or Object form, provided that You\r\nmeet the following conditions:\r\n\r\n(a) You must give any other recipients of the Work or\r\nDerivative Works a copy of this License; and\r\n\r\n(b) You must cause any modified files to carry prominent notices\r\nstating that You changed the files; and\r\n\r\n(c) You must retain, in the Source form of any Derivative Works\r\nthat You distribute, all copyright, patent, trademark, and\r\nattribution notices from the Source form of the Work,\r\nexcluding those notices that do not pertain to any part of\r\nthe Derivative Works; and\r\n\r\n(d) If the Work includes a \"NOTICE\" text file as part of its\r\ndistribution, then any Derivative Works that You distribute must\r\ninclude a readable copy of the attribution notices contained\r\nwithin such NOTICE file, excluding those notices that do not\r\npertain to any part of the Derivative Works, in at least one\r\nof the following places: within a NOTICE text file distributed\r\nas part of the Derivative Works; within the Source form or\r\ndocumentation, if provided along with the Derivative Works; or,\r\nwithin a display generated by the Derivative Works, if and\r\nwherever such third-party notices normally appear. The contents\r\nof the NOTICE file are for informational purposes only and\r\ndo not modify the License. You may add Your own attribution\r\nnotices within Derivative Works that You distribute, alongside\r\nor as an addendum to the NOTICE text from the Work, provided\r\nthat such additional attribution notices cannot be construed\r\nas modifying the License.\r\n\r\nYou may add Your own copyright statement to Your modifications and\r\nmay provide additional or different license terms and conditions\r\nfor use, reproduction, or distribution of Your modifications, or\r\nfor any such Derivative Works as a whole, provided Your use,\r\nreproduction, and distribution of the Work otherwise complies with\r\nthe conditions stated in this License.\r\n\r\n5. Submission of Contributions. Unless You explicitly state otherwise,\r\nany Contribution intentionally submitted for inclusion in the Work\r\nby You to the Licensor shall be under the terms and conditions of\r\nthis License, without any additional terms or conditions.\r\nNotwithstanding the above, nothing herein shall supersede or modify\r\nthe terms of any separate license agreement you may have executed\r\nwith Licensor regarding such Contributions.\r\n\r\n6. Trademarks. This License does not grant permission to use the trade\r\nnames, trademarks, service marks, or product names of the Licensor,\r\nexcept as required for reasonable and customary use in describing the\r\norigin of the Work and reproducing the content of the NOTICE file.\r\n\r\n7. Disclaimer of Warranty. Unless required by applicable law or\r\nagreed to in writing, Licensor provides the Work (and each\r\nContributor provides its Contributions) on an \"AS IS\" BASIS,\r\nWITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or\r\nimplied, including, without limitation, any warranties or conditions\r\nof TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A\r\nPARTICULAR PURPOSE. You are solely responsible for determining the\r\nappropriateness of using or redistributing the Work and assume any\r\nrisks associated with Your exercise of permissions under this License.\r\n\r\n8. Limitation of Liability. In no event and under no legal theory,\r\nwhether in tort (including negligence), contract, or otherwise,\r\nunless required by applicable law (such as deliberate and grossly\r\nnegligent acts) or agreed to in writing, shall any Contributor be\r\nliable to You for damages, including any direct, indirect, special,\r\nincidental, or consequential damages of any character arising as a\r\nresult of this License or out of the use or inability to use the\r\nWork (including but not limited to damages for loss of goodwill,\r\nwork stoppage, computer failure or malfunction, or any and all\r\nother commercial damages or losses), even if such Contributor\r\nhas been advised of the possibility of such damages.\r\n\r\n9. Accepting Warranty or Additional Liability. While redistributing\r\nthe Work or Derivative Works thereof, You may choose to offer,\r\nand charge a fee for, acceptance of support, warranty, indemnity,\r\nor other liability obligations and/or rights consistent with this\r\nLicense. However, in accepting such obligations, You may act only\r\non Your own behalf and on Your sole responsibility, not on behalf\r\nof any other Contributor, and only if You agree to indemnify,\r\ndefend, and hold each Contributor harmless for any liability\r\nincurred by, or claims asserted against, such Contributor by reason\r\nof your accepting any such warranty or additional liability.\r\n\r\nEND OF TERMS AND CONDITIONS\r\n\r\nAPPENDIX: How to apply the Apache License to your work.\r\n\r\nTo apply the Apache License to your work, attach the following\r\nboilerplate notice, with the fields enclosed by brackets \"[]\"\r\nreplaced with your own identifying information. (Don't include\r\nthe brackets!)  The text should be enclosed in the appropriate\r\ncomment syntax for the file format. We also recommend that a\r\nfile or class name and description of purpose be included on the\r\nsame \"printed page\" as the copyright notice for easier\r\nidentification within third-party archives.\r\n\r\nCopyright [yyyy] [name of copyright owner]\r\n\r\nLicensed under the Apache License, Version 2.0 (the \"License\");\r\nyou may not use this file except in compliance with the License.\r\nYou may obtain a copy of the License at\r\n\r\nhttp://www.apache.org/licenses/LICENSE-2.0\r\n\r\nUnless required by applicable law or agreed to in writing, software\r\ndistributed under the License is distributed on an \"AS IS\" BASIS,\r\nWITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\nSee the License for the specific language governing permissions and\r\nlimitations under the License.\r\n\r\n_______________________________________________________________________________\r\n\r\n## Creative Commons 4.0 Attribution International\r\n\r\n## Creative Commons Attribution 4.0\r\n\r\nAttribution 4.0 International\r\n\r\n=======================================================================\r\n\r\nCreative Commons Corporation (\"Creative Commons\") is not a law firm and\r\ndoes not provide legal services or legal advice. Distribution of\r\nCreative Commons public licenses does not create a lawyer-client or\r\nother relationship. Creative Commons makes its licenses and related\r\ninformation available on an \"as-is\" basis. Creative Commons gives no\r\nwarranties regarding its licenses, any material licensed under their\r\nterms and conditions, or any related information. Creative Commons\r\ndisclaims all liability for damages resulting from their use to the\r\nfullest extent possible.\r\n\r\nUsing Creative Commons Public Licenses\r\n\r\nCreative Commons public licenses provide a standard set of terms and\r\nconditions that creators and other rights holders may use to share\r\noriginal works of authorship and other material subject to copyright\r\nand certain other rights specified in the public license below. The\r\nfollowing considerations are for informational purposes only, are not\r\nexhaustive, and do not form part of our licenses.\r\n\r\n     Considerations for licensors: Our public licenses are\r\n     intended for use by those authorized to give the public\r\n     permission to use material in ways otherwise restricted by\r\n     copyright and certain other rights. Our licenses are\r\n     irrevocable. Licensors should read and understand the terms\r\n     and conditions of the license they choose before applying it.\r\n     Licensors should also secure all rights necessary before\r\n     applying our licenses so that the public can reuse the\r\n     material as expected. Licensors should clearly mark any\r\n     material not subject to the license. This includes other CC-\r\n     licensed material, or material used under an exception or\r\n     limitation to copyright. More considerations for licensors:\r\n    wiki.creativecommons.org/Considerations_for_licensors\r\n\r\n     Considerations for the public: By using one of our public\r\n     licenses, a licensor grants the public permission to use the\r\n     licensed material under specified terms and conditions. If\r\n     the licensor's permission is not necessary for any reason--for\r\n     example, because of any applicable exception or limitation to\r\n     copyright--then that use is not regulated by the license. Our\r\n     licenses grant only permissions under copyright and certain\r\n     other rights that a licensor has authority to grant. Use of\r\n     the licensed material may still be restricted for other\r\n     reasons, including because others have copyright or other\r\n     rights in the material. A licensor may make special requests,\r\n     such as asking that all changes be marked or described.\r\n     Although not required by our licenses, you are encouraged to\r\n     respect those requests where reasonable. More considerations\r\n     for the public:\r\n    wiki.creativecommons.org/Considerations_for_licensees\r\n\r\n=======================================================================\r\n\r\nCreative Commons Attribution 4.0 International Public License\r\n\r\nBy exercising the Licensed Rights (defined below), You accept and agree\r\nto be bound by the terms and conditions of this Creative Commons\r\nAttribution 4.0 International Public License (\"Public License\"). To the\r\nextent this Public License may be interpreted as a contract, You are\r\ngranted the Licensed Rights in consideration of Your acceptance of\r\nthese terms and conditions, and the Licensor grants You such rights in\r\nconsideration of benefits the Licensor receives from making the\r\nLicensed Material available under these terms and conditions.\r\n\r\n\r\nSection 1 -- Definitions.\r\n\r\n  a. Adapted Material means material subject to Copyright and Similar\r\n     Rights that is derived from or based upon the Licensed Material\r\n     and in which the Licensed Material is translated, altered,\r\n     arranged, transformed, or otherwise modified in a manner requiring\r\n     permission under the Copyright and Similar Rights held by the\r\n     Licensor. For purposes of this Public License, where the Licensed\r\n     Material is a musical work, performance, or sound recording,\r\n     Adapted Material is always produced where the Licensed Material is\r\n     synched in timed relation with a moving image.\r\n\r\n  b. Adapter's License means the license You apply to Your Copyright\r\n     and Similar Rights in Your contributions to Adapted Material in\r\n     accordance with the terms and conditions of this Public License.\r\n\r\n  c. Copyright and Similar Rights means copyright and/or similar rights\r\n     closely related to copyright including, without limitation,\r\n     performance, broadcast, sound recording, and Sui Generis Database\r\n     Rights, without regard to how the rights are labeled or\r\n     categorized. For purposes of this Public License, the rights\r\n     specified in Section 2(b)(1)-(2) are not Copyright and Similar\r\n     Rights.\r\n\r\n  d. Effective Technological Measures means those measures that, in the\r\n     absence of proper authority, may not be circumvented under laws\r\n     fulfilling obligations under Article 11 of the WIPO Copyright\r\n     Treaty adopted on December 20, 1996, and/or similar international\r\n     agreements.\r\n\r\n  e. Exceptions and Limitations means fair use, fair dealing, and/or\r\n     any other exception or limitation to Copyright and Similar Rights\r\n     that applies to Your use of the Licensed Material.\r\n\r\n  f. Licensed Material means the artistic or literary work, database,\r\n     or other material to which the Licensor applied this Public\r\n     License.\r\n\r\n  g. Licensed Rights means the rights granted to You subject to the\r\n     terms and conditions of this Public License, which are limited to\r\n     all Copyright and Similar Rights that apply to Your use of the\r\n     Licensed Material and that the Licensor has authority to license.\r\n\r\n  h. Licensor means the individual(s) or entity(ies) granting rights\r\n     under this Public License.\r\n\r\n  i. Share means to provide material to the public by any means or\r\n     process that requires permission under the Licensed Rights, such\r\n     as reproduction, public display, public performance, distribution,\r\n     dissemination, communication, or importation, and to make material\r\n     available to the public including in ways that members of the\r\n     public may access the material from a place and at a time\r\n     individually chosen by them.\r\n\r\n  j. Sui Generis Database Rights means rights other than copyright\r\n     resulting from Directive 96/9/EC of the European Parliament and of\r\n     the Council of 11 March 1996 on the legal protection of databases,\r\n     as amended and/or succeeded, as well as other essentially\r\n     equivalent rights anywhere in the world.\r\n\r\n  k. You means the individual or entity exercising the Licensed Rights\r\n     under this Public License. Your has a corresponding meaning.\r\n\r\n\r\nSection 2 -- Scope.\r\n\r\n  a. License grant.\r\n\r\n       1. Subject to the terms and conditions of this Public License,\r\n          the Licensor hereby grants You a worldwide, royalty-free,\r\n          non-sublicensable, non-exclusive, irrevocable license to\r\n          exercise the Licensed Rights in the Licensed Material to:\r\n\r\n            a. reproduce and Share the Licensed Material, in whole or\r\n               in part; and\r\n\r\n            b. produce, reproduce, and Share Adapted Material.\r\n\r\n       2. Exceptions and Limitations. For the avoidance of doubt, where\r\n          Exceptions and Limitations apply to Your use, this Public\r\n          License does not apply, and You do not need to comply with\r\n          its terms and conditions.\r\n\r\n       3. Term. The term of this Public License is specified in Section\r\n          6(a).\r\n\r\n       4. Media and formats; technical modifications allowed. The\r\n          Licensor authorizes You to exercise the Licensed Rights in\r\n          all media and formats whether now known or hereafter created,\r\n          and to make technical modifications necessary to do so. The\r\n          Licensor waives and/or agrees not to assert any right or\r\n          authority to forbid You from making technical modifications\r\n          necessary to exercise the Licensed Rights, including\r\n          technical modifications necessary to circumvent Effective\r\n          Technological Measures. For purposes of this Public License,\r\n          simply making modifications authorized by this Section 2(a)\r\n          (4) never produces Adapted Material.\r\n\r\n       5. Downstream recipients.\r\n\r\n            a. Offer from the Licensor -- Licensed Material. Every\r\n               recipient of the Licensed Material automatically\r\n               receives an offer from the Licensor to exercise the\r\n               Licensed Rights under the terms and conditions of this\r\n               Public License.\r\n\r\n            b. No downstream restrictions. You may not offer or impose\r\n               any additional or different terms or conditions on, or\r\n               apply any Effective Technological Measures to, the\r\n               Licensed Material if doing so restricts exercise of the\r\n               Licensed Rights by any recipient of the Licensed\r\n               Material.\r\n\r\n       6. No endorsement. Nothing in this Public License constitutes or\r\n          may be construed as permission to assert or imply that You\r\n          are, or that Your use of the Licensed Material is, connected\r\n          with, or sponsored, endorsed, or granted official status by,\r\n          the Licensor or others designated to receive attribution as\r\n          provided in Section 3(a)(1)(A)(i).\r\n\r\n  b. Other rights.\r\n\r\n       1. Moral rights, such as the right of integrity, are not\r\n          licensed under this Public License, nor are publicity,\r\n          privacy, and/or other similar personality rights; however, to\r\n          the extent possible, the Licensor waives and/or agrees not to\r\n          assert any such rights held by the Licensor to the limited\r\n          extent necessary to allow You to exercise the Licensed\r\n          Rights, but not otherwise.\r\n\r\n       2. Patent and trademark rights are not licensed under this\r\n          Public License.\r\n\r\n       3. To the extent possible, the Licensor waives any right to\r\n          collect royalties from You for the exercise of the Licensed\r\n          Rights, whether directly or through a collecting society\r\n          under any voluntary or waivable statutory or compulsory\r\n          licensing scheme. In all other cases the Licensor expressly\r\n          reserves any right to collect such royalties.\r\n\r\n\r\nSection 3 -- License Conditions.\r\n\r\nYour exercise of the Licensed Rights is expressly made subject to the\r\nfollowing conditions.\r\n\r\n  a. Attribution.\r\n\r\n       1. If You Share the Licensed Material (including in modified\r\n          form), You must:\r\n\r\n            a. retain the following if it is supplied by the Licensor\r\n               with the Licensed Material:\r\n\r\n                 i. identification of the creator(s) of the Licensed\r\n                    Material and any others designated to receive\r\n                    attribution, in any reasonable manner requested by\r\n                    the Licensor (including by pseudonym if\r\n                    designated);\r\n\r\n                ii. a copyright notice;\r\n\r\n               iii. a notice that refers to this Public License;\r\n\r\n                iv. a notice that refers to the disclaimer of\r\n                    warranties;\r\n\r\n                 v. a URI or hyperlink to the Licensed Material to the\r\n                    extent reasonably practicable;\r\n\r\n            b. indicate if You modified the Licensed Material and\r\n               retain an indication of any previous modifications; and\r\n\r\n            c. indicate the Licensed Material is licensed under this\r\n               Public License, and include the text of, or the URI or\r\n               hyperlink to, this Public License.\r\n\r\n       2. You may satisfy the conditions in Section 3(a)(1) in any\r\n          reasonable manner based on the medium, means, and context in\r\n          which You Share the Licensed Material. For example, it may be\r\n          reasonable to satisfy the conditions by providing a URI or\r\n          hyperlink to a resource that includes the required\r\n          information.\r\n\r\n       3. If requested by the Licensor, You must remove any of the\r\n          information required by Section 3(a)(1)(A) to the extent\r\n          reasonably practicable.\r\n\r\n       4. If You Share Adapted Material You produce, the Adapter's\r\n          License You apply must not prevent recipients of the Adapted\r\n          Material from complying with this Public License.\r\n\r\n\r\nSection 4 -- Sui Generis Database Rights.\r\n\r\nWhere the Licensed Rights include Sui Generis Database Rights that\r\napply to Your use of the Licensed Material:\r\n\r\n  a. for the avoidance of doubt, Section 2(a)(1) grants You the right\r\n     to extract, reuse, reproduce, and Share all or a substantial\r\n     portion of the contents of the database;\r\n\r\n  b. if You include all or a substantial portion of the database\r\n     contents in a database in which You have Sui Generis Database\r\n     Rights, then the database in which You have Sui Generis Database\r\n     Rights (but not its individual contents) is Adapted Material; and\r\n\r\n  c. You must comply with the conditions in Section 3(a) if You Share\r\n     all or a substantial portion of the contents of the database.\r\n\r\nFor the avoidance of doubt, this Section 4 supplements and does not\r\nreplace Your obligations under this Public License where the Licensed\r\nRights include other Copyright and Similar Rights.\r\n\r\n\r\nSection 5 -- Disclaimer of Warranties and Limitation of Liability.\r\n\r\n  a. UNLESS OTHERWISE SEPARATELY UNDERTAKEN BY THE LICENSOR, TO THE\r\n     EXTENT POSSIBLE, THE LICENSOR OFFERS THE LICENSED MATERIAL AS-IS\r\n     AND AS-AVAILABLE, AND MAKES NO REPRESENTATIONS OR WARRANTIES OF\r\n     ANY KIND CONCERNING THE LICENSED MATERIAL, WHETHER EXPRESS,\r\n     IMPLIED, STATUTORY, OR OTHER. THIS INCLUDES, WITHOUT LIMITATION,\r\n     WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR\r\n     PURPOSE, NON-INFRINGEMENT, ABSENCE OF LATENT OR OTHER DEFECTS,\r\n     ACCURACY, OR THE PRESENCE OR ABSENCE OF ERRORS, WHETHER OR NOT\r\n     KNOWN OR DISCOVERABLE. WHERE DISCLAIMERS OF WARRANTIES ARE NOT\r\n     ALLOWED IN FULL OR IN PART, THIS DISCLAIMER MAY NOT APPLY TO YOU.\r\n\r\n  b. TO THE EXTENT POSSIBLE, IN NO EVENT WILL THE LICENSOR BE LIABLE\r\n     TO YOU ON ANY LEGAL THEORY (INCLUDING, WITHOUT LIMITATION,\r\n     NEGLIGENCE) OR OTHERWISE FOR ANY DIRECT, SPECIAL, INDIRECT,\r\n     INCIDENTAL, CONSEQUENTIAL, PUNITIVE, EXEMPLARY, OR OTHER LOSSES,\r\n     COSTS, EXPENSES, OR DAMAGES ARISING OUT OF THIS PUBLIC LICENSE OR\r\n     USE OF THE LICENSED MATERIAL, EVEN IF THE LICENSOR HAS BEEN\r\n     ADVISED OF THE POSSIBILITY OF SUCH LOSSES, COSTS, EXPENSES, OR\r\n     DAMAGES. WHERE A LIMITATION OF LIABILITY IS NOT ALLOWED IN FULL OR\r\n     IN PART, THIS LIMITATION MAY NOT APPLY TO YOU.\r\n\r\n  c. The disclaimer of warranties and limitation of liability provided\r\n     above shall be interpreted in a manner that, to the extent\r\n     possible, most closely approximates an absolute disclaimer and\r\n     waiver of all liability.\r\n\r\n\r\nSection 6 -- Term and Termination.\r\n\r\n  a. This Public License applies for the term of the Copyright and\r\n     Similar Rights licensed here. However, if You fail to comply with\r\n     this Public License, then Your rights under this Public License\r\n     terminate automatically.\r\n\r\n  b. Where Your right to use the Licensed Material has terminated under\r\n     Section 6(a), it reinstates:\r\n\r\n       1. automatically as of the date the violation is cured, provided\r\n          it is cured within 30 days of Your discovery of the\r\n          violation; or\r\n\r\n       2. upon express reinstatement by the Licensor.\r\n\r\n     For the avoidance of doubt, this Section 6(b) does not affect any\r\n     right the Licensor may have to seek remedies for Your violations\r\n     of this Public License.\r\n\r\n  c. For the avoidance of doubt, the Licensor may also offer the\r\n     Licensed Material under separate terms or conditions or stop\r\n     distributing the Licensed Material at any time; however, doing so\r\n     will not terminate this Public License.\r\n\r\n  d. Sections 1, 5, 6, 7, and 8 survive termination of this Public\r\n     License.\r\n\r\n\r\nSection 7 -- Other Terms and Conditions.\r\n\r\n  a. The Licensor shall not be bound by any additional or different\r\n     terms or conditions communicated by You unless expressly agreed.\r\n\r\n  b. Any arrangements, understandings, or agreements regarding the\r\n     Licensed Material not stated herein are separate from and\r\n     independent of the terms and conditions of this Public License.\r\n\r\n\r\nSection 8 -- Interpretation.\r\n\r\n  a. For the avoidance of doubt, this Public License does not, and\r\n     shall not be interpreted to, reduce, limit, restrict, or impose\r\n     conditions on any use of the Licensed Material that could lawfully\r\n     be made without permission under this Public License.\r\n\r\n  b. To the extent possible, if any provision of this Public License is\r\n     deemed unenforceable, it shall be automatically reformed to the\r\n     minimum extent necessary to make it enforceable. If the provision\r\n     cannot be reformed, it shall be severed from this Public License\r\n     without affecting the enforceability of the remaining terms and\r\n     conditions.\r\n\r\n  c. No term or condition of this Public License will be waived and no\r\n     failure to comply consented to unless expressly agreed to by the\r\n     Licensor.\r\n\r\n  d. Nothing in this Public License constitutes or may be interpreted\r\n     as a limitation upon, or waiver of, any privileges and immunities\r\n     that apply to the Licensor or You, including from the legal\r\n     processes of any jurisdiction or authority.\r\n\r\n\r\n=======================================================================\r\n\r\nCreative Commons is not a party to its public\r\nlicenses. Notwithstanding, Creative Commons may elect to apply one of\r\nits public licenses to material it publishes and in those instances\r\nwill be considered the “Licensor.” The text of the Creative Commons\r\npublic licenses is dedicated to the public domain under the CC0 Public\r\nDomain Dedication. Except for the limited purpose of indicating that\r\nmaterial is shared under a Creative Commons public license or as\r\notherwise permitted by the Creative Commons policies published at\r\ncreativecommons.org/policies, Creative Commons does not authorize the\r\nuse of the trademark \"Creative Commons\" or any other trademark or logo\r\nof Creative Commons without its prior written consent including,\r\nwithout limitation, in connection with any unauthorized modifications\r\nto any of its public licenses or any other arrangements,\r\nunderstandings, or agreements concerning use of licensed material. For\r\nthe avoidance of doubt, this paragraph does not form part of the\r\npublic licenses.\r\n\r\nCreative Commons may be contacted at creativecommons.org.\r\n\r\n_______________________________________________________________________________\r\n\r\n## MIT Licence\r\n\r\nPermission is hereby granted, free of charge, to any person obtaining\r\na copy of this software and associated documentation files (the \"Software\"),\r\nto deal in the Software without restriction, including without limitation\r\nthe rights to use, copy, modify, merge, publish, distribute, sublicense,\r\nand/or sell copies of the Software, and to permit persons to whom the\r\nSoftware is furnished to do so, subject to the following conditions:\r\n\r\nThe above copyright notice and this permission notice shall be\r\nincluded in all copies or substantial portions of the Software.\r\n\r\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\r\nOR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\r\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL\r\nTHE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\r\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\r\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\r\nTHE SOFTWARE.\r\n\r\n-------------------------------------------------------------------------------\r\n\r\nMozilla Public License Version 2.0\r\n==================================\r\n\r\n1. Definitions\r\n--------------\r\n\r\n1.1. \"Contributor\"\r\n    means each individual or legal entity that creates, contributes to\r\n    the creation of, or owns Covered Software.\r\n\r\n1.2. \"Contributor Version\"\r\n    means the combination of the Contributions of others (if any) used\r\n    by a Contributor and that particular Contributor's Contribution.\r\n\r\n1.3. \"Contribution\"\r\n    means Covered Software of a particular Contributor.\r\n\r\n1.4. \"Covered Software\"\r\n    means Source Code Form to which the initial Contributor has attached\r\n    the notice in Exhibit A, the Executable Form of such Source Code\r\n    Form, and Modifications of such Source Code Form, in each case\r\n    including portions thereof.\r\n\r\n1.5. \"Incompatible With Secondary Licenses\"\r\n    means\r\n\r\n    (a) that the initial Contributor has attached the notice described\r\n        in Exhibit B to the Covered Software; or\r\n\r\n    (b) that the Covered Software was made available under the terms of\r\n        version 1.1 or earlier of the License, but not also under the\r\n        terms of a Secondary License.\r\n\r\n1.6. \"Executable Form\"\r\n    means any form of the work other than Source Code Form.\r\n\r\n1.7. \"Larger Work\"\r\n    means a work that combines Covered Software with other material, in \r\n    a separate file or files, that is not Covered Software.\r\n\r\n1.8. \"License\"\r\n    means this document.\r\n\r\n1.9. \"Licensable\"\r\n    means having the right to grant, to the maximum extent possible,\r\n    whether at the time of the initial grant or subsequently, any and\r\n    all of the rights conveyed by this License.\r\n\r\n1.10. \"Modifications\"\r\n    means any of the following:\r\n\r\n    (a) any file in Source Code Form that results from an addition to,\r\n        deletion from, or modification of the contents of Covered\r\n        Software; or\r\n\r\n    (b) any new file in Source Code Form that contains any Covered\r\n        Software.\r\n\r\n1.11. \"Patent Claims\" of a Contributor\r\n    means any patent claim(s), including without limitation, method,\r\n    process, and apparatus claims, in any patent Licensable by such\r\n    Contributor that would be infringed, but for the grant of the\r\n    License, by the making, using, selling, offering for sale, having\r\n    made, import, or transfer of either its Contributions or its\r\n    Contributor Version.\r\n\r\n1.12. \"Secondary License\"\r\n    means either the GNU General Public License, Version 2.0, the GNU\r\n    Lesser General Public License, Version 2.1, the GNU Affero General\r\n    Public License, Version 3.0, or any later versions of those\r\n    licenses.\r\n\r\n1.13. \"Source Code Form\"\r\n    means the form of the work preferred for making modifications.\r\n\r\n1.14. \"You\" (or \"Your\")\r\n    means an individual or a legal entity exercising rights under this\r\n    License. For legal entities, \"You\" includes any entity that\r\n    controls, is controlled by, or is under common control with You. For\r\n    purposes of this definition, \"control\" means (a) the power, direct\r\n    or indirect, to cause the direction or management of such entity,\r\n    whether by contract or otherwise, or (b) ownership of more than\r\n    fifty percent (50%) of the outstanding shares or beneficial\r\n    ownership of such entity.\r\n\r\n2. License Grants and Conditions\r\n--------------------------------\r\n\r\n2.1. Grants\r\n\r\nEach Contributor hereby grants You a world-wide, royalty-free,\r\nnon-exclusive license:\r\n\r\n(a) under intellectual property rights (other than patent or trademark)\r\n    Licensable by such Contributor to use, reproduce, make available,\r\n    modify, display, perform, distribute, and otherwise exploit its\r\n    Contributions, either on an unmodified basis, with Modifications, or\r\n    as part of a Larger Work; and\r\n\r\n(b) under Patent Claims of such Contributor to make, use, sell, offer\r\n    for sale, have made, import, and otherwise transfer either its\r\n    Contributions or its Contributor Version.\r\n\r\n2.2. Effective Date\r\n\r\nThe licenses granted in Section 2.1 with respect to any Contribution\r\nbecome effective for each Contribution on the date the Contributor first\r\ndistributes such Contribution.\r\n\r\n2.3. Limitations on Grant Scope\r\n\r\nThe licenses granted in this Section 2 are the only rights granted under\r\nthis License. No additional rights or licenses will be implied from the\r\ndistribution or licensing of Covered Software under this License.\r\nNotwithstanding Section 2.1(b) above, no patent license is granted by a\r\nContributor:\r\n\r\n(a) for any code that a Contributor has removed from Covered Software;\r\n    or\r\n\r\n(b) for infringements caused by: (i) Your and any other third party's\r\n    modifications of Covered Software, or (ii) the combination of its\r\n    Contributions with other software (except as part of its Contributor\r\n    Version); or\r\n\r\n(c) under Patent Claims infringed by Covered Software in the absence of\r\n    its Contributions.\r\n\r\nThis License does not grant any rights in the trademarks, service marks,\r\nor logos of any Contributor (except as may be necessary to comply with\r\nthe notice requirements in Section 3.4).\r\n\r\n2.4. Subsequent Licenses\r\n\r\nNo Contributor makes additional grants as a result of Your choice to\r\ndistribute the Covered Software under a subsequent version of this\r\nLicense (see Section 10.2) or under the terms of a Secondary License (if\r\npermitted under the terms of Section 3.3).\r\n\r\n2.5. Representation\r\n\r\nEach Contributor represents that the Contributor believes its\r\nContributions are its original creation(s) or it has sufficient rights\r\nto grant the rights to its Contributions conveyed by this License.\r\n\r\n2.6. Fair Use\r\n\r\nThis License is not intended to limit any rights You have under\r\napplicable copyright doctrines of fair use, fair dealing, or other\r\nequivalents.\r\n\r\n2.7. Conditions\r\n\r\nSections 3.1, 3.2, 3.3, and 3.4 are conditions of the licenses granted\r\nin Section 2.1.\r\n\r\n3. Responsibilities\r\n-------------------\r\n\r\n3.1. Distribution of Source Form\r\n\r\nAll distribution of Covered Software in Source Code Form, including any\r\nModifications that You create or to which You contribute, must be under\r\nthe terms of this License. You must inform recipients that the Source\r\nCode Form of the Covered Software is governed by the terms of this\r\nLicense, and how they can obtain a copy of this License. You may not\r\nattempt to alter or restrict the recipients' rights in the Source Code\r\nForm.\r\n\r\n3.2. Distribution of Executable Form\r\n\r\nIf You distribute Covered Software in Executable Form then:\r\n\r\n(a) such Covered Software must also be made available in Source Code\r\n    Form, as described in Section 3.1, and You must inform recipients of\r\n    the Executable Form how they can obtain a copy of such Source Code\r\n    Form by reasonable means in a timely manner, at a charge no more\r\n    than the cost of distribution to the recipient; and\r\n\r\n(b) You may distribute such Executable Form under the terms of this\r\n    License, or sublicense it under different terms, provided that the\r\n    license for the Executable Form does not attempt to limit or alter\r\n    the recipients' rights in the Source Code Form under this License.\r\n\r\n3.3. Distribution of a Larger Work\r\n\r\nYou may create and distribute a Larger Work under terms of Your choice,\r\nprovided that You also comply with the requirements of this License for\r\nthe Covered Software. If the Larger Work is a combination of Covered\r\nSoftware with a work governed by one or more Secondary Licenses, and the\r\nCovered Software is not Incompatible With Secondary Licenses, this\r\nLicense permits You to additionally distribute such Covered Software\r\nunder the terms of such Secondary License(s), so that the recipient of\r\nthe Larger Work may, at their option, further distribute the Covered\r\nSoftware under the terms of either this License or such Secondary\r\nLicense(s).\r\n\r\n3.4. Notices\r\n\r\nYou may not remove or alter the substance of any license notices\r\n(including copyright notices, patent notices, disclaimers of warranty,\r\nor limitations of liability) contained within the Source Code Form of\r\nthe Covered Software, except that You may alter any license notices to\r\nthe extent required to remedy known factual inaccuracies.\r\n\r\n3.5. Application of Additional Terms\r\n\r\nYou may choose to offer, and to charge a fee for, warranty, support,\r\nindemnity or liability obligations to one or more recipients of Covered\r\nSoftware. However, You may do so only on Your own behalf, and not on\r\nbehalf of any Contributor. You must make it absolutely clear that any\r\nsuch warranty, support, indemnity, or liability obligation is offered by\r\nYou alone, and You hereby agree to indemnify every Contributor for any\r\nliability incurred by such Contributor as a result of warranty, support,\r\nindemnity or liability terms You offer. You may include additional\r\ndisclaimers of warranty and limitations of liability specific to any\r\njurisdiction.\r\n\r\n4. Inability to Comply Due to Statute or Regulation\r\n---------------------------------------------------\r\n\r\nIf it is impossible for You to comply with any of the terms of this\r\nLicense with respect to some or all of the Covered Software due to\r\nstatute, judicial order, or regulation then You must: (a) comply with\r\nthe terms of this License to the maximum extent possible; and (b)\r\ndescribe the limitations and the code they affect. Such description must\r\nbe placed in a text file included with all distributions of the Covered\r\nSoftware under this License. Except to the extent prohibited by statute\r\nor regulation, such description must be sufficiently detailed for a\r\nrecipient of ordinary skill to be able to understand it.\r\n\r\n5. Termination\r\n--------------\r\n\r\n5.1. The rights granted under this License will terminate automatically\r\nif You fail to comply with any of its terms. However, if You become\r\ncompliant, then the rights granted under this License from a particular\r\nContributor are reinstated (a) provisionally, unless and until such\r\nContributor explicitly and finally terminates Your grants, and (b) on an\r\nongoing basis, if such Contributor fails to notify You of the\r\nnon-compliance by some reasonable means prior to 60 days after You have\r\ncome back into compliance. Moreover, Your grants from a particular\r\nContributor are reinstated on an ongoing basis if such Contributor\r\nnotifies You of the non-compliance by some reasonable means, this is the\r\nfirst time You have received notice of non-compliance with this License\r\nfrom such Contributor, and You become compliant prior to 30 days after\r\nYour receipt of the notice.\r\n\r\n5.2. If You initiate litigation against any entity by asserting a patent\r\ninfringement claim (excluding declaratory judgment actions,\r\ncounter-claims, and cross-claims) alleging that a Contributor Version\r\ndirectly or indirectly infringes any patent, then the rights granted to\r\nYou by any and all Contributors for the Covered Software under Section\r\n2.1 of this License shall terminate.\r\n\r\n5.3. In the event of termination under Sections 5.1 or 5.2 above, all\r\nend user license agreements (excluding distributors and resellers) which\r\nhave been validly granted by You or Your distributors under this License\r\nprior to termination shall survive termination.\r\n\r\n************************************************************************\r\n*                                                                      *\r\n*  6. Disclaimer of Warranty                                           *\r\n*  -------------------------                                           *\r\n*                                                                      *\r\n*  Covered Software is provided under this License on an \"as is\"       *\r\n*  basis, without warranty of any kind, either expressed, implied, or  *\r\n*  statutory, including, without limitation, warranties that the       *\r\n*  Covered Software is free of defects, merchantable, fit for a        *\r\n*  particular purpose or non-infringing. The entire risk as to the     *\r\n*  quality and performance of the Covered Software is with You.        *\r\n*  Should any Covered Software prove defective in any respect, You     *\r\n*  (not any Contributor) assume the cost of any necessary servicing,   *\r\n*  repair, or correction. This disclaimer of warranty constitutes an   *\r\n*  essential part of this License. No use of any Covered Software is   *\r\n*  authorized under this License except under this disclaimer.         *\r\n*                                                                      *\r\n************************************************************************\r\n\r\n************************************************************************\r\n*                                                                      *\r\n*  7. Limitation of Liability                                          *\r\n*  --------------------------                                          *\r\n*                                                                      *\r\n*  Under no circumstances and under no legal theory, whether tort      *\r\n*  (including negligence), contract, or otherwise, shall any           *\r\n*  Contributor, or anyone who distributes Covered Software as          *\r\n*  permitted above, be liable to You for any direct, indirect,         *\r\n*  special, incidental, or consequential damages of any character      *\r\n*  including, without limitation, damages for lost profits, loss of    *\r\n*  goodwill, work stoppage, computer failure or malfunction, or any    *\r\n*  and all other commercial damages or losses, even if such party      *\r\n*  shall have been informed of the possibility of such damages. This   *\r\n*  limitation of liability shall not apply to liability for death or   *\r\n*  personal injury resulting from such party's negligence to the       *\r\n*  extent applicable law prohibits such limitation. Some               *\r\n*  jurisdictions do not allow the exclusion or limitation of           *\r\n*  incidental or consequential damages, so this exclusion and          *\r\n*  limitation may not apply to You.                                    *\r\n*                                                                      *\r\n************************************************************************\r\n\r\n8. Litigation\r\n-------------\r\n\r\nAny litigation relating to this License may be brought only in the\r\ncourts of a jurisdiction where the defendant maintains its principal\r\nplace of business and such litigation shall be governed by laws of that\r\njurisdiction, without reference to its conflict-of-law provisions.\r\nNothing in this Section shall prevent a party's ability to bring\r\ncross-claims or counter-claims.\r\n\r\n9. Miscellaneous\r\n----------------\r\n\r\nThis License represents the complete agreement concerning the subject\r\nmatter hereof. If any provision of this License is held to be\r\nunenforceable, such provision shall be reformed only to the extent\r\nnecessary to make it enforceable. Any law or regulation which provides\r\nthat the language of a contract shall be construed against the drafter\r\nshall not be used to construe this License against a Contributor.\r\n\r\n10. Versions of the License\r\n---------------------------\r\n\r\n10.1. New Versions\r\n\r\nMozilla Foundation is the license steward. Except as provided in Section\r\n10.3, no one other than the license steward has the right to modify or\r\npublish new versions of this License. Each version will be given a\r\ndistinguishing version number.\r\n\r\n10.2. Effect of New Versions\r\n\r\nYou may distribute the Covered Software under the terms of the version\r\nof the License under which You originally received the Covered Software,\r\nor under the terms of any subsequent version published by the license\r\nsteward.\r\n\r\n10.3. Modified Versions\r\n\r\nIf you create software not governed by this License, and you want to\r\ncreate a new license for such software, you may create and use a\r\nmodified version of this License if you rename the license and remove\r\nany references to the name of the license steward (except to note that\r\nsuch modified license differs from this License).\r\n\r\n10.4. Distributing Source Code Form that is Incompatible With Secondary\r\nLicenses\r\n\r\nIf You choose to distribute Source Code Form that is Incompatible With\r\nSecondary Licenses under the terms of this version of the License, the\r\nnotice described in Exhibit B of this License must be attached.\r\n\r\nExhibit A - Source Code Form License Notice\r\n-------------------------------------------\r\n\r\n  This Source Code Form is subject to the terms of the Mozilla Public\r\n  License, v. 2.0. If a copy of the MPL was not distributed with this\r\n  file, You can obtain one at http://mozilla.org/MPL/2.0/.\r\n\r\nIf it is not possible or desirable to put the notice in a particular\r\nfile, then You may include the notice in a location (such as a LICENSE\r\nfile in a relevant directory) where a recipient would be likely to look\r\nfor such a notice.\r\n\r\nYou may add additional accurate notices of copyright ownership.\r\n\r\nExhibit B - \"Incompatible With Secondary Licenses\" Notice\r\n---------------------------------------------------------\r\n\r\n  This Source Code Form is \"Incompatible With Secondary Licenses\", as\r\n  defined by the Mozilla Public License, v. 2.0."
})

// packages\kate-core\RELEASE.txt
require.define(102, "", "", (module, exports, __dirname, __filename) => {
  module.exports = "=======================================================================\r\nKate v0.23.10  (October 2023)\r\n=======================================================================\r\n\r\nThe v0.23.10 is October's experimental release of Kate."
})

// packages\kate-core\build\os\apps\index.js
require.define(103, "packages\\kate-core\\build\\os\\apps", "packages\\kate-core\\build\\os\\apps\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(99), exports);
__exportStar(require(53), exports);
__exportStar(require(96), exports);
__exportStar(require(56), exports);
__exportStar(require(97), exports);
__exportStar(require(60), exports);
__exportStar(require(57), exports);
__exportStar(require(61), exports);
__exportStar(require(104), exports);

});

// packages\kate-core\build\os\apps\settings\index.js
require.define(104, "packages\\kate-core\\build\\os\\apps\\settings", "packages\\kate-core\\build\\os\\apps\\settings\\index.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneSettings = void 0;
const UI = require(59);
const audit_1 = require(105);
const developer_1 = require(106);
const input_1 = require(107);
const permissions_1 = require(62);
const play_habits_1 = require(111);
const recovery_1 = require(112);
const storage_1 = require(58);
const ui_1 = require(113);
class SceneSettings extends UI.SimpleScene {
    icon = "gear";
    title = ["Settings"];
    body() {
        return [
            UI.when(this.os.kernel.console.options.mode !== "single", [
                UI.link_card(this.os, {
                    icon: "calendar",
                    title: "Play habits",
                    description: "Recently played and play time",
                    on_click: () => {
                        this.os.push_scene(new play_habits_1.ScenePlayHabitsSettings(this.os));
                    },
                }),
            ]),
            UI.link_card(this.os, {
                icon: "gamepad",
                title: "Controller & Sensors",
                description: "Configure virtual buttons, keyboard, gamepad, and other input sources",
                on_click: () => {
                    this.os.push_scene(new input_1.SceneInputSettings(this.os));
                },
            }),
            UI.link_card(this.os, {
                icon: "window-maximize",
                title: "User Interface",
                description: "Configure appearance and audio/visual feedback for KateOS",
                on_click: () => {
                    this.os.push_scene(new ui_1.SceneUISettings(this.os));
                },
            }),
            UI.when(this.os.kernel.console.options.mode !== "single", [
                UI.link_card(this.os, {
                    icon: "hard-drive",
                    title: "Storage",
                    description: "Visualise and manage storage usage",
                    on_click: () => {
                        this.os.push_scene(new storage_1.SceneStorageSettings(this.os));
                    },
                }),
            ]),
            UI.when(this.os.kernel.console.options.mode !== "single", [
                UI.link_card(this.os, {
                    icon: "key",
                    title: "Permissions",
                    description: "What cartridges are allowed to do with your device and data",
                    on_click: () => {
                        this.os.push_scene(new permissions_1.ScenePermissions(this.os));
                    },
                }),
            ]),
            UI.link_card(this.os, {
                icon: "stethoscope",
                title: "Diagnostics & Recovery",
                description: "Troubleshoot and reset parts of the console",
                on_click: () => {
                    this.os.push_scene(new recovery_1.SceneRecovery(this.os));
                },
            }),
            UI.link_card(this.os, {
                icon: "eye",
                title: "Audit",
                description: "See what your console and cartridges have been doing behind the scenes",
                on_click: () => {
                    this.os.push_scene(new audit_1.SceneAudit(this.os));
                },
            }),
            UI.when(this.os.kernel.console.options.mode !== "single", [
                UI.link_card(this.os, {
                    icon: "code",
                    title: "For developers",
                    description: `
            Settings intended only for those making their own cartridges for Kate.
          `,
                    on_click: () => {
                        this.os.push_scene(new developer_1.SceneDeveloperSettings(this.os));
                    },
                }),
            ]),
        ];
    }
}
exports.SceneSettings = SceneSettings;

});

// packages\kate-core\build\os\apps\settings\audit.js
require.define(105, "packages\\kate-core\\build\\os\\apps\\settings", "packages\\kate-core\\build\\os\\apps\\settings\\audit.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneAuditEntry = exports.SceneAuditLog = exports.SceneAudit = void 0;
const utils_1 = require(5);
const UI = require(59);
function format_retention(days) {
    if (!Number.isFinite(days)) {
        return "forever";
    }
    else if (days === 365) {
        return "1 year";
    }
    else if (days >= 365) {
        const years = Math.floor(days / 365);
        return `${years} years`;
    }
    else {
        return `${days} days`;
    }
}
class SceneAudit extends UI.SimpleScene {
    icon = "eye";
    title = ["Audit"];
    body() {
        const config = new utils_1.Observable(this.os.settings.get("audit"));
        return [
            UI.link_card(this.os, {
                arrow: "pencil",
                click_label: "Change",
                title: `Log retention period`,
                description: `Log entries older than this will be removed automatically to save storage space.`,
                value: UI.dynamic(config.map((x) => format_retention(x.log_retention_days))),
                on_click: () => {
                    this.select_retention_days(config);
                },
            }),
            UI.vspace(32),
            UI.link_card(this.os, {
                icon: "eye",
                title: "Audit log",
                description: "See all actions taken on your behalf and any errors that happened.",
                on_click: () => {
                    this.os.push_scene(new SceneAuditLog(this.os));
                },
            }),
        ];
    }
    async select_retention_days(current) {
        const result = await this.os.dialog.pop_menu("kate:settings", "Keep logs for at least:", [
            { label: "30 days", value: 30 },
            { label: "90 days", value: 90 },
            { label: "1 year", value: 365 },
            { label: "3 years", value: 365 * 3 },
            { label: "forever", value: Infinity },
        ], null);
        if (result == null) {
            return;
        }
        current.value = { ...current.value, log_retention_days: result };
        await this.os.settings.update("audit", (_) => current.value);
        await this.os.audit_supervisor.log("kate:settings", {
            resources: ["kate:settings"],
            risk: "high",
            type: "kate.settings.audit.updated",
            message: `Updated log retention to ${format_retention(result)}`,
            extra: { log_retention_days: result },
        });
    }
}
exports.SceneAudit = SceneAudit;
class SceneAuditLog extends UI.SimpleScene {
    icon = "eye";
    title = ["Audit log"];
    page = new utils_1.Observable(0);
    data = new utils_1.Observable({
        total: 0,
        logs: [],
    });
    PAGE_SIZE = 100;
    current = this.page.zip_with(this.data, (page, data) => {
        const start = page * this.PAGE_SIZE;
        const logs = data.logs.slice(start, start + this.PAGE_SIZE);
        const has_next = data.logs.length > start + this.PAGE_SIZE;
        const has_prev = start > 0;
        return { start, logs, has_next, has_prev };
    });
    subtitle = UI.dynamic(this.current.zip_with(this.data, (x, data) => `
      Displaying ${x.start + 1} to ${x.start + x.logs.length} (of ${data.total})
    `));
    actions = [
        {
            key: ["ltrigger"],
            label: "Previous page",
            handler: () => {
                if (this.current.value.has_prev) {
                    this.page.value -= 1;
                }
            },
        },
        {
            key: ["rtrigger"],
            label: "Next page",
            handler: () => {
                if (this.current.value.has_next) {
                    this.page.value += 1;
                }
            },
        },
        {
            key: ["x"],
            label: "Return",
            handler: () => {
                this.on_return();
            },
        },
    ];
    async body() {
        const data = await this.os.audit_supervisor.read_recent();
        this.data.value = data;
        return [
            UI.dynamic(this.current.map((current) => {
                return UI.klass("kate-ui-logview", [
                    UI.klass("kate-ui-logview-data", [
                        ...current.logs.map((x) => this.render_entry(x)),
                    ]),
                ]);
            })),
        ];
    }
    render_entry(x) {
        return UI.interactive(this.os, UI.h("div", { class: "kate-ui-logview-entry", "data-risk": x.risk }, [
            UI.h("div", { class: "kate-ui-logview-entry-heading" }, [
                UI.h("div", { class: "kate-ui-logview-process", title: x.process_id }, [x.process_id]),
                UI.h("div", { class: "kate-ui-logview-date", title: x.time.toISOString() }, [(0, utils_1.fine_grained_relative_date)(x.time)]),
                UI.h("div", { class: "kate-ui-logview-resources" }, [
                    ...[...x.resources.values()].map(render_resource),
                ]),
            ]),
            UI.h("div", { class: "kate-ui-logview-entry-message" }, [x.message]),
            UI.when(x.extra != null, [
                UI.h("div", { class: "kate-ui-logview-extra" }, [
                    JSON.stringify(x.extra, null, 2),
                ]),
            ]),
        ]), [
            {
                key: ["o"],
                label: "View",
                on_click: true,
                handler: () => {
                    this.os.push_scene(new SceneAuditEntry(this.os, this, x));
                },
            },
        ]);
    }
}
exports.SceneAuditLog = SceneAuditLog;
class SceneAuditEntry extends UI.SimpleScene {
    logview;
    entry;
    icon = "eye";
    title = ["Audit log"];
    actions = [
        {
            key: ["x"],
            label: "Return",
            handler: () => this.on_return(),
        },
        {
            key: ["menu"],
            label: "Options",
            handler: () => this.on_options(),
        },
    ];
    constructor(os, logview, entry) {
        super(os);
        this.logview = logview;
        this.entry = entry;
    }
    async body() {
        const x = this.entry;
        return [
            UI.scroll([
                UI.h("div", { class: "kate-ui-audit-entry" }, [
                    UI.h("div", { class: "kate-ui-logview-entry-heading", "data-risk": x.risk }, [
                        UI.h("div", { class: "kate-ui-logview-process", title: x.process_id }, [x.process_id]),
                        UI.h("div", { class: "kate-ui-logview-risk" }, [
                            `(${x.risk} risk)`,
                        ]),
                        UI.h("div", { class: "kate-ui-logview-date", title: x.time.toISOString() }, [(0, utils_1.fine_grained_relative_date)(x.time)]),
                        UI.h("div", { class: "kate-ui-logview-resources" }, [
                            ...[...x.resources.values()].map(render_resource),
                        ]),
                    ]),
                    UI.h("div", { class: "kate-ui-audit-entry-message" }, [x.message]),
                    UI.h("div", { class: "kate-ui-audit-entry-extra" }, [
                        JSON.stringify(x.extra, null, 2),
                    ]),
                ]),
            ]),
        ];
    }
    async on_options() {
        const result = await this.os.dialog.pop_menu("kate:audit", "", [
            {
                label: "Delete",
                value: "delete",
            },
        ], null);
        switch (result) {
            case "delete": {
                await this.os.audit_supervisor.remove(this.entry.id);
                await this.logview.refresh();
                this.os.pop_scene(this);
                break;
            }
            case null: {
                break;
            }
            default:
                throw (0, utils_1.unreachable)(result);
        }
    }
}
exports.SceneAuditEntry = SceneAuditEntry;
function render_resource(x) {
    switch (x) {
        case "error":
            return UI.fa_icon("circle-xmark");
        case "kate:capture":
            return UI.fa_icon("camera");
        case "kate:cartridge":
            return UI.fa_icon("ghost");
        case "kate:habits":
            return UI.fa_icon("calendar");
        case "kate:permissions":
            return UI.fa_icon("key");
        case "kate:settings":
            return UI.fa_icon("gear");
        case "kate:storage":
            return UI.fa_icon("hard-drive");
        case "kate:version":
            return UI.fa_icon("rotate");
        case "kate:ui":
            return UI.fa_icon("window-maximize");
        case "kate:audit":
            return UI.fa_icon("eye");
        case "navigate":
            return UI.fa_icon("globe");
        case "device-fs":
            return UI.fa_icon("laptop-file");
        default:
            throw (0, utils_1.unreachable)(x, "audit resource");
    }
}

});

// packages\kate-core\build\os\apps\settings\developer.js
require.define(106, "packages\\kate-core\\build\\os\\apps\\settings", "packages\\kate-core\\build\\os\\apps\\settings\\developer.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneDeveloperSettings = void 0;
const UI = require(59);
class SceneDeveloperSettings extends UI.SimpleScene {
    icon = "code";
    title = ["Developer settings"];
    body() {
        const data = this.os.settings.get("developer");
        return [
            UI.p([
                `These settings are intended for users making cartridges for Kate.
        Updating these settings may impact Kate's stability, security, and privacy.`,
            ]),
            UI.toggle_cell(this.os, {
                value: data.allow_version_overwrite,
                title: "Allow overwriting a cartridge",
                description: `
          Stop Kate from ignoring cartridge installs when the cartridge's
          version is already installed. Useful for iterating.
        `,
                on_changed: (v) => {
                    this.change("allow_version_overwrite", v);
                },
            }),
        ];
    }
    async change(key, value) {
        await this.os.settings.update("developer", (x) => {
            return { ...x, [key]: value };
        });
        await this.os.audit_supervisor.log("kate:settings", {
            resources: ["kate:settings"],
            risk: "high",
            type: "kate.settings.developer.updated",
            message: "Updated developer settings",
            extra: { [key]: value },
        });
    }
}
exports.SceneDeveloperSettings = SceneDeveloperSettings;

});

// packages\kate-core\build\os\apps\settings\input.js
require.define(107, "packages\\kate-core\\build\\os\\apps\\settings", "packages\\kate-core\\build\\os\\apps\\settings\\input.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneInputSettings = void 0;
const UI = require(59);
const gamepad_input_1 = require(108);
const keyboard_input_1 = require(110);
class SceneInputSettings extends UI.SimpleScene {
    icon = "gamepad";
    title = ["Controller & Sensors"];
    body() {
        const data = this.os.settings.get("input");
        return [
            UI.h("h3", {}, ["Virtual buttons"]),
            UI.toggle_cell(this.os, {
                value: data.haptic_feedback_for_virtual_button,
                title: "Haptic feedback",
                description: "Vibrate the console when a virtual button is touched",
                on_changed: this.handle_haptics_change,
            }),
            UI.h("h3", {}, ["Alternative input methods"]),
            UI.link_card(this.os, {
                icon: "keyboard",
                title: "Control Kate with a keyboard",
                description: "Configure keyboard mappings for Kate buttons",
                on_click: () => {
                    this.os.push_scene(new keyboard_input_1.KeyboardInputSettings(this.os));
                },
            }),
            UI.vspace(6),
            UI.link_card(this.os, {
                icon: "gamepad",
                title: "Control Kate with a standard gamepad",
                description: "Select a gamepad and configure how it maps to Kate buttons",
                on_click: () => {
                    this.os.push_scene(new gamepad_input_1.GamepadInputSettings(this.os));
                },
            }),
        ];
    }
    handle_haptics_change = async (x) => {
        await this.os.settings.update("input", (v) => ({
            ...v,
            haptic_feedback_for_virtual_button: x,
        }));
        await this.os.audit_supervisor.log("kate:settings", {
            resources: ["kate:settings"],
            risk: "low",
            type: "kate.settings.input.updated",
            message: "Updated input settings",
            extra: { haptic_feedback_for_virtual_button: x },
        });
    };
}
exports.SceneInputSettings = SceneInputSettings;

});

// packages\kate-core\build\os\apps\settings\gamepad-input.js
require.define(108, "packages\\kate-core\\build\\os\\apps\\settings", "packages\\kate-core\\build\\os\\apps\\settings\\gamepad-input.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChooseActiveGamepadSettings = exports.RemapStandardSettings = exports.TestStandardMappingSettings = exports.GamepadInputSettings = void 0;
const UI = require(59);
const utils_1 = require(5);
const gamepad_1 = require(109);
class GamepadInputSettings extends UI.SimpleScene {
    icon = "gamepad";
    title = ["Gamepad settings"];
    body() {
        return [
            UI.link_card(this.os, {
                title: "Test gamepad input",
                description: "Check how Kate reads your gamepad buttons",
                on_click: () => {
                    this.os.push_scene(new TestStandardMappingSettings(this.os));
                },
            }),
            UI.link_card(this.os, {
                title: "Configure standard mapping",
                description: "Change button configuration for standard gamepads",
                on_click: () => {
                    this.os.push_scene(new RemapStandardSettings(this.os));
                },
            }),
            UI.vspace(6),
            UI.link_card(this.os, {
                title: "Change active gamepad",
                description: "Choose which connected gamepad will control Kate",
                on_click: () => {
                    this.os.push_scene(new ChooseActiveGamepadSettings(this.os));
                },
            }),
        ];
    }
}
exports.GamepadInputSettings = GamepadInputSettings;
class TestStandardMappingSettings extends UI.SimpleScene {
    icon = "gamepad";
    title = ["Test gamepad input"];
    subtitle = "Hold any button to exit";
    _buttons = new Map();
    _haxes = new Map();
    _vaxes = new Map();
    _last_update = null;
    _pressed = new Map();
    body() {
        return [UI.centered_container(standard_frame())];
    }
    on_attached() {
        this.os.kernel.console.on_tick.listen(this.update_gamepad_status);
        this.os.kernel.gamepad.pause();
        this.index_buttons();
        super.on_attached();
    }
    on_detached() {
        super.on_detached();
        this.os.kernel.gamepad.unpause();
        this.os.kernel.console.on_tick.remove(this.update_gamepad_status);
    }
    index_buttons = () => {
        this._buttons = new Map();
        for (const button of Array.from(this.canvas.querySelectorAll("div[data-index]"))) {
            this._buttons.set(Number(button.getAttribute("data-index")), button);
        }
        this._haxes = new Map();
        for (const axes of Array.from(this.canvas.querySelectorAll("div[data-axis-h]"))) {
            this._haxes.set(Number(axes.getAttribute("data-axis-h")), axes);
        }
        this._vaxes = new Map();
        for (const axes of Array.from(this.canvas.querySelectorAll("div[data-axis-v]"))) {
            this._vaxes.set(Number(axes.getAttribute("data-axis-v")), axes);
        }
    };
    update_gamepad_status = (time) => {
        const gamepad = this.os.kernel.gamepad.current?.raw;
        if (gamepad == null) {
            return;
        }
        for (const [index, button] of (0, utils_1.enumerate)(gamepad.buttons)) {
            if (!button.pressed) {
                this._pressed.set(index, null);
            }
            else {
                const previous = this._pressed.get(index) ?? time;
                this._pressed.set(index, previous);
                if (time - previous > 1_000) {
                    this._pressed = new Map();
                    this.close();
                    return;
                }
            }
        }
        if (this._last_update != null && gamepad.timestamp < this._last_update) {
            return;
        }
        for (const [key, button] of this._buttons) {
            button.classList.toggle("active", gamepad.buttons[key].pressed);
        }
        for (const [key, stick] of this._haxes) {
            stick.style.left = `${axis_to_offset(gamepad.axes[key])}%`;
        }
        for (const [key, stick] of this._vaxes) {
            stick.style.top = `${axis_to_offset(gamepad.axes[key])}%`;
        }
        this._last_update = gamepad.timestamp;
    };
    on_cancel = () => {
        this.close();
    };
    on_save = () => { };
}
exports.TestStandardMappingSettings = TestStandardMappingSettings;
function axis_to_offset(x) {
    return x * 30 + 50;
}
function standard_frame(handler = (_, x) => x) {
    return UI.h("div", { class: "standard-gamepad-frame" }, [
        UI.h("div", { class: "standard-gamepad-left standard-gamepad-cluster" }, [
            handler(12, UI.h("div", {
                class: "standard-gamepad-button1 standard-gamepad-button",
                "data-index": "12",
            }, [])),
            handler(15, UI.h("div", {
                class: "standard-gamepad-button2 standard-gamepad-button",
                "data-index": "15",
            }, [])),
            handler(13, UI.h("div", {
                class: "standard-gamepad-button3 standard-gamepad-button",
                "data-index": "13",
            }, [])),
            handler(14, UI.h("div", {
                class: "standard-gamepad-button4 standard-gamepad-button",
                "data-index": "14",
            }, [])),
        ]),
        UI.h("div", { class: "standard-gamepad-right standard-gamepad-cluster" }, [
            handler(3, UI.h("div", {
                class: "standard-gamepad-button1 standard-gamepad-button",
                "data-index": "3",
            }, [])),
            handler(1, UI.h("div", {
                class: "standard-gamepad-button2 standard-gamepad-button",
                "data-index": "1",
            }, [])),
            handler(0, UI.h("div", {
                class: "standard-gamepad-button3 standard-gamepad-button",
                "data-index": "0",
            }, [])),
            handler(2, UI.h("div", {
                class: "standard-gamepad-button4 standard-gamepad-button",
                "data-index": "2",
            }, [])),
        ]),
        handler(8, UI.h("div", {
            class: "standard-gamepad-special standard-gamepad-special-left",
            "data-index": "8",
        }, [])),
        handler(16, UI.h("div", {
            class: "standard-gamepad-special standard-gamepad-special-center",
            "data-index": "16",
        }, [])),
        handler(9, UI.h("div", {
            class: "standard-gamepad-special standard-gamepad-special-right",
            "data-index": "9",
        }, [])),
        UI.h("div", { class: "standard-gamepad-axes standard-gamepad-axes-left" }, [
            handler(10, UI.h("div", {
                class: "standard-gamepad-joystick",
                "data-name": "left thumbstick",
                "data-axis-h": "0",
                "data-axis-v": "1",
                "data-index": "10",
            }, [
                UI.h("div", { class: "standard-gamepad-joystick-up" }, []),
                UI.h("div", { class: "standard-gamepad-joystick-down" }, []),
                UI.h("div", { class: "standard-gamepad-joystick-left" }, []),
                UI.h("div", { class: "standard-gamepad-joystick-right" }, []),
                UI.h("div", { class: "standard-gamepad-joystick-press" }, []),
            ])),
        ]),
        UI.h("div", { class: "standard-gamepad-axes standard-gamepad-axes-right" }, [
            handler(11, UI.h("div", {
                class: "standard-gamepad-joystick",
                "data-name": "right thumbstick",
                "data-axis-h": "2",
                "data-axis-v": "3",
                "data-index": "11",
            }, [
                UI.h("div", { class: "standard-gamepad-joystick-up" }, []),
                UI.h("div", { class: "standard-gamepad-joystick-down" }, []),
                UI.h("div", { class: "standard-gamepad-joystick-left" }, []),
                UI.h("div", { class: "standard-gamepad-joystick-right" }, []),
                UI.h("div", { class: "standard-gamepad-joystick-press" }, []),
            ])),
        ]),
        UI.h("div", { class: "standard-gamepad-shoulder standard-gamepad-shoulder-left" }, [
            handler(6, UI.h("div", {
                class: "standard-gamepad-shoulder-button standard-gamepad-shoulder-button1",
                "data-index": "6",
            }, [])),
            handler(4, UI.h("div", {
                class: "standard-gamepad-shoulder-button standard-gamepad-shoulder-button2",
                "data-index": "4",
            }, [])),
        ]),
        UI.h("div", {
            class: "standard-gamepad-shoulder standard-gamepad-shoulder-right",
        }, [
            handler(7, UI.h("div", {
                class: "standard-gamepad-shoulder-button standard-gamepad-shoulder-button1",
                "data-index": "7",
            }, [])),
            handler(5, UI.h("div", {
                class: "standard-gamepad-shoulder-button standard-gamepad-shoulder-button2",
                "data-index": "5",
            }, [])),
        ]),
    ]);
}
const config_modes = [
    {
        id: "d-pad",
        title: "D-Pad",
        active: [12, 13, 14, 15],
    },
    {
        id: "buttons",
        title: "Face buttons",
        active: [0, 1, 2, 3],
    },
    {
        id: "special",
        title: "Special buttons",
        active: [8, 9, 16],
    },
    {
        id: "shoulder",
        title: "Shoulder buttons",
        active: [4, 5, 6, 7],
    },
    {
        id: "axes",
        title: "Thumbsticks",
        active: [10, 11],
    },
];
class RemapStandardSettings extends UI.SimpleScene {
    mode = new utils_1.Observable(config_modes[0]);
    updated = new utils_1.Observable(false);
    _mapping;
    constructor(os) {
        super(os);
        this._mapping = os.settings.get("input").gamepad_mapping.standard;
    }
    icon = "gamepad";
    title = ["Remap buttons"];
    subtitle = UI.hbox(0.5, [
        UI.icon("ltrigger"),
        UI.dynamic(this.mode.map((x) => x.title)),
        UI.icon("rtrigger"),
    ]);
    actions = [
        {
            key: ["x"],
            label: "Return",
            handler: () => this.on_return(),
        },
        {
            key: ["ltrigger"],
            label: "Previous button set",
            handler: () => {
                this.change_mode(-1);
            },
        },
        {
            key: ["rtrigger"],
            label: "Next button set",
            handler: () => {
                this.change_mode(1);
            },
        },
    ];
    change_mode(offset) {
        const index = config_modes.findIndex((x) => x.id === this.mode.value.id);
        const new_index = (0, utils_1.clamp)(index + offset, 0, config_modes.length - 1);
        if (new_index !== index) {
            this.mode.value = config_modes[new_index];
        }
    }
    fill_button(button) {
        const index = this.button_index(button);
        if (index != null) {
            const entry = this._mapping.find((x) => x.type === "button" && x.index === index);
            if (entry != null) {
                UI.append(UI.h("div", { class: "gamepad-pressed-mapping" }, [
                    UI.icon(entry.pressed),
                ]), button);
            }
        }
        return button;
    }
    fill_stick(button) {
        const index = this.button_index(button);
        const haxis = Number(button.getAttribute("data-axis-h"));
        const vaxis = Number(button.getAttribute("data-axis-v"));
        const pressed_mapping = this._mapping.find((x) => x.type === "button" && x.index === index);
        const haxis_mapping = this._mapping.find((x) => x.type === "axis" && x.index === haxis);
        const vaxis_mapping = this._mapping.find((x) => x.type === "axis" && x.index === vaxis);
        UI.append(UI.h("div", { class: "gamepad-pressed-mapping" }, [
            pressed_mapping == null ? null : UI.icon(pressed_mapping.pressed),
        ]), button.querySelector(".standard-gamepad-joystick-press"));
        UI.append(UI.h("div", { class: "gamepad-pressed-mapping" }, [
            haxis_mapping == null || haxis_mapping.negative == null
                ? null
                : UI.icon(haxis_mapping.negative),
        ]), button.querySelector(".standard-gamepad-joystick-left"));
        UI.append(UI.h("div", { class: "gamepad-pressed-mapping" }, [
            haxis_mapping == null || haxis_mapping.positive == null
                ? null
                : UI.icon(haxis_mapping.positive),
        ]), button.querySelector(".standard-gamepad-joystick-right"));
        UI.append(UI.h("div", { class: "gamepad-pressed-mapping" }, [
            vaxis_mapping == null || vaxis_mapping.negative == null
                ? null
                : UI.icon(vaxis_mapping.negative),
        ]), button.querySelector(".standard-gamepad-joystick-up"));
        UI.append(UI.h("div", { class: "gamepad-pressed-mapping" }, [
            vaxis_mapping == null || vaxis_mapping.positive == null
                ? null
                : UI.icon(vaxis_mapping.positive),
        ]), button.querySelector(".standard-gamepad-joystick-down"));
    }
    annotated_button(button, interactive) {
        if (interactive) {
            return UI.interactive(this.os, this.fill_button(button), [
                {
                    key: ["o"],
                    label: "Remap",
                    on_click: true,
                    handler: () => this.ask_remap_pressed(button),
                },
            ], {
                replace: true,
                default_focus_indicator: false,
            });
        }
        else {
            button.classList.add("inactive");
            return this.fill_button(button);
        }
    }
    annotated_stick(button, interactive) {
        this.fill_stick(button);
        if (!interactive) {
            button.classList.add("inactive");
        }
        else {
            const click = (fn) => {
                return {
                    key: ["o"],
                    on_click: true,
                    label: "Remap",
                    handler: fn,
                };
            };
            const interactive = (child, fn) => {
                UI.interactive(this.os, child, [click(fn)], {
                    replace: true,
                });
            };
            const up = button.querySelector(".standard-gamepad-joystick-up");
            const right = button.querySelector(".standard-gamepad-joystick-right");
            const down = button.querySelector(".standard-gamepad-joystick-down");
            const left = button.querySelector(".standard-gamepad-joystick-left");
            const press = button.querySelector(".standard-gamepad-joystick-press");
            interactive(press, () => this.ask_remap_pressed(button));
            interactive(up, () => this.ask_remap_axis(button, "up"));
            interactive(right, () => this.ask_remap_axis(button, "right"));
            interactive(down, () => this.ask_remap_axis(button, "down"));
            interactive(left, () => this.ask_remap_axis(button, "left"));
        }
        return button;
    }
    annotated_layout() {
        return UI.dynamic(this.mode.map((mode) => {
            return standard_frame((index, button0) => {
                const button = button0;
                const kind = button_kind(button);
                switch (kind) {
                    case "button":
                        return this.annotated_button(button, mode.active.includes(index));
                    case "stick":
                        return this.annotated_stick(button, mode.active.includes(index));
                    default:
                        throw (0, utils_1.unreachable)(kind);
                }
            });
        }));
    }
    body_container(body) {
        return UI.h("div", {
            class: "gamepad-settings-remap-container kate-os-content kate-os-screen-body",
        }, [...body]);
    }
    body() {
        return [
            UI.h("div", { class: "gamepad-settings-remap-frame" }, [
                this.annotated_layout(),
            ]),
            UI.h("div", { class: "gamepad-settings-remap-actions" }, [
                UI.text_button(this.os, "Save", {
                    primary: true,
                    on_click: this.on_save,
                    enabled: this.updated,
                }),
                UI.text_button(this.os, "Cancel", {
                    on_click: () => this.on_return(),
                }),
                UI.text_button(this.os, "Defaults", {
                    on_click: this.revert_defaults,
                }),
            ]),
        ];
    }
    revert_defaults = async () => {
        this._mapping =
            this.os.settings.defaults.input.gamepad_mapping.standard.slice();
        this.updated.value = true;
        this.refresh_mode();
    };
    on_return = async () => {
        if (this.updated.value) {
            const discard_confirm = await this.os.dialog.confirm("kate:settings", {
                title: "Discard changes?",
                message: "The changes made to the gamepad mapping have not been saved. Discard changes and leave the screen?",
                cancel: "Review changes",
                ok: "Discard changes",
                dangerous: true,
            });
            if (discard_confirm) {
                this.close();
            }
        }
        else {
            this.close();
        }
    };
    on_save = async () => {
        await this.os.settings.update("input", (x) => {
            const mapping = { ...x.gamepad_mapping, standard: this._mapping };
            return { ...x, gamepad_mapping: mapping };
        });
        await this.os.audit_supervisor.log("kate:settings", {
            resources: ["kate:settings"],
            risk: "low",
            type: "kate.settings.gamepad.updated-standard-mapping",
            message: "Updated standard gamepad mapping",
            extra: this._mapping,
        });
        this.os.kernel.gamepad.remap(this._mapping);
        this.close();
    };
    on_attached() {
        super.on_attached();
        const frame = this.canvas.querySelector(".gamepad-settings-remap-frame");
        this.mode.stream.listen(() => {
            this.os.focus_handler.refocus(frame);
        });
    }
    button_index(button) {
        const index_string = button.getAttribute("data-index");
        if (index_string != null && !isNaN(Number(index_string))) {
            return Number(index_string);
        }
        else {
            return null;
        }
    }
    async ask_remap_axis(button, direction) {
        const clone = (x) => ({ ...x });
        const name = button.getAttribute("data-name") ?? "joystick";
        const haxis = Number(button.getAttribute("data-axis-h"));
        const vaxis = Number(button.getAttribute("data-axis-v"));
        const current_haxis = clone(this._mapping.find((x) => x.type === "axis" && x.index === haxis) ?? {
            type: "axis",
            index: haxis,
            negative: null,
            positive: null,
        });
        const current_vaxis = clone(this._mapping.find((x) => x.type === "axis" && x.index === vaxis) ?? {
            type: "axis",
            index: vaxis,
            negative: null,
            positive: null,
        });
        const message = `When ${name} is moved ${direction}`;
        const current = (direction === "left"
            ? current_haxis?.negative
            : direction === "right"
                ? current_haxis?.positive
                : direction === "up"
                    ? current_vaxis?.negative
                    : direction === "down"
                        ? current_haxis?.positive
                        : null) ?? null;
        const new_key = await this.remap(message, current);
        if (new_key === false) {
            return;
        }
        if (new_key !== current) {
            switch (direction) {
                case "left":
                    current_haxis.negative = new_key;
                    break;
                case "right":
                    current_haxis.positive = new_key;
                    break;
                case "up":
                    current_vaxis.negative = new_key;
                    break;
                case "down":
                    current_vaxis.positive = new_key;
                    break;
                default:
                    throw (0, utils_1.unreachable)(direction);
            }
            const mapping = this._mapping.filter((x) => x.type !== "axis" || ![haxis, vaxis].includes(x.index));
            this._mapping = mapping.concat([current_haxis, current_vaxis]);
            this.updated.value = true;
            this.refresh_mode();
        }
    }
    async ask_remap_pressed(button) {
        const index = this.button_index(button);
        if (index != null) {
            const current = this._mapping.find((x) => x.type === "button" && x.index === index);
            const key = await this.remap(`When button ${index} is pressed`, current?.pressed ?? null);
            if (key === false) {
                return;
            }
            if (key !== current) {
                const mapping = this._mapping.filter((x) => x.type !== "button" || x.index !== index);
                const addition = key == null ? [] : [{ type: "button", index, pressed: key }];
                this._mapping = mapping.concat(addition);
                this.updated.value = true;
                this.refresh_mode();
            }
        }
    }
    async remap(title, current) {
        let pressed = new utils_1.Observable(current);
        const choose_pressed = (key, title) => {
            const active = pressed.value === key ? "active" : "";
            return UI.interactive(this.os, UI.h("div", { class: `kate-key-button ${active}` }, [
                UI.h("div", { class: "kate-key-button-icon" }, [
                    key == null ? null : UI.icon(key),
                ]),
                UI.h("div", { class: "kate-key-button-title" }, [title]),
            ]), [
                {
                    key: ["o"],
                    on_click: true,
                    label: "Select",
                    handler: () => {
                        if (pressed.value !== key) {
                            pressed.value = key;
                        }
                    },
                },
            ], {
                focused: pressed.value === key,
            });
        };
        const result = this.os.dialog.custom("kate:settings", "gamepad-remap-dialog", [
            UI.h("div", { class: "gamepad-remap-dialog-contents" }, [
                UI.h("div", { class: "kate-hud-dialog-title" }, [title]),
                UI.dynamic(pressed.map((key) => {
                    return UI.h("div", { class: "gamepad-remap-kate-buttons" }, [
                        choose_pressed("up", "Up"),
                        choose_pressed("right", "Right"),
                        choose_pressed("down", "Down"),
                        choose_pressed("left", "Left"),
                        choose_pressed("o", "Ok"),
                        choose_pressed("x", "Cancel"),
                        choose_pressed("ltrigger", "L"),
                        choose_pressed("rtrigger", "R"),
                        choose_pressed("menu", "Menu"),
                        choose_pressed("capture", "Capture"),
                        choose_pressed(null, "None"),
                    ]);
                })),
            ]),
            UI.h("div", { class: "kate-hud-dialog-actions" }, [
                UI.h("div", { class: "kate-hud-dialog-action", "data-kind": "cancel" }, [
                    UI.button("Discard", {
                        on_clicked: () => {
                            result.resolve(false);
                        },
                    }),
                ]),
                UI.h("div", { class: "kate-hud-dialog-action", "data-kind": "primary" }, [
                    UI.button("Remap", {
                        on_clicked: () => {
                            result.resolve(true);
                        },
                    }),
                ]),
            ]),
        ], false);
        return result.promise.then((remap) => {
            if (remap) {
                return pressed.value;
            }
            else {
                return false;
            }
        });
    }
    refresh_mode() {
        this.mode.value = this.mode.value;
    }
}
exports.RemapStandardSettings = RemapStandardSettings;
function button_kind(x) {
    const pressable = x.hasAttribute("data-index");
    const haxis = x.hasAttribute("data-axis-h");
    const vaxis = x.hasAttribute("data-axis-v");
    return haxis && vaxis ? "stick" : "button";
}
class ChooseActiveGamepadSettings extends UI.SimpleScene {
    icon = "gamepad";
    title = ["Choose active gamepad"];
    actions = [
        {
            key: ["x"],
            label: "Cancel",
            handler: () => {
                this.on_return();
            },
        },
        {
            key: ["o"],
            label: "Save",
            handler: async () => {
                this.on_save();
            },
        },
    ];
    on_save = async () => {
        const paired = this._paired.value;
        if (paired == null) {
            return;
        }
        await this.os.settings.update("input", (x) => {
            return { ...x, paired_gamepad: paired.id };
        });
        await this.os.audit_supervisor.log("kate:settings", {
            resources: ["kate:settings"],
            risk: "low",
            type: "kate.settings.gamepad.updated-paired",
            message: "Updated paired gamepad",
            extra: { id: paired.id },
        });
        this.os.kernel.gamepad.pair(paired.id);
        this.close();
    };
    _last_update = null;
    _left_held_at = null;
    _right_held_at = null;
    _paired;
    constructor(os) {
        super(os);
        const paired = this.os.settings.get("input").paired_gamepad;
        this._paired = new utils_1.Observable(paired == null ? null : { id: paired, active: null });
    }
    on_attached() {
        super.on_attached();
        this.os.kernel.console.on_tick.listen(this.update_gamepads);
        this.os.kernel.gamepad.pause();
    }
    on_detached() {
        this.os.kernel.console.on_tick.remove(this.update_gamepads);
        this.os.kernel.gamepad.unpause();
        super.on_detached();
    }
    update_gamepads = (time) => {
        const has_updated = (x) => {
            if (x == null) {
                return false;
            }
            else if (this._last_update == null) {
                return true;
            }
            else {
                return x.timestamp > this._last_update;
            }
        };
        const is_pairing = (gamepad) => {
            return gamepad.buttons[4].pressed || gamepad.buttons[5].pressed;
        };
        const all_gamepads = navigator
            .getGamepads()
            .filter((x) => x != null);
        const gamepad = all_gamepads
            .filter(has_updated)
            .filter(is_pairing)
            .sort((a, b) => b.timestamp - a.timestamp)[0];
        if (gamepad != null) {
            if (gamepad.id !== this._paired.value?.id ||
                this._paired.value.active == null) {
                this._paired.value = { id: gamepad.id, active: time };
            }
        }
        else if (this._paired.value != null &&
            this._paired.value.active != null) {
            const active = this._paired.value.active;
            const elapsed = time - active;
            if (elapsed >= 1_000) {
                this._paired.value = { ...this._paired.value, active: null };
            }
        }
        const paired_update = all_gamepads
            .filter(has_updated)
            .find((x) => x.id === this._paired.value?.id);
        if (paired_update != null) {
            const is_left = (a) => a.buttons[14].pressed ||
                a.buttons[2].pressed ||
                a.axes[0] < -0.5 ||
                a.axes[2] < -0.5;
            const is_right = (a) => a.buttons[15].pressed ||
                a.buttons[1].pressed ||
                a.axes[0] > 0.5 ||
                a.axes[2] > 0.5;
            this._left_held_at = is_left(paired_update)
                ? this._left_held_at ?? time
                : null;
            this._right_held_at = is_right(paired_update)
                ? this._right_held_at ?? time
                : null;
        }
        if (this._left_held_at != null && time - this._left_held_at > 1_000) {
            this._left_held_at = null;
            this._right_held_at = null;
            this.on_return();
        }
        else if (this._right_held_at != null &&
            time - this._right_held_at > 1_000) {
            this._right_held_at = null;
            this._right_held_at = null;
            this.on_save();
        }
        this._last_update = Math.max(...all_gamepads.map((x) => x.timestamp));
    };
    body() {
        const widgets = this._paired.map((x) => {
            if (x == null) {
                return UI.h("div", {
                    class: "gamepad-choose-controller gamepad-choose-controller-inactive",
                }, [
                    UI.h("div", { class: "gamepad-choose-controller-port" }, [
                        "(No controller paired)",
                    ]),
                ]);
            }
            else {
                return UI.h("div", {
                    class: "gamepad-choose-controller",
                    "data-active": x.active != null,
                }, [
                    UI.fa_icon("gamepad", "2x", "solid", x.active != null ? "bounce" : null),
                    UI.h("div", { class: "gamepad-choose-controller-name" }, [
                        (0, gamepad_1.friendly_gamepad_id)(x.id),
                    ]),
                ]);
            }
        });
        return [
            UI.h("div", { class: "gamepad-choose-settings" }, [
                UI.h("div", { class: "gamepad-choose-message" }, [
                    "Press",
                    UI.icon("ltrigger"),
                    "or",
                    UI.icon("rtrigger"),
                    "on the gamepad to pair with Kate.",
                ]),
                UI.h("div", { class: "gamepad-choose-message", style: "font-size: 1rem" }, [
                    "On the paired gamepad, hold",
                    UI.button_icon("dpad-right"),
                    "to save, or",
                    UI.button_icon("dpad-left"),
                    "to return without changes.",
                ]),
                UI.vspace(8),
                UI.dynamic(widgets.map((x) => UI.h("div", { class: "gamepad-choose-paired" }, [x]))),
            ]),
        ];
    }
}
exports.ChooseActiveGamepadSettings = ChooseActiveGamepadSettings;
/*
export class GamepadInputSettings0 extends UI.SimpleScene {
  icon = "gamepad";
  title = ["Gamepad mappings"];

  body() {
    return [
      UI.h("div", { class: "settings-gamepad-new" }, [
        UI.p(["Checking for connected gamepads..."]),
      ]),
      UI.h("div", { class: "settings-gamepad-list" }, []),
    ];
  }

  on_attached(): void {
    super.on_attached();
    this.detect_gamepad();
    this.os.settings.on_settings_changed.listen(this.handle_settings_changed);
  }

  on_detached(): void {
    this.os.settings.on_settings_changed.remove(this.handle_settings_changed);
    super.on_detached();
  }

  handle_settings_changed = (change: ChangedSetting<keyof SettingsData>) => {
    if (change.key === "input") {
      const input = change.value as SettingsData["input"];
      this.render_gamepad_layouts(input.gamepads);
    }
  };

  render_gamepad_layouts(layouts: GamepadToKate[]) {
    const canvas = this.canvas.querySelector(".settings-gamepad-list")!;
    canvas.textContent = "";
    for (const layout of layouts) {
      UI.append(this.render_gamepad_layout(layout), canvas);
    }
  }

  render_new_layouts(gamepads: Gamepad[]) {
    const canvas = this.canvas.querySelector(".settings-gamepad-new")!;
    canvas.textContent = "";
    for (const gamepad of gamepads) {
      UI.append(this.render_new_layout(gamepad), canvas);
    }
  }

  render_new_layout(gamepad: Gamepad) {
    return UI.interactive(
      this.os,
      UI.padded_container("1x", [
        UI.text_panel({
          title: gamepad.id,
          description: `Connected on port ${gamepad.index}`,
        }),
      ]),
      [
        {
          key: ["o"],
          on_click: true,
          label: "Edit",
          handler: () => {
            this.os.push_scene(
              new StandardGamepadMappingSettings(this.os, gamepad, null)
            );
          },
        },
      ]
    );
  }

  render_gamepad_layout(layout: GamepadToKate) {
    const gamepad = this.gamepad_for_id(layout.id);
    if (gamepad == null) {
      return UI.focusable_container([
        UI.padded_container("1x", [
          UI.text_panel({
            title: layout.id,
            description: "Not connected. (Connect to edit)",
          }),
        ]),
      ]);
    } else {
      return UI.interactive(
        this.os,
        UI.padded_container("1x", [
          UI.text_panel({
            title: layout.id,
            description: `Connected on port ${gamepad.index}`,
          }),
        ]),
        [
          {
            key: ["o"],
            on_click: true,
            label: "Edit",
            handler: () => {
              this.os.push_scene(
                new StandardGamepadMappingSettings(this.os, gamepad, layout)
              );
            },
          },
          {
            key: ["menu"],
            on_menu: true,
            label: "Options",
            handler: () => {},
          },
        ]
      );
    }
  }

  gamepad_for_id(id: string) {
    const gamepad = navigator.getGamepads();
    return (
      gamepad.find((x) => x != null && x.connected === true && x.id === id) ??
      null
    );
  }

  detect_gamepad = () => {
    const gamepads = navigator.getGamepads();
    const canvas = this.canvas.querySelector(".settings-gamepad-new")!;
    if (gamepads.every((x) => x === null)) {
      canvas.textContent =
        "No gamepads connected. Connect a gamepad to configure it here.";
      setTimeout(this.detect_gamepad, 1_000);
    } else {
      canvas.textContent = "";
      const layouts = this.os.settings.get("input").gamepads;
      const existing = layouts.some((layout) => {
        return gamepads.some((g) => g != null && g.id === layout.id);
      });
      const unmapped = gamepads.flatMap((x) => {
        if (x == null || layouts.some((l) => l.id === x.id)) {
          return [];
        } else {
          return x;
        }
      });
      if (existing) {
        this.render_gamepad_layouts(layouts);
      }
      if (unmapped.length > 0) {
        this.render_new_layouts(unmapped);
      }
    }
  };
}

export class StandardGamepadMappingSettings extends UI.SimpleScene {
  icon = "gamepad";
  title = ["Configure gamepad mappings"];

  private _buttons = new Map<number, HTMLElement>();
  private _haxes = new Map<number, HTMLElement>();
  private _vaxes = new Map<number, HTMLElement>();
  private _last_update: number | null = null;

  constructor(
    os: KateOS,
    readonly gamepad: Gamepad,
    readonly layout: GamepadToKate | null
  ) {
    super(os);
  }

  body() {
    return [
      UI.h("div", { class: "standard-gamepad-frame" }, [
        UI.h(
          "div",
          { class: "standard-gamepad-left standard-gamepad-cluster" },
          [
            UI.h(
              "div",
              {
                class: "standard-gamepad-button1 standard-gamepad-button",
                "data-index": "12",
              },
              []
            ),
            UI.h(
              "div",
              {
                class: "standard-gamepad-button2 standard-gamepad-button",
                "data-index": "15",
              },
              []
            ),
            UI.h(
              "div",
              {
                class: "standard-gamepad-button3 standard-gamepad-button",
                "data-index": "13",
              },
              []
            ),
            UI.h(
              "div",
              {
                class: "standard-gamepad-button4 standard-gamepad-button",
                "data-index": "14",
              },
              []
            ),
          ]
        ),
        UI.h(
          "div",
          { class: "standard-gamepad-right standard-gamepad-cluster" },
          [
            UI.h(
              "div",
              {
                class: "standard-gamepad-button1 standard-gamepad-button",
                "data-index": "3",
              },
              []
            ),
            UI.h(
              "div",
              {
                class: "standard-gamepad-button2 standard-gamepad-button",
                "data-index": "1",
              },
              []
            ),
            UI.h(
              "div",
              {
                class: "standard-gamepad-button3 standard-gamepad-button",
                "data-index": "0",
              },
              []
            ),
            UI.h(
              "div",
              {
                class: "standard-gamepad-button4 standard-gamepad-button",
                "data-index": "2",
              },
              []
            ),
          ]
        ),
        UI.h(
          "div",
          {
            class: "standard-gamepad-special standard-gamepad-special-left",
            "data-index": "8",
          },
          []
        ),
        UI.h(
          "div",
          {
            class: "standard-gamepad-special standard-gamepad-special-center",
            "data-index": "16",
          },
          []
        ),
        UI.h(
          "div",
          {
            class: "standard-gamepad-special standard-gamepad-special-right",
            "data-index": "9",
          },
          []
        ),
        UI.h(
          "div",
          { class: "standard-gamepad-axes standard-gamepad-axes-left" },
          [
            UI.h(
              "div",
              {
                class: "standard-gamepad-joystick",
                "data-axis-h": "0",
                "data-axis-v": "1",
                "data-index": "10",
              },
              []
            ),
          ]
        ),
        UI.h(
          "div",
          { class: "standard-gamepad-axes standard-gamepad-axes-right" },
          [
            UI.h(
              "div",
              {
                class: "standard-gamepad-joystick",
                "data-axis-h": "2",
                "data-axis-v": "3",
                "data-index": "11",
              },
              []
            ),
          ]
        ),
        UI.h(
          "div",
          { class: "standard-gamepad-shoulder standard-gamepad-shoulder-left" },
          [
            UI.h(
              "div",
              {
                class:
                  "standard-gamepad-shoulder-button standard-gamepad-shoulder-button1",
                "data-index": "6",
              },
              []
            ),
            UI.h(
              "div",
              {
                class:
                  "standard-gamepad-shoulder-button standard-gamepad-shoulder-button2",
                "data-index": "4",
              },
              []
            ),
          ]
        ),
        UI.h(
          "div",
          {
            class: "standard-gamepad-shoulder standard-gamepad-shoulder-right",
          },
          [
            UI.h(
              "div",
              {
                class:
                  "standard-gamepad-shoulder-button standard-gamepad-shoulder-button1",
                "data-index": "7",
              },
              []
            ),
            UI.h(
              "div",
              {
                class:
                  "standard-gamepad-shoulder-button standard-gamepad-shoulder-button2",
                "data-index": "5",
              },
              []
            ),
          ]
        ),
      ]),
    ];
  }

  on_attached(): void {
    this.os.kernel.console.on_tick.listen(this.update_gamepad_status);
    this.os.kernel.gamepad.pause(this.gamepad);
    this._buttons = new Map();
    for (const button of Array.from(
      this.canvas.querySelectorAll("div[data-index]")
    )) {
      this._buttons.set(
        Number(button.getAttribute("data-index")),
        button as HTMLElement
      );
    }
    this._haxes = new Map();
    for (const axes of Array.from(
      this.canvas.querySelectorAll("div[data-axis-h]")
    )) {
      this._haxes.set(
        Number(axes.getAttribute("data-axis-h")),
        axes as HTMLElement
      );
    }
    this._vaxes = new Map();
    for (const axes of Array.from(
      this.canvas.querySelectorAll("div[data-axis-v]")
    )) {
      this._vaxes.set(
        Number(axes.getAttribute("data-axis-v")),
        axes as HTMLElement
      );
    }
    super.on_attached();
  }

  on_detached(): void {
    this.os.kernel.console.on_tick.remove(this.update_gamepad_status);
    this.os.kernel.gamepad.unpause(this.gamepad);
    super.on_detached();
  }

  update_gamepad_status = () => {
    const gamepad = navigator
      .getGamepads()
      .find((x) => x != null && x.id === this.gamepad.id);
    if (gamepad == null) {
      return;
    }
    if (this._last_update != null && gamepad.timestamp < this._last_update) {
      return;
    }
    for (const [key, button] of this._buttons) {
      button.classList.toggle("active", gamepad.buttons[key].pressed);
    }
    for (const [key, stick] of this._haxes) {
      stick.style.left = `${axis_to_offset(gamepad.axes[key])}%`;
    }
    for (const [key, stick] of this._vaxes) {
      stick.style.top = `${axis_to_offset(gamepad.axes[key])}%`;
    }
    this._last_update = gamepad.timestamp;
  };
}

function axis_to_offset(x: number) {
  return x * 30 + 50;
}
*/

});

// packages\kate-core\build\friendly\gamepad.js
require.define(109, "packages\\kate-core\\build\\friendly", "packages\\kate-core\\build\\friendly\\gamepad.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendly_gamepad_id = exports.friendly_product = exports.product = exports.vendor = exports.id_mapping = void 0;
exports.id_mapping = {
    "057e": {
        // Nintendo
        devices: {
            "2006": "Joy-Con (L)",
            "2007": "Joy-Con (R)",
            "2009": "Switch Pro Controller",
            "200e": "Joy-Con (L + R)",
        },
    },
    "054c": {
        // Sony
        devices: {
            "0ce6": "DualSense Wireless Controller",
        },
    },
    "045e": {
        // Microsoft/generic controllers
        devices: {
            "0b13": "XBox Wireless Controller",
            "02e0": "8BitDo SN30 pro",
        },
    },
};
function vendor(x) {
    const m = x.match(/\bvendor:\s*([0-9a-f]+)/i);
    if (m != null) {
        return m[1].toLowerCase();
    }
    else {
        return null;
    }
}
exports.vendor = vendor;
function product(x) {
    const m = x.match(/\bproduct:\s*([0-9a-f]+)/i);
    if (m != null) {
        return m[1].toLowerCase();
    }
    else {
        return null;
    }
}
exports.product = product;
function friendly_product(x) {
    const vendor_id = vendor(x);
    const product_id = product(x);
    if (vendor_id == null || product_id == null) {
        return null;
    }
    else {
        const details = exports.id_mapping[vendor_id];
        return details?.devices[product_id] ?? null;
    }
}
exports.friendly_product = friendly_product;
function friendly_gamepad_id(x) {
    return friendly_product(x) ?? x.replace(/(.*?)\(.*/, (_, name) => name);
}
exports.friendly_gamepad_id = friendly_gamepad_id;

});

// packages\kate-core\build\os\apps\settings\keyboard-input.js
require.define(110, "packages\\kate-core\\build\\os\\apps\\settings", "packages\\kate-core\\build\\os\\apps\\settings\\keyboard-input.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendly_name = exports.friendly_kbd = exports.KeyboardInputSettings = void 0;
const UI = require(59);
const utils_1 = require(5);
class KeyboardInputSettings extends UI.SimpleScene {
    icon = "keyboard";
    title = ["Keyboard mapping"];
    _mapping;
    _changed = new utils_1.Observable(false);
    _wait_key = new utils_1.Observable(null);
    constructor(os) {
        super(os);
        this._mapping = os.settings.get("input").keyboard_mapping;
    }
    on_return = async () => {
        if (this._wait_key.value != null) {
            return;
        }
        else if (this._changed.value) {
            const discard_confirm = await this.os.dialog.confirm("kate:settings", {
                title: "Discard changes?",
                message: "The changes made to the keyboard mapping have not been saved. Discard changes and leave the screen?",
                cancel: "Review changes",
                ok: "Discard changes",
                dangerous: true,
            });
            if (discard_confirm) {
                this.close();
            }
        }
        else {
            this.close();
        }
    };
    body_container(body) {
        return UI.h("div", { class: "kate-keyboard-mapping kate-os-content kate-os-screen-body" }, [...body]);
    }
    body() {
        return [
            UI.h("div", { class: "kate-keyboard-mapping-main" }, [
                UI.h("div", { class: "kate-wireframe" }, [
                    UI.h("div", { class: "kate-wireframe-dpad" }, [
                        UI.h("div", { class: "kate-wireframe-dpad-button kate-wireframe-dpad-up" }, [this.keymap("up")]),
                        UI.h("div", {
                            class: "kate-wireframe-dpad-button kate-wireframe-dpad-right",
                        }, [this.keymap("right")]),
                        UI.h("div", {
                            class: "kate-wireframe-dpad-button kate-wireframe-dpad-down",
                        }, [this.keymap("down")]),
                        UI.h("div", {
                            class: "kate-wireframe-dpad-button kate-wireframe-dpad-left",
                        }, [this.keymap("left")]),
                    ]),
                    UI.h("div", { class: "kate-wireframe-shoulder kate-wireframe-shoulder-left" }, [this.keymap("ltrigger")]),
                    UI.h("div", {
                        class: "kate-wireframe-shoulder kate-wireframe-shoulder-right",
                    }, [this.keymap("rtrigger")]),
                    UI.h("div", { class: "kate-wireframe-special kate-wireframe-special-left" }, [this.keymap("capture")]),
                    UI.h("div", { class: "kate-wireframe-special kate-wireframe-special-right" }, [this.keymap("menu")]),
                    UI.h("div", { class: "kate-wireframe-buttons" }, [
                        UI.h("div", { class: "kate-wireframe-button kate-wireframe-button-x" }, [this.keymap("x")]),
                        UI.h("div", { class: "kate-wireframe-button kate-wireframe-button-o" }, [this.keymap("o")]),
                    ]),
                ]),
            ]),
            UI.h("div", { class: "kate-keyboard-mapping-actions" }, [
                UI.text_button(this.os, "Save", {
                    primary: true,
                    on_click: async () => {
                        this.on_save();
                    },
                    enabled: this._changed,
                }),
                UI.text_button(this.os, "Cancel", {
                    on_click: async () => {
                        this.on_return();
                    },
                    enabled: this._wait_key.map((x) => !x),
                }),
                UI.text_button(this.os, "Defaults", {
                    on_click: async () => {
                        this.revert_defaults();
                    },
                }),
            ]),
        ];
    }
    revert_defaults() {
        this._mapping = this.os.settings.defaults.input.keyboard_mapping.slice();
        const keys = [
            "up",
            "right",
            "down",
            "left",
            "ltrigger",
            "rtrigger",
            "x",
            "o",
            "menu",
            "capture",
        ];
        for (const key of keys) {
            this.update_key_mapping(key, null);
        }
        for (const entry of this._mapping) {
            this.update_key_mapping(entry.button, entry.key);
        }
        this._changed.value = true;
    }
    on_save = async () => {
        await this.os.settings.update("input", (x) => {
            return { ...x, keyboard_mapping: this._mapping };
        });
        await this.os.audit_supervisor.log("kate:settings", {
            resources: ["kate:settings"],
            risk: "low",
            type: "kate.settings.keyboard.updated-mapping",
            message: "Updated keyboard mapping",
            extra: this._mapping,
        });
        this.os.kernel.keyboard.remap(this._mapping);
        this.close();
    };
    keymap(key) {
        const kbd = this._mapping.find((x) => x.button === key);
        const container = UI.h("div", { class: "kate-wireframe-mapping-button", "data-key": key }, []);
        const update = async (key) => {
            container.setAttribute("title", key ?? "");
            container.textContent = "";
            UI.append(await friendly_kbd(key), container);
        };
        update(kbd?.key ?? null);
        return UI.h("div", { class: "kate-wireframe-mapping" }, [
            UI.interactive(this.os, container, [
                {
                    key: ["o"],
                    label: "Select key",
                    on_click: true,
                    handler: async () => {
                        const waiter = this.ask_key(key);
                        this._wait_key.value = waiter;
                        const kbd_key = await waiter.promise;
                        this._wait_key.value = null;
                        if (kbd_key != null && (await this.associate(key, kbd_key))) {
                            update(kbd_key);
                            this._changed.value = true;
                        }
                    },
                    enabled: () => this._wait_key.value == null,
                },
            ]),
        ]);
    }
    async update_key_mapping(key, kbd) {
        const container = this.canvas.querySelector(`.kate-wireframe-mapping-button[data-key=${JSON.stringify(key)}]`);
        if (container != null) {
            container.setAttribute("title", kbd ?? "");
            container.textContent = "";
            UI.append(await friendly_kbd(kbd), container);
        }
    }
    async associate(key, kbd) {
        const previous = this._mapping.find((x) => x.key === kbd);
        const mapping = this._mapping.filter((x) => x.key !== kbd && x.button !== key);
        if (previous != null && previous.button !== key) {
            const should_associate = await this.os.dialog.confirm("kate:settings", {
                title: "Replace mapping?",
                message: `"${kbd}" is already associated with the virtual button "${previous.button}". Replace with "${key}"?`,
                cancel: "Keep old mapping",
                ok: "Replace",
            });
            if (should_associate) {
                this.update_key_mapping(previous.button, null);
                this._mapping = mapping.concat([
                    {
                        key: kbd,
                        button: key,
                    },
                ]);
                return true;
            }
            else {
                return false;
            }
        }
        else {
            this._mapping = mapping.concat([
                {
                    key: kbd,
                    button: key,
                },
            ]);
            return true;
        }
    }
    ask_key(key) {
        const result = (0, utils_1.defer)();
        const dialog = UI.h("div", { class: "kate-screen-dialog kate-screen-kbd-dialog" }, [
            UI.h("div", { class: "kate-screen-dialog-container" }, [
                UI.hbox(0.5, [
                    UI.h("span", {}, [
                        "Press a key in your keyboard to associate with ",
                    ]),
                    UI.icon(key),
                    UI.h("span", {}, [`(${key})`]),
                    UI.h("input", { class: "wait-for-key" }, []),
                ]),
            ]),
        ]);
        const input = dialog.querySelector("input");
        const handle_key = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            result.resolve(ev.code);
        };
        const click_cancel = (ev) => {
            ev.preventDefault();
            result.resolve(null);
        };
        const x_cancel = (key) => {
            if (key === "x") {
                result.resolve(null);
            }
        };
        const dismiss = () => {
            this.os.focus_handler.pop_root(dialog);
            dialog.remove();
            input.removeEventListener("keydown", handle_key);
            dialog.removeEventListener("click", click_cancel);
            this.os.kernel.console.on_virtual_button_touched.remove(x_cancel);
        };
        input.addEventListener("keydown", handle_key);
        dialog.addEventListener("click", click_cancel);
        this.os.kernel.console.on_virtual_button_touched.listen(x_cancel);
        this.canvas.append(dialog);
        input.focus();
        this.os.focus_handler.push_root(dialog);
        result.promise.finally(() => {
            dismiss();
        });
        return result;
    }
}
exports.KeyboardInputSettings = KeyboardInputSettings;
async function friendly_kbd(x) {
    if (x == null) {
        return null;
    }
    if (navigator.keyboard != null) {
        const layout = await navigator.keyboard.getLayoutMap();
        return layout.get(x) ?? exports.friendly_name[x] ?? x;
    }
    else {
        return exports.friendly_name[x] ?? x;
    }
}
exports.friendly_kbd = friendly_kbd;
exports.friendly_name = Object.assign(Object.create(null), {
    ArrowLeft: UI.fa_icon("arrow-left"),
    ArrowRight: UI.fa_icon("arrow-right"),
    ArrowUp: UI.fa_icon("arrow-up"),
    ArrowDown: UI.fa_icon("arrow-down"),
    KeyQ: "Q",
    KeyW: "W",
    KeyE: "E",
    KeyR: "R",
    KeyT: "T",
    KeyY: "Y",
    KeyU: "U",
    KeyI: "I",
    KeyO: "O",
    KeyP: "P",
    KeyA: "A",
    KeyS: "S",
    KeyD: "D",
    KeyF: "F",
    KeyG: "G",
    KeyH: "H",
    KeyJ: "J",
    KeyL: "L",
    KeyK: "K",
    KeyN: "N",
    KeyM: "M",
    KeyB: "B",
    KeyV: "V",
    KeyC: "C",
    KeyX: "X",
    KeyZ: "Z",
    Delete: "Delete",
    End: "End",
    PageDown: "PgDn",
    PageUp: "PgUp",
    Insert: "Insert",
    Home: "Home",
    Enter: "Enter",
    Backspace: UI.fa_icon("delete-left"),
    Digit0: "0",
    Digit9: "9",
    Digit8: "8",
    Digit7: "7",
    Digit6: "6",
    Digit5: "5",
    Digit4: "4",
    Digit3: "3",
    Digit2: "2",
    Digit1: "1",
    Tab: "Tab",
    CapsLock: "CapsLock",
    ShiftLeft: "L Shift",
    ControlLeft: "L Ctrl",
    MetaLeft: "L Meta",
    AltLeft: "L Alt",
    Space: "Space",
    AltRight: "R Alt",
    ControlRight: "R Ctrl",
    ShiftRight: "R Shift",
    ContextMenu: "Context",
    MetaRight: "R Meta",
    NumpadDecimal: "Np .",
    NumpadEnter: "Np Enter",
    Numpad0: "Np 0",
    Numpad1: "Np 1",
    Numpad2: "Np 2",
    Numpad3: "Np 3",
    Numpad4: "Np 4",
    Numpad5: "Np 5",
    Numpad6: "Np 6",
    Numpad7: "Np 7",
    Numpad8: "Np 8",
    Numpad9: "Np 9",
    NumpadAdd: "Np +",
    NumpadDivide: "Np /",
    NumpadMultiply: "Np *",
    NumpadSubtract: "Np -",
    F1: "F1",
    F2: "F2",
    F3: "F3",
    F4: "F4",
    F5: "F5",
    F6: "F6",
    F7: "F7",
    F8: "F8",
    F9: "F9",
    F10: "F10",
    F11: "F11",
    F12: "F12",
    Escape: "Escape",
});

});

// packages\kate-core\build\os\apps\settings\play-habits.js
require.define(111, "packages\\kate-core\\build\\os\\apps\\settings", "packages\\kate-core\\build\\os\\apps\\settings\\play-habits.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenePlayHabitsSettings = void 0;
const utils_1 = require(5);
const UI = require(59);
class ScenePlayHabitsSettings extends UI.SimpleScene {
    icon = "calendar";
    title = ["Play habits"];
    body() {
        const data = this.os.settings.get("play_habits");
        const play_habit_list = UI.h("div", { class: "play-habit-history" }, []);
        this.load_history(play_habit_list);
        return [
            UI.p([
                `Kate stores data about the cartridges you play. This allows
         you to sort and filter cartridges by recency and usage time in
         your library.`,
            ]),
            UI.p([
                `The data is only stored in your device, but you can still disable
         any collection of this data here. You can also remove any previously
         stored data.`,
            ]),
            UI.vspace(32),
            UI.toggle_cell(this.os, {
                value: data.recently_played,
                title: "Record last played time",
                description: "Track and store (locally) the last time you played a cartridge.",
                on_changed: this.handle_last_played_change,
            }),
            UI.toggle_cell(this.os, {
                value: data.play_times,
                title: "Record total play time",
                description: "Track and store (locally) how many minutes you've played a cartridge.",
                on_changed: this.handle_play_time_change,
            }),
            UI.vspace(16),
            UI.button_panel(this.os, {
                title: "Delete all stored play habits",
                description: "Remove habits of uninstalled games, reset habits of installed games.",
                on_click: this.handle_delete,
                dangerous: true,
            }),
            UI.vspace(32),
            UI.h("h3", {}, ["Stored play habits"]),
            play_habit_list,
        ];
    }
    async load_history(container) {
        container.textContent = "";
        const items = [];
        const carts = new Map((await this.os.cart_manager.list_all()).map((x) => [x.id, x]));
        const all_habits = await this.os.play_habits.all_in_database();
        const history = all_habits.map((x) => {
            const cart = carts.get(x.id) ?? null;
            return {
                id: x.id,
                installed: cart != null,
                title: cart?.metadata.presentation.title ?? x.id,
                play_time: x.play_time,
                last_played: x.last_played,
            };
        });
        for (const entry of history) {
            items.push(UI.interactive(this.os, UI.padded_container("s", [
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
                            : `Played for ${(0, utils_1.coarse_time_from_minutes)(entry.play_time)}`,
                        UI.h("br", {}, []),
                        entry.last_played === null
                            ? "No play date recorded"
                            : `Last played ${(0, utils_1.relative_date)(entry.last_played)}`,
                    ]),
                }),
            ]), [
                {
                    key: ["menu"],
                    label: "Options",
                    on_menu: true,
                    handler: () => {
                        this.handle_play_entry_options(entry);
                    },
                },
            ]));
        }
        UI.append(new UI.VBox(1, [...items]), container);
    }
    handle_play_entry_options = async (entry) => {
        const result = await this.os.dialog.pop_menu("kate:settings", `${entry.title}`, [
            {
                label: "Delete play habits",
                value: "delete",
            },
        ], null);
        switch (result) {
            case "delete": {
                await this.os.play_habits.remove_one(entry.id, !entry.installed);
                await this.os.audit_supervisor.log("kate:settings", {
                    resources: ["kate:habits"],
                    risk: "low",
                    type: "kate.habits.deleted.one",
                    message: `Play habits deleted for ${entry.id}`,
                    extra: { cartridge: entry.id },
                });
                await this.load_history(this.canvas.querySelector(".play-habit-history"));
                return;
            }
        }
    };
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
            await this.os.play_habits.remove_all();
            await this.os.audit_supervisor.log("kate:settings", {
                resources: ["kate:habits"],
                risk: "low",
                type: "kate.habits.deleted.all",
                message: "Play habits deleted for all cartridges",
            });
            await this.load_history(this.canvas.querySelector(".play-habit-history"));
        }
    };
    handle_last_played_change = async (x) => {
        await this.os.settings.update("play_habits", (v) => ({
            ...v,
            recently_played: x,
        }));
        await this.os.audit_supervisor.log("kate:settings", {
            resources: ["kate:settings"],
            risk: "low",
            type: "kate.settings.habits.updated",
            message: "Updated play habits tracking settings",
            extra: { track_recently_played: x },
        });
    };
    handle_play_time_change = async (x) => {
        await this.os.settings.update("play_habits", (v) => ({
            ...v,
            play_times: x,
        }));
        await this.os.audit_supervisor.log("kate:settings", {
            resources: ["kate:settings"],
            risk: "low",
            type: "kate.settings.habits.updated",
            message: "Updated play habits tracking settings",
            extra: { track_total_play_time: x },
        });
    };
}
exports.ScenePlayHabitsSettings = ScenePlayHabitsSettings;

});

// packages\kate-core\build\os\apps\settings\recovery.js
require.define(112, "packages\\kate-core\\build\\os\\apps\\settings", "packages\\kate-core\\build\\os\\apps\\settings\\recovery.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneRecovery = void 0;
const UI = require(59);
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
            UI.when(this.os.kernel.console.options.mode === "web" &&
                this.os.app_resources.worker != null, [
                UI.button_panel(this.os, {
                    title: "Refresh cache",
                    description: "Update all cached resources to the current version. The application will reload afterwards.",
                    on_click: this.refresh_cache,
                    dangerous: false,
                }),
            ]),
            UI.vdivider(),
            UI.button_panel(this.os, {
                title: "Restore default settings",
                description: "Switch all settings back to the default ones.",
                on_click: this.restore_default_settings,
                dangerous: true,
            }),
            UI.vdivider(),
            UI.button_panel(this.os, {
                title: "Delete all data",
                description: `Delete ALL data locally stored in the console. The application will reload
          afterwards.`,
                on_click: this.delete_all_data,
                dangerous: true,
            }),
        ];
    }
    restore_default_settings = async () => {
        const should_reset = await this.os.dialog.confirm("kate:recovery", {
            title: "Restore to default settings?",
            message: `This will remove all of your custom configuration and reset Kate to
       its original configuration. The operation is irreversible.`,
            dangerous: true,
            cancel: "Keep my configuration",
            ok: "Reset to defaults",
        });
        if (!should_reset) {
            return;
        }
        await this.os.dialog.progress("kate:recovery", "Restoring default settings", async (progress) => {
            await this.os.settings.reset_to_defaults();
        });
        await this.os.dialog.message("kate:recovery", {
            title: "",
            message: "All settings reverted to defaults.",
        });
    };
    refresh_cache = async () => {
        try {
            await this.os.dialog.progress("kate:recovery", "Refreshing cache", async (progress) => {
                await this.os.app_resources.refresh_cache();
            });
            location.reload();
        }
        catch (error) {
            console.error(`[Kate] failed to refresh cache:`, error);
            await this.os.dialog.message("kate:recovery", {
                title: "Failed to refresh cache",
                message: `Kate's cache could not be refreshed.`,
            });
        }
    };
    delete_all_data = async () => {
        const should_delete = await this.os.dialog.confirm("kate:recovery", {
            title: "Remove all console data?",
            message: `This will delete all data stored in the console, including
      cartridge files, save data, screenshots, and settings. When Kate reloads
      it'll be as if you were running it for the first time. This is an
      irreversible operation.`,
            dangerous: true,
            cancel: "Keep my data",
            ok: "Delete all data",
        });
        if (!should_delete) {
            return;
        }
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

// packages\kate-core\build\os\apps\settings\ui.js
require.define(113, "packages\\kate-core\\build\\os\\apps\\settings", "packages\\kate-core\\build\\os\\apps\\settings\\ui.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneUISettings = void 0;
const utils_1 = require(5);
const UI = require(59);
class SceneUISettings extends UI.SimpleScene {
    icon = "window-maximize";
    title = ["User Interface"];
    async can_change_display_mode() {
        switch (this.os.kernel.console.options.mode) {
            case "native":
                return !(await KateNative?.is_fullscreen());
            case "single":
                return false;
            case "web":
                return true;
        }
    }
    get supports_fullscreen() {
        return this.os.kernel.console.options.mode !== "native";
    }
    get supports_scale_to_fit() {
        return this.os.kernel.console.options.mode !== "native";
    }
    async body() {
        const data = this.os.settings.get("ui");
        const configurable_display = await this.can_change_display_mode();
        const kase = new utils_1.Observable(configurable_display ? data.case_type : this.os.kernel.console.raw_case);
        return [
            UI.toggle_cell(this.os, {
                value: data.sound_feedback,
                title: "Audio feedback for buttons",
                description: "Play a sound when you interact with the UI using buttons",
                on_changed: (v) => {
                    this.change("sound_feedback", v);
                    this.os.sfx.set_enabled(v);
                },
            }),
            UI.toggle_cell(this.os, {
                value: data.animation_effects,
                title: "Animation effects",
                description: "Enable motion-based effects; OS settings have precedence",
                on_changed: (v) => {
                    this.change("animation_effects", v);
                    this.os.set_os_animation(v);
                },
            }),
            UI.vspace(32),
            UI.h("h3", {}, ["Display mode"]),
            UI.when(configurable_display, [
                UI.h("div", { class: "kate-os-mode-choices" }, [
                    UI.hchoices(3, [
                        this.mode_button(kase, {
                            mode: "handheld",
                            title: "Handheld mode",
                            image: "img/handheld-mode.png",
                        }),
                        this.mode_button(kase, {
                            mode: "tv",
                            title: "TV mode",
                            image: "img/tv-mode.png",
                        }),
                        UI.when(this.supports_fullscreen, [
                            this.mode_button(kase, {
                                mode: "fullscreen",
                                title: "Fullscreen mode",
                                image: "img/fullscreen-mode.png",
                            }),
                        ]),
                    ]),
                ]),
                UI.vspace(16),
            ]),
            UI.link_card(this.os, {
                arrow: "pencil",
                click_label: "Change",
                title: "Resolution",
                description: "The size Kate's contents are rendered in",
                value: UI.dynamic(kase.map((x) => friendly_resolution(x.resolution))),
                on_click: () => {
                    this.select_resolution(kase);
                },
            }),
            UI.when(this.supports_scale_to_fit, [
                UI.toggle_cell(this.os, {
                    title: "Scale to fit screen",
                    description: "Scale Kate up to fit the whole screen, might result in blurry images",
                    value: kase.map((x) => x.scale_to_fit),
                    on_label: "Yes",
                    off_label: "No",
                    on_changed: (x) => {
                        this.set_case(kase, { ...kase.value, scale_to_fit: x });
                    },
                }),
            ]),
        ];
    }
    async select_resolution(current) {
        const available = current.value.type === "handheld"
            ? [480]
            : [480, 720];
        const result = await this.os.dialog.pop_menu("kate:settings", "Display resolution", available.map((x) => ({
            label: friendly_resolution(x),
            value: x,
        })), null);
        if (result == null) {
            return;
        }
        this.set_case(current, {
            type: current.value.type,
            resolution: result,
            scale_to_fit: current.value.scale_to_fit,
        });
    }
    async set_case(current, kase) {
        this.os.kernel.console.set_case(kase);
        current.value = kase;
        if (await this.can_change_display_mode()) {
            await this.os.settings.update("ui", (x) => {
                return { ...x, case_type: kase };
            });
            await this.os.audit_supervisor.log("kate:settings", {
                resources: ["kate:settings"],
                risk: "low",
                type: "kate.settings.ui.updated",
                message: "Updated display mode",
                extra: { case_type: kase },
            });
        }
    }
    async change(key, value) {
        await this.os.settings.update("ui", (x) => {
            return { ...x, [key]: value };
        });
        await this.os.audit_supervisor.log("kate:settings", {
            resources: ["kate:settings"],
            risk: "low",
            type: "kate.settings.ui.updated",
            message: "Updated UI settings",
            extra: { [key]: value },
        });
    }
    mode_button(kase, x) {
        return UI.choice_button(this.os, UI.vbox(1, [UI.image(x.image), UI.h("div", {}, [x.title])]), {
            selected: kase.map((k) => k.type === x.mode),
            on_select: () => {
                this.set_case(kase, case_defaults(x.mode));
            },
        });
    }
}
exports.SceneUISettings = SceneUISettings;
function friendly_resolution(height) {
    const BASE_WIDTH = 800;
    const BASE_HEIGHT = 480;
    const factor = height / BASE_HEIGHT;
    return `${BASE_WIDTH * factor} x ${BASE_HEIGHT * factor}`;
}
function case_defaults(type) {
    switch (type) {
        case "handheld": {
            return { type: "handheld", resolution: 480, scale_to_fit: false };
        }
        case "tv": {
            return { type: "tv", resolution: 720, scale_to_fit: false };
        }
        case "fullscreen": {
            return { type: "fullscreen", resolution: 720, scale_to_fit: true };
        }
        default:
            throw (0, utils_1.unreachable)(type, "case type");
    }
}

});

// packages\kate-core\build\os\apis\notification.js
require.define(114, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\notification.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_Toaster = exports.KateNotification = void 0;
const scenes_1 = require(55);
const UI = require(59);
const Db = require(32);
const time_1 = require(52);
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
        this.hud.show(title, message);
    }
    async log(process_id, title, message, allow_failures = false) {
        try {
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
        catch (error) {
            console.error(`[Kate] failed to store audit log:`, error, {
                process_id,
                title,
                message,
            });
            if (!allow_failures) {
                throw error;
            }
        }
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
        super(manager.os, true);
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
require.define(115, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\drop-installer.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_DropInstaller = exports.KateDropInstaller = void 0;
const scenes_1 = require(55);
const UI = require(59);
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
        super(manager.os, true);
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
require.define(116, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\focus-handler.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateFocusHandler = void 0;
const utils_1 = require(5);
class KateFocusHandler {
    os;
    _stack = [];
    _current_root = null;
    _previous_traps = null;
    _handlers = [];
    on_focus_changed = new utils_1.EventStream();
    on_traps_changed = new utils_1.EventStream();
    interactives = new WeakMap();
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
    register_interactive(element, interactions) {
        this.interactives.set(element, interactions);
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
        if (this._current_root != null) {
            this._stack.push(this._current_root);
        }
        this._current_root = element;
        this.on_focus_changed.emit(element);
        if (element != null && element.querySelector(".focus") == null) {
            this.refocus();
        }
    }
    pop_root(expected) {
        if (expected === this._current_root) {
            this._current_root = this._stack.pop() ?? null;
            this.on_focus_changed.emit(this._current_root);
            this.focus(this.current_focus);
        }
        else {
            const popped = this._stack.findIndex((x) => x === expected);
            if (popped === -1) {
                console.warn(`[Kate] pop_root() called with inactive root.`, expected);
                return;
            }
            this._stack.splice(popped, 1);
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
        const current_focus = this.current_focus;
        if (current_focus != null) {
            const traps = this.interactives.get(current_focus);
            if (traps != null) {
                const trap = traps.handlers.find((x) => x.key.includes(key) &&
                    (!is_repeat || x.allow_repeat) &&
                    (x.enabled == null || x.enabled()));
                if (trap != null) {
                    trap.handler(key, is_repeat);
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
        const focusable = Array.from(this._current_root.querySelectorAll(".kate-ui-focus-target")).map((x) => {
            const rect = x.getBoundingClientRect();
            return {
                element: x,
                position: {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    right: rect.right,
                    bottom: rect.bottom,
                },
            };
        });
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
    refocus(container) {
        if (this.current_focus != null || this._current_root == null) {
            return;
        }
        const root = container ?? this._current_root;
        const candidates0 = Array.from(root.querySelectorAll(".kate-ui-focus-target"));
        const candidates1 = candidates0.map((x) => [x.getBoundingClientRect(), x]);
        const candidates = candidates1.sort(([ra, _], [rb, __]) => ra.top - rb.top);
        const candidate = candidates[0]?.[1];
        this.focus(candidate);
    }
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
        const traps = this.interactives.get(element) ?? null;
        if (traps === this._previous_traps) {
            return;
        }
        this._previous_traps = traps;
        if (traps != null) {
            this.on_traps_changed.emit(traps);
        }
        else {
            this.on_traps_changed.emit(null);
        }
    }
}
exports.KateFocusHandler = KateFocusHandler;

});

// packages\kate-core\build\os\apis\status-bar.js
require.define(117, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\status-bar.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateStatus = exports.HUD_StatusBar = exports.KateStatusBar = void 0;
const ui_1 = require(59);
const scenes_1 = require(55);
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
        super(manager.os, true);
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

// packages\kate-core\build\os\ipc\index.js
require.define(118, "packages\\kate-core\\build\\os\\ipc", "packages\\kate-core\\build\\os\\ipc\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(119), exports);

});

// packages\kate-core\build\os\ipc\ipc.js
require.define(119, "packages\\kate-core\\build\\os\\ipc", "packages\\kate-core\\build\\os\\ipc\\ipc.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateIPCChannel = exports.KateIPCServer = void 0;
const handlers_1 = require(120);
const utils_1 = require(5);
const capture_1 = require(121);
const cart_fs_1 = require(122);
const notification_1 = require(123);
const object_storage_1 = require(124);
const special_1 = require(125);
const browser_1 = require(126);
const device_file_1 = require(127);
const cart_manager_1 = require(128);
const dialog_1 = require(129);
class KateIPCServer {
    os;
    _handlers = new Map();
    _messages;
    _initialised = false;
    TRACE_MESSAGES = false;
    constructor(os) {
        this.os = os;
        this._messages = new Map();
        this.add_handlers(capture_1.default);
        this.add_handlers(cart_fs_1.default);
        this.add_handlers(notification_1.default);
        this.add_handlers(object_storage_1.default);
        this.add_handlers(special_1.default);
        this.add_handlers(browser_1.default);
        this.add_handlers(device_file_1.default);
        this.add_handlers(cart_manager_1.default);
        this.add_handlers(dialog_1.default);
    }
    add_handlers(handlers) {
        for (const handler of handlers) {
            this._messages.set(handler.type, handler);
        }
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
            if (this.TRACE_MESSAGES) {
                console.debug("kate-ipc <==", { type, id, payload });
            }
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
                    if (this.TRACE_MESSAGES) {
                        console.debug("kate-ipc ==>", { id, ok: true, value: result });
                    }
                    handler.frame.contentWindow?.postMessage({
                        type: "kate:reply",
                        id: id,
                        ok: true,
                        value: result,
                    }, "*");
                }
                catch (error) {
                    console.error(`[Kate] Error handling ${type}`, {
                        payload,
                        error,
                    });
                    handler.frame.contentWindow?.postMessage({
                        type: "kate:reply",
                        id: id,
                        ok: false,
                        value: {
                            code: "kate.unknown-error",
                            type: type,
                            payload: payload,
                        },
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
            await this.os.processes.terminate(handler.cart.id, "kate:ipc", "suspicious IPC activity");
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
        const handler = this._messages.get(message.type);
        if (handler == null) {
            throw new Error(`No handler for ${message.type}`);
        }
        const payload = utils_1.TC.parse(handler.parser, message.payload);
        for (const capability of handler.auth.capabilities) {
            if (!(await this.os.capability_supervisor.is_allowed(env.cart.id, capability.type, capability.configuration ?? {}))) {
                console.error(`[kate:ipc] Denied ${env.cart.id} access to ${message.type}: missing ${capability.type}`, message);
                if (handler.auth.fail_silently) {
                    return null;
                }
                else {
                    throw new handlers_1.EMessageFailed("kate.ipc.access-denied", `Operation not allowed`);
                }
            }
        }
        return await handler.handler(this.os, env, this, payload, message);
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

// packages\kate-core\build\os\ipc\handlers.js
require.define(120, "packages\\kate-core\\build\\os\\ipc", "packages\\kate-core\\build\\os\\ipc\\handlers.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth_handler = exports.handler = exports.EMessageFailed = void 0;
class EMessageFailed extends Error {
    name;
    constructor(name, message) {
        super(message);
        this.name = name;
    }
}
exports.EMessageFailed = EMessageFailed;
function handler(type, parser, handler) {
    return {
        type,
        parser: parser,
        auth: {
            fail_silently: false,
            capabilities: [],
        },
        handler: handler,
    };
}
exports.handler = handler;
function auth_handler(type, parser, auth, handler) {
    return {
        type,
        parser: parser,
        auth: {
            fail_silently: auth.fail_silently ?? false,
            capabilities: auth.capabilities,
        },
        handler: handler,
    };
}
exports.auth_handler = auth_handler;

});

// packages\kate-core\build\os\ipc\capture.js
require.define(121, "packages\\kate-core\\build\\os\\ipc", "packages\\kate-core\\build\\os\\ipc\\capture.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const handlers_1 = require(120);
const utils_1 = require(5);
exports.default = [
    (0, handlers_1.handler)("kate:capture.save-image", utils_1.TC.spec({
        data: utils_1.TC.instance_of(Uint8Array),
        type: utils_1.TC.str,
        token: utils_1.TC.str,
    }), async (os, env, ipc, payload, message) => {
        await ipc.consume_capture_token(payload.token, env, message);
        try {
            os.sfx.play("shutter");
            await os.capture.save_screenshot(env.cart.id, payload.data, payload.type);
        }
        catch (error) {
            console.debug(`[Kate] failed to save screenshot`, error);
            os.notifications.push_transient("kate:capture", "Failed to save screenshot", "");
            throw new handlers_1.EMessageFailed("kate.capture.failed", "Failed to save screenshot");
        }
        return null;
    }),
    (0, handlers_1.handler)("kate:capture.start-recording", utils_1.TC.spec({}), async (os, env) => {
        os.kernel.console.take_resource("screen-recording");
        await os.audit_supervisor.log(env.cart.id, {
            resources: ["kate:capture"],
            risk: "low",
            type: "kate.capture.recording-started",
            message: `Screen recording started`,
        });
        await os.notifications.push_transient(env.cart.id, "Screen recording started", "");
        return null;
    }),
    (0, handlers_1.handler)("kate:capture.save-recording", utils_1.TC.spec({
        data: utils_1.TC.instance_of(Uint8Array),
        type: utils_1.TC.str,
        token: utils_1.TC.str,
    }), async (os, env, ipc, payload, message) => {
        await ipc.consume_capture_token(payload.token, env, message);
        try {
            os.kernel.console.release_resource("screen-recording");
            await os.capture.save_video(env.cart.id, payload.data, payload.type);
        }
        catch (error) {
            console.debug(`[Kate] failed to save recording`, error);
            os.notifications.push_transient("kate:capture", "Failed to save screen recording", "");
            throw new handlers_1.EMessageFailed(`kate.capture.failed`, "Failed to save recording");
        }
        return null;
    }),
];

});

// packages\kate-core\build\os\ipc\cart_fs.js
require.define(122, "packages\\kate-core\\build\\os\\ipc", "packages\\kate-core\\build\\os\\ipc\\cart_fs.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const handlers_1 = require(120);
const utils_1 = require(5);
exports.default = [
    (0, handlers_1.handler)("kate:cart.read-file", utils_1.TC.spec({ path: utils_1.TC.str }), async (os, env, ipc, { path }) => {
        try {
            const file = await env.read_file(path);
            return { mime: file.mime, bytes: file.data };
        }
        catch (error) {
            console.error(`[Kate] failed to read file ${path} from ${env.cart.id}`);
            throw new handlers_1.EMessageFailed("kate.cart-fs.file-not-found", `Failed to read file ${path}`);
        }
    }),
];

});

// packages\kate-core\build\os\ipc\notification.js
require.define(123, "packages\\kate-core\\build\\os\\ipc", "packages\\kate-core\\build\\os\\ipc\\notification.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require(5);
const handlers_1 = require(120);
exports.default = [
    (0, handlers_1.handler)("kate:notify.transient", utils_1.TC.spec({
        title: utils_1.TC.str,
        message: utils_1.TC.str,
    }), async (os, env, ipc, { title, message }) => {
        await os.notifications.push_transient(env.cart.id, title, message);
        return null;
    }),
];

});

// packages\kate-core\build\os\ipc\object-storage.js
require.define(124, "packages\\kate-core\\build\\os\\ipc", "packages\\kate-core\\build\\os\\ipc\\object-storage.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bucket_name = exports.public_repr = void 0;
const utils_1 = require(5);
const handlers_1 = require(120);
exports.public_repr = {
    bucket: (x) => {
        return {
            name: x.bucket.bucket_name,
            created_at: x.bucket.created_at,
        };
    },
    storage_entry: (x) => {
        return {
            key: x.key,
            created_at: x.created_at,
            updated_at: x.updated_at,
            type: x.type,
            size: x.size,
            metadata: x.metadata,
        };
    },
    storage_entry_with_data: (x) => {
        return {
            key: x.key,
            created_at: x.created_at,
            updated_at: x.updated_at,
            type: x.type,
            size: x.size,
            metadata: x.metadata,
            data: x.data,
        };
    },
    storage_usage: (x) => {
        return {
            limits: {
                size_in_bytes: x.maximum_size_in_bytes,
                buckets: x.maximum_buckets_in_storage,
                entries: x.maximum_items_in_storage,
            },
            usage: {
                size_in_bytes: x.current_size_in_bytes,
                buckets: x.current_buckets_in_storage,
                entries: x.current_items_in_storage,
            },
        };
    },
};
exports.bucket_name = utils_1.TC.short_str(255);
exports.default = [
    (0, handlers_1.handler)("kate:store.list-buckets", utils_1.TC.spec({ versioned: utils_1.TC.bool, count: utils_1.TC.optional(undefined, utils_1.TC.int) }), async (os, env, ipc, { versioned, count }) => {
        const store = os.object_store.cartridge(env.cart, versioned);
        const buckets = await store.list_buckets(count);
        return buckets.map(exports.public_repr.bucket);
    }),
    (0, handlers_1.handler)("kate:store.add-bucket", utils_1.TC.spec({ versioned: utils_1.TC.bool, name: exports.bucket_name }), async (os, env, ipc, { versioned, name }) => {
        const store = os.object_store.cartridge(env.cart, versioned);
        await store.add_bucket(name);
        return null;
    }),
    (0, handlers_1.handler)("kate:store.ensure-bucket", utils_1.TC.spec({ versioned: utils_1.TC.bool, name: exports.bucket_name }), async (os, env, ipc, { versioned, name }) => {
        const store = os.object_store.cartridge(env.cart, versioned);
        await store.ensure_bucket(name);
        return null;
    }),
    (0, handlers_1.handler)("kate:store.delete-bucket", utils_1.TC.spec({ versioned: utils_1.TC.bool, name: exports.bucket_name }), async (os, env, ipc, { versioned, name }) => {
        const store = os.object_store.cartridge(env.cart, versioned);
        const bucket = await store.get_bucket(name);
        await bucket.delete_bucket();
        return null;
    }),
    (0, handlers_1.handler)("kate:store.count-entries", utils_1.TC.spec({
        versioned: utils_1.TC.bool,
        bucket_name: exports.bucket_name,
    }), async (os, env, ipc, { versioned, bucket_name }) => {
        const store = os.object_store.cartridge(env.cart, versioned);
        const bucket = await store.get_bucket(bucket_name);
        return await bucket.count();
    }),
    (0, handlers_1.handler)("kate:store.list-entries", utils_1.TC.spec({
        versioned: utils_1.TC.bool,
        bucket_name: exports.bucket_name,
        count: utils_1.TC.optional(undefined, utils_1.TC.int),
    }), async (os, env, ipc, { versioned, bucket_name, count }) => {
        const store = os.object_store.cartridge(env.cart, versioned);
        const bucket = await store.get_bucket(bucket_name);
        const entries = await bucket.list_metadata(count);
        return entries.map(exports.public_repr.storage_entry);
    }),
    (0, handlers_1.handler)("kate:store.read", utils_1.TC.spec({
        versioned: utils_1.TC.bool,
        bucket_name: exports.bucket_name,
        key: utils_1.TC.str,
    }), async (os, env, ipc, { versioned, bucket_name, key }) => {
        const store = os.object_store.cartridge(env.cart, versioned);
        const bucket = await store.get_bucket(bucket_name);
        const entry = await bucket.read(key);
        return exports.public_repr.storage_entry_with_data(entry);
    }),
    (0, handlers_1.handler)("kate:store.try-read", utils_1.TC.spec({
        versioned: utils_1.TC.bool,
        bucket_name: exports.bucket_name,
        key: utils_1.TC.str,
    }), async (os, env, ipc, { versioned, bucket_name, key }) => {
        const store = os.object_store.cartridge(env.cart, versioned);
        const bucket = await store.get_bucket(bucket_name);
        const entry = await bucket.try_read(key);
        return entry == null ? null : exports.public_repr.storage_entry_with_data(entry);
    }),
    (0, handlers_1.handler)("kate:store.write", utils_1.TC.spec({
        versioned: utils_1.TC.bool,
        bucket_name: exports.bucket_name,
        key: utils_1.TC.str,
        type: utils_1.TC.str,
        metadata: utils_1.TC.dictionary(utils_1.TC.anything()),
        data: utils_1.TC.anything(),
    }), async (os, env, ipc, { versioned, bucket_name, key, type, metadata, data }) => {
        const store = os.object_store.cartridge(env.cart, versioned);
        const bucket = await store.get_bucket(bucket_name);
        await bucket.write(key, {
            type: type,
            metadata: metadata,
            data: data,
        });
        return null;
    }),
    (0, handlers_1.handler)("kate:store.create", utils_1.TC.spec({
        versioned: utils_1.TC.bool,
        bucket_name: exports.bucket_name,
        key: utils_1.TC.str,
        type: utils_1.TC.str,
        metadata: utils_1.TC.dictionary(utils_1.TC.anything()),
        data: utils_1.TC.anything(),
    }), async (os, env, ipc, { versioned, bucket_name, key, type, metadata, data }) => {
        const store = os.object_store.cartridge(env.cart, versioned);
        const bucket = await store.get_bucket(bucket_name);
        await bucket.create(key, {
            type: type,
            metadata: metadata,
            data: data,
        });
        return null;
    }),
    (0, handlers_1.handler)("kate:store.delete", utils_1.TC.spec({
        versioned: utils_1.TC.bool,
        bucket_name: exports.bucket_name,
        key: utils_1.TC.str,
    }), async (os, env, ipc, { versioned, bucket_name, key }) => {
        const store = os.object_store.cartridge(env.cart, versioned);
        const bucket = await store.get_bucket(bucket_name);
        await bucket.delete(key);
        return null;
    }),
    (0, handlers_1.handler)("kate:store.usage", utils_1.TC.spec({
        versioned: utils_1.TC.bool,
    }), async (os, env, ipc, { versioned }) => {
        const store = os.object_store.cartridge(env.cart, versioned);
        const usage = await store.usage();
        return exports.public_repr.storage_usage(usage);
    }),
];

});

// packages\kate-core\build\os\ipc\special.js
require.define(125, "packages\\kate-core\\build\\os\\ipc", "packages\\kate-core\\build\\os\\ipc\\special.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require(5);
const handlers_1 = require(120);
exports.default = [
    (0, handlers_1.handler)("kate:special.focus", utils_1.TC.anything(), async () => {
        window.focus();
        return null;
    }),
];

});

// packages\kate-core\build\os\ipc\browser.js
require.define(126, "packages\\kate-core\\build\\os\\ipc", "packages\\kate-core\\build\\os\\ipc\\browser.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const handlers_1 = require(120);
const utils_1 = require(5);
exports.default = [
    (0, handlers_1.auth_handler)("kate:browser.open", utils_1.TC.spec({ url: utils_1.TC.url }), {
        fail_silently: true,
        capabilities: [{ type: "open-urls" }],
    }, async (os, env, ipc, { url }) => {
        try {
            await os.fairness_supervisor.with_resource(env.cart.id, "modal-dialog", async () => {
                await os.browser.open(env.cart.id, url);
            });
        }
        catch (error) {
            console.error(`Failed to open ${url} at the request of ${env.cart.id}:`, error);
        }
        return null;
    }),
    (0, handlers_1.auth_handler)("kate:browser.download", utils_1.TC.spec({ filename: utils_1.TC.short_str(255), data: utils_1.TC.bytearray }), {
        fail_silently: true,
        capabilities: [{ type: "download-files" }],
    }, async (os, env, ipc, { filename, data }) => {
        try {
            await os.fairness_supervisor.with_resource(env.cart.id, "modal-dialog", async () => {
                await os.browser.download(env.cart.id, filename, data);
            });
        }
        catch (error) {
            console.error(`Failed to download ${filename} at the request of ${env.cart.id}:`, error);
        }
        return null;
    }),
];

});

// packages\kate-core\build\os\ipc\device-file.js
require.define(127, "packages\\kate-core\\build\\os\\ipc", "packages\\kate-core\\build\\os\\ipc\\device-file.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateDeviceFileIPC = void 0;
const utils_1 = require(5);
const handlers_1 = require(120);
class KateDeviceFileIPC {
    _handles = new WeakMap();
    expose(env, handle) {
        const id = (0, utils_1.make_id)();
        const handles = this._handles.get(env.frame) ?? new Map();
        handles.set(id, handle);
        this._handles.set(env.frame, handles);
        return { id, path: handle.path };
    }
    async resolve(os, env, id) {
        const handles = this._handles.get(env.frame) ?? new Map();
        const handle = handles.get(id);
        if (handle != null) {
            return handle;
        }
        else {
            await os.audit_supervisor.log(env.cart.id, {
                resources: ["device-fs", "error"],
                risk: "high",
                type: "kate.device-fs.file.resolve-failed",
                message: `Failed to resolve id: cartridge might be misbehaving.`,
                extra: { id },
            });
            throw new handlers_1.EMessageFailed("kate.device-file.no-access", `No access`);
        }
    }
}
exports.KateDeviceFileIPC = KateDeviceFileIPC;
const handle_id = utils_1.TC.str;
const device_ipc = new KateDeviceFileIPC();
exports.default = [
    (0, handlers_1.auth_handler)("kate:device-fs.request-file", utils_1.TC.spec({
        multiple: utils_1.TC.optional(false, utils_1.TC.bool),
        strict: utils_1.TC.optional(false, utils_1.TC.bool),
        types: utils_1.TC.list_of(utils_1.TC.spec({
            type: utils_1.TC.str,
            extensions: utils_1.TC.list_of(utils_1.TC.str),
        })),
    }), { capabilities: [{ type: "request-device-files" }] }, async (os, env, ipc, { multiple, strict, types }) => {
        return await os.fairness_supervisor.with_resource(env.cart.id, "modal-dialog", async () => {
            const handles = await os.device_file.open_file(env.cart.id, {
                multiple,
                strict,
                types: [
                    {
                        description: "",
                        accept: Object.fromEntries(types.map((x) => [x.type, x.extensions])),
                    },
                ],
            });
            return handles.map((x) => device_ipc.expose(env, x));
        });
    }),
    (0, handlers_1.auth_handler)("kate:device-fs.request-directory", utils_1.TC.spec({}), { capabilities: [{ type: "request-device-files" }] }, async (os, env, ipc, _) => {
        return await os.fairness_supervisor.with_resource(env.cart.id, "modal-dialog", async () => {
            const handles = await os.device_file.open_directory(env.cart.id);
            return handles.map((x) => device_ipc.expose(env, x));
        });
    }),
    (0, handlers_1.auth_handler)("kate:device-fs.read-file", utils_1.TC.spec({ id: handle_id }), { capabilities: [{ type: "request-device-files" }] }, async (os, env, ipc, { id }) => {
        const file = (await device_ipc.resolve(os, env, id)).handle;
        const data = await file.arrayBuffer();
        return new Uint8Array(data);
    }),
];

});

// packages\kate-core\build\os\ipc\cart-manager.js
require.define(128, "packages\\kate-core\\build\\os\\ipc", "packages\\kate-core\\build\\os\\ipc\\cart-manager.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require(5);
const handlers_1 = require(120);
const Cart = require(64);
const UI = require(59);
exports.default = [
    (0, handlers_1.auth_handler)("kate:cart-manager.install", utils_1.TC.spec({ cartridge: utils_1.TC.bytearray }), { capabilities: [{ type: "install-cartridges" }] }, async (os, env, ipc, { cartridge }) => {
        return await os.fairness_supervisor.with_resource(env.cart.id, "modal-dialog", async () => {
            if (os.kernel.console.options.mode === "single") {
                throw new handlers_1.EMessageFailed("kate.os.not-available", "Feature not available in single mode");
            }
            const cart = Cart.parse(cartridge);
            const errors = await Cart.verify_integrity(cart);
            if (errors.length !== 0) {
                console.error(`Corrupted cartridge ${cart.id}`, errors);
                throw new handlers_1.EMessageFailed("kate.cart-manager.corrupted", `Corrupted cartridge`);
            }
            const should_install = await os.dialog.confirm("kate:cart-manager", {
                title: "Install cartridge?",
                message: UI.stack([
                    UI.paragraph([
                        UI.strong([UI.mono_text([env.cart.id])]),
                        " wants to install a cartridge:",
                        UI.cartridge_chip(cart),
                    ]),
                ]),
            });
            if (!should_install) {
                return null;
            }
            await os.cart_manager.install(cart);
            return null;
        });
    }),
];

});

// packages\kate-core\build\os\ipc\dialog.js
require.define(129, "packages\\kate-core\\build\\os\\ipc", "packages\\kate-core\\build\\os\\ipc\\dialog.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require(5);
const handlers_1 = require(120);
exports.default = [
    (0, handlers_1.auth_handler)("kate:dialog.text-input", utils_1.TC.spec({
        type: utils_1.TC.one_of(["text", "password"]),
        initial_value: utils_1.TC.optional("", utils_1.TC.str),
        message: utils_1.TC.short_str(255),
        placeholder: utils_1.TC.optional("", utils_1.TC.str),
        max_length: utils_1.TC.optional(undefined, utils_1.TC.int),
    }), { fail_silently: true, capabilities: [{ type: "show-dialogs" }] }, async (os, env, ipc, { type, message, initial_value, placeholder, max_length }) => {
        return await os.fairness_supervisor.with_resource(env.cart.id, "modal-dialog", async () => {
            const result = await os.dialog.text_input(env.cart.id, message, {
                max_length: max_length ?? undefined,
                type: type,
                initial_value,
                placeholder,
            });
            return result;
        });
    }),
    (0, handlers_1.auth_handler)("kate:dialog.message", utils_1.TC.spec({ message: utils_1.TC.str }), { fail_silently: true, capabilities: [{ type: "show-dialogs" }] }, async (os, env, ipc, { message }) => {
        return await os.fairness_supervisor.with_resource(env.cart.id, "modal-dialog", async () => {
            await os.dialog.message(env.cart.id, { title: "", message });
            return null;
        });
    }),
];

});

// packages\kate-core\build\os\apis\index.js
require.define(130, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\index.js", (module, exports, __dirname, __filename) => {
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
__exportStar(require(131), exports);
__exportStar(require(63), exports);
__exportStar(require(98), exports);
__exportStar(require(115), exports);
__exportStar(require(116), exports);
__exportStar(require(132), exports);
__exportStar(require(114), exports);
__exportStar(require(95), exports);
__exportStar(require(117), exports);
__exportStar(require(133), exports);
__exportStar(require(134), exports);
__exportStar(require(135), exports);

});

// packages\kate-core\build\os\apis\audio.js
require.define(131, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\audio.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
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
require.define(132, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\object-store.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartridgeBucket = exports.CartridgeObjectStore = exports.KateObjectStore = void 0;
const Db = require(32);
const utils_1 = require(5);
class KateObjectStore {
    os;
    static DEFAULT_QUOTA = {
        maximum_size: (0, utils_1.mb)(64),
        maximum_buckets: 1_000,
        maximum_entries: 10_000,
    };
    static SPECIAL_BUCKET_KEY = "kate:special";
    static LOCAL_STORAGE_KEY = "kate:local-storage";
    static UNVERSIONED_KEY = "<unversioned>";
    get default_quota() {
        return KateObjectStore.DEFAULT_QUOTA;
    }
    constructor(os) {
        this.os = os;
    }
    cartridge(cart, versioned) {
        return new CartridgeObjectStore(this, cart.id, versioned ? cart.version : KateObjectStore.UNVERSIONED_KEY);
    }
    async delete_cartridge_data(cart_id, version_id) {
        await Db.ObjectStorage.transaction(this.os.db, "readwrite", async (store) => {
            await store.delete_partitions_and_quota(cart_id);
            await store.initialise_partitions(cart_id, version_id);
        });
        this.os.events.on_cart_changed.emit({
            id: cart_id,
            reason: "save-data-changed",
        });
    }
    async usage_estimates() {
        return this.os.db.transaction([Db.cartridge_quota], "readonly", async (t) => {
            const quota = t.get_index1(Db.idx_os_quota_by_cartridge);
            const result = new Map();
            for (const entry of await quota.get_all()) {
                const versions = result.get(entry.cartridge_id) ?? [];
                versions.push(entry);
                result.set(entry.cartridge_id, versions);
            }
            return result;
        });
    }
}
exports.KateObjectStore = KateObjectStore;
class CartridgeObjectStore {
    store;
    cartridge_id;
    version;
    constructor(store, cartridge_id, version) {
        this.store = store;
        this.cartridge_id = cartridge_id;
        this.version = version;
    }
    get db() {
        return this.store.os.db;
    }
    transaction(mode, fn) {
        return Db.ObjectStorage.transaction(this.db, mode, fn);
    }
    async usage() {
        return await this.transaction("readonly", async (storage) => {
            return storage.quota.get([this.cartridge_id, this.version]);
        });
    }
    async add_bucket(name) {
        const bucket = await this.transaction("readwrite", async (storage) => {
            return storage.add_bucket(this.cartridge_id, this.version, name);
        });
        return new CartridgeBucket(this, bucket);
    }
    async ensure_bucket(name) {
        const bucket = await this.transaction("readwrite", async (storage) => {
            const bucket = await storage.partitions.try_get([
                this.cartridge_id,
                this.version,
                name,
            ]);
            if (bucket == null) {
                return storage.add_bucket(this.cartridge_id, this.version, name);
            }
            else {
                return bucket;
            }
        });
        return new CartridgeBucket(this, bucket);
    }
    async get_bucket(name) {
        const bucket = await this.transaction("readonly", async (storage) => {
            return await storage.partitions.get([
                this.cartridge_id,
                this.version,
                name,
            ]);
        });
        return new CartridgeBucket(this, bucket);
    }
    async get_local_storage() {
        const bucket = await this.get_bucket(KateObjectStore.SPECIAL_BUCKET_KEY);
        const entry = await bucket.try_read(KateObjectStore.LOCAL_STORAGE_KEY);
        if (entry != null) {
            return entry.data;
        }
        else {
            return {};
        }
    }
    async list_buckets(count) {
        const buckets = await this.transaction("readonly", async (storage) => {
            return await storage.partitions_by_version.get_all([this.cartridge_id, this.version], count);
        });
        return buckets.map((x) => new CartridgeBucket(this, x));
    }
}
exports.CartridgeObjectStore = CartridgeObjectStore;
class CartridgeBucket {
    parent;
    bucket;
    constructor(parent, bucket) {
        this.parent = parent;
        this.bucket = bucket;
    }
    get db() {
        return this.parent.store.os.db;
    }
    transaction(mode, fn) {
        return Db.ObjectStorage.transaction(this.db, mode, fn);
    }
    async delete_bucket() {
        await this.transaction("readwrite", async (storage) => {
            await storage.remove_bucket(this.parent.cartridge_id, this.parent.version, this.bucket.bucket_name);
        });
    }
    async list_metadata(count) {
        return await this.transaction("readonly", async (storage) => {
            return storage.entries_by_bucket.get_all(this.bucket.unique_bucket_id, count);
        });
    }
    async count() {
        return await this.transaction("readonly", async (storage) => {
            return storage.entries_by_bucket.count(this.bucket.unique_bucket_id);
        });
    }
    async read(key) {
        return await this.transaction("readonly", async (storage) => {
            const metadata = await storage.entries.get([
                this.bucket.unique_bucket_id,
                key,
            ]);
            const data = await storage.data.get([this.bucket.unique_bucket_id, key]);
            return { ...metadata, data: data.data };
        });
    }
    async try_read(key) {
        return await this.transaction("readonly", async (storage) => {
            const metadata = await storage.entries.try_get([
                this.bucket.unique_bucket_id,
                key,
            ]);
            if (metadata == null) {
                return null;
            }
            else {
                const data = await storage.data.get([
                    this.bucket.unique_bucket_id,
                    key,
                ]);
                return { ...metadata, data: data.data };
            }
        });
    }
    async create(key, entry) {
        const size = estimate(entry.data) +
            estimate(entry.metadata) +
            estimate(entry.type) +
            estimate(key);
        await this.transaction("readwrite", async (storage) => {
            await storage.add_entry(this.parent.cartridge_id, this.parent.version, this.bucket.unique_bucket_id, {
                key: key,
                type: entry.type,
                size: size,
                metadata: entry.metadata,
                data: entry.data,
            });
        });
    }
    async write(key, entry) {
        const size = estimate(entry.data) +
            estimate(entry.metadata) +
            estimate(entry.type) +
            estimate(key);
        await this.transaction("readwrite", async (storage) => {
            await storage.write_entry(this.parent.cartridge_id, this.parent.version, this.bucket.unique_bucket_id, {
                key: key,
                type: entry.type,
                size: size,
                metadata: entry.metadata,
                data: entry.data,
            });
        });
    }
    async delete(key) {
        await this.transaction("readwrite", async (storage) => {
            storage.delete_entry(this.parent.cartridge_id, this.parent.version, this.bucket.unique_bucket_id, key);
        });
    }
}
exports.CartridgeBucket = CartridgeBucket;
function estimate(value) {
    if (value == null) {
        return 2;
    }
    switch (typeof value) {
        case "number":
            return 8;
        case "boolean":
            return 2;
        case "bigint":
            return Math.ceil(value.toString(16).length / 2);
        case "string":
            return value.length * 2;
    }
    if (value instanceof RegExp) {
        return value.source.length * 2 + value.flags.length * 2;
    }
    if (Array.isArray(value)) {
        let size = 8;
        for (const x of value) {
            size += estimate(x);
        }
        return size;
    }
    if (value instanceof Map) {
        let size = 8;
        for (const [k, v] of value.entries()) {
            size += estimate(k) + estimate(v);
        }
        return size;
    }
    if (value instanceof Set) {
        let size = 8;
        for (const x of value) {
            size += estimate(x);
        }
        return size;
    }
    if (value instanceof Uint8Array ||
        value instanceof Uint32Array ||
        value instanceof Uint16Array ||
        value instanceof Uint8ClampedArray ||
        value instanceof BigUint64Array ||
        value instanceof Int16Array ||
        value instanceof Int32Array ||
        value instanceof Int8Array ||
        value instanceof ArrayBuffer) {
        return value.byteLength;
    }
    if (value instanceof Date) {
        return 8;
    }
    const proto = Object.getPrototypeOf(value);
    if (proto === null || proto === Object.prototype) {
        let size = 0;
        for (const [k, v] of Object.entries(value)) {
            size += estimate(k) + estimate(v);
        }
        return size;
    }
    throw new Error(`Serialisation not supported: ${value}`);
}

});

// packages\kate-core\build\os\apis\settings.js
require.define(133, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\settings.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateSettings = void 0;
const Db = require(32);
const utils_1 = require(5);
const defaults = {
    ui: {
        sound_feedback: true,
        animation_effects: true,
        case_type: {
            type: "handheld",
            resolution: 480,
            scale_to_fit: false,
        },
    },
    security: {
        prompt_for: "medium",
    },
    play_habits: {
        recently_played: true,
        play_times: true,
    },
    input: {
        haptic_feedback_for_virtual_button: true,
        keyboard_mapping: [
            {
                key: "ArrowUp",
                button: "up",
            },
            {
                key: "ArrowRight",
                button: "right",
            },
            {
                key: "ArrowDown",
                button: "down",
            },
            {
                key: "ArrowLeft",
                button: "left",
            },
            {
                key: "ShiftLeft",
                button: "menu",
            },
            {
                key: "KeyC",
                button: "capture",
            },
            {
                key: "KeyX",
                button: "x",
            },
            {
                key: "KeyZ",
                button: "o",
            },
            {
                key: "KeyA",
                button: "ltrigger",
            },
            {
                key: "KeyS",
                button: "rtrigger",
            },
        ],
        gamepad_mapping: {
            standard: [
                {
                    type: "button",
                    index: 12,
                    pressed: "up",
                },
                {
                    type: "button",
                    index: 15,
                    pressed: "right",
                },
                {
                    type: "button",
                    index: 13,
                    pressed: "down",
                },
                {
                    type: "button",
                    index: 14,
                    pressed: "left",
                },
                {
                    type: "button",
                    index: 9,
                    pressed: "menu",
                },
                {
                    type: "button",
                    index: 8,
                    pressed: "capture",
                },
                {
                    type: "button",
                    index: 0,
                    pressed: "x",
                },
                {
                    type: "button",
                    index: 1,
                    pressed: "o",
                },
                {
                    type: "button",
                    index: 4,
                    pressed: "ltrigger",
                },
                {
                    type: "button",
                    index: 5,
                    pressed: "rtrigger",
                },
                {
                    type: "axis",
                    index: 0,
                    negative: "left",
                    positive: "right",
                },
                {
                    type: "axis",
                    index: 1,
                    negative: "up",
                    positive: "down",
                },
            ],
        },
        paired_gamepad: null,
    },
    audit: {
        log_retention_days: 365,
    },
    developer: {
        allow_version_overwrite: false,
    },
};
class KateSettings {
    db;
    _data = null;
    on_settings_changed = new utils_1.EventStream();
    static defaults = defaults;
    constructor(db) {
        this.db = db;
    }
    get defaults() {
        return KateSettings.defaults;
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
            const result = Object.create(null);
            for (const [key, default_value] of Object.entries(defaults)) {
                const stored = await settings.try_get(key);
                const value = { ...default_value, ...(stored?.data ?? {}) };
                result[key] = value;
            }
            return result;
        });
    }
    async update(key, fn) {
        return await this.db.transaction([Db.settings], "readwrite", async (t) => {
            const settings = t.get_table1(Db.settings);
            const value = fn(this.get(key));
            settings.put({
                key: key,
                data: value,
                last_updated: new Date(),
            });
            this._data[key] = value;
            this.on_settings_changed.emit({ key, value });
            return value;
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
                this.on_settings_changed.emit({
                    key: key,
                    value,
                });
            }
        });
    }
}
exports.KateSettings = KateSettings;

});

// packages\kate-core\build\os\apis\storage-manager.js
require.define(134, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\storage-manager.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateStorageManager = void 0;
const utils_1 = require(5);
const object_store_1 = require(132);
class KateStorageManager {
    os;
    static MINIMUM_FREE_SPACE = (0, utils_1.mb)(256);
    static ALERT_USAGE_PERCENT = 0.8;
    _setup = false;
    constructor(os) {
        this.os = os;
    }
    setup() {
        if (this._setup) {
            throw new Error(`setup() called twice`);
        }
        this._setup = true;
        this.os.events.on_cart_changed.listen(() => this.check_storage_health());
        setInterval(() => this.check_storage_health(), 1_000 * 60 * 30);
        this.check_storage_health();
    }
    async storage_summary() {
        const estimate = (await navigator.storage?.estimate?.()) ?? {
            quota: null,
            usage: null,
        };
        return {
            quota: estimate.quota ?? null,
            usage: estimate.usage ?? null,
            reserved: KateStorageManager.MINIMUM_FREE_SPACE,
        };
    }
    async can_fit(size) {
        const estimate = await this.storage_summary();
        if (estimate.quota == null || estimate.usage == null) {
            return true;
        }
        else {
            return (estimate.usage + size <
                estimate.quota - KateStorageManager.MINIMUM_FREE_SPACE);
        }
    }
    async check_storage_health() {
        const estimate = await this.storage_summary();
        if (estimate.quota == null || estimate.usage == null) {
            return;
        }
        const usage = estimate.usage / (estimate.quota - KateStorageManager.MINIMUM_FREE_SPACE);
        if (usage >= KateStorageManager.ALERT_USAGE_PERCENT &&
            !this.os.kernel.console.is_resource_taken("low-storage")) {
            await this.os.notifications.push_transient("kate:storage-manager", "Low storage space", `Your device is running out of storage space. Kate may not be fully operational.`);
            this.os.kernel.console.take_resource("low-storage");
        }
    }
    async estimate_media() {
        return this.os.capture.usage_estimates();
    }
    async estimate_save_data() {
        return this.os.object_store.usage_estimates();
    }
    async estimate_applications() {
        return this.os.cart_manager.usage_estimates();
    }
    async try_estimate_cartridge(cart_id) {
        const estimate = await this.estimate();
        return estimate.cartridges.get(cart_id) ?? null;
    }
    async try_estimate_live_cartridge(cart) {
        const { cartridges } = await this.estimate();
        const maybe_cart = cartridges.get(cart.id) ?? null;
        const media = await this.estimate_media();
        const cart_media = media.get(cart.id) ?? {
            size: 0,
            count: 0,
        };
        const saves = (await this.estimate_save_data()).get(cart.id) ?? [];
        const save_versions = new Map(saves.map((x) => [x.version_id, x]));
        const unversioned = save_versions.get(object_store_1.KateObjectStore.UNVERSIONED_KEY) ?? null;
        const versioned = save_versions.get(cart.version) ?? null;
        const thumbnail = await (0, utils_1.make_empty_thumbnail)(1, 1);
        return {
            id: cart.id,
            title: cart.metadata.presentation.title,
            icon_url: thumbnail,
            version_id: cart.version,
            status: "active",
            dates: {
                last_used: null,
                play_time: null,
                installed: new Date(),
                last_modified: new Date(),
            },
            usage: {
                cartridge_size_in_bytes: maybe_cart?.usage.cartridge_size_in_bytes ?? 0,
                media: {
                    size_in_bytes: cart_media.size,
                    count: cart_media.count,
                },
                data: {
                    size_in_bytes: versioned?.current_size_in_bytes ?? 0,
                    buckets: versioned?.current_buckets_in_storage ?? 0,
                    entries: versioned?.current_items_in_storage ?? 0,
                },
                shared_data: {
                    size_in_bytes: unversioned?.current_size_in_bytes ?? 0,
                    buckets: unversioned?.current_buckets_in_storage ?? 0,
                    entries: unversioned?.current_items_in_storage ?? 0,
                },
                get total_in_bytes() {
                    return (this.cartridge_size_in_bytes +
                        this.media.size_in_bytes +
                        this.data.size_in_bytes +
                        this.shared_data.size_in_bytes);
                },
            },
            quota: {
                data: {
                    size_in_bytes: versioned?.maximum_size_in_bytes ?? 0,
                    buckets: versioned?.maximum_buckets_in_storage ?? 0,
                    entries: versioned?.maximum_items_in_storage ?? 0,
                },
                shared_data: {
                    size_in_bytes: unversioned?.maximum_size_in_bytes ?? 0,
                    buckets: unversioned?.maximum_buckets_in_storage ?? 0,
                    entries: unversioned?.maximum_items_in_storage ?? 0,
                },
            },
        };
    }
    async estimate() {
        const media = await this.estimate_media();
        const save_data = await this.estimate_save_data();
        const applications = await this.estimate_applications();
        const device = await this.storage_summary();
        const media_usage = (0, utils_1.foldl)(media.values(), 0, (total, x) => total + x.size);
        const save_data_usage = (0, utils_1.foldl)(save_data.values(), 0, (total, quotas) => total + quotas.reduce((x, quota) => x + quota.current_size_in_bytes, 0));
        const applications_usage = (0, utils_1.foldl)(applications.values(), 0, (total, app) => total + app.size);
        const totals = {
            quota: device.quota ? device.quota - device.reserved : device.usage,
            media: media_usage,
            save_data: save_data_usage,
            applications: applications_usage,
            get used() {
                return device.usage ?? this.user;
            },
            get system() {
                return device.usage == null ? 0 : device.usage - this.user;
            },
            get user() {
                return this.media + this.save_data + this.applications;
            },
        };
        const cartridges = new Map();
        for (const [id, app] of applications.entries()) {
            const habits = await this.os.play_habits.try_get(id);
            const media_usage = media.get(id) ?? { count: 0, size: 0 };
            const save_data_usage = save_data.get(id) ?? [];
            const save_versions = new Map(save_data_usage.map((x) => [x.version_id, x]));
            const unversioned = save_versions.get(object_store_1.KateObjectStore.UNVERSIONED_KEY) ?? null;
            const versioned = save_versions.get(app.version_id) ?? null;
            cartridges.set(id, {
                id: id,
                title: app.meta.metadata.presentation.title,
                icon_url: app.thumbnail_url,
                version_id: app.version_id,
                status: app.status,
                dates: {
                    last_used: habits?.last_played ?? null,
                    play_time: habits?.play_time ?? null,
                    installed: app.meta.installed_at,
                    last_modified: app.meta.updated_at,
                },
                usage: {
                    cartridge_size_in_bytes: app.size,
                    media: {
                        size_in_bytes: media_usage.size,
                        count: media_usage.count,
                    },
                    data: {
                        size_in_bytes: versioned?.current_size_in_bytes ?? 0,
                        buckets: versioned?.current_buckets_in_storage ?? 0,
                        entries: versioned?.current_items_in_storage ?? 0,
                    },
                    shared_data: {
                        size_in_bytes: unversioned?.current_size_in_bytes ?? 0,
                        buckets: unversioned?.current_buckets_in_storage ?? 0,
                        entries: unversioned?.current_items_in_storage ?? 0,
                    },
                    get total_in_bytes() {
                        return (this.cartridge_size_in_bytes +
                            this.media.size_in_bytes +
                            this.data.size_in_bytes +
                            this.shared_data.size_in_bytes);
                    },
                },
                quota: {
                    data: {
                        size_in_bytes: versioned?.maximum_size_in_bytes ?? 0,
                        buckets: versioned?.maximum_buckets_in_storage ?? 0,
                        entries: versioned?.maximum_items_in_storage ?? 0,
                    },
                    shared_data: {
                        size_in_bytes: unversioned?.maximum_size_in_bytes ?? 0,
                        buckets: unversioned?.maximum_buckets_in_storage ?? 0,
                        entries: unversioned?.maximum_items_in_storage ?? 0,
                    },
                },
            });
        }
        return { totals, cartridges };
    }
}
exports.KateStorageManager = KateStorageManager;

});

// packages\kate-core\build\os\apis\device-file.js
require.define(135, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\device-file.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateDeviceFile = void 0;
const ui_1 = require(59);
class KateDeviceFile {
    os;
    constructor(os) {
        this.os = os;
    }
    single_file() {
        const single_file = (0, ui_1.h)("input", {
            type: "file",
            id: "kate-os-device-file-single",
            style: "display: none",
        }, []);
        document.body.appendChild(single_file);
        return single_file;
    }
    async open_file(requestee, options) {
        this.os.kernel.console.reset_all_keys();
        let handles;
        if ("showOpenFilePicker" in window) {
            handles = await this.open_file_picker(options);
        }
        else {
            handles = await this.open_file_input(options);
        }
        await this.os.audit_supervisor.log(requestee, {
            resources: ["device-fs"],
            risk: "high",
            type: "kate.device-fs.grant.read-file",
            message: `Granted read access to ${handles.length} files.`,
            extra: { files: handles.map((x) => x.path) },
        });
        return handles;
    }
    async open_file_input(options) {
        const input = this.single_file();
        input.accept = options.types
            .flatMap((x) => Object.entries(x.accept).map(([k, v]) => [k, ...v]))
            .join(",");
        input.multiple = options.multiple ?? false;
        const result = new Promise((resolve, reject) => {
            input.onchange = (ev) => {
                ev.preventDefault();
                if (input.files == null || input.files.length == 0) {
                    reject(new Error(`Cancelled`));
                }
                const files = [];
                for (let i = 0; i < input.files.length; ++i) {
                    const file = input.files.item(i);
                    files.push({ path: file.name, handle: file });
                }
                resolve(files);
            };
            input.click();
        });
        result.finally(() => {
            input.remove();
        });
        return result;
    }
    async open_file_picker(options) {
        const handles = await window.showOpenFilePicker({
            multiple: options.multiple ?? false,
            excludeAcceptAllOption: options.strict ?? false,
            types: options.types,
        });
        return Promise.all(handles.map(async (x) => ({ path: x.name, handle: await x.getFile() })));
    }
    async open_directory(requestee) {
        const handle = await window.showDirectoryPicker({ mode: "read" });
        const files = await directory_to_files(handle);
        await this.os.audit_supervisor.log(requestee, {
            resources: ["device-fs"],
            risk: "high",
            type: "kate.device-fs.grant.read-directory",
            message: `Granted read access to a directory containing ${files.length} files`,
            extra: { files: files.map((x) => x.path) },
        });
        return files;
    }
}
exports.KateDeviceFile = KateDeviceFile;
async function directory_to_files(directory) {
    const files = [];
    const go = async (path, directory) => {
        for await (const [key, handle] of directory.entries()) {
            if (handle.kind === "file") {
                files.push({
                    path: path + "/" + key,
                    handle: await handle.getFile(),
                });
            }
            if (handle.kind === "directory") {
                await go(path + "/" + key, handle);
            }
        }
    };
    await go("", directory);
    return files;
}

});

// packages\kate-core\build\os\apis\dialog.js
require.define(136, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\dialog.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_Dialog = exports.Progress = exports.KateDialog = void 0;
const utils_1 = require(5);
const time_1 = require(52);
const UI = require(59);
const scenes_1 = require(55);
class KateDialog {
    os;
    constructor(os) {
        this.os = os;
    }
    async message(id, x) {
        const hud = new HUD_Dialog(this, "message");
        try {
            this.os.push_scene(hud);
            return await hud.show(id, x.title, x.message, [{ label: "Ok", kind: "primary", value: null }], null);
        }
        finally {
            this.os.pop_scene(hud);
        }
    }
    async confirm(id, x) {
        const hud = new HUD_Dialog(this, "confirm");
        try {
            this.os.push_scene(hud);
            return await hud.show(id, x.title, x.message, [
                { label: x.cancel ?? "Cancel", kind: "cancel", value: false },
                {
                    label: x.ok ?? "Ok",
                    kind: x.dangerous === true ? "dangerous" : "primary",
                    value: true,
                },
            ], false);
        }
        finally {
            this.os.pop_scene(hud);
        }
    }
    async progress(id, message, process) {
        const hud = new HUD_Dialog(this, "progress");
        try {
            this.os.push_scene(hud);
            return await hud.progress(id, message, process);
        }
        finally {
            this.os.pop_scene(hud);
        }
    }
    async text_input(id, message, options) {
        const input = UI.h("input", {
            type: options.type,
            value: options.initial_value ?? "",
            placeholder: options.placeholder ?? "",
            class: "kate-ui-text-input-input",
        }, []);
        input.addEventListener("keydown", (ev) => {
            if (ev.code === "ArrowUp" || ev.code === "ArrowDown") {
                ev.preventDefault();
                return;
            }
            ev.stopPropagation();
            if (ev.code === "Escape") {
                input.blur();
                ev.preventDefault();
                return;
            }
        });
        const deferred = this.custom(id, "kate-ui-text-input-container", [
            UI.h("div", { class: "kate-ui-text-input-message" }, [message]),
            UI.h("div", { class: "kate-ui-text-input-control" }, [
                UI.interactive(this.os, input, [
                    {
                        key: ["o"],
                        label: "Edit",
                        on_click: true,
                        handler: () => {
                            input.focus();
                        },
                    },
                ], {
                    replace: true,
                    default_focus_indicator: false,
                }),
            ]),
            UI.h("div", { class: "kate-hud-dialog-actions" }, [
                UI.h("div", { class: "kate-hud-dialog-action", "data-kind": "cancel" }, [
                    UI.button("Cancel", {
                        on_clicked: () => {
                            deferred.resolve(null);
                        },
                    }),
                ]),
                UI.h("div", { class: "kate-hud-dialog-action", "data-kind": "primary" }, [
                    UI.button("Ok", {
                        on_clicked: () => {
                            deferred.resolve(input.value);
                        },
                    }),
                ]),
            ]),
        ], null, "text-input");
        return await deferred.promise;
    }
    custom(id, className, contents, cancel_value, description = "custom") {
        const hud = new HUD_Dialog(this, description);
        this.os.push_scene(hud);
        const deferred = hud.custom(id, `kate-hud-dialog-custom ${className}`, contents, cancel_value);
        deferred.promise.finally(() => {
            this.os.pop_scene(hud);
        });
        return deferred;
    }
    async pop_menu(id, heading, buttons, cancel_value) {
        const hud = new HUD_Dialog(this, "pop-menu");
        try {
            this.os.push_scene(hud);
            return await hud.pop_menu(id, heading, buttons, cancel_value);
        }
        finally {
            this.os.pop_scene(hud);
        }
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
    description;
    FADE_OUT_TIME_MS = 250;
    constructor(manager, description = "dialog") {
        super(manager.os, false);
        this.manager = manager;
        this.description = description;
        this.canvas = UI.h("div", { class: "kate-hud-dialog", "data-title": description }, []);
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
            await result;
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
        const result = this.custom(id, "kate-hud-dialog-message", [
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
        ], cancel_value);
        return result.promise;
    }
    custom(id, className, content, cancel_value) {
        const result = (0, utils_1.defer)();
        const dialog = UI.h("div", {
            class: `kate-hud-dialog-root ${className}`,
            "data-trusted": String(this.is_trusted(id)),
        }, [UI.h("div", { class: "kate-hud-dialog-container" }, [...content])]);
        dialog.addEventListener("click", (ev) => {
            if (ev.target === dialog) {
                result.resolve(cancel_value);
            }
        });
        if (this.is_trusted(id)) {
            this.os.kernel.enter_trusted_mode();
        }
        try {
            this.canvas.textContent = "";
            this.canvas.appendChild(dialog);
            const key_handler = (x) => {
                if (x.key === "x" && !x.is_repeat) {
                    result.resolve(cancel_value);
                    return true;
                }
                return false;
            };
            this.os.focus_handler.listen(this.canvas, key_handler);
            result.promise.finally(() => {
                this.os.kernel.exit_trusted_mode();
                this.os.focus_handler.remove(this.canvas, key_handler);
                setTimeout(async () => {
                    dialog.classList.add("leaving");
                    await (0, time_1.wait)(this.FADE_OUT_TIME_MS);
                    dialog.remove();
                });
            });
        }
        catch (_) {
            this.os.kernel.exit_trusted_mode();
        }
        return result;
    }
    async pop_menu(id, heading, buttons, cancel_value) {
        const result = this.custom(id, "kate-hud-dialog-pop-menu", [
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
        ], cancel_value);
        return result.promise;
    }
}
exports.HUD_Dialog = HUD_Dialog;

});

// packages\kate-core\build\os\apis\capture.js
require.define(137, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\capture.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateCapture = void 0;
const Db = require(32);
const utils_1 = require(5);
class KateCapture {
    os;
    THUMBNAIL_WIDTH = 160;
    THUMBNAIL_HEIGHT = 96;
    MAX_SCREENSHOT_SIZE = (0, utils_1.mb)(10);
    MAX_VIDEO_SIZE = (0, utils_1.mb)(128);
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
            await this.os.audit_supervisor.log(game_id, {
                resources: ["kate:capture", "error"],
                risk: "high",
                type: "kate.capture.screenshot-failed.size-exceeded",
                message: `Failed to save screenshot: size limit of ${(0, utils_1.from_bytes)(this.MAX_SCREENSHOT_SIZE)} exceeded`,
                extra: { size: data.length, max_size: this.MAX_SCREENSHOT_SIZE },
            });
            await this.os.notifications.push_transient(game_id, "Failed to save screenshot", `Size limit of ${(0, utils_1.from_bytes)(this.MAX_SCREENSHOT_SIZE)} exceeded`);
            return null;
        }
        const id = await this.store_file(game_id, data, type, "image");
        await this.os.audit_supervisor.log(game_id, {
            resources: ["kate:capture"],
            risk: "low",
            type: "kate.capture.screenshot-saved",
            message: "Screenshot saved",
            extra: { id: id },
        });
        await this.os.notifications.push_transient(game_id, `Screenshot saved`, "");
        return id;
    }
    async save_video(game_id, data, type) {
        if (data.length > this.MAX_VIDEO_SIZE) {
            await this.os.audit_supervisor.log(game_id, {
                resources: ["kate:capture", "error"],
                risk: "high",
                type: "kate.capture.recording-failed.size-exceeded",
                message: `Failed to save recording: size limit of ${(0, utils_1.from_bytes)(this.MAX_VIDEO_SIZE)} exceeded`,
                extra: { size: data.length, max_size: this.MAX_VIDEO_SIZE },
            });
            await this.os.notifications.push_transient(game_id, "Failed to save recording", `Size limit of ${(0, utils_1.from_bytes)(this.MAX_VIDEO_SIZE)} exceeded`);
            return null;
        }
        const id = await this.store_file(game_id, data, type, "video");
        await this.os.audit_supervisor.log(game_id, {
            resources: ["kate:capture"],
            risk: "low",
            type: "kate.capture.recording-saved",
            message: `Recording saved`,
            extra: { id },
        });
        await this.os.notifications.push_transient(game_id, `Recording saved`, "");
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
    async usage_estimates() {
        return await this.os.db.transaction([Db.media_store], "readonly", async (t) => {
            const store = t.get_index1(Db.idx_media_store_by_cart);
            const result = new Map();
            for (const entry of await store.get_all()) {
                const previous = result.get(entry.cart_id) ?? { size: 0, count: 0 };
                result.set(entry.cart_id, {
                    size: previous.size + entry.size,
                    count: previous.count + 1,
                });
            }
            return result;
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
require.define(138, "packages\\kate-core\\build\\os", "packages\\kate-core\\build\\os\\sfx.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateSfx = void 0;
const apis_1 = require(130);
class KateSfx {
    console;
    server;
    channel;
    sources;
    _enabled = true;
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
    set_enabled(enabled) {
        this._enabled = enabled;
    }
    play(source) {
        if (this._enabled) {
            this.channel.play(this.sources[source], false);
        }
    }
}
exports.KateSfx = KateSfx;
async function get_sfx(url) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
}

});

// packages\kate-core\build\os\apis\play-habits.js
require.define(139, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\play-habits.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KatePlayHabits = void 0;
const Db = require(32);
class KatePlayHabits {
    os;
    constructor(os) {
        this.os = os;
    }
    async try_get(cart) {
        return await Db.PlayHabitsStore.transaction(this.os.db, "readonly", async (store) => {
            return store.habits.try_get(cart);
        });
    }
    async try_get_all(carts) {
        return await Db.PlayHabitsStore.transaction(this.os.db, "readonly", async (store) => {
            const results = new Map();
            for (const cart of carts) {
                const habits = await store.habits.try_get(cart);
                if (habits != null) {
                    results.set(cart, habits);
                }
            }
            return results;
        });
    }
    async all_in_database() {
        return await Db.PlayHabitsStore.transaction(this.os.db, "readonly", async (store) => {
            return store.habits.get_all();
        });
    }
    async remove_all() {
        await Db.PlayHabitsStore.transaction(this.os.db, "readwrite", async (store) => {
            await store.reset_all();
        });
    }
    async remove_one(id, remove) {
        await Db.PlayHabitsStore.transaction(this.os.db, "readwrite", async (store) => {
            if (remove) {
                store.remove(id);
            }
            else {
                store.reset(id);
            }
        });
    }
    async update_last_played(cart_id, last_played) {
        if (!this.os.settings.get("play_habits").recently_played) {
            return;
        }
        await Db.PlayHabitsStore.transaction(this.os.db, "readwrite", async (store) => {
            const cart = await store.habits.get(cart_id);
            cart.last_played = last_played;
            await store.habits.put(cart);
        });
    }
    async increase_play_time(cart_id, play_time_ms) {
        const play_time_minutes = Math.floor(play_time_ms / (1_000 * 60));
        if (!this.os.settings.get("play_habits").play_times) {
            return;
        }
        await Db.PlayHabitsStore.transaction(this.os.db, "readwrite", async (store) => {
            const cart = await store.habits.get(cart_id);
            cart.play_time += play_time_minutes || 0;
            await store.habits.put(cart);
        });
    }
}
exports.KatePlayHabits = KatePlayHabits;

});

// packages\kate-core\build\os\apis\app-resources.js
require.define(140, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\app-resources.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateAppResources = void 0;
const utils_1 = require(5);
class KateAppResources {
    os;
    constructor(os) {
        this.os = os;
    }
    get worker() {
        if (this.os.kernel.console.options.mode !== "web") {
            return null;
        }
        else {
            return navigator.serviceWorker.controller ?? null;
        }
    }
    async send(message0) {
        const worker = await this.worker;
        if (!worker) {
            return;
        }
        return new Promise((resolve, reject) => {
            const id = (0, utils_1.make_id)();
            const message = { ...message0, id };
            const channel = new MessageChannel();
            channel.port1.onmessage = (ev) => {
                if (ev.data.type !== "reply" || ev.data.id !== id) {
                    return;
                }
                if (ev.data.ok) {
                    resolve(ev.data.value);
                }
                else {
                    reject(ev.data.error);
                }
            };
            worker?.postMessage(message, [channel.port2]);
        });
    }
    async refresh_cache() {
        // ensure we are online by reading a non-cached resource
        const response = await fetch("/versions.json");
        if (!response.ok) {
            throw new Error(`Refreshing the cache requires network access`);
        }
        const version = JSON.parse(localStorage["kate-version"]);
        const refresh = this.send({
            type: "refresh-cache",
            version: version.version,
        });
        const timeout = (0, utils_1.sleep)(5000).then((x) => Promise.reject(new Error("timeout")));
        await Promise.race([refresh, timeout]);
    }
}
exports.KateAppResources = KateAppResources;

});

// packages\kate-core\build\os\apis\browse.js
require.define(141, "packages\\kate-core\\build\\os\\apis", "packages\\kate-core\\build\\os\\apis\\browse.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateBrowser = void 0;
const utils_1 = require(5);
const UI = require(59);
class KateBrowser {
    os;
    SUPPORTED_PROTOCOLS = ["http:", "https:"];
    constructor(os) {
        this.os = os;
    }
    async open(requestee, url) {
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
                UI.paragraph([
                    UI.strong([UI.mono_text([requestee])]),
                    " wants to open:",
                ]),
                UI.h("div", { class: "kate-ui-highlight-url", title: url.toString() }, [
                    shorten(url),
                ]),
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
    async download(requestee, filename, data) {
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
                        UI.line_field("File size:", (0, utils_1.from_bytes)(data.length)),
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
            extra: { filename, size: data.length },
        });
        const blob = new Blob([data.buffer]);
        const url = URL.createObjectURL(blob);
        const link = UI.h("a", { download: filename, href: url }, []);
        link.click();
    }
}
exports.KateBrowser = KateBrowser;
function shorten(url) {
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
function shorten_end(text, max) {
    const chars = [...text];
    if (chars.length > max) {
        return UI.flow([
            UI.mono_text([chars.slice(0, max).join("")]),
            UI.chip([`...${chars.length - max} characters omitted`]),
        ]);
    }
    else {
        return UI.mono_text([text]);
    }
}
function shorten_mid(text, max) {
    const chars = [...text];
    if (chars.length > max) {
        const mid = Math.floor(max / 2);
        return UI.flow([
            UI.mono_text([chars.slice(0, mid).join("")]),
            UI.chip([`...${chars.length - max} characters omitted...`]),
            UI.mono_text([chars.slice(chars.length - mid).join("")]),
        ]);
    }
    else {
        return UI.mono_text([text]);
    }
}

});

// packages\kate-core\build\os\services\capability-supervisor.js
require.define(142, "packages\\kate-core\\build\\os\\services", "packages\\kate-core\\build\\os\\services\\capability-supervisor.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateCapabilitySupervisor = void 0;
const capability_1 = require(44);
class KateCapabilitySupervisor {
    os;
    constructor(os) {
        this.os = os;
    }
    async all_grants(cart_id) {
        return await capability_1.CapabilityStore.transaction(this.os.db, "capability", "readonly", async (store) => store.read_all_grants(cart_id));
    }
    async update_grant(cart_id, grant) {
        return await capability_1.CapabilityStore.transaction(this.os.db, "capability", "readwrite", async (store) => {
            await store.update_grant(cart_id, grant);
        });
    }
    async is_allowed(cart_id, capability, configuration) {
        const grant = await capability_1.CapabilityStore.transaction(this.os.db, "capability", "readonly", async (store) => {
            return store.read_grant(cart_id, capability);
        });
        if (grant == null) {
            return false;
        }
        else {
            return grant.is_allowed(configuration);
        }
    }
}
exports.KateCapabilitySupervisor = KateCapabilitySupervisor;

});

// packages\kate-core\build\os\services\audit-supervisor.js
require.define(143, "packages\\kate-core\\build\\os\\services", "packages\\kate-core\\build\\os\\services\\audit-supervisor.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateAuditSupervisor = void 0;
const data_1 = require(32);
const utils_1 = require(5);
class KateAuditSupervisor {
    os;
    RECENT_LOG_LIMIT = 1000;
    PRESSURE_MARK = 10000;
    constructor(os) {
        this.os = os;
    }
    async start() {
        this.gc();
    }
    async gc() {
        try {
            const config = this.os.settings.get("audit");
            const removed = await data_1.AuditStore.transaction(this.os.db, "readwrite", async (store) => {
                return await store.garbage_collect_logs(config.log_retention_days, this.PRESSURE_MARK);
            });
            if (removed > 0) {
                await this.log("kate:audit", {
                    resources: ["kate:audit"],
                    risk: "high",
                    type: "kate.audit.gc.removed-logs",
                    message: `Removed ${removed} audit log entries`,
                    extra: { removed },
                });
            }
        }
        catch (error) {
            console.error(`Failed to GC audit logs:`, error);
            await this.log("kate:audit", {
                resources: ["kate:audit", "error"],
                risk: "high",
                type: "kate.audit.gc.error",
                message: `Failed to remove older log entries`,
                extra: { error: (0, utils_1.serialise_error)(error) },
            });
        }
    }
    async log(process_id, message) {
        const entry = {
            process_id: process_id,
            resources: new Set(message.resources ?? []),
            risk: message.risk,
            time: new Date(),
            type: message.type,
            message: message.message ?? "",
            extra: message.extra ?? null,
        };
        if (entry.resources.has("error")) {
            console.error(`[Kate Audit]`, process_id, message.message ?? "", entry);
        }
        else {
            console.log(`[Kate Audit]`, process_id, message.message ?? "", entry);
        }
        await data_1.AuditStore.transaction(this.os.db, "readwrite", async (store) => {
            store.log(entry);
        });
    }
    async read_recent() {
        return data_1.AuditStore.transaction(this.os.db, "readonly", async (store) => {
            const total = await store.count_all();
            const logs = await store.read_recent(this.RECENT_LOG_LIMIT);
            return { total, logs };
        });
    }
    async remove(id) {
        return data_1.AuditStore.transaction(this.os.db, "readwrite", async (store) => {
            await store.remove(id);
        });
    }
}
exports.KateAuditSupervisor = KateAuditSupervisor;

});

// packages\kate-core\build\os\services\fairness-supervisor.js
require.define(144, "packages\\kate-core\\build\\os\\services", "packages\\kate-core\\build\\os\\services\\fairness-supervisor.js", (module, exports, __dirname, __filename) => {
"use strict";
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateFairnessSupervisor = void 0;
const utils_1 = require(5);
class FairLock {
    resource;
    process_id;
    constructor(resource, process_id) {
        this.resource = resource;
        this.process_id = process_id;
    }
}
class KateFairnessSupervisor {
    os;
    _resources = new Map();
    constructor(os) {
        this.os = os;
    }
    get_locks(process_id, resource) {
        const resources = this._resources.get(process_id) ?? new Map();
        return resources.get(resource) ?? new Set();
    }
    update_resources(process_id, resource, fn) {
        if (!this._resources.has(process_id)) {
            this._resources.set(process_id, new Map());
        }
        const resources = this._resources.get(process_id);
        if (!resources.has(resource)) {
            resources.set(resource, new Set());
        }
        const locks = resources.get(resource);
        fn(locks);
    }
    async take(process_id, resource) {
        if (this.is_allowed(process_id, resource)) {
            console.debug(`[kate:fairness] ${process_id} acquired a lock for ${resource}`);
            const lock = new FairLock(resource, process_id);
            this.update_resources(process_id, resource, (locks) => {
                locks.add(lock);
            });
            return lock;
        }
        else {
            console.error(`[kate:fairness] ${process_id} failed to acquire a lock for ${resource}`);
            return null;
        }
    }
    release(lock) {
        const locks = this.get_locks(lock.process_id, lock.resource);
        locks.delete(lock);
        console.debug(`[kate:fairness] ${lock.process_id} released a lock for ${lock.resource}`);
    }
    async with_resource(process_id, resource, action, on_failed = () => new Error(`Failed to take a lock to ${resource} for ${process_id}`)) {
        const lock = await this.take(process_id, resource);
        if (lock == null) {
            throw on_failed();
        }
        try {
            const result = await action();
            return result;
        }
        finally {
            this.release(lock);
        }
    }
    is_allowed(process_id, resource) {
        switch (resource) {
            case "modal-dialog": {
                return (this.os.processes.is_foreground(process_id) &&
                    this.get_locks(process_id, resource).size === 0);
            }
            default:
                throw (0, utils_1.unreachable)(resource);
        }
    }
}
exports.KateFairnessSupervisor = KateFairnessSupervisor;

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