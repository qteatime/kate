(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.KateOS = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
(function (setImmediate,clearImmediate){(function (){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":1,"timers":2}],3:[function(require,module,exports){
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
    constructor(db) {
        this.db = db;
    }
    async transaction(tables, mode, fn) {
        return new Promise(async (resolve, reject) => {
            const request = this.db.transaction(tables.map(x => x.name), mode);
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

},{}],4:[function(require,module,exports){
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

},{"./db":3,"./schema":5}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexSchema = exports.TableSchema = exports.DatabaseSchema = exports.DBError_UnableToOpen = void 0;
const db_1 = require("./db");
class DBError_UnableToOpen extends Error {
    constructor(db) {
        super(`Unable to open ${db.name}`);
        this.db = db;
    }
}
exports.DBError_UnableToOpen = DBError_UnableToOpen;
class DatabaseSchema {
    constructor(name, version) {
        this.name = name;
        this.version = version;
        this.tables = [];
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

},{"./db":3}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bridge = exports.Bridge$Base = exports.Platform = exports.Platform$Base = exports.Date = exports.Content_classification = exports.Content_classification$Base = exports.Metadata = exports.File = exports.Cartridge = exports._Encoder = exports._Decoder = void 0;
class _Decoder {
    constructor(view) {
        this.view = view;
        this.offset = 0;
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
        const result = [];
        for (let i = 0; i < size; ++i) {
            result[i] = this.view.getUint8(this.offset + i);
        }
        this.offset += size;
        return new Uint8Array(result);
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
    constructor() {
        this.buffers = [];
    }
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
class Cartridge {
    constructor(id, metadata, files, platform) {
        this.id = id;
        this.metadata = metadata;
        this.files = files;
        this.platform = platform;
        this.$tag = 0;
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
Cartridge.$tag = 0;
class File {
    constructor(path, mime, data) {
        this.path = path;
        this.mime = mime;
        this.data = data;
        this.$tag = 1;
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
File.$tag = 1;
class Metadata {
    constructor(author, title, description, category, content_warning, classification, release_date, thumbnail) {
        this.author = author;
        this.title = title;
        this.description = description;
        this.category = category;
        this.content_warning = content_warning;
        this.classification = classification;
        this.release_date = release_date;
        this.thumbnail = thumbnail;
        this.$tag = 2;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 2) {
            throw new Error(`Invalid tag ${$tag} for Metadata: expected 2`);
        }
        return Metadata.$do_decode($d);
    }
    static $do_decode($d) {
        const author = $d.text();
        const title = $d.text();
        const description = $d.text();
        const category = $d.text();
        const content_warning = $d.array(() => {
            const item = $d.text();
            ;
            return item;
        });
        const classification = Content_classification$Base.$do_decode($d);
        const release_date = Date.$do_decode($d);
        const thumbnail = File.$do_decode($d);
        return new Metadata(author, title, description, category, content_warning, classification, release_date, thumbnail);
    }
    encode($e) {
        $e.ui32(2);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.text(this.author);
        $e.text(this.title);
        $e.text(this.description);
        $e.text(this.category);
        $e.array((this.content_warning), ($e, v) => {
            $e.text(v);
        });
        (this.classification).$do_encode($e);
        (this.release_date).$do_encode($e);
        (this.thumbnail).$do_encode($e);
    }
}
exports.Metadata = Metadata;
Metadata.$tag = 2;
class Content_classification$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 3) {
            throw new Error(`Invalid tag ${$tag} for Content-classification: expected 3`);
        }
        return Content_classification$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Content_classification.General.decode($d);
            case 1: return Content_classification.Teen_and_up.decode($d);
            case 2: return Content_classification.Mature.decode($d);
            case 3: return Content_classification.Explicit.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Content-classification`);
        }
    }
}
exports.Content_classification$Base = Content_classification$Base;
var Content_classification;
(function (Content_classification) {
    class General extends Content_classification$Base {
        constructor() {
            super();
            this.$tag = 0 /* $Tags.General */;
        }
        static decode($d) {
            return General.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Content-classification.General: expected 0`);
            }
            return new General();
        }
        encode($e) {
            $e.ui32(3);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
        }
    }
    General.$tag = 0 /* $Tags.General */;
    Content_classification.General = General;
    class Teen_and_up extends Content_classification$Base {
        constructor() {
            super();
            this.$tag = 1 /* $Tags.Teen_and_up */;
        }
        static decode($d) {
            return Teen_and_up.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 1) {
                throw new Error(`Invalid tag ${$tag} for Content-classification.Teen-and-up: expected 1`);
            }
            return new Teen_and_up();
        }
        encode($e) {
            $e.ui32(3);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(1);
        }
    }
    Teen_and_up.$tag = 1 /* $Tags.Teen_and_up */;
    Content_classification.Teen_and_up = Teen_and_up;
    class Mature extends Content_classification$Base {
        constructor() {
            super();
            this.$tag = 2 /* $Tags.Mature */;
        }
        static decode($d) {
            return Mature.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 2) {
                throw new Error(`Invalid tag ${$tag} for Content-classification.Mature: expected 2`);
            }
            return new Mature();
        }
        encode($e) {
            $e.ui32(3);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(2);
        }
    }
    Mature.$tag = 2 /* $Tags.Mature */;
    Content_classification.Mature = Mature;
    class Explicit extends Content_classification$Base {
        constructor() {
            super();
            this.$tag = 3 /* $Tags.Explicit */;
        }
        static decode($d) {
            return Explicit.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 3) {
                throw new Error(`Invalid tag ${$tag} for Content-classification.Explicit: expected 3`);
            }
            return new Explicit();
        }
        encode($e) {
            $e.ui32(3);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(3);
        }
    }
    Explicit.$tag = 3 /* $Tags.Explicit */;
    Content_classification.Explicit = Explicit;
})(Content_classification = exports.Content_classification || (exports.Content_classification = {}));
class Date {
    constructor(year, month, day) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.$tag = 4;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 4) {
            throw new Error(`Invalid tag ${$tag} for Date: expected 4`);
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
        $e.ui32(4);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.ui32(this.year);
        $e.ui8(this.month);
        $e.ui8(this.day);
    }
}
exports.Date = Date;
Date.$tag = 4;
class Platform$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 5) {
            throw new Error(`Invalid tag ${$tag} for Platform: expected 5`);
        }
        return Platform$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Platform.Web.decode($d);
            case 1: return Platform.Web_archive.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Platform`);
        }
    }
}
exports.Platform$Base = Platform$Base;
var Platform;
(function (Platform) {
    class Web extends Platform$Base {
        constructor(url, width, height) {
            super();
            this.url = url;
            this.width = width;
            this.height = height;
            this.$tag = 0 /* $Tags.Web */;
        }
        static decode($d) {
            return Web.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Platform.Web: expected 0`);
            }
            const url = $d.text();
            const width = $d.ui32();
            const height = $d.ui32();
            return new Web(url, width, height);
        }
        encode($e) {
            $e.ui32(5);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
            $e.text(this.url);
            $e.ui32(this.width);
            $e.ui32(this.height);
        }
    }
    Web.$tag = 0 /* $Tags.Web */;
    Platform.Web = Web;
    class Web_archive extends Platform$Base {
        constructor(html, bridges) {
            super();
            this.html = html;
            this.bridges = bridges;
            this.$tag = 1 /* $Tags.Web_archive */;
        }
        static decode($d) {
            return Web_archive.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 1) {
                throw new Error(`Invalid tag ${$tag} for Platform.Web-archive: expected 1`);
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
            $e.ui32(5);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(1);
            $e.text(this.html);
            $e.array((this.bridges), ($e, v) => {
                (v).$do_encode($e);
            });
        }
    }
    Web_archive.$tag = 1 /* $Tags.Web_archive */;
    Platform.Web_archive = Web_archive;
})(Platform = exports.Platform || (exports.Platform = {}));
class Bridge$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 6) {
            throw new Error(`Invalid tag ${$tag} for Bridge: expected 6`);
        }
        return Bridge$Base.$do_decode($d);
    }
    static $do_decode($d) {
        const $tag = $d.peek((v) => v.getUint8(0));
        switch ($tag) {
            case 0: return Bridge.RPG_maker_mv.decode($d);
            case 1: return Bridge.Renpy.decode($d);
            case 2: return Bridge.Network_proxy.decode($d);
            case 3: return Bridge.Local_storage_proxy.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Bridge`);
        }
    }
}
exports.Bridge$Base = Bridge$Base;
var Bridge;
(function (Bridge) {
    class RPG_maker_mv extends Bridge$Base {
        constructor() {
            super();
            this.$tag = 0 /* $Tags.RPG_maker_mv */;
        }
        static decode($d) {
            return RPG_maker_mv.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 0) {
                throw new Error(`Invalid tag ${$tag} for Bridge.RPG-maker-mv: expected 0`);
            }
            return new RPG_maker_mv();
        }
        encode($e) {
            $e.ui32(6);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(0);
        }
    }
    RPG_maker_mv.$tag = 0 /* $Tags.RPG_maker_mv */;
    Bridge.RPG_maker_mv = RPG_maker_mv;
    class Renpy extends Bridge$Base {
        constructor() {
            super();
            this.$tag = 1 /* $Tags.Renpy */;
        }
        static decode($d) {
            return Renpy.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 1) {
                throw new Error(`Invalid tag ${$tag} for Bridge.Renpy: expected 1`);
            }
            return new Renpy();
        }
        encode($e) {
            $e.ui32(6);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(1);
        }
    }
    Renpy.$tag = 1 /* $Tags.Renpy */;
    Bridge.Renpy = Renpy;
    class Network_proxy extends Bridge$Base {
        constructor() {
            super();
            this.$tag = 2 /* $Tags.Network_proxy */;
        }
        static decode($d) {
            return Network_proxy.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 2) {
                throw new Error(`Invalid tag ${$tag} for Bridge.Network-proxy: expected 2`);
            }
            return new Network_proxy();
        }
        encode($e) {
            $e.ui32(6);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(2);
        }
    }
    Network_proxy.$tag = 2 /* $Tags.Network_proxy */;
    Bridge.Network_proxy = Network_proxy;
    class Local_storage_proxy extends Bridge$Base {
        constructor() {
            super();
            this.$tag = 3 /* $Tags.Local_storage_proxy */;
        }
        static decode($d) {
            return Local_storage_proxy.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 3) {
                throw new Error(`Invalid tag ${$tag} for Bridge.Local-storage-proxy: expected 3`);
            }
            return new Local_storage_proxy();
        }
        encode($e) {
            $e.ui32(6);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(3);
        }
    }
    Local_storage_proxy.$tag = 3 /* $Tags.Local_storage_proxy */;
    Bridge.Local_storage_proxy = Local_storage_proxy;
})(Bridge = exports.Bridge || (exports.Bridge = {}));

},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartManager = void 0;
const Cart = require("../../generated/cartridge");
const Db = require("./db");
class CartManager {
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
    async install(cart) {
        const result = await this.os.db.transaction([Db.cart_meta, Db.cart_files], "readwrite", async (t) => {
            const meta = t.get_table(Db.cart_meta);
            const files = t.get_table(Db.cart_files);
            const existing = await meta.get_all(cart.id);
            if (existing.length !== 0) {
                return false;
            }
            const encoder = new Cart._Encoder();
            cart.encode(encoder);
            const bytes = encoder.to_bytes();
            await meta.write({
                id: cart.id,
                title: cart.metadata?.title ?? cart.id,
                description: cart.metadata?.description ?? "",
                thumbnail: cart.metadata?.thumbnail ? {
                    mime: cart.metadata.thumbnail.mime,
                    bytes: cart.metadata.thumbnail.data
                } : null
            });
            await files.write({
                id: cart.id,
                bytes: bytes
            });
            return true;
        });
        if (result) {
            this.os.events.on_cart_inserted.emit(cart);
        }
        return result;
    }
}
exports.CartManager = CartManager;

},{"../../generated/cartridge":6,"./db":9}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_ContextMenu = exports.KateContextMenu = void 0;
const scenes_1 = require("../ui/scenes");
const UI = require("../ui");
const events_1 = require("../../util/events");
class KateContextMenu {
    constructor(os) {
        this.os = os;
        this.in_context = false;
        this.handle_key_press = (key) => {
            switch (key) {
                case "long_menu": {
                    this.show_context_menu();
                    break;
                }
            }
        };
    }
    setup() {
        this.os.kernel.console.on_key_pressed.listen(this.handle_key_press);
    }
    teardown() {
        this.os.kernel.console.on_key_pressed.remove(this.handle_key_press);
    }
    show_context_menu() {
        if (this.in_context) {
            return;
        }
        this.in_context = true;
        this.os.processes.running?.pause();
        const old_context = this.os.focus_handler.current_root;
        const menu = new HUD_ContextMenu(this.os);
        menu.on_close.listen(() => {
            this.in_context = false;
            this.os.processes.running?.unpause();
            this.os.focus_handler.compare_and_change_root(old_context, menu.canvas);
        });
        this.os.show_hud(menu);
        this.os.focus_handler.change_root(menu.canvas);
    }
}
exports.KateContextMenu = KateContextMenu;
class HUD_ContextMenu extends scenes_1.Scene {
    constructor(os) {
        super(os);
        this.os = os;
        this.on_close = new events_1.EventStream();
        this.on_close_game = async () => {
            await this.os.processes.running?.exit();
            this.os.hide_hud(this);
            this.on_close.emit();
        };
        this.on_return = async () => {
            this.os.hide_hud(this);
            this.on_close.emit();
        };
        this.on_power_off = async () => {
            window.close();
            this.os.hide_hud(this);
            this.on_close.emit();
        };
    }
    render() {
        return UI.h("div", { class: "kate-os-hud-context-menu" }, [
            UI.h("div", { class: "kate-os-hud-context-menu-backdrop" }, []),
            UI.h("div", { class: "kate-os-hud-context-menu-content" }, [
                new UI.If(() => this.os.processes.running != null, {
                    then: new UI.Menu_list([
                        new UI.Button(["Close game"]).on_clicked(this.on_close_game),
                        new UI.Button(["Return"]).on_clicked(this.on_return)
                    ]),
                    else: new UI.Menu_list([
                        new UI.Button(["Power off"]).on_clicked(this.on_power_off),
                        new UI.Button(["Return"]).on_clicked(this.on_return)
                    ])
                })
            ]),
        ]);
    }
}
exports.HUD_ContextMenu = HUD_ContextMenu;

},{"../../util/events":23,"../ui":20,"../ui/scenes":21}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cart_kvstore = exports.notifications = exports.cart_files = exports.cart_meta = exports.kate = void 0;
const Db = require("../../db");
exports.kate = new Db.DatabaseSchema("kate", 1);
exports.cart_meta = exports.kate.table(1, "cart_meta", { path: "id", auto_increment: false }, []);
exports.cart_files = exports.kate.table(1, "cart_files", { path: "id", auto_increment: false }, []);
exports.notifications = exports.kate.table(1, "notifications", { path: "id", auto_increment: true }, []);
exports.cart_kvstore = exports.kate.table(1, "cart_kvstore", { path: "id", auto_increment: false }, []);

},{"../../db":4}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_DropInstaller = exports.KateDropInstaller = void 0;
const scenes_1 = require("../ui/scenes");
const UI = require("../ui");
class KateDropInstaller {
    constructor(os) {
        this.os = os;
        this.hud = new HUD_DropInstaller(this);
    }
    setup() {
        this.hud.setup();
    }
    async install(files) {
        const valid = files.filter(x => x.name.endsWith(".kart"));
        const status = this.os.status_bar.show(`Installing ${files.length} carts...`);
        for (const file of valid) {
            if (!file.name.endsWith(".kart")) {
                continue;
            }
            status.update(`Installing ${file.name}...`);
            try {
                const cart = this.os.kernel.loader.load_bytes(await file.arrayBuffer());
                if (await this.os.cart_manager.install(cart)) {
                    await this.os.notifications.push("kate:installer", "New game installed", `${cart.metadata?.title ?? cart.id} is ready to play!`);
                }
            }
            catch (error) {
                console.error(`Failed to install ${file.name}:`, error);
                await this.os.notifications.push("kate:installer", "Installation failed", `${file.name} could not be installed.`);
            }
        }
        status.hide();
    }
}
exports.KateDropInstaller = KateDropInstaller;
class HUD_DropInstaller extends scenes_1.Scene {
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

},{"../ui":20,"../ui/scenes":21}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageFile = exports.StorageBucket = exports.KateStorage = void 0;
const Cart = require("../../generated/cartridge");
class KateStorage {
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
            used: estimate.usage ?? 0
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

},{"../../generated/cartridge":6}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateFocusHandler = void 0;
class KateFocusHandler {
    constructor(os) {
        this.os = os;
        this._current_root = null;
        this.handle_input = (key) => {
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
                    bottom: x.offsetTop + x.offsetHeight
                },
            }));
            const right_limit = Math.max(...focusable.map(x => x.position.right));
            const bottom_limit = Math.max(...focusable.map(x => x.position.bottom));
            const current = focusable.find((x) => x.element.classList.contains("focus"));
            const left = current?.position.x ?? right_limit;
            const top = current?.position.y ?? bottom_limit;
            const right = current?.position.right ?? 0;
            const bottom = current?.position.bottom ?? 0;
            switch (key) {
                case "b": {
                    if (current != null) {
                        current.element.click();
                    }
                    break;
                }
                case "up": {
                    const candidates = focusable.filter(x => x.position.bottom < top).sort((a, b) => b.position.bottom - a.position.bottom);
                    const closest = candidates.sort((a, b) => {
                        return Math.min(a.position.x - left, a.position.right - right) - Math.min(b.position.x - left, b.position.right - right);
                    });
                    this.focus(closest[0]?.element);
                    break;
                }
                case "down": {
                    const candidates = focusable.filter(x => x.position.y > bottom).sort((a, b) => a.position.y - b.position.y);
                    const closest = candidates.sort((a, b) => {
                        return Math.min(a.position.x - left, a.position.right - right) - Math.min(b.position.x - left, b.position.right - right);
                    });
                    this.focus(closest[0]?.element);
                    break;
                }
                case "left": {
                    const candidates = focusable.filter(x => x.position.right < left).sort((a, b) => b.position.right - a.position.right);
                    const closest = candidates.sort((a, b) => {
                        return Math.min(a.position.y - top, a.position.bottom - bottom) - Math.min(b.position.y - top, b.position.bottom - bottom);
                    });
                    this.focus(closest[0]?.element);
                    break;
                }
                case "right": {
                    const candidates = focusable.filter(x => x.position.x > right).sort((a, b) => a.position.x - b.position.x);
                    const closest = candidates.sort((a, b) => {
                        return Math.min(a.position.y - top, a.position.bottom - bottom) - Math.min(b.position.y - top, b.position.bottom - bottom);
                    });
                    this.focus(closest[0]?.element);
                    break;
                }
            }
        };
    }
    setup() {
        this.os.kernel.console.on_key_pressed.listen(this.handle_input);
    }
    should_handle(key) {
        return ["up", "down", "left", "right", "b"].includes(key);
    }
    get current_root() {
        return this._current_root;
    }
    change_root(element) {
        this._current_root = element;
        if (element != null && element.querySelector(".focus") == null) {
            const candidates0 = Array.from(element.querySelectorAll(".kate-ui-focus-target"));
            const candidates = candidates0.sort((a, b) => a.offsetLeft - b.offsetLeft);
            this.focus(candidates[0]);
        }
    }
    compare_and_change_root(element, old) {
        if (this.current_root === old) {
            this.change_root(element);
            return true;
        }
        else {
            return false;
        }
    }
    focus_current_scene() {
        this.change_root(this.os.current_scene?.canvas ?? null);
    }
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
            inline: "center"
        });
    }
}
exports.KateFocusHandler = KateFocusHandler;

},{}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateKVStoragePartition = exports.KateKVStorage = void 0;
const Db = require("./db");
class KateKVStorage {
    constructor(os) {
        this.os = os;
    }
    get_store(id) {
        return new KateKVStoragePartition(this, id);
    }
}
exports.KateKVStorage = KateKVStorage;
class KateKVStoragePartition {
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
}
exports.KateKVStoragePartition = KateKVStoragePartition;

},{"./db":9}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUD_Toaster = exports.KateNotification = void 0;
const scenes_1 = require("../ui/scenes");
const UI = require("../ui");
const Db = require("./db");
const time_1 = require("../time");
class KateNotification {
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
            await notifications.write({ type: "basic", process_id, time: new Date(), title, message });
        });
        this.hud.show(title, message);
    }
}
exports.KateNotification = KateNotification;
class HUD_Toaster extends scenes_1.Scene {
    constructor(manager) {
        super(manager.os);
        this.manager = manager;
        this.NOTIFICATION_WAIT_TIME_MS = 5000;
        this.FADE_OUT_TIME_MS = 250;
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
            UI.h("div", { class: "kate-hud-notification-message" }, [message])
        ]);
        this.canvas.appendChild(element);
        await (0, time_1.wait)(this.NOTIFICATION_WAIT_TIME_MS);
        element.classList.add("leaving");
        await (0, time_1.wait)(this.FADE_OUT_TIME_MS);
        element.remove();
    }
}
exports.HUD_Toaster = HUD_Toaster;

},{"../time":19,"../ui":20,"../ui/scenes":21,"./db":9}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateProcess = exports.HUD_LoadIndicator = exports.KateProcesses = void 0;
const ui_1 = require("../ui");
const scenes_1 = require("../ui/scenes");
const Db = require("./db");
class KateProcesses {
    constructor(os) {
        this.os = os;
        this._running = null;
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
        this.os.focus_handler.change_root(null);
        try {
            const cart = await this.os.db.transaction([Db.cart_files], "readonly", async (t) => {
                const files = t.get_table(Db.cart_files);
                const file = await files.get(id);
                return this.os.kernel.loader.load_bytes(file.bytes.buffer);
            });
            const storage = this.os.kv_storage.get_store(cart.id);
            const runtime = this.os.kernel.runtimes.from_cartridge(cart, await storage.contents());
            const process = new KateProcess(this, cart, runtime.run({ storage }));
            this._running = process;
            this.os.kernel.console.os_root.classList.add("in-background");
            return process;
        }
        finally {
            this.os.hide_hud(loading);
        }
    }
    notify_exit(process) {
        if (process === this._running) {
            this._running = null;
            this.os.focus_handler.focus_current_scene();
            this.os.kernel.console.os_root.classList.remove("in-background");
        }
    }
}
exports.KateProcesses = KateProcesses;
class HUD_LoadIndicator extends scenes_1.Scene {
    render() {
        return (0, ui_1.h)("div", { class: "kate-hud-load-screen" }, [
            "Loading..."
        ]);
    }
}
exports.HUD_LoadIndicator = HUD_LoadIndicator;
class KateProcess {
    constructor(manager, cart, runtime) {
        this.manager = manager;
        this.cart = cart;
        this.runtime = runtime;
        this._paused = false;
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

},{"../ui":20,"../ui/scenes":21,"./db":9}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateStatus = exports.HUD_StatusBar = exports.KateStatusBar = void 0;
const ui_1 = require("../ui");
const scenes_1 = require("../ui/scenes");
class KateStatusBar {
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
    constructor(manager) {
        super(manager.os);
        this.manager = manager;
        this._timer = null;
        this.STATUS_LINE_TIME_MS = 5000;
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
            const current = items.findIndex(x => x.classList.contains("active"));
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

},{"../ui":20,"../ui/scenes":21}],17:[function(require,module,exports){
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

},{"./os":18}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateOS = void 0;
const KateDb = require("./apis/db");
const events_1 = require("../util/events");
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
class KateOS {
    constructor(kernel, db) {
        this.kernel = kernel;
        this.db = db;
        this._scene_stack = [];
        this._active_hud = [];
        this._current_scene = null;
        this.events = {
            on_cart_inserted: new events_1.EventStream()
        };
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
        this.focus_handler.change_root(scene.canvas);
    }
    pop_scene() {
        if (this._current_scene != null) {
            this._current_scene.detach();
        }
        this._current_scene = this._scene_stack.pop() ?? null;
        this.focus_handler.change_root(this._current_scene?.canvas ?? null);
    }
    show_hud(scene) {
        this._active_hud.push(scene);
        scene.attach(this.hud_display);
    }
    hide_hud(scene) {
        this._active_hud = this._active_hud.filter(x => x !== scene);
        scene.detach();
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

},{"../util/events":23,"./apis/cart-manager":7,"./apis/context_menu":8,"./apis/db":9,"./apis/drop-installer":10,"./apis/file_storage":11,"./apis/focus-handler":12,"./apis/kv_storage":13,"./apis/notification":14,"./apis/processes":15,"./apis/status-bar":16,"./time":19,"./ui/scenes":21}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wait = void 0;
async function wait(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(), ms));
}
exports.wait = wait;

},{}],20:[function(require,module,exports){
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

},{"./scenes":21,"./widget":22}],21:[function(require,module,exports){
(function (setImmediate){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneHome = exports.SceneBoot = exports.Scene = void 0;
const widget_1 = require("./widget");
const UI = require("./widget");
class Scene {
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
    render() {
        const home = (0, widget_1.h)("div", { class: "kate-os-home" }, [
            new UI.Title_bar({
                left: UI.fragment([
                    new UI.Section_title(["Library"]),
                ])
            }),
            (0, widget_1.h)("div", { class: "kate-os-carts-scroll" }, [
                (0, widget_1.h)("div", { class: "kate-os-carts" }, [])
            ]),
        ]);
        const carts = home.querySelector(".kate-os-carts");
        setImmediate(async () => {
            const list = await this.os.cart_manager.list();
            carts.innerHTML = "";
            for (const x of list) {
                carts.appendChild(this.render_cart(x).render());
            }
            this.os.focus_handler.focus(carts.querySelector(".kate-ui-focus-target") ?? null);
        });
        this.os.events.on_cart_inserted.listen(async (x) => {
            carts.insertBefore(this.render_cart({
                id: x.id,
                title: x.metadata?.title ?? x.id,
                thumbnail: x.metadata?.thumbnail
                    ? {
                        mime: x.metadata.thumbnail.mime,
                        bytes: x.metadata.thumbnail.data,
                    }
                    : null,
            }).render(), carts.firstChild);
        });
        return home;
    }
}
exports.SceneHome = SceneHome;

}).call(this)}).call(this,require("timers").setImmediate)
},{"./widget":22,"timers":2}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Icon = exports.Button = exports.If = exports.Menu_list = exports.Section_title = exports.Title_bar = exports.VBox = exports.HBox = exports.WithClass = exports.append = exports.render = exports.svg = exports.h = exports.fragment = exports.Widget = void 0;
const events_1 = require("../../util/events");
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
    constructor(children) {
        super();
        this.children = children;
    }
    render() {
        return h("div", { class: "kate-ui-title-bar" }, [
            h("div", { class: "kate-ui-title-bar-child" }, [this.children.left ?? null]),
            h("div", { class: "kate-ui-title-bar-child" }, [this.children.middle ?? null]),
            h("div", { class: "kate-ui-title-bar-child" }, [this.children.right ?? null]),
        ]);
    }
}
exports.Title_bar = Title_bar;
class Section_title extends Widget {
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
    constructor(children) {
        super();
        this.children = children;
        this._on_clicked = new events_1.EventStream();
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
        element.addEventListener("mouseenter", () => { element.classList.add("focus"); });
        element.addEventListener("mouseleave", () => { element.classList.remove("focus"); });
        return element;
    }
}
exports.Button = Button;
class Icon extends Widget {
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
                return h("div", { class: "kate-icon kate-icon-light", "data-name": this.type }, [
                    h("img", { src: `img/${this.type}.png` }, [])
                ]);
            case "ltrigger":
            case "rtrigger":
            case "menu":
            case "capture":
                return h("div", { class: "kate-icon", "data-name": this.type }, []);
            case "a":
                return h("div", { class: "kate-icon", "data-name": this.type }, [
                    h("img", { src: `img/cancel.png` }, [])
                ]);
            case "b":
                return h("div", { class: "kate-icon", "data-name": this.type }, [
                    h("img", { src: `img/ok.png` }, [])
                ]);
        }
    }
}
exports.Icon = Icon;

},{"../../util/events":23}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStream = void 0;
class EventStream {
    constructor() {
        this.subscribers = [];
    }
    listen(fn) {
        this.remove(fn);
        this.subscribers.push(fn);
        return this;
    }
    remove(fn) {
        this.subscribers = this.subscribers.filter(x => x !== fn);
        return this;
    }
    emit(ev) {
        for (const fn of this.subscribers) {
            fn(ev);
        }
    }
}
exports.EventStream = EventStream;

},{}]},{},[17])(17)
});
