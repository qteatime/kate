"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualKey = exports.VirtualKey$Base = exports.Bridge = exports.Bridge$Base = exports.Platform = exports.Platform$Base = exports.Date = exports.Content_classification = exports.Content_classification$Base = exports.Metadata = exports.File = exports.Cartridge = exports.KeyboardKey = exports._Encoder = exports._Decoder = void 0;
class _Decoder {
    view;
    offset = 0;
    constructor(view) {
        this.view = view;
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
class KeyboardKey {
    key;
    code;
    key_code;
    static $tag = 8;
    $tag = 8;
    constructor(key, code, key_code) {
        this.key = key;
        this.code = code;
        this.key_code = key_code;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 8) {
            throw new Error(`Invalid tag ${$tag} for KeyboardKey: expected 8`);
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
        $e.ui32(8);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.text(this.key);
        $e.text(this.code);
        $e.integer(this.key_code);
    }
}
exports.KeyboardKey = KeyboardKey;
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
    author;
    title;
    description;
    category;
    content_warning;
    classification;
    release_date;
    thumbnail;
    static $tag = 2;
    $tag = 2;
    constructor(author, title, description, category, content_warning, classification, release_date, thumbnail) {
        this.author = author;
        this.title = title;
        this.description = description;
        this.category = category;
        this.content_warning = content_warning;
        this.classification = classification;
        this.release_date = release_date;
        this.thumbnail = thumbnail;
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
    Content_classification.General = General;
    class Teen_and_up extends Content_classification$Base {
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
    Content_classification.Teen_and_up = Teen_and_up;
    class Mature extends Content_classification$Base {
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
    Content_classification.Mature = Mature;
    class Explicit extends Content_classification$Base {
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
    Content_classification.Explicit = Explicit;
})(Content_classification = exports.Content_classification || (exports.Content_classification = {}));
class Date {
    year;
    month;
    day;
    static $tag = 4;
    $tag = 4;
    constructor(year, month, day) {
        this.year = year;
        this.month = month;
        this.day = day;
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
            $e.ui32(5);
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
            case 4: return Bridge.Input_proxy.decode($d);
            default:
                throw new Error(`Unknown tag ${$tag} in union Bridge`);
        }
    }
}
exports.Bridge$Base = Bridge$Base;
var Bridge;
(function (Bridge) {
    class RPG_maker_mv extends Bridge$Base {
        static $tag = 0 /* $Tags.RPG_maker_mv */;
        $tag = 0 /* $Tags.RPG_maker_mv */;
        constructor() {
            super();
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
    Bridge.RPG_maker_mv = RPG_maker_mv;
    class Renpy extends Bridge$Base {
        static $tag = 1 /* $Tags.Renpy */;
        $tag = 1 /* $Tags.Renpy */;
        constructor() {
            super();
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
    Bridge.Renpy = Renpy;
    class Network_proxy extends Bridge$Base {
        static $tag = 2 /* $Tags.Network_proxy */;
        $tag = 2 /* $Tags.Network_proxy */;
        constructor() {
            super();
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
    Bridge.Network_proxy = Network_proxy;
    class Local_storage_proxy extends Bridge$Base {
        static $tag = 3 /* $Tags.Local_storage_proxy */;
        $tag = 3 /* $Tags.Local_storage_proxy */;
        constructor() {
            super();
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
    Bridge.Local_storage_proxy = Local_storage_proxy;
    class Input_proxy extends Bridge$Base {
        mapping;
        static $tag = 4 /* $Tags.Input_proxy */;
        $tag = 4 /* $Tags.Input_proxy */;
        constructor(mapping) {
            super();
            this.mapping = mapping;
        }
        static decode($d) {
            return Input_proxy.$do_decode($d);
        }
        static $do_decode($d) {
            const $tag = $d.ui8();
            if ($tag !== 4) {
                throw new Error(`Invalid tag ${$tag} for Bridge.Input-proxy: expected 4`);
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
            $e.ui32(6);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(4);
            $e.map((this.mapping), ($e, k) => { (k).$do_encode($e); }, ($e, v) => { (v).$do_encode($e); });
        }
    }
    Bridge.Input_proxy = Input_proxy;
})(Bridge = exports.Bridge || (exports.Bridge = {}));
class VirtualKey$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 7) {
            throw new Error(`Invalid tag ${$tag} for VirtualKey: expected 7`);
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
            $e.ui32(7);
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
            $e.ui32(7);
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
            $e.ui32(7);
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
            $e.ui32(7);
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
            $e.ui32(7);
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
            $e.ui32(7);
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
            $e.ui32(7);
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
            $e.ui32(7);
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
            $e.ui32(7);
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
            $e.ui32(7);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(9);
        }
    }
    VirtualKey.R_trigger = R_trigger;
})(VirtualKey = exports.VirtualKey || (exports.VirtualKey = {}));
