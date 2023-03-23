(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Kate = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = exports.Transaction = exports.Database = void 0;
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
    get_table(table) {
        return new Table(this.trans.objectStore(table.name));
    }
}
exports.Transaction = Transaction;
class Table {
    store;
    constructor(store) {
        this.store = store;
    }
    async write(value) {
        return await lift_request(this.store.put(value));
    }
    async clear() {
        return await lift_request(this.store.clear());
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
    async try_get(query) {
        const results = await this.get_all(query);
        if (results.length === 1) {
            return results[0];
        }
        else {
            return null;
        }
    }
    async get_all(query, count) {
        return await lift_request(this.store.getAll(query, count));
    }
}
exports.Table = Table;

},{}],3:[function(require,module,exports){
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
__exportStar(require("./schema"), exports);
__exportStar(require("./db"), exports);

},{"./db":2,"./schema":4}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexSchema = exports.TableSchema = exports.DatabaseSchema = exports.DBError_UnableToOpen = void 0;
const db_1 = require("./db");
class DBError_UnableToOpen extends Error {
    db;
    constructor(db) {
        super(`Unable to open ${db.name}`);
        this.db = db;
    }
}
exports.DBError_UnableToOpen = DBError_UnableToOpen;
class DatabaseSchema {
    name;
    version;
    tables = [];
    constructor(name, version) {
        this.name = name;
        this.version = version;
    }
    table(since, name, options, indexes) {
        const table = new TableSchema(since, name, options, indexes);
        this.tables.push(table);
        return table;
    }
    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.name, this.version);
            request.onerror = (ev) => {
                reject(new DBError_UnableToOpen(this));
            };
            request.onsuccess = (ev) => {
                resolve(new db_1.Database(request.result));
            };
            request.onupgradeneeded = (ev) => {
                const old_version = ev.oldVersion;
                const db = ev.target.result;
                for (const table of this.tables) {
                    if (table.version > old_version) {
                        table.upgrade(db);
                    }
                }
            };
        });
    }
}
exports.DatabaseSchema = DatabaseSchema;
class TableSchema {
    version;
    name;
    key;
    indexes;
    __schema;
    constructor(version, name, key, indexes) {
        this.version = version;
        this.name = name;
        this.key = key;
        this.indexes = indexes;
    }
    get key_path() {
        return this.key.path;
    }
    upgrade(db) {
        const store = db.createObjectStore(this.name, {
            keyPath: this.key.path,
            autoIncrement: this.key.auto_increment,
        });
        for (const index of this.indexes) {
            index.upgrade(store);
        }
    }
}
exports.TableSchema = TableSchema;
class IndexSchema {
    name;
    key_path;
    options;
    constructor(name, key_path, options) {
        this.name = name;
        this.key_path = key_path;
        this.options = options;
    }
    upgrade(store) {
        store.createIndex(this.name, this.key_path, {
            unique: this.options.unique,
        });
    }
}
exports.IndexSchema = IndexSchema;

},{"./db":2}],5:[function(require,module,exports){
"use strict";
exports.__esModule = true;
exports.bridges = void 0;
exports.bridges = {
    "input.js": "\"use strict\";\r\nlet paused = false;\r\nconst { events } = KateAPI;\r\nconst add_event_listener = window.addEventListener;\r\nconst down_listeners = [];\r\nconst up_listeners = [];\r\nconst down = new Set();\r\nconst on_key_update = ({ key: kate_key, is_down, }) => {\r\n    if (!paused) {\r\n        const data = key_mapping[kate_key];\r\n        if (data) {\r\n            if (is_down) {\r\n                down.add(kate_key);\r\n            }\r\n            else {\r\n                down.delete(kate_key);\r\n            }\r\n            const listeners = is_down ? down_listeners : up_listeners;\r\n            const type = is_down ? \"keydown\" : \"keyup\";\r\n            const [key, code, keyCode] = data;\r\n            const key_ev = new KeyboardEvent(type, { key, code, keyCode });\r\n            for (const fn of listeners) {\r\n                fn.call(document, key_ev);\r\n            }\r\n        }\r\n    }\r\n};\r\nevents.input_state_changed.listen(on_key_update);\r\nevents.paused.listen((state) => {\r\n    if (state === true) {\r\n        for (const key of down) {\r\n            on_key_update({ key, is_down: false });\r\n        }\r\n    }\r\n    paused = state;\r\n});\r\nfunction listen(type, listener, options) {\r\n    if (type === \"keydown\") {\r\n        down_listeners.push(listener);\r\n    }\r\n    else if (type === \"keyup\") {\r\n        up_listeners.push(listener);\r\n    }\r\n    else if (type === \"gamepadconnected\" || type === \"gamepaddisconnected\") {\r\n        // do nothing\r\n    }\r\n    else {\r\n        add_event_listener.call(this, type, listener, options);\r\n    }\r\n}\r\nwindow.addEventListener = listen;\r\ndocument.addEventListener = listen;\r\n// Disable gamepad input\r\nObject.defineProperty(navigator, \"getGamepads\", {\r\n    enumerable: false,\r\n    configurable: false,\r\n    value: () => [null, null, null, null],\r\n});\r\n",
    "kate-api.js": "(function(f){if(typeof exports===\"object\"&&typeof module!==\"undefined\"){module.exports=f()}else if(typeof define===\"function\"&&define.amd){define([],f)}else{var g;if(typeof window!==\"undefined\"){g=window}else if(typeof global!==\"undefined\"){g=global}else if(typeof self!==\"undefined\"){g=self}else{g=this}g.KateAPI = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c=\"function\"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error(\"Cannot find module '\"+i+\"'\");throw a.code=\"MODULE_NOT_FOUND\",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u=\"function\"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateAudioChannel = exports.KateAudioSource = exports.KateAudio = void 0;\r\nclass KateAudio {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    async create_channel(name, max_tracks = 1) {\r\n        const { id, volume } = await this.#channel.call(\"kate:audio.create-channel\", { max_tracks });\r\n        return new KateAudioChannel(this, name, id, max_tracks, volume);\r\n    }\r\n    async stop_all_sources(channel) {\r\n        await this.#channel.call(\"kate:audio.stop-all-sources\", { id: channel.id });\r\n    }\r\n    async change_channel_volume(channel, value) {\r\n        await this.#channel.call(\"kate:audio.change-volume\", {\r\n            id: channel.id,\r\n            volume: value,\r\n        });\r\n    }\r\n    async load_audio(mime, bytes) {\r\n        const audio = await this.#channel.call(\"kate:audio.load\", {\r\n            mime,\r\n            bytes,\r\n        });\r\n        return new KateAudioSource(this, audio);\r\n    }\r\n    async play(channel, audio, loop) {\r\n        await this.#channel.call(\"kate:audio.play\", {\r\n            channel: channel.id,\r\n            source: audio.id,\r\n            loop: loop,\r\n        });\r\n    }\r\n}\r\nexports.KateAudio = KateAudio;\r\nclass KateAudioSource {\r\n    audio;\r\n    id;\r\n    constructor(audio, id) {\r\n        this.audio = audio;\r\n        this.id = id;\r\n    }\r\n}\r\nexports.KateAudioSource = KateAudioSource;\r\nclass KateAudioChannel {\r\n    audio;\r\n    name;\r\n    id;\r\n    max_tracks;\r\n    _volume;\r\n    constructor(audio, name, id, max_tracks, _volume) {\r\n        this.audio = audio;\r\n        this.name = name;\r\n        this.id = id;\r\n        this.max_tracks = max_tracks;\r\n        this._volume = _volume;\r\n    }\r\n    get volume() {\r\n        return this._volume;\r\n    }\r\n    async set_volume(value) {\r\n        if (value < 0 || value > 1) {\r\n            throw new Error(`Invalid volume value ${value}`);\r\n        }\r\n        this._volume = value;\r\n        this.audio.change_channel_volume(this, value);\r\n    }\r\n    async stop_all_sources() {\r\n        return this.audio.stop_all_sources(this);\r\n    }\r\n    async play(source, loop) {\r\n        return this.audio.play(this, source, loop);\r\n    }\r\n}\r\nexports.KateAudioChannel = KateAudioChannel;\r\n\n},{}],2:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateCartFS = void 0;\r\nclass KateCartFS {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    read_file(path0) {\r\n        const path = new URL(path0, \"http://localhost\").pathname;\r\n        return this.#channel.call(\"kate:cart.read-file\", { path });\r\n    }\r\n    async get_file_url(path) {\r\n        const file = await this.read_file(path);\r\n        const blob = new Blob([file.bytes], { type: file.mime });\r\n        return URL.createObjectURL(blob);\r\n    }\r\n}\r\nexports.KateCartFS = KateCartFS;\r\n\n},{}],3:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateIPC = void 0;\r\nconst events_1 = require(\"../../util/build/events\");\r\nconst promise_1 = require(\"../../util/build/promise\");\r\nclass KateIPC {\r\n    #secret;\r\n    #pending;\r\n    #initialised;\r\n    #server;\r\n    events = {\r\n        input_state_changed: new events_1.EventStream(),\r\n        key_pressed: new events_1.EventStream(),\r\n        paused: new events_1.EventStream(),\r\n    };\r\n    constructor(secret, server) {\r\n        this.#secret = secret;\r\n        this.#pending = new Map();\r\n        this.#initialised = false;\r\n        this.#server = server;\r\n    }\r\n    make_id() {\r\n        let id = new Uint8Array(16);\r\n        crypto.getRandomValues(id);\r\n        return Array.from(id)\r\n            .map((x) => x.toString(16).padStart(2, \"0\"))\r\n            .join(\"\");\r\n    }\r\n    setup() {\r\n        if (this.#initialised) {\r\n            throw new Error(`setup() called twice`);\r\n        }\r\n        this.#initialised = true;\r\n        window.addEventListener(\"message\", this.handle_message);\r\n    }\r\n    do_send(id, type, payload) {\r\n        this.#server.postMessage({\r\n            type: type,\r\n            secret: this.#secret,\r\n            id: id,\r\n            payload: payload,\r\n        }, \"*\");\r\n    }\r\n    async call(type, payload) {\r\n        const deferred = (0, promise_1.defer)();\r\n        const id = this.make_id();\r\n        this.#pending.set(id, deferred);\r\n        this.do_send(id, type, payload);\r\n        return deferred.promise;\r\n    }\r\n    async send_and_ignore_result(type, payload) {\r\n        this.do_send(this.make_id(), type, payload);\r\n    }\r\n    handle_message = (ev) => {\r\n        switch (ev.data.type) {\r\n            case \"kate:reply\": {\r\n                const pending = this.#pending.get(ev.data.id);\r\n                if (pending != null) {\r\n                    this.#pending.delete(ev.data.id);\r\n                    if (ev.data.ok) {\r\n                        pending.resolve(ev.data.value);\r\n                    }\r\n                    else {\r\n                        pending.reject(ev.data.value);\r\n                    }\r\n                }\r\n                break;\r\n            }\r\n            case \"kate:input-state-changed\": {\r\n                this.events.input_state_changed.emit({\r\n                    key: ev.data.key,\r\n                    is_down: ev.data.is_down,\r\n                });\r\n                break;\r\n            }\r\n            case \"kate:input-key-pressed\": {\r\n                this.events.key_pressed.emit(ev.data.key);\r\n                break;\r\n            }\r\n            case \"kate:paused\": {\r\n                this.events.paused.emit(ev.data.state);\r\n                break;\r\n            }\r\n        }\r\n    };\r\n}\r\nexports.KateIPC = KateIPC;\r\n\n},{\"../../util/build/events\":8,\"../../util/build/promise\":9}],4:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.focus = exports.timer = exports.audio = exports.input = exports.kv_store = exports.cart_fs = exports.events = void 0;\r\nconst audio_1 = require(\"./audio\");\r\nconst cart_fs_1 = require(\"./cart-fs\");\r\nconst channel_1 = require(\"./channel\");\r\nconst input_1 = require(\"./input\");\r\nconst kv_store_1 = require(\"./kv-store\");\r\nconst timer_1 = require(\"./timer\");\r\nconst channel = new channel_1.KateIPC(KATE_SECRET, window.parent);\r\nchannel.setup();\r\nexports.events = channel.events;\r\nexports.cart_fs = new cart_fs_1.KateCartFS(channel);\r\nexports.kv_store = new kv_store_1.KateKVStore(channel);\r\nexports.input = new input_1.KateInput(channel);\r\nexports.input.setup();\r\nexports.audio = new audio_1.KateAudio(channel);\r\nexports.timer = new timer_1.KateTimer();\r\nexports.timer.setup();\r\nconst focus = () => {\r\n    channel.send_and_ignore_result(\"kate:special.focus\", {});\r\n};\r\nexports.focus = focus;\r\n\n},{\"./audio\":1,\"./cart-fs\":2,\"./channel\":3,\"./input\":5,\"./kv-store\":6,\"./timer\":7}],5:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateInput = void 0;\r\nconst events_1 = require(\"../../util/build/events\");\r\nclass KateInput {\r\n    #channel;\r\n    on_key_pressed = new events_1.EventStream();\r\n    _paused = false;\r\n    _state = Object.assign(Object.create(null), {\r\n        up: false,\r\n        right: false,\r\n        down: false,\r\n        left: false,\r\n        menu: false,\r\n        capture: false,\r\n        x: false,\r\n        o: false,\r\n        ltrigger: false,\r\n        rtrigger: false,\r\n    });\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    setup() {\r\n        this.#channel.events.input_state_changed.listen(({ key, is_down }) => {\r\n            if (!this._paused) {\r\n                this._state[key] = is_down;\r\n            }\r\n        });\r\n        this.#channel.events.key_pressed.listen((key) => {\r\n            if (!this._paused) {\r\n                this.on_key_pressed.emit(key);\r\n            }\r\n        });\r\n        this.#channel.events.paused.listen((state) => {\r\n            this._paused = state;\r\n            for (const key of Object.keys(this._state)) {\r\n                this._state[key] = false;\r\n            }\r\n        });\r\n    }\r\n    is_down(key) {\r\n        return this._state[key];\r\n    }\r\n}\r\nexports.KateInput = KateInput;\r\n\n},{\"../../util/build/events\":8}],6:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateKVStore = void 0;\r\nclass KateKVStore {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    async read_all() {\r\n        return await this.#channel.call(\"kate:kv-store.read-all\", {});\r\n    }\r\n    async replace_all(value) {\r\n        await this.#channel.call(\"kate:kv-store.update-all\", { value });\r\n    }\r\n    async get(key) {\r\n        return await this.#channel.call(\"kate:kv-store.get\", { key });\r\n    }\r\n    async set(key, value) {\r\n        await this.#channel.call(\"kate:kv-store.set\", { key, value });\r\n    }\r\n    async delete(key) {\r\n        await this.#channel.call(\"kate:kv-store.delete\", { key });\r\n    }\r\n    async delete_all() {\r\n        await this.replace_all({});\r\n    }\r\n}\r\nexports.KateKVStore = KateKVStore;\r\n\n},{}],7:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateTimer = void 0;\r\nconst events_1 = require(\"../../util/build/events\");\r\nclass KateTimer {\r\n    on_tick = new events_1.EventStream();\r\n    _last_time = null;\r\n    _timer_id = null;\r\n    MAX_FPS = 30;\r\n    ONE_FRAME = Math.ceil(1000 / 30);\r\n    _fps = 30;\r\n    setup() {\r\n        cancelAnimationFrame(this._timer_id);\r\n        this._last_time = null;\r\n        this._timer_id = requestAnimationFrame(this.tick);\r\n    }\r\n    get fps() {\r\n        return this._fps;\r\n    }\r\n    tick = (time) => {\r\n        if (this._last_time == null) {\r\n            this._last_time = time;\r\n            this._fps = this.MAX_FPS;\r\n            this.on_tick.emit(time);\r\n            this._timer_id = requestAnimationFrame(this.tick);\r\n        }\r\n        else {\r\n            const elapsed = time - this._last_time;\r\n            if (elapsed < this.ONE_FRAME) {\r\n                this._timer_id = requestAnimationFrame(this.tick);\r\n            }\r\n            else {\r\n                this._last_time = time;\r\n                this._fps = (1000 / elapsed) | 0;\r\n                this.on_tick.emit(time);\r\n                this._timer_id = requestAnimationFrame(this.tick);\r\n            }\r\n        }\r\n    };\r\n}\r\nexports.KateTimer = KateTimer;\r\n\n},{\"../../util/build/events\":8}],8:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.EventStream = void 0;\r\nclass EventStream {\r\n    subscribers = [];\r\n    on_dispose = () => { };\r\n    listen(fn) {\r\n        this.remove(fn);\r\n        this.subscribers.push(fn);\r\n        return fn;\r\n    }\r\n    remove(fn) {\r\n        this.subscribers = this.subscribers.filter((x) => x !== fn);\r\n        return this;\r\n    }\r\n    once(fn) {\r\n        const handler = this.listen((x) => {\r\n            this.remove(handler);\r\n            fn(x);\r\n        });\r\n        return handler;\r\n    }\r\n    emit(ev) {\r\n        for (const fn of this.subscribers) {\r\n            fn(ev);\r\n        }\r\n    }\r\n    dispose() {\r\n        this.on_dispose();\r\n    }\r\n    filter(fn) {\r\n        const stream = new EventStream();\r\n        const subscriber = this.listen((ev) => {\r\n            if (fn(ev)) {\r\n                stream.emit(ev);\r\n            }\r\n        });\r\n        stream.on_dispose = () => {\r\n            this.remove(subscriber);\r\n        };\r\n        return stream;\r\n    }\r\n    map(fn) {\r\n        const stream = new EventStream();\r\n        const subscriber = this.listen((ev) => {\r\n            stream.emit(fn(ev));\r\n        });\r\n        stream.on_dispose = () => {\r\n            this.remove(subscriber);\r\n        };\r\n        return stream;\r\n    }\r\n}\r\nexports.EventStream = EventStream;\r\n\n},{}],9:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.sleep = exports.defer = void 0;\r\nfunction defer() {\r\n    const p = Object.create(null);\r\n    p.promise = new Promise((resolve, reject) => {\r\n        p.resolve = resolve;\r\n        p.reject = reject;\r\n    });\r\n    return p;\r\n}\r\nexports.defer = defer;\r\nfunction sleep(ms) {\r\n    return new Promise((resolve, reject) => {\r\n        setTimeout(() => resolve(), ms);\r\n    });\r\n}\r\nexports.sleep = sleep;\r\n\n},{}]},{},[4])(4)\n});\n",
    "kate-bridge.js": "(function(f){if(typeof exports===\"object\"&&typeof module!==\"undefined\"){module.exports=f()}else if(typeof define===\"function\"&&define.amd){define([],f)}else{var g;if(typeof window!==\"undefined\"){g=window}else if(typeof global!==\"undefined\"){g=global}else if(typeof self!==\"undefined\"){g=self}else{g=this}g.KateAPI = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c=\"function\"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error(\"Cannot find module '\"+i+\"'\");throw a.code=\"MODULE_NOT_FOUND\",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u=\"function\"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateAudioChannel = exports.KateAudioSource = exports.KateAudio = void 0;\r\nclass KateAudio {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    async create_channel(name) {\r\n        const { id, volume } = await this.#channel.call(\"kate:audio.create-channel\", {});\r\n        return new KateAudioChannel(this, name, id, volume);\r\n    }\r\n    async resume_channel(channel) {\r\n        await this.#channel.call(\"kate:audio.resume-channel\", { id: channel.id });\r\n    }\r\n    async pause_channel(channel) {\r\n        await this.#channel.call(\"kate:audio.pause-channel\", { id: channel.id });\r\n    }\r\n    async change_channel_volume(channel, value) {\r\n        await this.#channel.call(\"kate:audio.change-volume\", {\r\n            id: channel.id,\r\n            volume: value,\r\n        });\r\n    }\r\n    async load_audio(mime, bytes) {\r\n        const audio = await this.#channel.call(\"kate:audio.load\", {\r\n            mime,\r\n            bytes,\r\n        });\r\n        return new KateAudioSource(this, audio);\r\n    }\r\n    async play(channel, audio, loop) {\r\n        await this.#channel.call(\"kate:audio.play\", {\r\n            channel: channel.id,\r\n            source: audio.id,\r\n            loop: loop,\r\n        });\r\n    }\r\n}\r\nexports.KateAudio = KateAudio;\r\nclass KateAudioSource {\r\n    audio;\r\n    id;\r\n    constructor(audio, id) {\r\n        this.audio = audio;\r\n        this.id = id;\r\n    }\r\n}\r\nexports.KateAudioSource = KateAudioSource;\r\nclass KateAudioChannel {\r\n    audio;\r\n    name;\r\n    id;\r\n    _volume;\r\n    constructor(audio, name, id, _volume) {\r\n        this.audio = audio;\r\n        this.name = name;\r\n        this.id = id;\r\n        this._volume = _volume;\r\n    }\r\n    get volume() {\r\n        return this._volume;\r\n    }\r\n    async set_volume(value) {\r\n        if (value < 0 || value > 1) {\r\n            throw new Error(`Invalid volume value ${value}`);\r\n        }\r\n        this._volume = value;\r\n        this.audio.change_channel_volume(this, value);\r\n    }\r\n    async resume() {\r\n        return this.audio.resume_channel(this);\r\n    }\r\n    async pause() {\r\n        return this.audio.pause_channel(this);\r\n    }\r\n    async play(source, loop) {\r\n        return this.audio.play(this, source, loop);\r\n    }\r\n}\r\nexports.KateAudioChannel = KateAudioChannel;\r\n\n},{}],2:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateCartFS = void 0;\r\nclass KateCartFS {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    read_file(path0) {\r\n        const path = new URL(path0, \"http://localhost\").pathname;\r\n        return this.#channel.call(\"kate:cart.read-file\", { path });\r\n    }\r\n    async get_file_url(path) {\r\n        const file = await this.read_file(path);\r\n        const blob = new Blob([file.bytes], { type: file.mime });\r\n        return URL.createObjectURL(blob);\r\n    }\r\n}\r\nexports.KateCartFS = KateCartFS;\r\n\n},{}],3:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateIPC = void 0;\r\nconst events_1 = require(\"../../util/build/events\");\r\nconst promise_1 = require(\"../../util/build/promise\");\r\nclass KateIPC {\r\n    #secret;\r\n    #pending;\r\n    #initialised;\r\n    #server;\r\n    events = {\r\n        input_state_changed: new events_1.EventStream(),\r\n        key_pressed: new events_1.EventStream(),\r\n        paused: new events_1.EventStream(),\r\n    };\r\n    constructor(secret, server) {\r\n        this.#secret = secret;\r\n        this.#pending = new Map();\r\n        this.#initialised = false;\r\n        this.#server = server;\r\n    }\r\n    make_id() {\r\n        let id = new Uint8Array(16);\r\n        crypto.getRandomValues(id);\r\n        return Array.from(id)\r\n            .map((x) => x.toString(16).padStart(2, \"0\"))\r\n            .join(\"\");\r\n    }\r\n    setup() {\r\n        if (this.#initialised) {\r\n            throw new Error(`setup() called twice`);\r\n        }\r\n        this.#initialised = true;\r\n        window.addEventListener(\"message\", this.handle_message);\r\n    }\r\n    do_send(id, type, payload) {\r\n        this.#server.postMessage({\r\n            type: type,\r\n            secret: this.#secret,\r\n            id: id,\r\n            payload: payload,\r\n        }, \"*\");\r\n    }\r\n    async call(type, payload) {\r\n        const deferred = (0, promise_1.defer)();\r\n        const id = this.make_id();\r\n        this.#pending.set(id, deferred);\r\n        this.do_send(id, type, payload);\r\n        return deferred.promise;\r\n    }\r\n    async send_and_ignore_result(type, payload) {\r\n        this.do_send(this.make_id(), type, payload);\r\n    }\r\n    handle_message = (ev) => {\r\n        switch (ev.data.type) {\r\n            case \"kate:reply\": {\r\n                const pending = this.#pending.get(ev.data.id);\r\n                if (pending != null) {\r\n                    this.#pending.delete(ev.data.id);\r\n                    if (ev.data.ok) {\r\n                        pending.resolve(ev.data.value);\r\n                    }\r\n                    else {\r\n                        pending.reject(ev.data.value);\r\n                    }\r\n                }\r\n                break;\r\n            }\r\n            case \"kate:input-state-changed\": {\r\n                this.events.input_state_changed.emit({\r\n                    key: ev.data.key,\r\n                    is_down: ev.data.is_down,\r\n                });\r\n                break;\r\n            }\r\n            case \"kate:input-key-pressed\": {\r\n                this.events.key_pressed.emit(ev.data.key);\r\n                break;\r\n            }\r\n            case \"kate:paused\": {\r\n                this.events.paused.emit(ev.data.state);\r\n                break;\r\n            }\r\n        }\r\n    };\r\n}\r\nexports.KateIPC = KateIPC;\r\n\n},{\"../../util/build/events\":8,\"../../util/build/promise\":9}],4:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.timer = exports.audio = exports.input = exports.kv_store = exports.cart_fs = exports.events = void 0;\r\nconst audio_1 = require(\"./audio\");\r\nconst cart_fs_1 = require(\"./cart-fs\");\r\nconst channel_1 = require(\"./channel\");\r\nconst input_1 = require(\"./input\");\r\nconst kv_store_1 = require(\"./kv-store\");\r\nconst timer_1 = require(\"./timer\");\r\nconst channel = new channel_1.KateIPC(KATE_SECRET, window.parent);\r\nchannel.setup();\r\nexports.events = channel.events;\r\nexports.cart_fs = new cart_fs_1.KateCartFS(channel);\r\nexports.kv_store = new kv_store_1.KateKVStore(channel);\r\nexports.input = new input_1.KateInput(channel);\r\nexports.input.setup();\r\nexports.audio = new audio_1.KateAudio(channel);\r\nexports.timer = new timer_1.KateTimer();\r\nexports.timer.setup();\r\n\n},{\"./audio\":1,\"./cart-fs\":2,\"./channel\":3,\"./input\":5,\"./kv-store\":6,\"./timer\":7}],5:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateInput = void 0;\r\nconst events_1 = require(\"../../util/build/events\");\r\nclass KateInput {\r\n    #channel;\r\n    on_key_pressed = new events_1.EventStream();\r\n    _state = Object.assign(Object.create(null), {\r\n        up: false,\r\n        right: false,\r\n        down: false,\r\n        left: false,\r\n        menu: false,\r\n        capture: false,\r\n        x: false,\r\n        o: false,\r\n        ltrigger: false,\r\n        rtrigger: false,\r\n    });\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    setup() {\r\n        this.#channel.events.input_state_changed.listen(({ key, is_down }) => {\r\n            this._state[key] = is_down;\r\n        });\r\n        this.#channel.events.key_pressed.listen((key) => {\r\n            this.on_key_pressed.emit(key);\r\n        });\r\n    }\r\n    is_down(key) {\r\n        return this._state[key];\r\n    }\r\n}\r\nexports.KateInput = KateInput;\r\n\n},{\"../../util/build/events\":8}],6:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateKVStore = void 0;\r\nclass KateKVStore {\r\n    #channel;\r\n    constructor(channel) {\r\n        this.#channel = channel;\r\n    }\r\n    async read_all() {\r\n        return await this.#channel.call(\"kate:kv-store.read-all\", {});\r\n    }\r\n    async replace_all(value) {\r\n        await this.#channel.call(\"kate:kv-store.update-all\", { value });\r\n    }\r\n    async get(key) {\r\n        return await this.#channel.call(\"kate:kv-store.get\", { key });\r\n    }\r\n    async set(key, value) {\r\n        await this.#channel.call(\"kate:kv-store.set\", { key, value });\r\n    }\r\n    async delete(key) {\r\n        await this.#channel.call(\"kate:kv-store.delete\", { key });\r\n    }\r\n    async delete_all() {\r\n        await this.replace_all({});\r\n    }\r\n}\r\nexports.KateKVStore = KateKVStore;\r\n\n},{}],7:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.KateTimer = void 0;\r\nconst events_1 = require(\"../../util/build/events\");\r\nclass KateTimer {\r\n    on_tick = new events_1.EventStream();\r\n    _last_time = null;\r\n    _timer_id = null;\r\n    MAX_FPS = 30;\r\n    ONE_FRAME = Math.ceil(1000 / 30);\r\n    _fps = 30;\r\n    setup() {\r\n        cancelAnimationFrame(this._timer_id);\r\n        this._last_time = null;\r\n        this._timer_id = requestAnimationFrame(this.tick);\r\n    }\r\n    get fps() {\r\n        return this._fps;\r\n    }\r\n    tick = (time) => {\r\n        if (this._last_time == null) {\r\n            this._last_time = time;\r\n            this._fps = this.MAX_FPS;\r\n            this.on_tick.emit(time);\r\n            this._timer_id = requestAnimationFrame(this.tick);\r\n        }\r\n        else {\r\n            const elapsed = time - this._last_time;\r\n            if (elapsed < this.ONE_FRAME) {\r\n                this._timer_id = requestAnimationFrame(this.tick);\r\n            }\r\n            else {\r\n                this._last_time = time;\r\n                this._fps = (1000 / elapsed) | 0;\r\n                this.on_tick.emit(time);\r\n                this._timer_id = requestAnimationFrame(this.tick);\r\n            }\r\n        }\r\n    };\r\n}\r\nexports.KateTimer = KateTimer;\r\n\n},{\"../../util/build/events\":8}],8:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.EventStream = void 0;\r\nclass EventStream {\r\n    subscribers = [];\r\n    on_dispose = () => { };\r\n    listen(fn) {\r\n        this.remove(fn);\r\n        this.subscribers.push(fn);\r\n        return fn;\r\n    }\r\n    remove(fn) {\r\n        this.subscribers = this.subscribers.filter((x) => x !== fn);\r\n        return this;\r\n    }\r\n    emit(ev) {\r\n        for (const fn of this.subscribers) {\r\n            fn(ev);\r\n        }\r\n    }\r\n    dispose() {\r\n        this.on_dispose();\r\n    }\r\n    filter(fn) {\r\n        const stream = new EventStream();\r\n        const subscriber = this.listen((ev) => {\r\n            if (fn(ev)) {\r\n                stream.emit(ev);\r\n            }\r\n        });\r\n        stream.on_dispose = () => {\r\n            this.remove(subscriber);\r\n        };\r\n        return stream;\r\n    }\r\n    map(fn) {\r\n        const stream = new EventStream();\r\n        const subscriber = this.listen((ev) => {\r\n            stream.emit(fn(ev));\r\n        });\r\n        stream.on_dispose = () => {\r\n            this.remove(subscriber);\r\n        };\r\n        return stream;\r\n    }\r\n}\r\nexports.EventStream = EventStream;\r\n\n},{}],9:[function(require,module,exports){\n\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nexports.sleep = exports.defer = void 0;\r\nfunction defer() {\r\n    const p = Object.create(null);\r\n    p.promise = new Promise((resolve, reject) => {\r\n        p.resolve = resolve;\r\n        p.reject = reject;\r\n    });\r\n    return p;\r\n}\r\nexports.defer = defer;\r\nfunction sleep(ms) {\r\n    return new Promise((resolve, reject) => {\r\n        setTimeout(() => resolve(), ms);\r\n    });\r\n}\r\nexports.sleep = sleep;\r\n\n},{}]},{},[4])(4)\n});\n",
    "local-storage.js": "\"use strict\";\r\nconst { kv_store } = KateAPI;\r\nlet contents = KATE_LOCAL_STORAGE ?? Object.create(null);\r\nlet timer = null;\r\nfunction persist(contents) {\r\n    clearTimeout(timer);\r\n    timer = setTimeout(() => {\r\n        kv_store.replace_all(contents);\r\n    });\r\n}\r\nclass KateStorage {\r\n    __contents;\r\n    __persistent;\r\n    constructor(contents, persistent) {\r\n        this.__contents = contents;\r\n        this.__persistent = persistent;\r\n    }\r\n    _persist() {\r\n        if (this.__persistent) {\r\n            persist(this.__contents);\r\n        }\r\n    }\r\n    getItem(name) {\r\n        return this.__contents[name] ?? null;\r\n    }\r\n    setItem(name, value) {\r\n        this.__contents[name] = value;\r\n        this._persist();\r\n    }\r\n    removeItem(name) {\r\n        delete this.__contents[name];\r\n        this._persist();\r\n    }\r\n    clear() {\r\n        this.__contents = Object.create(null);\r\n        this._persist();\r\n    }\r\n    key(index) {\r\n        return this.getItem(Object.keys(this.__contents)[index]) ?? null;\r\n    }\r\n    get length() {\r\n        return Object.keys(this.__contents).length;\r\n    }\r\n}\r\nfunction proxy_storage(storage, key) {\r\n    const exposed = [\"getItem\", \"setItem\", \"removeItem\", \"clear\", \"key\"];\r\n    Object.defineProperty(window, key, {\r\n        value: new Proxy(storage, {\r\n            get(target, prop, receiver) {\r\n                return exposed.includes(prop)\r\n                    ? storage[prop].bind(storage)\r\n                    : storage.getItem(prop);\r\n            },\r\n            has(target, prop) {\r\n                return exposed.includes(prop) || prop in contents;\r\n            },\r\n            set(target, prop, value) {\r\n                storage.setItem(prop, value);\r\n                return true;\r\n            },\r\n            deleteProperty(target, prop) {\r\n                storage.removeItem(prop);\r\n                return true;\r\n            },\r\n        }),\r\n    });\r\n}\r\nconst storage = new KateStorage(contents, true);\r\nproxy_storage(storage, \"localStorage\");\r\nconst session_storage = new KateStorage(Object.create(null), false);\r\nproxy_storage(session_storage, \"sessionStorage\");\r\n",
    "renpy.js": "\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nlet paused = false;\r\nconst { events } = KateAPI;\r\nconst add_event_listener = window.addEventListener;\r\nconst key_mapping = {\r\n    up: [\"ArrowUp\", \"ArrowUp\", 38],\r\n    right: [\"ArrowRight\", \"ArrowRight\", 39],\r\n    down: [\"ArrowDown\", \"ArrowDown\", 40],\r\n    left: [\"ArrowLeft\", \"ArrowLeft\", 37],\r\n    x: [\"Escape\", \"Escape\", 27],\r\n    o: [\"Enter\", \"Enter\", 13],\r\n    ltrigger: [\"PageUp\", \"PageUp\", 33],\r\n    rtrigger: [\"PageDown\", \"PageDown\", 34],\r\n};\r\nconst down_listeners = [];\r\nconst up_listeners = [];\r\nevents.input_state_changed.listen(({ key: kate_key, is_down }) => {\r\n    if (!paused) {\r\n        const data = key_mapping[kate_key];\r\n        if (data) {\r\n            const listeners = is_down ? down_listeners : up_listeners;\r\n            const type = is_down ? \"keydown\" : \"keyup\";\r\n            const [key, code, keyCode] = data;\r\n            const key_ev = new KeyboardEvent(type, { key, code, keyCode });\r\n            for (const fn of listeners) {\r\n                fn.call(document, key_ev);\r\n            }\r\n        }\r\n    }\r\n});\r\nevents.paused.listen((state) => {\r\n    paused = state;\r\n});\r\nfunction listen(type, listener, options) {\r\n    if (type === \"keydown\") {\r\n        down_listeners.push(listener);\r\n    }\r\n    else if (type === \"keyup\") {\r\n        up_listeners.push(listener);\r\n    }\r\n    else {\r\n        add_event_listener.call(this, type, listener, options);\r\n    }\r\n}\r\nwindow.addEventListener = listen;\r\ndocument.addEventListener = listen;\r\n",
    "rpgmk-mv.js": "\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nlet paused = false;\r\nconst { events } = KateAPI;\r\n// Disable RPGMkMV's handling of gamepads to avoid double-input handling.\r\nInput._updateGamepadState = () => { };\r\n// Ensure RPGMkMV uses ogg files (Kate will handle the decoding).\r\nWebAudio.canPlayOgg = () => true;\r\nWebAudio.canPlayM4a = () => false;\r\nAudioManager.audioFileExt = () => \".ogg\";\r\n// Patch RPGMkMV's keyboard input handling directly\r\nconst key_mapping = {\r\n    up: \"up\",\r\n    right: \"right\",\r\n    down: \"down\",\r\n    left: \"left\",\r\n    x: \"cancel\",\r\n    o: \"ok\",\r\n    menu: \"menu\",\r\n    rtrigger: \"shift\",\r\n};\r\nevents.input_state_changed.listen(({ key, is_down }) => {\r\n    if (!paused) {\r\n        const name = key_mapping[key];\r\n        if (name) {\r\n            Input._currentState[name] = is_down;\r\n        }\r\n    }\r\n});\r\nevents.paused.listen((state) => {\r\n    paused = state;\r\n    if (state) {\r\n        for (const key of Object.values(key_mapping)) {\r\n            Input._currentState[key] = false;\r\n        }\r\n    }\r\n});\r\n",
    "standard-network.js": "\"use strict\";\r\nObject.defineProperty(exports, \"__esModule\", { value: true });\r\nconst { cart_fs } = KateAPI;\r\n// -- Arbitrary fetching\r\nconst old_fetch = window.fetch;\r\nwindow.fetch = async function (request, options) {\r\n    let url;\r\n    let method;\r\n    if (Object(request) === request && request.url) {\r\n        url = request.url;\r\n        method = request.method;\r\n    }\r\n    else {\r\n        url = request;\r\n        method = options?.method ?? \"GET\";\r\n    }\r\n    if (method !== \"GET\") {\r\n        return new Promise((_, reject) => reject(new Error(`Non-GET requests are not supported.`)));\r\n    }\r\n    return new Promise(async (resolve, reject) => {\r\n        try {\r\n            const file = await cart_fs.get_file_url(String(url));\r\n            const result = await old_fetch(file);\r\n            resolve(result);\r\n        }\r\n        catch (error) {\r\n            reject(error);\r\n        }\r\n    });\r\n};\r\nconst old_xhr_open = XMLHttpRequest.prototype.open;\r\nconst old_xhr_send = XMLHttpRequest.prototype.send;\r\nXMLHttpRequest.prototype.open = function (method, url) {\r\n    if (method !== \"GET\") {\r\n        throw new Error(`Non-GET requests are not supported.`);\r\n    }\r\n    this.__waiting_open = true;\r\n    void (async () => {\r\n        try {\r\n            const real_url = await cart_fs.get_file_url(String(url));\r\n            old_xhr_open.call(this, \"GET\", real_url, true);\r\n            this.__maybe_send();\r\n        }\r\n        catch (error) {\r\n            old_xhr_open.call(this, \"GET\", \"not-found\", true);\r\n            this.__maybe_send();\r\n        }\r\n    })();\r\n};\r\nXMLHttpRequest.prototype.__maybe_send = function () {\r\n    this.__waiting_open = false;\r\n    if (this.__waiting_send) {\r\n        this.__waiting_send = false;\r\n        this.send();\r\n    }\r\n};\r\nXMLHttpRequest.prototype.send = function () {\r\n    if (this.__waiting_open) {\r\n        this.__waiting_send = true;\r\n        return;\r\n    }\r\n    else {\r\n        return old_xhr_send.call(this);\r\n    }\r\n};\r\n// -- Image loading\r\nconst old_img_src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, \"src\");\r\nObject.defineProperty(HTMLImageElement.prototype, \"src\", {\r\n    enumerable: old_img_src.enumerable,\r\n    configurable: old_img_src.configurable,\r\n    get() {\r\n        return this.__src ?? old_img_src.get.call(this);\r\n    },\r\n    set(url) {\r\n        this.__src = url;\r\n        void (async () => {\r\n            try {\r\n                const real_url = await cart_fs.get_file_url(String(url));\r\n                old_img_src.set.call(this, real_url);\r\n            }\r\n            catch (error) {\r\n                old_img_src.set.call(this, \"not-found\");\r\n            }\r\n        })();\r\n    },\r\n});\r\n// -- Media loading\r\nconst old_media_src = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, \"src\");\r\nObject.defineProperty(HTMLMediaElement.prototype, \"src\", {\r\n    enumerable: old_media_src.enumerable,\r\n    configurable: old_media_src.configurable,\r\n    get() {\r\n        return this.__src ?? old_media_src.get.call(this);\r\n    },\r\n    set(url) {\r\n        this.__src = url;\r\n        void (async () => {\r\n            try {\r\n                const real_url = await cart_fs.get_file_url(String(url));\r\n                old_media_src.set.call(this, real_url);\r\n            }\r\n            catch (error) {\r\n                old_media_src.set.call(this, \"not-found\");\r\n            }\r\n        })();\r\n    },\r\n});\r\n"
};

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.os = exports.kernel = void 0;
exports.kernel = require("./kernel");
exports.os = require("./os");

},{"./kernel":9,"./os":29}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CR_Web_archive = exports.CRW_Process = exports.CR_Process = exports.CartRuntime = exports.KateRuntimes = void 0;
const Cart = require("../../../schema/generated/cartridge");
const build_1 = require("../../../util/build");
const translate_html_1 = require("./translate-html");
class KateRuntimes {
    console;
    constructor(console) {
        this.console = console;
    }
    from_cartridge(cart, local_storage) {
        switch (cart.platform.$tag) {
            case 0 /* Cart.Platform.$Tags.Web_archive */:
                return new CR_Web_archive(this.console, cart.id, cart, cart.platform, local_storage);
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
class CRW_Process extends CR_Process {
    runtime;
    frame;
    secret;
    channel;
    audio;
    constructor(runtime, frame, secret, channel, audio) {
        super();
        this.runtime = runtime;
        this.frame = frame;
        this.secret = secret;
        this.channel = channel;
        this.audio = audio;
    }
    async exit() {
        this.frame.src = "about:blank";
        this.frame.remove();
        this.channel?.dispose();
        await this.audio.stop();
    }
    async pause() {
        this.channel?.send({
            type: "kate:paused",
            state: true,
        });
    }
    async unpause() {
        this.channel?.send({
            type: "kate:paused",
            state: false,
        });
    }
}
exports.CRW_Process = CRW_Process;
class CR_Web_archive extends CartRuntime {
    console;
    id;
    cart;
    data;
    local_storage;
    constructor(console, id, cart, data, local_storage) {
        super();
        this.console = console;
        this.id = id;
        this.cart = cart;
        this.data = data;
        this.local_storage = local_storage;
    }
    run(os) {
        const secret = (0, build_1.make_id)();
        const frame = document.createElement("iframe");
        const audio_server = os.make_audio_server();
        const channel = os.ipc.add_process(secret, this.cart, () => frame.contentWindow, audio_server);
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
        this.console.on_key_pressed.listen((key) => {
            channel.send({
                type: "kate:input-key-pressed",
                key: key,
            });
        });
        frame.src = URL.createObjectURL(new Blob([this.proxy_html(secret)], { type: "text/html" }));
        frame.scrolling = "no";
        this.console.screen.appendChild(frame);
        return new CRW_Process(this, frame, secret, channel, audio_server);
    }
    proxy_html(secret) {
        return (0, translate_html_1.translate_html)(this.data.html, {
            secret,
            zoom: Number(this.console.body.getAttribute("data-zoom") ?? "0"),
            bridges: this.data.bridges,
            cart: this.cart,
            local_storage: this.local_storage,
        });
    }
}
exports.CR_Web_archive = CR_Web_archive;

},{"../../../schema/generated/cartridge":36,"../../../util/build":40,"./translate-html":13}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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
__exportStar(require("./kate"), exports);
__exportStar(require("./cart-runtime"), exports);
__exportStar(require("./gamepad"), exports);
__exportStar(require("./input"), exports);
__exportStar(require("./loader"), exports);
__exportStar(require("./virtual"), exports);

},{"./cart-runtime":7,"./gamepad":8,"./input":10,"./kate":11,"./loader":12,"./virtual":14}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateKernel = void 0;
const cart_runtime_1 = require("./cart-runtime");
const gamepad_1 = require("./gamepad");
const input_1 = require("./input");
const loader_1 = require("./loader");
const virtual_1 = require("./virtual");
class KateKernel {
    console;
    keyboard;
    gamepad;
    loader = new loader_1.KateLoader();
    runtimes;
    constructor(console, keyboard, gamepad) {
        this.console = console;
        this.keyboard = keyboard;
        this.gamepad = gamepad;
        this.runtimes = new cart_runtime_1.KateRuntimes(console);
    }
    static from_root(root) {
        const console = new virtual_1.VirtualConsole(root);
        const keyboard = new input_1.KeyboardInput(console);
        const gamepad = new gamepad_1.GamepadInput(console);
        console.listen();
        keyboard.listen(document.body);
        gamepad.setup();
        return new KateKernel(console, keyboard, gamepad);
    }
}
exports.KateKernel = KateKernel;

},{"./cart-runtime":7,"./gamepad":8,"./input":10,"./loader":12,"./virtual":14}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateLoader = void 0;
const Cart = require("../../../schema/generated/cartridge");
const fingerprint_1 = require("../../../schema/lib/fingerprint");
class KateLoader {
    load_bytes(bytes) {
        const view = (0, fingerprint_1.remove_fingerprint)(new DataView(bytes));
        const decoder = new Cart._Decoder(view);
        return Cart.Cartridge.decode(decoder);
    }
    async load_from_url(url) {
        const bytes = await (await fetch(url)).arrayBuffer();
        return this.load_bytes(bytes);
    }
}
exports.KateLoader = KateLoader;

},{"../../../schema/generated/cartridge":36,"../../../schema/lib/fingerprint":37}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.add_cover = exports.translate_html = void 0;
const build_1 = require("../../../kate-bridges/build");
const Cart = require("../../../schema/generated/cartridge");
const build_2 = require("../../../util/build");
const pathname_1 = require("../../../util/build/pathname");
function translate_html(html, context) {
    const dom = new DOMParser().parseFromString(html, "text/html");
    const preamble = add_preamble(dom, context);
    add_zoom(dom, context);
    add_bridges(preamble, dom, context);
    inline_all_scripts(dom, context);
    inline_all_links(dom, context);
    add_cover(dom, context);
    return dom.documentElement.outerHTML;
}
exports.translate_html = translate_html;
function add_cover(dom, context) {
    const element = dom.createElement("div");
    const id = `kate_${(0, build_2.make_id)().replace(/\-/g, "_")}`;
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
function add_preamble(dom, context) {
    const script = dom.createElement("script");
    script.textContent = `
  void function() {
    var KATE_SECRET = ${JSON.stringify(context.secret)};
    ${build_1.bridges["kate-api.js"]};
  }();
  `;
    dom.head.insertBefore(script, dom.head.firstChild);
    return script;
}
function add_zoom(dom, context) {
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
function add_bridges(reference, dom, context) {
    for (const bridge of context.bridges) {
        apply_bridge(bridge, reference, dom, context);
    }
}
function apply_bridge(bridge, reference, dom, context) {
    const wrap = (source) => {
        return `void function(exports) {
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
    switch (bridge.$tag) {
        case 0 /* Cart.Bridge.$Tags.Network_proxy */: {
            append_proxy(build_1.bridges["standard-network.js"]);
            break;
        }
        case 2 /* Cart.Bridge.$Tags.Input_proxy */: {
            const code = build_1.bridges["input.js"];
            const keys = JSON.stringify(generate_proxied_key_mappings(bridge.mapping), null, 2);
            const full_source = `const key_mapping = ${keys};\n${code}`;
            append_proxy(full_source);
            break;
        }
        case 1 /* Cart.Bridge.$Tags.Local_storage_proxy */: {
            const full_source = `
        var KATE_LOCAL_STORAGE = ${JSON.stringify(context.local_storage ?? {})};
        ${build_1.bridges["local-storage.js"]}
      `;
            append_proxy(full_source);
            break;
        }
        case 3 /* Cart.Bridge.$Tags.RPGMaker_MV */: {
            apply_bridge(new Cart.Bridge.Local_storage_proxy(), reference, dom, context);
            apply_bridge(new Cart.Bridge.Network_proxy(), reference, dom, context);
            const key_map = new Map([
                [
                    new Cart.VirtualKey.Up(),
                    new Cart.KeyboardKey("ArrowUp", "ArrowUp", 38n),
                ],
                [
                    new Cart.VirtualKey.Right(),
                    new Cart.KeyboardKey("ArrowRight", "ArrowRight", 39n),
                ],
                [
                    new Cart.VirtualKey.Down(),
                    new Cart.KeyboardKey("ArrowDown", "ArrowDown", 40n),
                ],
                [
                    new Cart.VirtualKey.Left(),
                    new Cart.KeyboardKey("ArrowLeft", "ArrowLeft", 37n),
                ],
                [new Cart.VirtualKey.O(), new Cart.KeyboardKey("z", "KeyZ", 90n)],
                [new Cart.VirtualKey.X(), new Cart.KeyboardKey("x", "KeyX", 88n)],
                [
                    new Cart.VirtualKey.L_trigger(),
                    new Cart.KeyboardKey("PageUp", "PageUp", 33n),
                ],
                [
                    new Cart.VirtualKey.R_trigger(),
                    new Cart.KeyboardKey("PageDown", "PageDown", 34n),
                ],
            ]);
            apply_bridge(new Cart.Bridge.Input_proxy(key_map), reference, dom, context);
            break;
        }
        default:
            throw (0, build_2.unreachable)(bridge, "kate bridge");
    }
}
function virtual_key_to_code(key) {
    switch (key.$tag) {
        case 0 /* Cart.VirtualKey.$Tags.Up */:
            return "up";
        case 1 /* Cart.VirtualKey.$Tags.Right */:
            return "right";
        case 2 /* Cart.VirtualKey.$Tags.Down */:
            return "down";
        case 3 /* Cart.VirtualKey.$Tags.Left */:
            return "left";
        case 7 /* Cart.VirtualKey.$Tags.O */:
            return "o";
        case 6 /* Cart.VirtualKey.$Tags.X */:
            return "x";
        case 8 /* Cart.VirtualKey.$Tags.L_trigger */:
            return "ltrigger";
        case 9 /* Cart.VirtualKey.$Tags.R_trigger */:
            return "rtrigger";
        case 4 /* Cart.VirtualKey.$Tags.Menu */:
            return "menu";
        case 5 /* Cart.VirtualKey.$Tags.Capture */:
            return "capture";
        default:
            throw (0, build_2.unreachable)(key, "virtual key");
    }
}
function generate_proxied_key_mappings(map) {
    const pairs = [...map.entries()].map(([k, v]) => [
        virtual_key_to_code(k),
        [v.key, v.code, Number(v.key_code)],
    ]);
    return Object.fromEntries(pairs);
}
function inline_all_scripts(dom, context) {
    for (const script of Array.from(dom.querySelectorAll("script"))) {
        const src = script.getAttribute("src");
        if (src != null && src.trim() !== "") {
            const real_path = pathname_1.Pathname.from_string(src).make_absolute().as_string();
            const contents = get_text_file(real_path, context.cart);
            script.removeAttribute("src");
            script.removeAttribute("type");
            script.textContent = contents;
        }
    }
}
function inline_all_links(dom, context) {
    for (const link of Array.from(dom.querySelectorAll("link"))) {
        const href = link.getAttribute("href") ?? "";
        const path = pathname_1.Pathname.from_string(href).make_absolute();
        if (link.rel === "stylesheet") {
            inline_css(link, path, dom, context);
        }
        else {
            link.setAttribute("href", get_data_url(path.as_string(), context.cart));
        }
    }
}
function inline_css(link, root, dom, context) {
    const source0 = get_text_file(root.as_string(), context.cart);
    const source1 = transform_css_urls(root.dirname(), source0, context);
    // TODO: inline imports
    const style = dom.createElement("style");
    style.textContent = source1;
    link.parentNode.insertBefore(style, link);
    link.remove();
}
function transform_css_urls(base, source, context) {
    return source.replace(/\burl\(("[^"]+")\)/g, (_, url_string) => {
        const url_path = pathname_1.Pathname.from_string(JSON.parse(url_string));
        const path = base.join(url_path).as_string();
        const data_url = get_data_url(path, context.cart);
        return `url(${JSON.stringify(data_url)})`;
    });
}
function try_get_file(path, cart) {
    return cart.files.find((x) => x.path === path);
}
function try_get_text_file(path, cart) {
    const file = try_get_file(path, cart);
    if (file != null) {
        const decoder = new TextDecoder("utf-8");
        return decoder.decode(file.data);
    }
    else {
        return null;
    }
}
function get_text_file(real_path, cart) {
    const contents = try_get_text_file(real_path, cart);
    if (contents != null) {
        return contents;
    }
    else {
        throw new Error(`File not found: ${real_path}`);
    }
}
function get_data_url(real_path, cart) {
    const file = try_get_file(real_path, cart);
    if (file != null) {
        const content = Array.from(file.data)
            .map((x) => String.fromCharCode(x))
            .join("");
        return `data:${file.mime};base64,${btoa(content)}`;
    }
    else {
        throw new Error(`File not found: ${real_path}`);
    }
}

},{"../../../kate-bridges/build":5,"../../../schema/generated/cartridge":36,"../../../util/build":40,"../../../util/build/pathname":41}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualConsole = void 0;
const events_1 = require("../../../util/build/events");
const pkg = require("../../package.json");
class VirtualConsole {
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
    body;
    device_display;
    screen;
    hud;
    os_root;
    version_container;
    on_input_changed = new events_1.EventStream();
    on_key_pressed = new events_1.EventStream();
    on_tick = new events_1.EventStream();
    audio_context = new AudioContext();
    timer_id = null;
    last_time = null;
    SPECIAL_FRAMES = 15;
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
    constructor(root) {
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
        this.screen = root.querySelector("#kate-game");
        this.os_root = root.querySelector("#kate-os-root");
        this.hud = root.querySelector("#kate-hud");
        this.device_display = root.querySelector(".kate-screen");
        this.body = root.querySelector(".kate-body");
        this.version_container = root.querySelector(".kate-version");
        if (this.version_container != null && pkg.version != null) {
            this.version_container.textContent = `v${pkg.version}`;
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
    listen() {
        if (this.is_listening) {
            throw new Error(`listen called twice`);
        }
        this.is_listening = true;
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
                this.on_key_pressed.emit(`long_${key}`);
                this.render_button_state(key, false);
            }
            else if (!special && x.count === 1) {
                this.on_input_changed.emit({ key, is_down: true });
            }
        }
        else {
            if (special) {
                if (x.count === -1) {
                    this.on_input_changed.emit({ key, is_down: false });
                    this.on_key_pressed.emit(key);
                    x.count = 0;
                }
                else if (x.count > 0 && x.count < this.SPECIAL_FRAMES) {
                    this.on_input_changed.emit({ key, is_down: true });
                    x.count = -1;
                }
            }
            else if (x.count > 0) {
                x.count = 0;
                this.on_input_changed.emit({ key, is_down: false });
                this.on_key_pressed.emit(key);
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
}
exports.VirtualConsole = VirtualConsole;

},{"../../../util/build/events":39,"../../package.json":35}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateAudioServer = void 0;
const random_1 = require("../../../../util/build/random");
class KateAudioServer {
    os;
    channels = new Map();
    sources = new Map();
    get audio_context() {
        return this.os.kernel.console.audio_context;
    }
    constructor(os) {
        this.os = os;
    }
    async create_channel(max_tracks) {
        const id = (0, random_1.make_id)();
        const channel = new AudioChannel(this, id, max_tracks);
        this.channels.set(id, channel);
        return channel;
    }
    async load_sound(bytes) {
        const id = (0, random_1.make_id)();
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

},{"../../../../util/build/random":43}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartManager = void 0;
const Cart = require("../../../../schema/generated/cartridge");
const fingerprint_1 = require("../../../../schema/lib/fingerprint");
const Db = require("./db");
class CartManager {
    os;
    constructor(os) {
        this.os = os;
    }
    async list() {
        return await this.os.db.transaction([Db.cart_meta], "readonly", async (t) => {
            const meta = t.get_table(Db.cart_meta);
            const result = await meta.get_all();
            return result;
        });
    }
    async install_from_file(file) {
        try {
            const cart = this.os.kernel.loader.load_bytes(await file.arrayBuffer());
            await this.install(cart);
        }
        catch (error) {
            console.error(`Failed to install ${file.name}:`, error);
            await this.os.notifications.push("kate:cart-manager", "Installation failed", `${file.name} could not be installed.`);
        }
    }
    async uninstall(cart) {
        await this.os.db.transaction([Db.cart_meta, Db.cart_files], "readwrite", async (t) => {
            const meta = t.get_table(Db.cart_meta);
            const files = t.get_table(Db.cart_files);
            await meta.delete(cart.id);
            await files.delete(cart.id);
        });
        await this.os.notifications.push("kate:cart-manager", `Game uninstalled`, `${cart.title} ${cart.id} and its data was removed.`);
        await this.os.events.on_cart_removed.emit(cart);
    }
    async install(cart) {
        const old_cart = await this.os.db.transaction([Db.cart_meta], "readonly", async (t) => {
            const meta = t.get_table(Db.cart_meta);
            return await meta.try_get(cart.id);
        });
        if (old_cart != null) {
            const v = cart.metadata.release.version;
            const title = cart.metadata.title.title;
            const should_update = await this.os.dialog.confirm("kate:installer", {
                title: `Update ${old_cart.title}?`,
                message: `A cartridge already exists for ${cart.id}. Update it to ${title} v${v.major}.${v.minor}?`,
                ok: "Update",
                cancel: "Keep old version",
                dangerous: true,
            });
            if (!should_update) {
                return false;
            }
        }
        const result = await this.os.db.transaction([Db.cart_meta, Db.cart_files], "readwrite", async (t) => {
            const meta = t.get_table(Db.cart_meta);
            const files = t.get_table(Db.cart_files);
            const encoder = new Cart._Encoder();
            cart.encode(encoder);
            const bytes = (0, fingerprint_1.add_fingerprint)(encoder.to_bytes());
            await meta.write({
                id: cart.id,
                title: cart.metadata.title.title,
                description: cart.metadata.title.description,
                thumbnail: {
                    mime: cart.metadata.title.thumbnail.mime,
                    bytes: cart.metadata.title.thumbnail.data,
                },
                installed_at: new Date(),
            });
            await files.write({
                id: cart.id,
                bytes: bytes,
            });
            return true;
        });
        if (result) {
            await this.os.notifications.push("kate:cart-manager", `New game installed`, `${cart.metadata.title.title} is ready to play!`);
            this.os.events.on_cart_inserted.emit(cart);
        }
        return result;
    }
}
exports.CartManager = CartManager;

},{"../../../../schema/generated/cartridge":36,"../../../../schema/lib/fingerprint":37,"./db":18}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_ContextMenu = exports.KateContextMenu = void 0;
const scenes_1 = require("../ui/scenes");
const UI = require("../ui");
const events_1 = require("../../../../util/build/events");
class KateContextMenu {
    os;
    in_context = false;
    constructor(os) {
        this.os = os;
    }
    setup() {
        this.os.kernel.console.on_key_pressed.listen(this.handle_key_press);
    }
    teardown() {
        this.os.kernel.console.on_key_pressed.remove(this.handle_key_press);
    }
    handle_key_press = (key) => {
        switch (key) {
            case "long_menu": {
                this.show_context_menu();
                break;
            }
        }
    };
    show_context_menu() {
        if (this.in_context) {
            return;
        }
        this.in_context = true;
        this.os.processes.running?.pause();
        const menu = new HUD_ContextMenu(this.os);
        menu.on_close.listen(() => {
            this.in_context = false;
            // We want to avoid key presses being propagated on this tick
            this.os.kernel.console.on_tick.once(() => {
                this.os.processes.running?.unpause();
            });
            this.os.focus_handler.pop_root(menu.canvas);
        });
        this.os.show_hud(menu);
        this.os.focus_handler.push_root(menu.canvas);
    }
}
exports.KateContextMenu = KateContextMenu;
class HUD_ContextMenu extends scenes_1.Scene {
    os;
    on_close = new events_1.EventStream();
    constructor(os) {
        super(os);
        this.os = os;
    }
    render() {
        return UI.h("div", { class: "kate-os-hud-context-menu" }, [
            UI.h("div", { class: "kate-os-hud-context-menu-backdrop" }, []),
            UI.h("div", { class: "kate-os-hud-context-menu-content" }, [
                new UI.If(() => this.os.processes.running != null, {
                    then: new UI.Menu_list([
                        new UI.Button(["Close game"]).on_clicked(this.on_close_game),
                        new UI.Button(["Return"]).on_clicked(this.on_return),
                    ]),
                    else: new UI.Menu_list([
                        new UI.Button(["Power off"]).on_clicked(this.on_power_off),
                        new UI.Button(["Install from file"]).on_clicked(this.on_install_from_file),
                        new UI.Button(["Return"]).on_clicked(this.on_return),
                    ]),
                }),
            ]),
        ]);
    }
    on_install_from_file = async () => {
        this.os.hide_hud(this);
        this.on_close.emit();
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
        this.os.hide_hud(this);
        this.on_close.emit();
        await this.os.processes.running?.exit();
    };
    on_return = async () => {
        this.os.hide_hud(this);
        this.on_close.emit();
    };
    on_power_off = async () => {
        window.close();
        this.os.hide_hud(this);
        this.on_close.emit();
    };
}
exports.HUD_ContextMenu = HUD_ContextMenu;

},{"../../../../util/build/events":39,"../ui":32,"../ui/scenes":33}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cart_kvstore = exports.notifications = exports.cart_files = exports.cart_meta = exports.kate = void 0;
const Db = require("../../../../db-schema/build");
exports.kate = new Db.DatabaseSchema("kate", 1);
exports.cart_meta = exports.kate.table(1, "cart_meta", { path: "id", auto_increment: false }, []);
exports.cart_files = exports.kate.table(1, "cart_files", { path: "id", auto_increment: false }, []);
exports.notifications = exports.kate.table(1, "notifications", { path: "id", auto_increment: true }, []);
exports.cart_kvstore = exports.kate.table(1, "cart_kvstore", { path: "id", auto_increment: false }, []);

},{"../../../../db-schema/build":3}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_Dialog = exports.KateDialog = void 0;
const promise_1 = require("../../../../util/build/promise");
const time_1 = require("../time");
const UI = require("../ui");
const scenes_1 = require("../ui/scenes");
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
        return await this.hud.show(id, x.title, x.message, [
            { label: "Ok", kind: "primary", value: null },
        ]);
    }
    async confirm(id, x) {
        return await this.hud.show(id, x.title, x.message, [
            { label: x.cancel ?? "Cancel", kind: "cancel", value: false },
            {
                label: x.ok ?? "Ok",
                kind: x.dangerous === true ? "dangerous" : "primary",
                value: true,
            },
        ]);
    }
    async pop_menu(id, heading, buttons) {
        return await this.hud.pop_menu(id, heading, buttons);
    }
}
exports.KateDialog = KateDialog;
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
    async show(id, title, message, buttons) {
        const result = (0, promise_1.defer)();
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
        let return_value;
        if (this.is_trusted(id)) {
            this.os.kernel.console.body.classList.add("trusted-mode");
        }
        try {
            this.canvas.textContent = "";
            this.canvas.appendChild(element);
            this.os.focus_handler.push_root(this.canvas);
            return_value = await result.promise;
            this.os.focus_handler.pop_root(this.canvas);
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
    async pop_menu(id, heading, buttons) {
        const result = (0, promise_1.defer)();
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
        let return_value;
        if (this.is_trusted(id)) {
            this.os.kernel.console.body.classList.add("trusted-mode");
        }
        try {
            this.canvas.textContent = "";
            this.canvas.appendChild(element);
            this.os.focus_handler.push_root(this.canvas);
            return_value = await result.promise;
            this.os.focus_handler.pop_root(this.canvas);
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

},{"../../../../util/build/promise":42,"../time":31,"../ui":32,"../ui/scenes":33}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_DropInstaller = exports.KateDropInstaller = void 0;
const scenes_1 = require("../ui/scenes");
const UI = require("../ui");
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
            UI.h("div", { class: "kate-hud-drop-installer-icon" }, []),
            UI.h("div", { class: "kate-hud-drop-installer-description" }, [
                "Drop ",
                UI.h("tt", {}, [".kart"]),
                " files here to install them",
            ]),
        ]);
    }
}
exports.HUD_DropInstaller = HUD_DropInstaller;

},{"../ui":32,"../ui/scenes":33}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageFile = exports.StorageBucket = exports.KateStorage = void 0;
const Cart = require("../../../../schema/generated/cartridge");
class KateStorage {
    os;
    constructor(os) {
        this.os = os;
    }
    get backend() {
        return navigator.storage;
    }
    async usage() {
        const estimate = await this.backend.estimate();
        return {
            total: estimate.quota ?? 0,
            used: estimate.usage ?? 0,
        };
    }
    async get_real_bucket(name) {
        const root = await this.backend.getDirectory();
        const dir = await root.getDirectoryHandle(name, { create: true });
        return new StorageBucket(this, dir);
    }
    async get_bucket(name) {
        return this.get_real_bucket(`user.${name}`);
    }
    async get_carts() {
        return this.get_real_bucket("kate.carts");
    }
    async get_cart_bucket(cart) {
        return this.get_real_bucket(`cart.${cart.id}`);
    }
    async install_cart(cart) {
        const encoder = new Cart._Encoder();
        cart.encode(encoder);
        const bytes = encoder.to_bytes();
        const bucket = await this.get_carts();
        const file = await bucket.file_at(cart.id, true);
        await file.write(bytes.buffer);
        this.os.events.on_cart_inserted.emit(cart);
    }
}
exports.KateStorage = KateStorage;
class StorageBucket {
    storage;
    handle;
    constructor(storage, handle) {
        this.storage = storage;
        this.handle = handle;
    }
    async list() {
        const result = [];
        for await (const file of this.handle.values()) {
            if (file.kind === "file" && !file.name.endsWith(".crswap")) {
                result.push(file);
            }
        }
        return result;
    }
    async file_at(name, create) {
        return new StorageFile(this, await this.handle.getFileHandle(name, { create }));
    }
}
exports.StorageBucket = StorageBucket;
class StorageFile {
    bucket;
    handle;
    constructor(bucket, handle) {
        this.bucket = bucket;
        this.handle = handle;
    }
    async read() {
        return await this.handle.getFile();
    }
    async write(data) {
        const stream = await this.handle.createWritable();
        stream.write(data);
    }
    async get_write_stream() {
        return await this.handle.createWritable();
    }
}
exports.StorageFile = StorageFile;

},{"../../../../schema/generated/cartridge":36}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateFocusHandler = void 0;
class KateFocusHandler {
    os;
    _stack = [];
    _current_root = null;
    constructor(os) {
        this.os = os;
    }
    setup() {
        this.os.kernel.console.on_key_pressed.listen(this.handle_input);
    }
    should_handle(key) {
        return ["up", "down", "left", "right", "o"].includes(key);
    }
    get current_root() {
        return this._current_root;
    }
    push_root(element) {
        this._stack.push(this._current_root);
        this._current_root = element;
        if (element != null && element.querySelector(".focus") == null) {
            const candidates0 = Array.from(element.querySelectorAll(".kate-ui-focus-target"));
            const candidates = candidates0.sort((a, b) => a.offsetLeft - b.offsetLeft);
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
        }
        else {
            throw new Error(`pop_root() on an empty focus stack`);
        }
    }
    handle_input = (key) => {
        if (this._current_root == null || !this.should_handle(key)) {
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
                if (current != null) {
                    current.element.click();
                }
                break;
            }
            case "up": {
                const candidates = focusable
                    .filter((x) => x.position.bottom < bottom)
                    .sort((a, b) => b.position.bottom - a.position.bottom);
                const closest = candidates.sort((a, b) => {
                    return (Math.min(a.position.x - left, a.position.right - right) -
                        Math.min(b.position.x - left, b.position.right - right));
                });
                this.focus(closest[0]?.element);
                break;
            }
            case "down": {
                const candidates = focusable
                    .filter((x) => x.position.y > top)
                    .sort((a, b) => a.position.y - b.position.y);
                const closest = candidates.sort((a, b) => {
                    return (Math.min(a.position.x - left, a.position.right - right) -
                        Math.min(b.position.x - left, b.position.right - right));
                });
                this.focus(closest[0]?.element);
                break;
            }
            case "left": {
                const candidates = focusable
                    .filter((x) => x.position.right < right)
                    .sort((a, b) => b.position.right - a.position.right);
                const closest = candidates.sort((a, b) => {
                    return (Math.min(a.position.y - top, a.position.bottom - bottom) -
                        Math.min(b.position.y - top, b.position.bottom - bottom));
                });
                this.focus(closest[0]?.element);
                break;
            }
            case "right": {
                const candidates = focusable
                    .filter((x) => x.position.x > left)
                    .sort((a, b) => a.position.x - b.position.x);
                const closest = candidates.sort((a, b) => {
                    return (Math.min(a.position.y - top, a.position.bottom - bottom) -
                        Math.min(b.position.y - top, b.position.bottom - bottom));
                });
                this.focus(closest[0]?.element);
                break;
            }
        }
    };
    focus(element) {
        if (element == null || this._current_root == null) {
            return;
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

},{}],23:[function(require,module,exports){
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
__exportStar(require("./audio"), exports);
__exportStar(require("./cart-manager"), exports);
__exportStar(require("./context_menu"), exports);
__exportStar(require("./db"), exports);
__exportStar(require("./drop-installer"), exports);
__exportStar(require("./file_storage"), exports);
__exportStar(require("./focus-handler"), exports);
__exportStar(require("./ipc"), exports);
__exportStar(require("./kv_storage"), exports);
__exportStar(require("./notification"), exports);
__exportStar(require("./processes"), exports);
__exportStar(require("./status-bar"), exports);

},{"./audio":15,"./cart-manager":16,"./context_menu":17,"./db":18,"./drop-installer":20,"./file_storage":21,"./focus-handler":22,"./ipc":24,"./kv_storage":25,"./notification":26,"./processes":27,"./status-bar":28}],24:[function(require,module,exports){
(function (process){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateIPCChannel = exports.KateIPCServer = void 0;
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
    add_process(secret, cart, window, audio) {
        if (this._handlers.has(secret)) {
            throw new Error(`Duplicated secret when constructing IPC channel`);
        }
        const process = { secret, cart, window, audio };
        this._handlers.set(secret, process);
        return new KateIPCChannel(this, process);
    }
    remove_process(process) {
        this._handlers.delete(process.secret);
    }
    send(process, message) {
        process.window()?.postMessage(message, "*");
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
                const result = await this.process_message(handler, {
                    type: type,
                    payload,
                });
                if (result == null) {
                    return;
                }
                const { ok, value } = result;
                console.debug("kate-ipc ==>", { id, ok, value });
                handler.window()?.postMessage({
                    type: "kate:reply",
                    id: id,
                    ok: ok,
                    value: value,
                }, "*");
            }
        }
    };
    async process_message(process, message) {
        const err = (code) => ({ ok: false, value: { code } });
        const ok = (value) => ({ ok: true, value });
        switch (message.type) {
            // -- Special
            case "kate:special.focus": {
                window.focus();
                return null;
            }
            // -- Cart FS
            case "kate:cart.read-file": {
                const file = process.cart.files.find((x) => x.path === message.payload.path);
                if (file != null) {
                    return ok({ mime: file.mime, bytes: file.data });
                }
                else {
                    return err("kate.cart-fs.file-not-found");
                }
            }
            // -- KV store
            case "kate:kv-store.read-all": {
                const storage = this.os.kv_storage.get_store(process.cart.id);
                return ok(storage.contents());
            }
            case "kate:kv-store.update-all": {
                const storage = this.os.kv_storage.get_store(process.cart.id);
                try {
                    await storage.write(message.payload.value);
                    return ok(null);
                }
                catch (_) {
                    return err("kate.kv-store.write-failed");
                }
            }
            case "kate:kv-store.get": {
                const storage = this.os.kv_storage.get_store(process.cart.id);
                const value = (await storage.contents())[message.payload.key] ?? null;
                return ok(value);
            }
            case "kate:kv-store.set": {
                const storage = this.os.kv_storage.get_store(process.cart.id);
                try {
                    await storage.set_pair(message.payload.key, message.payload.value);
                    return ok(null);
                }
                catch (_) {
                    return err("kate:kv-store.write-failed");
                }
            }
            // -- Audio
            case "kate:audio.create-channel": {
                try {
                    const channel = await process.audio.create_channel(message.payload.max_tracks ?? 1);
                    return ok({ id: channel.id, volume: channel.volume.gain.value });
                }
                catch (error) {
                    return err(`kate:audio.cannot-create-channel`);
                }
            }
            case "kate:audio.stop-all-sources": {
                try {
                    const channel = process.audio.get_channel(message.payload.id);
                    await channel.stop_all_sources();
                    return ok(null);
                }
                catch (_) {
                    return err("kate:audio.cannot-stop-sources");
                }
            }
            case "kate:audio.change-volume": {
                try {
                    const channel = process.audio.get_channel(message.payload.id);
                    await channel.set_volume(message.payload.volume);
                    return ok(null);
                }
                catch (_) {
                    return err("kate:audio.cannot-change-volume");
                }
            }
            case "kate:audio.load": {
                try {
                    const source = await process.audio.load_sound(message.payload.bytes);
                    return ok(source.id);
                }
                catch (_) {
                    return err("kate:audio.cannot-load");
                }
            }
            case "kate:audio.play": {
                try {
                    const channel = process.audio.get_channel(message.payload.channel);
                    const source = process.audio.get_source(message.payload.source);
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
    process;
    constructor(server, process) {
        this.server = server;
        this.process = process;
    }
    send(message) {
        this.server.send(this.process, message);
    }
    dispose() {
        this.server.remove_process(this.process);
    }
}
exports.KateIPCChannel = KateIPCChannel;

}).call(this)}).call(this,require('_process'))
},{"_process":1}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateKVStoragePartition = exports.KateKVStorage = void 0;
const Db = require("./db");
class KateKVStorage {
    os;
    constructor(os) {
        this.os = os;
    }
    get_store(id) {
        return new KateKVStoragePartition(this, id);
    }
}
exports.KateKVStorage = KateKVStorage;
class KateKVStoragePartition {
    manager;
    id;
    constructor(manager, id) {
        this.manager = manager;
        this.id = id;
    }
    get db() {
        return this.manager.os.db;
    }
    async contents() {
        return this.db.transaction([Db.cart_kvstore], "readonly", async (t) => {
            const store = t.get_table(Db.cart_kvstore);
            return (await store.try_get(this.id))?.content ?? Object.create(null);
        });
    }
    async write(from) {
        const data = Object.create(null);
        for (const [key, value] of Object.entries(from)) {
            data[key] = String(value);
        }
        return this.db.transaction([Db.cart_kvstore], "readwrite", async (t) => {
            const store = t.get_table(Db.cart_kvstore);
            await store.write({ id: this.id, content: data });
        });
    }
    async set_pair(key, value) {
        return this.db.transaction([Db.cart_kvstore], "readwrite", async (t) => {
            const store = t.get_table(Db.cart_kvstore);
            const value = (await store.try_get(this.id))?.content ?? Object.create(null);
            value[key] = value;
            await store.write({ id: this.id, content: value });
        });
    }
}
exports.KateKVStoragePartition = KateKVStoragePartition;

},{"./db":18}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_Toaster = exports.KateNotification = void 0;
const scenes_1 = require("../ui/scenes");
const UI = require("../ui");
const Db = require("./db");
const time_1 = require("../time");
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
        await this.os.db.transaction([Db.notifications], "readwrite", async (t) => {
            const notifications = t.get_table(Db.notifications);
            await notifications.write({
                type: "basic",
                process_id,
                time: new Date(),
                title,
                message,
            });
        });
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

},{"../time":31,"../ui":32,"../ui/scenes":33,"./db":18}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateProcess = exports.HUD_LoadIndicator = exports.KateProcesses = void 0;
const ui_1 = require("../ui");
const scenes_1 = require("../ui/scenes");
const Db = require("./db");
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
    async run(id) {
        if (this.is_busy) {
            throw new Error(`process already running`);
        }
        const loading = new HUD_LoadIndicator(this.os);
        this.os.show_hud(loading);
        this.os.focus_handler.push_root(null);
        try {
            const cart = await this.os.db.transaction([Db.cart_files], "readonly", async (t) => {
                const files = t.get_table(Db.cart_files);
                const file = await files.get(id);
                return this.os.kernel.loader.load_bytes(file.bytes.buffer);
            });
            const storage = this.os.kv_storage.get_store(cart.id);
            const runtime = this.os.kernel.runtimes.from_cartridge(cart, await storage.contents());
            const process = new KateProcess(this, cart, runtime.run(this.os));
            this._running = process;
            this.os.kernel.console.os_root.classList.add("in-background");
            return process;
        }
        catch (error) {
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
            this.os.focus_handler.pop_root(null);
            this.os.kernel.console.os_root.classList.remove("in-background");
        }
    }
}
exports.KateProcesses = KateProcesses;
class HUD_LoadIndicator extends scenes_1.Scene {
    render() {
        return (0, ui_1.h)("div", { class: "kate-hud-load-screen" }, ["Loading..."]);
    }
}
exports.HUD_LoadIndicator = HUD_LoadIndicator;
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

},{"../ui":32,"../ui/scenes":33,"./db":18}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateStatus = exports.HUD_StatusBar = exports.KateStatusBar = void 0;
const ui_1 = require("../ui");
const scenes_1 = require("../ui/scenes");
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

},{"../ui":32,"../ui/scenes":33}],29:[function(require,module,exports){
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
__exportStar(require("./os"), exports);
__exportStar(require("./time"), exports);
__exportStar(require("./ui"), exports);
__exportStar(require("./apis"), exports);

},{"./apis":23,"./os":30,"./time":31,"./ui":32}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateOS = void 0;
const KateDb = require("./apis/db");
const events_1 = require("../../../util/build/events");
const file_storage_1 = require("./apis/file_storage");
const time_1 = require("./time");
const scenes_1 = require("./ui/scenes");
const cart_manager_1 = require("./apis/cart-manager");
const processes_1 = require("./apis/processes");
const context_menu_1 = require("./apis/context_menu");
const notification_1 = require("./apis/notification");
const drop_installer_1 = require("./apis/drop-installer");
const focus_handler_1 = require("./apis/focus-handler");
const status_bar_1 = require("./apis/status-bar");
const kv_storage_1 = require("./apis/kv_storage");
const ipc_1 = require("./apis/ipc");
const apis_1 = require("./apis");
const dialog_1 = require("./apis/dialog");
class KateOS {
    kernel;
    db;
    _scene_stack = [];
    _active_hud = [];
    _current_scene = null;
    storage;
    cart_manager;
    processes;
    context_menu;
    notifications;
    installer;
    focus_handler;
    status_bar;
    kv_storage;
    ipc;
    dialog;
    events = {
        on_cart_inserted: new events_1.EventStream(),
        on_cart_removed: new events_1.EventStream(),
    };
    constructor(kernel, db) {
        this.kernel = kernel;
        this.db = db;
        this.storage = new file_storage_1.KateStorage(this);
        this.cart_manager = new cart_manager_1.CartManager(this);
        this.processes = new processes_1.KateProcesses(this);
        this.kv_storage = new kv_storage_1.KateKVStorage(this);
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
    show_hud(scene) {
        this._active_hud.push(scene);
        scene.attach(this.hud_display);
    }
    hide_hud(scene) {
        this._active_hud = this._active_hud.filter((x) => x !== scene);
        scene.detach();
    }
    make_audio_server() {
        return new apis_1.KateAudioServer(this);
    }
    static async boot(kernel) {
        const db = await KateDb.kate.open();
        const os = new KateOS(kernel, db);
        const boot_screen = new scenes_1.SceneBoot(os);
        os.push_scene(boot_screen);
        await (0, time_1.wait)(2100);
        os.pop_scene();
        os.push_scene(new scenes_1.SceneHome(os));
        return os;
    }
}
exports.KateOS = KateOS;

},{"../../../util/build/events":39,"./apis":23,"./apis/cart-manager":16,"./apis/context_menu":17,"./apis/db":18,"./apis/dialog":19,"./apis/drop-installer":20,"./apis/file_storage":21,"./apis/focus-handler":22,"./apis/ipc":24,"./apis/kv_storage":25,"./apis/notification":26,"./apis/processes":27,"./apis/status-bar":28,"./time":31,"./ui/scenes":33}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wait = void 0;
async function wait(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(), ms));
}
exports.wait = wait;

},{}],32:[function(require,module,exports){
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
exports.Scenes = void 0;
__exportStar(require("./widget"), exports);
const Scenes = require("./scenes");
exports.Scenes = Scenes;

},{"./scenes":33,"./widget":34}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneHome = exports.SceneBoot = exports.Scene = void 0;
const widget_1 = require("./widget");
const UI = require("./widget");
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
    }
    async detach() {
        this.canvas.remove();
    }
}
exports.Scene = Scene;
class SceneBoot extends Scene {
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
class SceneHome extends Scene {
    render_cart(x) {
        return new UI.Button([
            (0, widget_1.h)("div", { class: "kate-os-carts-box" }, [
                (0, widget_1.h)("div", { class: "kate-os-carts-image" }, x.thumbnail
                    ? [
                        (0, widget_1.h)("img", {
                            src: URL.createObjectURL(new Blob([x.thumbnail.bytes], {
                                type: x.thumbnail.mime,
                            })),
                        }, []),
                    ]
                    : []),
                (0, widget_1.h)("div", { class: "kate-os-carts-title" }, [x.title]),
            ]),
        ]).on_clicked(() => {
            this.os.processes.run(x.id);
        });
    }
    async show_carts(list) {
        try {
            const carts = (await this.os.cart_manager.list()).sort((a, b) => b.installed_at.getTime() - a.installed_at.getTime());
            list.textContent = "";
            const cart_map = new Map();
            for (const x of carts) {
                const child = this.render_cart(x).render();
                cart_map.set(child, x);
                list.appendChild(child);
            }
            this.os.focus_handler.focus(list.querySelector(".kate-ui-focus-target") ??
                list.firstElementChild ??
                null);
            this.handle_key_pressed = async (key) => {
                if (this.os.processes.is_busy) {
                    return;
                }
                switch (key) {
                    case "menu": {
                        for (const [button, cart] of cart_map) {
                            if (button.classList.contains("focus")) {
                                await this.show_pop_menu(cart);
                                return;
                            }
                        }
                    }
                }
            };
        }
        catch (error) {
            console.log(error);
            this.os.notifications.push("kate:os", "Failed to load games", `An internal error happened while loading.`);
        }
    }
    async show_pop_menu(cart) {
        const result = await this.os.dialog.pop_menu("kate:home", cart.title, [
            { label: "Play game", value: "play" },
            { label: "Uninstall", value: "uninstall" },
            { label: "Return", value: "close" },
        ]);
        switch (result) {
            case "play": {
                this.os.processes.run(cart.id);
                break;
            }
            case "uninstall": {
                const should_uninstall = await this.os.dialog.confirm("kate:home", {
                    title: `Uninstall ${cart.title}?`,
                    message: `This will remove the cartridge and all its related data (including save data).`,
                    cancel: "Keep game",
                    ok: "Uninstall game",
                    dangerous: true,
                });
                if (should_uninstall) {
                    this.os.cart_manager.uninstall(cart);
                }
                break;
            }
        }
    }
    render() {
        const home = (0, widget_1.h)("div", { class: "kate-os-home" }, [
            new UI.Title_bar({
                left: UI.fragment([new UI.Section_title(["Library"])]),
            }),
            (0, widget_1.h)("div", { class: "kate-os-carts-scroll" }, [
                (0, widget_1.h)("div", { class: "kate-os-carts" }, []),
            ]),
        ]);
        const carts = home.querySelector(".kate-os-carts");
        this.show_carts(carts);
        this.os.events.on_cart_inserted.listen(async (x) => {
            this.show_carts(carts);
        });
        this.os.events.on_cart_removed.listen(async () => {
            this.show_carts(carts);
        });
        this.os.kernel.console.on_key_pressed.listen((key) => this.handle_key_pressed(key));
        return home;
    }
    handle_key_pressed = (key) => { };
}
exports.SceneHome = SceneHome;

},{"./widget":34}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Icon = exports.Button = exports.If = exports.Menu_list = exports.Section_title = exports.Title_bar = exports.VBox = exports.HBox = exports.WithClass = exports.append = exports.render = exports.svg = exports.h = exports.fragment = exports.Widget = void 0;
const events_1 = require("../../../../util/build/events");
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
class Button extends Widget {
    children;
    _on_clicked = new events_1.EventStream();
    constructor(children) {
        super();
        this.children = children;
    }
    on_clicked(fn) {
        this._on_clicked.listen(fn);
        return this;
    }
    render() {
        const element = h("button", { class: "kate-ui-button kate-ui-focus-target" }, this.children);
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

},{"../../../../util/build/events":39}],35:[function(require,module,exports){
module.exports={
  "name": "@qteatime/kate-core",
  "version": "0.3.0",
  "description": "The Kate emulator --- a fantasy console for 2d story games.",
  "main": "build/index.js",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/qteatime/kate.git"
  },
  "author": "Q.",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/qteatime/kate/issues"
  },
  "homepage": "https://github.com/qteatime/kate#readme"
}

},{}],36:[function(require,module,exports){
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
        const warnings = $d.array(() => {
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
        $e.array((this.warnings), ($e, v) => {
            $e.text(v);
        });
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
            case 3: return Bridge.RPGMaker_MV.decode($d);
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
    class RPGMaker_MV extends Bridge$Base {
        static $tag = 3 /* $Tags.RPGMaker_MV */;
        $tag = 3 /* $Tags.RPGMaker_MV */;
        constructor() {
            super();
        }
        static decode($d) {
            return RPGMaker_MV.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 3) {
                throw new Error(`Invalid tag ${$tag} for Bridge.RPGMaker-MV: expected 3`);
            }
            return new RPGMaker_MV();
        }
        encode($e) {
            $e.ui32(25);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(3);
        }
    }
    Bridge.RPGMaker_MV = RPGMaker_MV;
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
        const key_code = $d.bigint();
        return new KeyboardKey(key, code, key_code);
    }
    encode($e) {
        $e.ui32(27);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.text(this.key);
        $e.text(this.code);
        $e.integer(this.key_code);
    }
}
exports.KeyboardKey = KeyboardKey;

},{}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove_fingerprint = exports.add_fingerprint = exports.check_fingerprint = exports.fingerprint = void 0;
exports.fingerprint = new Uint8Array("KATE/v02".split("").map((x) => x.charCodeAt(0)));
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

},{}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unreachable = void 0;
function unreachable(x, message = "") {
    throw new Error(`Unhandled value(${message}): ${x}`);
}
exports.unreachable = unreachable;

},{}],39:[function(require,module,exports){
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

},{}],40:[function(require,module,exports){
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
__exportStar(require("./assert"), exports);
__exportStar(require("./events"), exports);
__exportStar(require("./promise"), exports);
__exportStar(require("./random"), exports);
__exportStar(require("./pathname"), exports);

},{"./assert":38,"./events":39,"./pathname":41,"./promise":42,"./random":43}],41:[function(require,module,exports){
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

},{}],42:[function(require,module,exports){
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

},{}],43:[function(require,module,exports){
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

},{}]},{},[6])(6)
});
