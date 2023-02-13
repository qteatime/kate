"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyboardKey = exports.VirtualKey = exports.VirtualKey$Base = exports.Bridge = exports.Bridge$Base = exports.Platform = exports.Platform$Base = exports.Booklet_align = exports.Booklet_align$Base = exports.Booklet_cell = exports.Booklet_row = exports.Booklet_expr = exports.Booklet_expr$Base = exports.Accessibility = exports.Accessibility$Base = exports.Language = exports.Player_range = exports.Input_method = exports.Input_method$Base = exports.Duration = exports.Duration$Base = exports.Date = exports.Content_rating = exports.Content_rating$Base = exports.Version = exports.Release_type = exports.Release_type$Base = exports.Meta_booklet = exports.Meta_play = exports.Meta_rating = exports.Meta_release = exports.Meta_title = exports.Metadata = exports.File = exports.Cartridge = exports.Genre = exports.Genre$Base = exports._Encoder = exports._Decoder = void 0;
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
class Genre$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 8) {
            throw new Error(`Invalid tag ${$tag} for Genre: expected 8`);
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
            $e.ui32(8);
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
            $e.ui32(8);
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
            $e.ui32(8);
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
            $e.ui32(8);
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
            $e.ui32(8);
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
            $e.ui32(8);
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
            $e.ui32(8);
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
            $e.ui32(8);
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
            $e.ui32(8);
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
            $e.ui32(8);
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
            $e.ui32(8);
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
            $e.ui32(8);
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
            $e.ui32(8);
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
            $e.ui32(8);
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
            $e.ui32(8);
            this.$do_encode($e);
        }
        $do_encode($e) {
            $e.ui8(14);
        }
    }
    Genre.Other = Other;
})(Genre = exports.Genre || (exports.Genre = {}));
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
    booklet;
    static $tag = 2;
    $tag = 2;
    constructor(title, release, rating, play, booklet) {
        this.title = title;
        this.release = release;
        this.rating = rating;
        this.play = play;
        this.booklet = booklet;
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
        const booklet = Meta_booklet.$do_decode($d);
        return new Metadata(title, release, rating, play, booklet);
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
        (this.booklet).$do_encode($e);
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
class Meta_booklet {
    pages;
    custom_css;
    static $tag = 7;
    $tag = 7;
    constructor(pages, custom_css) {
        this.pages = pages;
        this.custom_css = custom_css;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 7) {
            throw new Error(`Invalid tag ${$tag} for Meta-booklet: expected 7`);
        }
        return Meta_booklet.$do_decode($d);
    }
    static $do_decode($d) {
        const pages = $d.array(() => {
            const item = Booklet_expr$Base.$do_decode($d);
            ;
            return item;
        });
        const custom_css = $d.text();
        return new Meta_booklet(pages, custom_css);
    }
    encode($e) {
        $e.ui32(7);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.array((this.pages), ($e, v) => {
            (v).$do_encode($e);
        });
        $e.text(this.custom_css);
    }
}
exports.Meta_booklet = Meta_booklet;
class Release_type$Base {
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 9) {
            throw new Error(`Invalid tag ${$tag} for Release-type: expected 9`);
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
            $e.ui32(9);
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
            $e.ui32(9);
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
            $e.ui32(9);
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
            $e.ui32(9);
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
            $e.ui32(9);
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
    static $tag = 10;
    $tag = 10;
    constructor(major, minor) {
        this.major = major;
        this.minor = minor;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 10) {
            throw new Error(`Invalid tag ${$tag} for Version: expected 10`);
        }
        return Version.$do_decode($d);
    }
    static $do_decode($d) {
        const major = $d.ui32();
        const minor = $d.ui32();
        return new Version(major, minor);
    }
    encode($e) {
        $e.ui32(10);
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
        if ($tag !== 11) {
            throw new Error(`Invalid tag ${$tag} for Content-rating: expected 11`);
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
            $e.ui32(11);
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
            $e.ui32(11);
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
            $e.ui32(11);
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
            $e.ui32(11);
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
    static $tag = 12;
    $tag = 12;
    constructor(year, month, day) {
        this.year = year;
        this.month = month;
        this.day = day;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 12) {
            throw new Error(`Invalid tag ${$tag} for Date: expected 12`);
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
        $e.ui32(12);
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
        if ($tag !== 13) {
            throw new Error(`Invalid tag ${$tag} for Duration: expected 13`);
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
            $e.ui32(13);
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
            $e.ui32(13);
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
            $e.ui32(13);
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
            $e.ui32(13);
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
            $e.ui32(13);
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
            $e.ui32(13);
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
            $e.ui32(13);
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
        if ($tag !== 14) {
            throw new Error(`Invalid tag ${$tag} for Input-method: expected 14`);
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
            $e.ui32(14);
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
            $e.ui32(14);
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
    static $tag = 15;
    $tag = 15;
    constructor(minimum, maximum) {
        this.minimum = minimum;
        this.maximum = maximum;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 15) {
            throw new Error(`Invalid tag ${$tag} for Player-range: expected 15`);
        }
        return Player_range.$do_decode($d);
    }
    static $do_decode($d) {
        const minimum = $d.ui32();
        const maximum = $d.ui32();
        return new Player_range(minimum, maximum);
    }
    encode($e) {
        $e.ui32(15);
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
    static $tag = 16;
    $tag = 16;
    constructor(iso_code, _interface, audio, text) {
        this.iso_code = iso_code;
        this._interface = _interface;
        this.audio = audio;
        this.text = text;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 16) {
            throw new Error(`Invalid tag ${$tag} for Language: expected 16`);
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
        $e.ui32(16);
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
        if ($tag !== 17) {
            throw new Error(`Invalid tag ${$tag} for Accessibility: expected 17`);
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
            $e.ui32(17);
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
            $e.ui32(17);
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
            $e.ui32(17);
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
            $e.ui32(17);
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
            $e.ui32(17);
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
            $e.ui32(17);
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
        if ($tag !== 18) {
            throw new Error(`Invalid tag ${$tag} for Booklet-expr: expected 18`);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
            $e.ui32(18);
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
    static $tag = 19;
    $tag = 19;
    constructor(row_span, cells) {
        this.row_span = row_span;
        this.cells = cells;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 19) {
            throw new Error(`Invalid tag ${$tag} for Booklet-row: expected 19`);
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
        $e.ui32(19);
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
    static $tag = 20;
    $tag = 20;
    constructor(cell_span, value) {
        this.cell_span = cell_span;
        this.value = value;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 20) {
            throw new Error(`Invalid tag ${$tag} for Booklet-cell: expected 20`);
        }
        return Booklet_cell.$do_decode($d);
    }
    static $do_decode($d) {
        const cell_span = $d.ui32();
        const value = Booklet_expr$Base.$do_decode($d);
        return new Booklet_cell(cell_span, value);
    }
    encode($e) {
        $e.ui32(20);
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
        if ($tag !== 21) {
            throw new Error(`Invalid tag ${$tag} for Booklet-align: expected 21`);
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
            $e.ui32(21);
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
            $e.ui32(21);
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
            $e.ui32(21);
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
            $e.ui32(21);
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
            $e.ui32(21);
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
        if ($tag !== 22) {
            throw new Error(`Invalid tag ${$tag} for Platform: expected 22`);
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
            $e.ui32(22);
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
        if ($tag !== 23) {
            throw new Error(`Invalid tag ${$tag} for Bridge: expected 23`);
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
            $e.ui32(23);
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
            $e.ui32(23);
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
            $e.ui32(23);
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
            $e.ui32(23);
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
            $e.ui32(23);
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
        if ($tag !== 24) {
            throw new Error(`Invalid tag ${$tag} for VirtualKey: expected 24`);
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
            $e.ui32(24);
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
            $e.ui32(24);
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
            $e.ui32(24);
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
            $e.ui32(24);
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
            $e.ui32(24);
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
            $e.ui32(24);
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
            $e.ui32(24);
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
            $e.ui32(24);
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
            $e.ui32(24);
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
            $e.ui32(24);
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
    static $tag = 25;
    $tag = 25;
    constructor(key, code, key_code) {
        this.key = key;
        this.code = code;
        this.key_code = key_code;
    }
    static decode($d) {
        const $tag = $d.ui32();
        if ($tag !== 25) {
            throw new Error(`Invalid tag ${$tag} for KeyboardKey: expected 25`);
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
        $e.ui32(25);
        this.$do_encode($e);
    }
    $do_encode($e) {
        $e.text(this.key);
        $e.text(this.code);
        $e.integer(this.key_code);
    }
}
exports.KeyboardKey = KeyboardKey;
