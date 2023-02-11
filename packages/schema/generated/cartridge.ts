// This file was generated from a LJT schema.
interface _DecoderMethod {
  decode(decoder: _Decoder): any;
}

interface _EncodeMethod {
  encode(encoder: _Encoder): void;
}

export class _Decoder {
  private offset: number = 0;

  constructor(readonly view: DataView) {}

  peek<A>(f: (view: DataView) => A) {
    return f(
      new DataView(this.view.buffer, this.view.byteOffset + this.offset)
    );
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

  array<T>(f: () => T): T[] {
    const size = this.ui32();
    const result = [];
    for (let i = 0; i < size; ++i) {
      result[i] = f();
    }
    return result;
  }

  map<K, V>(k: () => K, v: () => V): Map<K, V> {
    const size = this.ui32();
    const result: Map<K, V> = new Map();
    for (let i = 0; i < size; ++i) {
      const key = k();
      const value = v();
      result.set(key, value);
    }
    return result;
  }

  optional<T>(f: () => T): T | null {
    const has_value = this.bool();
    if (has_value) {
      return f();
    } else {
      return null;
    }
  }

  decode(method: _DecoderMethod) {
    method.decode(this);
  }
}

export class _Encoder {
  private buffers: Uint8Array[] = [];

  bool(x: boolean) {
    this.buffers.push(new Uint8Array([x ? 0x01 : 0x00]));
    return this;
  }

  i8(x: Int8) {
    const a = new Uint8Array(1);
    const v = new DataView(a.buffer);
    v.setInt8(0, x);
    this.buffers.push(a);
    return this;
  }

  i16(x: Int8) {
    const a = new Uint8Array(2);
    const v = new DataView(a.buffer);
    v.setInt16(0, x, true);
    this.buffers.push(a);
    return this;
  }

  i32(x: Int8) {
    const a = new Uint8Array(4);
    const v = new DataView(a.buffer);
    v.setInt32(0, x, true);
    this.buffers.push(a);
    return this;
  }

  ui8(x: UInt8) {
    const a = new Uint8Array(1);
    const v = new DataView(a.buffer);
    v.setUint8(0, x);
    this.buffers.push(a);
    return this;
  }

  ui16(x: Int8) {
    const a = new Uint8Array(2);
    const v = new DataView(a.buffer);
    v.setUint16(0, x, true);
    this.buffers.push(a);
    return this;
  }

  ui32(x: Int8) {
    const a = new Uint8Array(4);
    const v = new DataView(a.buffer);
    v.setUint32(0, x, true);
    this.buffers.push(a);
    return this;
  }

  float32(x: Int8) {
    const a = new Uint8Array(4);
    const v = new DataView(a.buffer);
    v.setFloat32(0, x, true);
    this.buffers.push(a);
    return this;
  }

  float64(x: Int8) {
    const a = new Uint8Array(8);
    const v = new DataView(a.buffer);
    v.setFloat64(0, x, true);
    this.buffers.push(a);
    return this;
  }

  integer(x: bigint) {
    let bytes = (x < 0 ? -x : x).toString(16);
    if (bytes.length % 2 != 0) bytes = "0" + bytes;
    const size = bytes.length / 2;

    const header_size = 5;
    const buffer = new Uint8Array(size + header_size);
    const bufferv = new DataView(buffer.buffer);
    bufferv.setUint8(0, x < 0 ? 0x01 : 0x00);
    bufferv.setUint32(1, size, true);

    for (let i = 0; i < size; ++i) {
      const byte_offset = i * 2;
      bufferv.setUint8(
        header_size + i,
        parseInt(bytes.substring(byte_offset, byte_offset + 2), 16)
      );
    }

    this.buffers.push(buffer);
    return this;
  }

  text(x: string) {
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

  bytes(x: Uint8Array) {
    const result = new Uint8Array(x.length + 4);
    const view = new DataView(result.buffer);
    view.setUint32(0, x.length, true);
    result.set(x, 4);
    this.buffers.push(result);
    return this;
  }

  array<A>(xs: A[], f: (_: _Encoder, x: A) => void) {
    this.ui32(xs.length);
    for (const x of xs) {
      f(this, x);
    }
    return this;
  }

  map<K, V>(
    x: Map<K, V>,
    fk: (_: _Encoder, k: K) => void,
    fv: (_: _Encoder, v: V) => void
  ) {
    this.ui32(x.size);
    for (const [k, v] of x.entries()) {
      fk(this, k);
      fv(this, v);
    }
    return this;
  }

  optional<A>(x: A | null, f: (_: _Encoder, v: A) => void) {
    if (x == null) {
      this.bool(false);
    } else {
      this.bool(true);
      f(this, x);
    }
    return this;
  }

  encode(method: _EncodeMethod) {
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

export type Int8 = number;
export type Int16 = number;
export type Int32 = number;
export type UInt8 = number;
export type UInt16 = number;
export type UInt32 = number;
export type Float32 = number;
export type Float64 = number;



export class KeyboardKey {
 static readonly $tag = 8;
 readonly $tag = 8;

 constructor(readonly key: string, readonly code: string, readonly key_code: bigint) {}

 static decode($d: _Decoder): KeyboardKey {
   const $tag = $d.ui32();
   if ($tag !== 8) {
     throw new Error(`Invalid tag ${$tag} for KeyboardKey: expected 8`);
   }
   return KeyboardKey.$do_decode($d);
 }

 static $do_decode($d: _Decoder): KeyboardKey {
   const key = $d.text();
const code = $d.text();
const key_code = $d.bigint();
   return new KeyboardKey(key, code, key_code);
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.text(this.key);
$e.text(this.code);
$e.integer(this.key_code);
 }
}



export class Cartridge {
 static readonly $tag = 0;
 readonly $tag = 0;

 constructor(readonly id: string, readonly metadata: Metadata, readonly files: (File)[], readonly platform: (Platform.Web_archive)) {}

 static decode($d: _Decoder): Cartridge {
   const $tag = $d.ui32();
   if ($tag !== 0) {
     throw new Error(`Invalid tag ${$tag} for Cartridge: expected 0`);
   }
   return Cartridge.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Cartridge {
   const id = $d.text();
const metadata = Metadata.$do_decode($d);

const files = $d.array(() => {
 const item = File.$do_decode($d);;
 return item;
});

const platform = Platform$Base.$do_decode($d);
   return new Cartridge(id, metadata, files, platform);
 }

 encode($e: _Encoder) {
   $e.ui32(0);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.text(this.id);
(this.metadata).$do_encode($e);
$e.array((this.files), ($e, v) => {
  (v).$do_encode($e);
});
(this.platform).$do_encode($e);
 }
}



export class File {
 static readonly $tag = 1;
 readonly $tag = 1;

 constructor(readonly path: string, readonly mime: string, readonly data: Uint8Array) {}

 static decode($d: _Decoder): File {
   const $tag = $d.ui32();
   if ($tag !== 1) {
     throw new Error(`Invalid tag ${$tag} for File: expected 1`);
   }
   return File.$do_decode($d);
 }

 static $do_decode($d: _Decoder): File {
   const path = $d.text();
const mime = $d.text();
const data = $d.bytes();
   return new File(path, mime, data);
 }

 encode($e: _Encoder) {
   $e.ui32(1);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.text(this.path);
$e.text(this.mime);
$e.bytes(this.data);
 }
}



export class Metadata {
 static readonly $tag = 2;
 readonly $tag = 2;

 constructor(readonly author: string, readonly title: string, readonly description: string, readonly category: string, readonly content_warning: (string)[], readonly classification: (Content_classification.General | Content_classification.Teen_and_up | Content_classification.Mature | Content_classification.Explicit), readonly release_date: Date, readonly thumbnail: File) {}

 static decode($d: _Decoder): Metadata {
   const $tag = $d.ui32();
   if ($tag !== 2) {
     throw new Error(`Invalid tag ${$tag} for Metadata: expected 2`);
   }
   return Metadata.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Metadata {
   const author = $d.text();
const title = $d.text();
const description = $d.text();
const category = $d.text();

const content_warning = $d.array(() => {
 const item = $d.text();;
 return item;
});

const classification = Content_classification$Base.$do_decode($d);
const release_date = Date.$do_decode($d);
const thumbnail = File.$do_decode($d);
   return new Metadata(author, title, description, category, content_warning, classification, release_date, thumbnail);
 }

 encode($e: _Encoder) {
   $e.ui32(2);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
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



export type Content_classification = Content_classification.General | Content_classification.Teen_and_up | Content_classification.Mature | Content_classification.Explicit;

export abstract class Content_classification$Base {
 static decode($d: _Decoder): Content_classification {
   const $tag = $d.ui32();
   if ($tag !== 3) {
     throw new Error(`Invalid tag ${$tag} for Content-classification: expected 3`);
   }
   return Content_classification$Base.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Content_classification {
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

export namespace Content_classification {
 export const enum $Tags {
   General,Teen_and_up,Mature,Explicit
 }

 
export class General extends Content_classification$Base {
 static readonly $tag = $Tags.General;
 readonly $tag = $Tags.General;

 constructor() {
   super();
 }

 static decode($d: _Decoder): General {
   return General.$do_decode($d);
 }

 static $do_decode($d: _Decoder): General {
   const $tag = $d.ui8();
   if ($tag !== 0) {
     throw new Error(`Invalid tag ${$tag} for Content-classification.General: expected 0`);
   }

   
   return new General();
 }

 encode($e: _Encoder) {
   $e.ui32(3);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(0);
   
 }
}



export class Teen_and_up extends Content_classification$Base {
 static readonly $tag = $Tags.Teen_and_up;
 readonly $tag = $Tags.Teen_and_up;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Teen_and_up {
   return Teen_and_up.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Teen_and_up {
   const $tag = $d.ui8();
   if ($tag !== 1) {
     throw new Error(`Invalid tag ${$tag} for Content-classification.Teen-and-up: expected 1`);
   }

   
   return new Teen_and_up();
 }

 encode($e: _Encoder) {
   $e.ui32(3);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(1);
   
 }
}



export class Mature extends Content_classification$Base {
 static readonly $tag = $Tags.Mature;
 readonly $tag = $Tags.Mature;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Mature {
   return Mature.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Mature {
   const $tag = $d.ui8();
   if ($tag !== 2) {
     throw new Error(`Invalid tag ${$tag} for Content-classification.Mature: expected 2`);
   }

   
   return new Mature();
 }

 encode($e: _Encoder) {
   $e.ui32(3);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(2);
   
 }
}



export class Explicit extends Content_classification$Base {
 static readonly $tag = $Tags.Explicit;
 readonly $tag = $Tags.Explicit;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Explicit {
   return Explicit.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Explicit {
   const $tag = $d.ui8();
   if ($tag !== 3) {
     throw new Error(`Invalid tag ${$tag} for Content-classification.Explicit: expected 3`);
   }

   
   return new Explicit();
 }

 encode($e: _Encoder) {
   $e.ui32(3);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(3);
   
 }
}

}



export class Date {
 static readonly $tag = 4;
 readonly $tag = 4;

 constructor(readonly year: UInt32, readonly month: UInt8, readonly day: UInt8) {}

 static decode($d: _Decoder): Date {
   const $tag = $d.ui32();
   if ($tag !== 4) {
     throw new Error(`Invalid tag ${$tag} for Date: expected 4`);
   }
   return Date.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Date {
   const year = $d.ui32();
const month = $d.ui8();
const day = $d.ui8();
   return new Date(year, month, day);
 }

 encode($e: _Encoder) {
   $e.ui32(4);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui32(this.year);
$e.ui8(this.month);
$e.ui8(this.day);
 }
}



export type Platform = Platform.Web_archive;

export abstract class Platform$Base {
 static decode($d: _Decoder): Platform {
   const $tag = $d.ui32();
   if ($tag !== 5) {
     throw new Error(`Invalid tag ${$tag} for Platform: expected 5`);
   }
   return Platform$Base.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Platform {
   const $tag = $d.peek((v) => v.getUint8(0));

   switch ($tag) {
     case 0: return Platform.Web_archive.decode($d);

     default:
       throw new Error(`Unknown tag ${$tag} in union Platform`);
   }
 }
}

export namespace Platform {
 export const enum $Tags {
   Web_archive
 }

 
export class Web_archive extends Platform$Base {
 static readonly $tag = $Tags.Web_archive;
 readonly $tag = $Tags.Web_archive;

 constructor(readonly html: string, readonly bridges: ((Bridge.RPG_maker_mv | Bridge.Renpy | Bridge.Network_proxy | Bridge.Local_storage_proxy | Bridge.Input_proxy))[]) {
   super();
 }

 static decode($d: _Decoder): Web_archive {
   return Web_archive.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Web_archive {
   const $tag = $d.ui8();
   if ($tag !== 0) {
     throw new Error(`Invalid tag ${$tag} for Platform.Web-archive: expected 0`);
   }

   const html = $d.text();

const bridges = $d.array(() => {
 const item = Bridge$Base.$do_decode($d);;
 return item;
});

   return new Web_archive(html, bridges);
 }

 encode($e: _Encoder) {
   $e.ui32(5);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(0);
   $e.text(this.html);
$e.array((this.bridges), ($e, v) => {
  (v).$do_encode($e);
});
 }
}

}



export type Bridge = Bridge.RPG_maker_mv | Bridge.Renpy | Bridge.Network_proxy | Bridge.Local_storage_proxy | Bridge.Input_proxy;

export abstract class Bridge$Base {
 static decode($d: _Decoder): Bridge {
   const $tag = $d.ui32();
   if ($tag !== 6) {
     throw new Error(`Invalid tag ${$tag} for Bridge: expected 6`);
   }
   return Bridge$Base.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Bridge {
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

export namespace Bridge {
 export const enum $Tags {
   RPG_maker_mv,Renpy,Network_proxy,Local_storage_proxy,Input_proxy
 }

 
export class RPG_maker_mv extends Bridge$Base {
 static readonly $tag = $Tags.RPG_maker_mv;
 readonly $tag = $Tags.RPG_maker_mv;

 constructor() {
   super();
 }

 static decode($d: _Decoder): RPG_maker_mv {
   return RPG_maker_mv.$do_decode($d);
 }

 static $do_decode($d: _Decoder): RPG_maker_mv {
   const $tag = $d.ui8();
   if ($tag !== 0) {
     throw new Error(`Invalid tag ${$tag} for Bridge.RPG-maker-mv: expected 0`);
   }

   
   return new RPG_maker_mv();
 }

 encode($e: _Encoder) {
   $e.ui32(6);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(0);
   
 }
}



export class Renpy extends Bridge$Base {
 static readonly $tag = $Tags.Renpy;
 readonly $tag = $Tags.Renpy;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Renpy {
   return Renpy.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Renpy {
   const $tag = $d.ui8();
   if ($tag !== 1) {
     throw new Error(`Invalid tag ${$tag} for Bridge.Renpy: expected 1`);
   }

   
   return new Renpy();
 }

 encode($e: _Encoder) {
   $e.ui32(6);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(1);
   
 }
}



export class Network_proxy extends Bridge$Base {
 static readonly $tag = $Tags.Network_proxy;
 readonly $tag = $Tags.Network_proxy;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Network_proxy {
   return Network_proxy.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Network_proxy {
   const $tag = $d.ui8();
   if ($tag !== 2) {
     throw new Error(`Invalid tag ${$tag} for Bridge.Network-proxy: expected 2`);
   }

   
   return new Network_proxy();
 }

 encode($e: _Encoder) {
   $e.ui32(6);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(2);
   
 }
}



export class Local_storage_proxy extends Bridge$Base {
 static readonly $tag = $Tags.Local_storage_proxy;
 readonly $tag = $Tags.Local_storage_proxy;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Local_storage_proxy {
   return Local_storage_proxy.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Local_storage_proxy {
   const $tag = $d.ui8();
   if ($tag !== 3) {
     throw new Error(`Invalid tag ${$tag} for Bridge.Local-storage-proxy: expected 3`);
   }

   
   return new Local_storage_proxy();
 }

 encode($e: _Encoder) {
   $e.ui32(6);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(3);
   
 }
}



export class Input_proxy extends Bridge$Base {
 static readonly $tag = $Tags.Input_proxy;
 readonly $tag = $Tags.Input_proxy;

 constructor(readonly mapping: Map<(VirtualKey.Up | VirtualKey.Right | VirtualKey.Down | VirtualKey.Left | VirtualKey.Menu | VirtualKey.Capture | VirtualKey.X | VirtualKey.O | VirtualKey.L_trigger | VirtualKey.R_trigger), KeyboardKey>) {
   super();
 }

 static decode($d: _Decoder): Input_proxy {
   return Input_proxy.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Input_proxy {
   const $tag = $d.ui8();
   if ($tag !== 4) {
     throw new Error(`Invalid tag ${$tag} for Bridge.Input-proxy: expected 4`);
   }

   
const mapping = $d.map(
 () => {
   const key = VirtualKey$Base.$do_decode($d);;
   return key;
 },
 () => {
   const value = KeyboardKey.$do_decode($d);;
   return value;
 }
);

   return new Input_proxy(mapping);
 }

 encode($e: _Encoder) {
   $e.ui32(6);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(4);
   $e.map((this.mapping),
  ($e, k) => { (k).$do_encode($e); },
  ($e, v) => { (v).$do_encode($e); }
);
 }
}

}



export type VirtualKey = VirtualKey.Up | VirtualKey.Right | VirtualKey.Down | VirtualKey.Left | VirtualKey.Menu | VirtualKey.Capture | VirtualKey.X | VirtualKey.O | VirtualKey.L_trigger | VirtualKey.R_trigger;

export abstract class VirtualKey$Base {
 static decode($d: _Decoder): VirtualKey {
   const $tag = $d.ui32();
   if ($tag !== 7) {
     throw new Error(`Invalid tag ${$tag} for VirtualKey: expected 7`);
   }
   return VirtualKey$Base.$do_decode($d);
 }

 static $do_decode($d: _Decoder): VirtualKey {
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

export namespace VirtualKey {
 export const enum $Tags {
   Up,Right,Down,Left,Menu,Capture,X,O,L_trigger,R_trigger
 }

 
export class Up extends VirtualKey$Base {
 static readonly $tag = $Tags.Up;
 readonly $tag = $Tags.Up;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Up {
   return Up.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Up {
   const $tag = $d.ui8();
   if ($tag !== 0) {
     throw new Error(`Invalid tag ${$tag} for VirtualKey.Up: expected 0`);
   }

   
   return new Up();
 }

 encode($e: _Encoder) {
   $e.ui32(7);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(0);
   
 }
}



export class Right extends VirtualKey$Base {
 static readonly $tag = $Tags.Right;
 readonly $tag = $Tags.Right;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Right {
   return Right.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Right {
   const $tag = $d.ui8();
   if ($tag !== 1) {
     throw new Error(`Invalid tag ${$tag} for VirtualKey.Right: expected 1`);
   }

   
   return new Right();
 }

 encode($e: _Encoder) {
   $e.ui32(7);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(1);
   
 }
}



export class Down extends VirtualKey$Base {
 static readonly $tag = $Tags.Down;
 readonly $tag = $Tags.Down;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Down {
   return Down.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Down {
   const $tag = $d.ui8();
   if ($tag !== 2) {
     throw new Error(`Invalid tag ${$tag} for VirtualKey.Down: expected 2`);
   }

   
   return new Down();
 }

 encode($e: _Encoder) {
   $e.ui32(7);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(2);
   
 }
}



export class Left extends VirtualKey$Base {
 static readonly $tag = $Tags.Left;
 readonly $tag = $Tags.Left;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Left {
   return Left.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Left {
   const $tag = $d.ui8();
   if ($tag !== 3) {
     throw new Error(`Invalid tag ${$tag} for VirtualKey.Left: expected 3`);
   }

   
   return new Left();
 }

 encode($e: _Encoder) {
   $e.ui32(7);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(3);
   
 }
}



export class Menu extends VirtualKey$Base {
 static readonly $tag = $Tags.Menu;
 readonly $tag = $Tags.Menu;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Menu {
   return Menu.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Menu {
   const $tag = $d.ui8();
   if ($tag !== 4) {
     throw new Error(`Invalid tag ${$tag} for VirtualKey.Menu: expected 4`);
   }

   
   return new Menu();
 }

 encode($e: _Encoder) {
   $e.ui32(7);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(4);
   
 }
}



export class Capture extends VirtualKey$Base {
 static readonly $tag = $Tags.Capture;
 readonly $tag = $Tags.Capture;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Capture {
   return Capture.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Capture {
   const $tag = $d.ui8();
   if ($tag !== 5) {
     throw new Error(`Invalid tag ${$tag} for VirtualKey.Capture: expected 5`);
   }

   
   return new Capture();
 }

 encode($e: _Encoder) {
   $e.ui32(7);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(5);
   
 }
}



export class X extends VirtualKey$Base {
 static readonly $tag = $Tags.X;
 readonly $tag = $Tags.X;

 constructor() {
   super();
 }

 static decode($d: _Decoder): X {
   return X.$do_decode($d);
 }

 static $do_decode($d: _Decoder): X {
   const $tag = $d.ui8();
   if ($tag !== 6) {
     throw new Error(`Invalid tag ${$tag} for VirtualKey.X: expected 6`);
   }

   
   return new X();
 }

 encode($e: _Encoder) {
   $e.ui32(7);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(6);
   
 }
}



export class O extends VirtualKey$Base {
 static readonly $tag = $Tags.O;
 readonly $tag = $Tags.O;

 constructor() {
   super();
 }

 static decode($d: _Decoder): O {
   return O.$do_decode($d);
 }

 static $do_decode($d: _Decoder): O {
   const $tag = $d.ui8();
   if ($tag !== 7) {
     throw new Error(`Invalid tag ${$tag} for VirtualKey.O: expected 7`);
   }

   
   return new O();
 }

 encode($e: _Encoder) {
   $e.ui32(7);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(7);
   
 }
}



export class L_trigger extends VirtualKey$Base {
 static readonly $tag = $Tags.L_trigger;
 readonly $tag = $Tags.L_trigger;

 constructor() {
   super();
 }

 static decode($d: _Decoder): L_trigger {
   return L_trigger.$do_decode($d);
 }

 static $do_decode($d: _Decoder): L_trigger {
   const $tag = $d.ui8();
   if ($tag !== 8) {
     throw new Error(`Invalid tag ${$tag} for VirtualKey.L-trigger: expected 8`);
   }

   
   return new L_trigger();
 }

 encode($e: _Encoder) {
   $e.ui32(7);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(8);
   
 }
}



export class R_trigger extends VirtualKey$Base {
 static readonly $tag = $Tags.R_trigger;
 readonly $tag = $Tags.R_trigger;

 constructor() {
   super();
 }

 static decode($d: _Decoder): R_trigger {
   return R_trigger.$do_decode($d);
 }

 static $do_decode($d: _Decoder): R_trigger {
   const $tag = $d.ui8();
   if ($tag !== 9) {
     throw new Error(`Invalid tag ${$tag} for VirtualKey.R-trigger: expected 9`);
   }

   
   return new R_trigger();
 }

 encode($e: _Encoder) {
   $e.ui32(7);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(9);
   
 }
}

}


