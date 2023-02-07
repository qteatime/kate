(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Kate = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bridge = exports.Bridge$Base = exports.Platform = exports.Platform$Base = exports.Date = exports.Content_classification = exports.Content_classification$Base = exports.Metadata = exports.File = exports.Cartridge = exports._Encoder = exports._Decoder = void 0;
class _Decoder {
    constructor(view) {
        this.view = view;
        this.offset = 0;
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

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bridges = void 0;
exports.bridges = {
    "local-storage.js": "void function () {\r\n  const secret = KATE_SECRET;\r\n  let contents = window.KATE_LOCAL_STORAGE ?? Object.create(null);\r\n  \r\n  let timer = null;\r\n  function persist(contents) {\r\n    clearTimeout(timer);\r\n    timer = setTimeout(() => {\r\n      window.parent.postMessage({\r\n        type: \"kate:write-kv-storage\",\r\n        secret: secret,\r\n        content: contents\r\n      }, \"*\");\r\n    })\r\n  }\r\n\r\n  class KateStorage {\r\n    constructor(contents, persistent) {\r\n      this.__contents = contents;\r\n      this.__persistent = persistent;\r\n    }\r\n\r\n    _persist() {\r\n      if (this.__persistent) {\r\n        persist(this.__contents);\r\n      }\r\n    }\r\n\r\n    getItem(name) {\r\n      return this.__contents[name] ?? null;\r\n    }\r\n\r\n    setItem(name, value) {\r\n      this.__contents[name] = value;\r\n      this._persist();\r\n    }\r\n\r\n    removeItem(name) {\r\n      delete this.__contents[name];\r\n      this._persist();\r\n    }\r\n\r\n    clear() {\r\n      this.__contents = Object.create(null);\r\n      this._persist();\r\n    }\r\n\r\n    key(index) {\r\n      return this.getItem(Object.keys(this.__contents)[index]) ?? null;\r\n    }\r\n\r\n    get length() {\r\n      return Object.keys(this.__contents).length;\r\n    }\r\n  }\r\n\r\n  function proxy_storage(storage, key) {\r\n    const exposed = [\"getItem\", \"setItem\", \"removeItem\", \"clear\", \"key\"];\r\n\r\n    Object.defineProperty(window, key, {\r\n      value: new Proxy(storage, {\r\n        get(target, prop, receiver) {\r\n          return exposed.contains(prop) ? storage[prop].bind(storage) : storage.getItem(prop);\r\n        },\r\n        has(target, prop) {\r\n          return exposed.contains(prop) || prop in contents;\r\n        },\r\n        set(target, prop, value) {\r\n          return storage.setItem(prop, value);\r\n        },\r\n        deleteProperty(target, prop) {\r\n          return storage.removeItem(prop);\r\n        }\r\n      })\r\n    })\r\n  }\r\n  \r\n  const storage = new KateStorage(contents, true);\r\n  proxy_storage(storage, \"localStorage\");\r\n\r\n  const session_storage = new KateStorage(Object.create(null), false);\r\n  proxy_storage(session_storage, \"sessionStorage\");\r\n\r\n}();",
    "renpy.js": "void function() {\r\n  let paused = false;\r\n  const add_event_listener = window.addEventListener;\r\n  const key_mapping = {\r\n    up: [\"ArrowUp\", \"ArrowUp\", 38],\r\n    right: [\"ArrowRight\", \"ArrowRight\", 39],\r\n    down: [\"ArrowDown\", \"ArrowDown\", 40],\r\n    left: [\"ArrowLeft\", \"ArrowLeft\", 37],\r\n    x: [\"Escape\", \"Escape\", 27],\r\n    o: [\"Enter\", \"Enter\", 13],\r\n    ltrigger: ['PageUp', 'PageUp', 33],\r\n    rtrigger: ['PageDown', 'PageDown', 34]\r\n  }\r\n\r\n  const down_listeners = [];\r\n  const up_listeners = [];\r\n  \r\n  window.addEventListener(\"message\", (ev) => {\r\n    switch (ev.data.type) {\r\n      case \"kate:paused\": {\r\n        paused = true;\r\n        break;\r\n      }\r\n\r\n      case \"kate:unpaused\": {\r\n        paused = false;\r\n        break;\r\n      }\r\n\r\n      case \"kate:input-changed\": {\r\n        if (!paused) {\r\n          const data = key_mapping[ev.data.key];\r\n          if (data) {\r\n            const listeners = ev.data.is_down ? down_listeners : up_listeners;\r\n            const type = ev.data.is_down ? \"keydown\" : \"keyup\";\r\n            const [key, code, keyCode] = data;\r\n            const key_ev = new KeyboardEvent(type, {key, code, keyCode});\r\n            for (const fn of listeners) {\r\n              fn.call(document, key_ev);\r\n            }\r\n          }\r\n        }\r\n        break;\r\n      }\r\n    }\r\n  })\r\n  \r\n  function listen(type, listener, options) {\r\n    if (type === \"keydown\") {\r\n      down_listeners.push(listener);\r\n    } else if (type === \"keyup\") {\r\n      up_listeners.push(listener);\r\n    } else {\r\n      add_event_listener.call(this, type, listener, options);\r\n    }\r\n  };\r\n  window.addEventListener = listen;\r\n  document.addEventListener = listen;\r\n}();",
    "rpgmk-mv.js": "void function() {\r\n  let paused = false;\r\n\r\n  // -- Things that need to be patched still\r\n  Utils.isOptionValid = (name) => {\r\n    return [\"noaudio\"].includes(name);\r\n  }\r\n\r\n  const key_mapping = {\r\n    up: \"up\",\r\n    right: \"right\",\r\n    down: \"down\",\r\n    left: \"left\",\r\n    x: \"cancel\",\r\n    o: \"ok\",\r\n    menu: \"menu\",\r\n    rtrigger: \"shift\"\r\n  };\r\n\r\n  window.addEventListener(\"message\", (ev) => {\r\n    switch (ev.data.type) {\r\n      case \"kate:paused\": {\r\n        for (const key of Object.values(key_mapping)) {\r\n          Input._currentState[key] = false;\r\n        }\r\n        paused = true;\r\n        break;\r\n      }\r\n      case \"kate:unpaused\": {\r\n        paused = false;\r\n        break;\r\n      }\r\n\r\n      case \"kate:input-changed\": {\r\n        if (!paused) {\r\n          const name = key_mapping[ev.data.key];\r\n          if (name) {\r\n            Input._currentState[name] = ev.data.is_down;\r\n          }\r\n        }\r\n        break;\r\n      }\r\n    }\r\n  })\r\n}();",
    "standard-network.js": "void function () {\r\n  const secret = KATE_SECRET;\r\n\r\n  function make_id() {\r\n    let id = new Uint8Array(16);\r\n    crypto.getRandomValues(id);\r\n    return Array.from(id).map(x => x.toString(16).padStart(2, \"0\")).join(\"\");\r\n  }\r\n\r\n  async function read_file(path) {\r\n    return new Promise((resolve, reject) => {\r\n      const id = make_id();\r\n      const handler = (ev) => {\r\n        if (ev.data.type === \"kate:reply\" && ev.data.id === id) {\r\n          window.removeEventListener(\"message\", handler);\r\n          if (ev.data.ok) {\r\n            resolve(ev.data.result);\r\n          } else {\r\n            reject(new Error(`Request to ${path} failed`));\r\n          }\r\n        }\r\n      };\r\n\r\n      window.addEventListener(\"message\", handler);\r\n      window.parent.postMessage({\r\n        type: \"kate:read-file\",\r\n        secret: secret,\r\n        id: id,\r\n        path: path\r\n      }, \"*\")\r\n    });\r\n  }\r\n\r\n  async function get_url(url) {\r\n    try {\r\n      const file = await read_file(url);\r\n      const blob = new Blob([file.data], {type: file.mime});\r\n      return URL.createObjectURL(blob);\r\n    } catch (e) {\r\n      console.error(\"error ==>\", e);\r\n      throw e;\r\n    }\r\n  }\r\n\r\n  // -- Arbitrary fetching\r\n  const old_fetch = window.fetch;\r\n  window.fetch = async function(request, options) {\r\n    let url;\r\n    let method;\r\n\r\n    if (Object(request) === request && request.url) {\r\n      url = request.url;\r\n      method = request.method;\r\n    } else {\r\n      url = request;\r\n      method = options?.method ?? \"GET\";\r\n    }\r\n\r\n    if (method !== \"GET\") {\r\n      return new Promise((_, reject) => reject(new Error(`Non-GET requests are not supported.`)));\r\n    }\r\n    return new Promise(async (resolve, reject) => {\r\n      try {\r\n        const file = await get_url(String(url));\r\n        const result = await old_fetch(file);\r\n        resolve(result);\r\n      } catch (error) {\r\n        reject(error);\r\n      }\r\n    });\r\n  }\r\n\r\n  const old_xhr_open = XMLHttpRequest.prototype.open;\r\n  const old_xhr_send = XMLHttpRequest.prototype.send;\r\n  XMLHttpRequest.prototype.open = function(method, url) {\r\n    if (method !== \"GET\") {\r\n      throw new Error(`Non-GET requests are not supported.`);\r\n    }\r\n\r\n    this.__waiting_open = true;\r\n\r\n    void (async () => {\r\n      try {\r\n        const real_url = await get_url(String(url));\r\n        old_xhr_open.call(this, \"GET\", real_url);\r\n        this.__maybe_send();\r\n      } catch (error) {\r\n        old_xhr_open.call(this, \"GET\", \"not-found\");\r\n        this.__maybe_send();\r\n      }\r\n    })();\r\n  };\r\n\r\n  XMLHttpRequest.prototype.__maybe_send = function() {\r\n    this.__waiting_open = false;\r\n    if (this.__waiting_send) {\r\n      this.__waiting_send = false;\r\n      this.send();\r\n    }\r\n  };\r\n\r\n  XMLHttpRequest.prototype.send = function() {\r\n    if (this.__waiting_open) {\r\n      this.__waiting_send = true;\r\n      return;\r\n    } else {\r\n      return old_xhr_send.call(this);\r\n    }\r\n  };\r\n\r\n  // -- Image loading\r\n  const old_img_src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, \"src\");\r\n  Object.defineProperty(HTMLImageElement.prototype, \"src\", {\r\n    enumerable: old_img_src.enumerable,\r\n    configurable: old_img_src.configurable,\r\n    get() {\r\n      return this.__src ?? old_img_src.get.call(this);\r\n    },\r\n    set(url) {\r\n      this.__src = url;\r\n      void (async () => {\r\n        try {\r\n          const real_url = await get_url(String(url));\r\n          old_img_src.set.call(this, real_url);\r\n        } catch (error) {\r\n          old_img_src.set.call(this, \"not-found\");\r\n        }\r\n      })();\r\n    }\r\n  });\r\n\r\n}();"
};

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CR_Web_archive = exports.CRW_Process = exports.CR_Web = exports.CR_Process = exports.CartRuntime = exports.KateRuntimes = void 0;
const Cart = require("../generated/cartridge");
const kate_bridges_1 = require("../kate-bridges");
const random_1 = require("../util/random");
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 480;
class KateRuntimes {
    constructor(console) {
        this.console = console;
    }
    from_cartridge(cart, local_storage) {
        switch (cart.platform.$tag) {
            case 0 /* Cart.Platform.$Tags.Web */:
                return new CR_Web(this.console, cart.id, cart.platform);
            case 1 /* Cart.Platform.$Tags.Web_archive */:
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
class CR_Web extends CartRuntime {
    constructor(console, id, cart) {
        super();
        this.console = console;
        this.id = id;
        this.cart = cart;
    }
    run() {
        const frame = document.createElement("iframe");
        frame.className = "kate-game-frame";
        frame.sandbox = "allow-scripts allow-same-origin";
        frame.allow = "";
        this.console.on_input_changed.listen(ev => {
            frame.contentWindow?.postMessage({
                type: "kate:input-changed",
                key: ev.key,
                is_down: ev.is_down
            }, this.cart.url);
        });
        frame.src = this.cart.url;
        frame.width = String(this.cart.width);
        frame.height = String(this.cart.height);
        frame.style.width = `${frame.width}px`;
        frame.style.height = `${frame.height}px`;
        frame.scrolling = "no";
        const zoom = this.cart.width >= this.cart.height ? (SCREEN_WIDTH / this.cart.width) : (SCREEN_HEIGHT / this.cart.height);
        frame.style.transform = `scale(${zoom})`;
        this.console.screen.appendChild(frame);
        return new CRW_Process(this, frame, (0, random_1.make_id)());
    }
}
exports.CR_Web = CR_Web;
class CRW_Process extends CR_Process {
    constructor(runtime, frame, secret) {
        super();
        this.runtime = runtime;
        this.frame = frame;
        this.secret = secret;
    }
    async exit() {
        this.frame.src = "about:blank";
        this.frame.remove();
    }
    async pause() {
        this.frame.contentWindow?.postMessage({
            type: "kate:paused"
        }, "*");
    }
    async unpause() {
        this.frame.contentWindow?.postMessage({
            type: "kate:unpaused"
        }, "*");
    }
}
exports.CRW_Process = CRW_Process;
class CR_Web_archive extends CartRuntime {
    constructor(console, id, cart, data, local_storage) {
        super();
        this.console = console;
        this.id = id;
        this.cart = cart;
        this.data = data;
        this.local_storage = local_storage;
    }
    run({ storage }) {
        const secret = (0, random_1.make_id)();
        const frame = document.createElement("iframe");
        frame.className = "kate-game-frame kate-game-frame-defaults";
        frame.sandbox = "allow-scripts";
        frame.allow = "";
        this.console.on_input_changed.listen(ev => {
            frame.contentWindow?.postMessage({
                type: "kate:input-changed",
                key: ev.key,
                is_down: ev.is_down
            }, "*");
        });
        const send = (type, data) => {
            frame.contentWindow?.postMessage({
                type, ...data
            }, "*");
        };
        const reply = (ev, data) => {
            send("kate:reply", {
                id: ev.data.id,
                ...data
            });
        };
        const send_error = (message, id) => {
            send("kate:error", { id, message });
        };
        window.addEventListener("message", async (ev) => {
            if (ev.data?.secret !== secret) {
                return;
            }
            switch (ev.data.type) {
                case "kate:write-kv-storage": {
                    const data = ev.data.content;
                    try {
                        await storage.write(data);
                    }
                    catch (error) {
                        send_error(`Failed to persist localStorage contents`, ev.data.id);
                    }
                    break;
                }
                case "kate:read-file": {
                    const file = this.get_file(new URL(ev.data.path, "http://no.domain").toString());
                    if (file == null) {
                        reply(ev, { path: ev.data.path, ok: false });
                    }
                    else {
                        reply(ev, { path: ev.data.path, ok: true, result: {
                                mime: file.mime,
                                data: file.data
                            } });
                    }
                }
            }
        });
        frame.src = URL.createObjectURL(new Blob([this.proxy_html(secret)], { type: "text/html" }));
        frame.scrolling = "no";
        this.console.screen.appendChild(frame);
        return new CRW_Process(this, frame, secret);
    }
    proxy_html(secret) {
        const decoder = new TextDecoder("utf-8");
        const dom = new DOMParser().parseFromString(this.data.html, "text/html");
        const secret_el = document.createElement("script");
        secret_el.textContent = `
      var KATE_SECRET = ${JSON.stringify(secret)};
      var KATE_LOCAL_STORAGE = ${JSON.stringify(this.local_storage ?? {})};
    `;
        dom.head.insertBefore(secret_el, dom.head.firstChild);
        const zoom_style = document.createElement("style");
        zoom_style.textContent = `
    :root {
      zoom: ${this.console.body.getAttribute("data-zoom") ?? "0"};
    }
    `;
        dom.head.appendChild(zoom_style);
        for (const bridge of this.data.bridges) {
            this.apply_bridge(dom, bridge, secret_el);
        }
        for (const script of Array.from(dom.querySelectorAll("script"))) {
            if (script.src) {
                const file = this.get_file(script.src);
                if (file != null) {
                    script.removeAttribute("src");
                    script.removeAttribute("type");
                    script.textContent = decoder.decode(file.data);
                }
            }
        }
        for (const link of Array.from(dom.querySelectorAll("link"))) {
            if (link.href) {
                if (link.rel === "stylesheet") {
                    const file = this.get_file(link.href);
                    if (file != null) {
                        const style = dom.createElement("style");
                        style.textContent = this.transform_css_urls(new URL(link.href).pathname, decoder.decode(file.data));
                        link.parentNode?.insertBefore(style, link);
                        link.remove();
                    }
                }
                else {
                    link.href = this.get_data_url(link.href);
                }
            }
        }
        return dom.documentElement.outerHTML;
    }
    transform_css_urls(base, code) {
        return code.replace(/\burl\(("[^"]+")\)/g, (_, url_string) => {
            const url = this.resolve_pathname(base, JSON.parse(url_string));
            const data_url = this.get_data_url(new URL(url, "http://localhost").toString());
            return `url(${JSON.stringify(data_url)})`;
        });
    }
    resolve_pathname(base, url0) {
        const x0 = base.endsWith("/") ? base : base + "/";
        const x1 = x0.startsWith("/") ? base : "/" + base;
        const x2 = x1.endsWith(".css") ? x1.split("/").slice(0, -1).join("/") : x1;
        return x2 + "/" + url0;
    }
    apply_bridge(dom, bridge, secret_node) {
        switch (bridge.$tag) {
            case 0 /* Cart.Bridge.$Tags.RPG_maker_mv */: {
                const proxy = kate_bridges_1.bridges["rpgmk-mv.js"];
                const script = dom.createElement("script");
                script.textContent = proxy;
                const scripts = Array.from(dom.querySelectorAll("script"));
                const main_script = scripts.find(x => x.src.includes("js/main.js"));
                if (main_script != null) {
                    main_script.parentNode.insertBefore(script, main_script);
                }
                else {
                    dom.body.appendChild(script);
                }
                break;
            }
            case 1 /* Cart.Bridge.$Tags.Renpy */: {
                this.append_proxy(kate_bridges_1.bridges["renpy.js"], dom, secret_node);
                break;
            }
            case 2 /* Cart.Bridge.$Tags.Network_proxy */: {
                this.append_proxy(kate_bridges_1.bridges["standard-network.js"], dom, secret_node);
                break;
            }
            case 3 /* Cart.Bridge.$Tags.Local_storage_proxy */: {
                this.append_proxy(kate_bridges_1.bridges["local-storage.js"], dom, secret_node);
                break;
            }
        }
    }
    append_proxy(proxy, dom, ref) {
        const script = dom.createElement("script");
        script.textContent = proxy;
        if (ref.nextSibling != null) {
            ref.parentNode.insertBefore(script, ref.nextSibling);
        }
        else {
            dom.head.appendChild(script);
        }
    }
    get_file(url) {
        const path = new URL(url).pathname;
        return this.cart.files.find(x => x.path === path);
    }
    get_data_url(url) {
        const file = this.get_file(url);
        if (file != null) {
            const content = Array.from(file.data).map(x => String.fromCharCode(x)).join("");
            return `data:${file.mime};base64,${btoa(content)}`;
        }
        else {
            return url;
        }
    }
}
exports.CR_Web_archive = CR_Web_archive;

},{"../generated/cartridge":1,"../kate-bridges":2,"../util/random":9}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyboardInput = void 0;
class KeyboardInput {
    constructor(console) {
        this.console = console;
        this.physical_config = {
            up: "ArrowUp",
            right: "ArrowRight",
            down: "ArrowDown",
            left: "ArrowLeft",
            menu: "ShiftLeft",
            capture: "ControlLeft",
            x: "KeyX",
            o: "KeyZ",
            ltrigger: "KeyA",
            rtrigger: "KeyS"
        };
        this.ignore_repeat = ["menu", "capture"];
        this.attached = false;
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

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kate = void 0;
const cart_runtime_1 = require("./cart-runtime");
const input_1 = require("./input");
const loader_1 = require("./loader");
const virtual_1 = require("./virtual");
class Kate {
    constructor(console, keyboard) {
        this.console = console;
        this.keyboard = keyboard;
        this.loader = new loader_1.KateLoader();
        this.runtimes = new cart_runtime_1.KateRuntimes(console);
    }
    static from_root(root) {
        const console = new virtual_1.VirtualConsole(root);
        const keyboard = new input_1.KeyboardInput(console);
        console.listen();
        keyboard.listen(document.body);
        return new Kate(console, keyboard);
    }
}
exports.Kate = Kate;

},{"./cart-runtime":3,"./input":4,"./loader":6,"./virtual":7}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KateLoader = void 0;
const Cart = require("../generated/cartridge");
class KateLoader {
    load_bytes(bytes) {
        const view = new DataView(bytes);
        const decoder = new Cart._Decoder(view);
        return Cart.Cartridge.decode(decoder);
    }
    async load_from_url(url) {
        const bytes = await (await fetch(url)).arrayBuffer();
        return this.load_bytes(bytes);
    }
}
exports.KateLoader = KateLoader;

},{"../generated/cartridge":1}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualConsole = void 0;
const events_1 = require("../util/events");
class VirtualConsole {
    constructor(root) {
        this.is_listening = false;
        this.on_input_changed = new events_1.EventStream();
        this.on_key_pressed = new events_1.EventStream();
        this.LONG_PRESS_TIME_MS = 500;
        this.FPS = 30;
        this.ONE_FRAME = Math.ceil(1000 / 30);
        this.up_button = root.querySelector(".kate-dpad-up");
        this.right_button = root.querySelector(".kate-dpad-right");
        this.down_button = root.querySelector(".kate-dpad-down");
        this.left_button = root.querySelector(".kate-dpad-left");
        this.menu_button = root.querySelector(".kate-button-menu");
        this.capture_button = root.querySelector(".kate-button-capture");
        this.x_button = root.querySelector(".kate-button-x");
        this.o_button = root.querySelector(".kate-button-o");
        this.ltrigger_button = root.querySelector(".kate-trigger-left");
        this.rtrigger_button = root.querySelector(".kate-trigger-right");
        this.screen = root.querySelector("#kate-game");
        this.os_root = root.querySelector("#kate-os-root");
        this.hud = root.querySelector("#kate-hud");
        this.body = root.querySelector(".kate-body");
        this.reset_states();
    }
    reset_states() {
        this.input_state = {
            up: false,
            right: false,
            down: false,
            left: false,
            menu: false,
            capture: false,
            x: false,
            o: false,
            ltrigger: false,
            rtrigger: false
        };
        this.special_input_timing = {
            menu: null,
            capture: null,
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
    }
    is_special_key(key) {
        return this.special_input_timing.hasOwnProperty(key);
    }
    // Made a bit complicated because we want to avoid forwarding special keys
    // to game processes before we know if this is a regular press of the key
    // or a long press of the key. In that sense, all special keys have a 1/30
    // frame delay inserted.
    update_virtual_key(key, state) {
        if (this.input_state[key] !== state) {
            this.input_state[key] = state;
            this.render_button_state(key, state);
            if (this.is_special_key(key)) {
                clearTimeout(this.special_input_timing[key]);
                if (state === false) {
                    this.on_input_changed.emit({ key, is_down: true });
                    setTimeout(() => {
                        if (this.input_state[key] === false) {
                            this.on_input_changed.emit({ key, is_down: false });
                        }
                    }, this.ONE_FRAME);
                }
                else {
                    this.special_input_timing[key] = setTimeout(() => {
                        if (this.input_state[key] === true) {
                            this.input_state[key] = false;
                            this.render_button_state(key, false);
                            this.on_key_pressed.emit(`long_${key}`);
                        }
                    }, this.LONG_PRESS_TIME_MS);
                }
            }
            else {
                this.on_input_changed.emit({ key, is_down: state });
            }
            if (state === false) {
                this.on_key_pressed.emit(key);
            }
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
            rtrigger: this.rtrigger_button
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

},{"../util/events":8}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.make_id = void 0;
function make_id() {
    let id = new Uint8Array(16);
    crypto.getRandomValues(id);
    return Array.from(id).map(x => x.toString(16).padStart(2, "0")).join("");
}
exports.make_id = make_id;

},{}]},{},[5])(5)
});
