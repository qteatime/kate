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

  get remaining_bytes() {
    return this.view.byteLength - (this.view.byteOffset + this.offset);
  }

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



export type Genre = Genre.Not_specified | Genre.Action | Genre.Figthing | Genre.Interactive_fiction | Genre.Platformer | Genre.Puzzle | Genre.Racing | Genre.Rhythm | Genre.RPG | Genre.Simulation | Genre.Shooter | Genre.Sports | Genre.Strategy | Genre.Tool | Genre.Other;

export abstract class Genre$Base {
 static decode($d: _Decoder): Genre {
   const $tag = $d.ui32();
   if ($tag !== 8) {
     throw new Error(`Invalid tag ${$tag} for Genre: expected 8`);
   }
   return Genre$Base.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Genre {
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

export namespace Genre {
 export const enum $Tags {
   Not_specified,Action,Figthing,Interactive_fiction,Platformer,Puzzle,Racing,Rhythm,RPG,Simulation,Shooter,Sports,Strategy,Tool,Other
 }

 
export class Not_specified extends Genre$Base {
 static readonly $tag = $Tags.Not_specified;
 readonly $tag = $Tags.Not_specified;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Not_specified {
   return Not_specified.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Not_specified {
   const $tag = $d.ui8();
   if ($tag !== 0) {
     throw new Error(`Invalid tag ${$tag} for Genre.Not-specified: expected 0`);
   }

   
   return new Not_specified();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(0);
   
 }
}



export class Action extends Genre$Base {
 static readonly $tag = $Tags.Action;
 readonly $tag = $Tags.Action;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Action {
   return Action.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Action {
   const $tag = $d.ui8();
   if ($tag !== 1) {
     throw new Error(`Invalid tag ${$tag} for Genre.Action: expected 1`);
   }

   
   return new Action();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(1);
   
 }
}



export class Figthing extends Genre$Base {
 static readonly $tag = $Tags.Figthing;
 readonly $tag = $Tags.Figthing;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Figthing {
   return Figthing.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Figthing {
   const $tag = $d.ui8();
   if ($tag !== 2) {
     throw new Error(`Invalid tag ${$tag} for Genre.Figthing: expected 2`);
   }

   
   return new Figthing();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(2);
   
 }
}



export class Interactive_fiction extends Genre$Base {
 static readonly $tag = $Tags.Interactive_fiction;
 readonly $tag = $Tags.Interactive_fiction;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Interactive_fiction {
   return Interactive_fiction.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Interactive_fiction {
   const $tag = $d.ui8();
   if ($tag !== 3) {
     throw new Error(`Invalid tag ${$tag} for Genre.Interactive-fiction: expected 3`);
   }

   
   return new Interactive_fiction();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(3);
   
 }
}



export class Platformer extends Genre$Base {
 static readonly $tag = $Tags.Platformer;
 readonly $tag = $Tags.Platformer;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Platformer {
   return Platformer.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Platformer {
   const $tag = $d.ui8();
   if ($tag !== 4) {
     throw new Error(`Invalid tag ${$tag} for Genre.Platformer: expected 4`);
   }

   
   return new Platformer();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(4);
   
 }
}



export class Puzzle extends Genre$Base {
 static readonly $tag = $Tags.Puzzle;
 readonly $tag = $Tags.Puzzle;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Puzzle {
   return Puzzle.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Puzzle {
   const $tag = $d.ui8();
   if ($tag !== 5) {
     throw new Error(`Invalid tag ${$tag} for Genre.Puzzle: expected 5`);
   }

   
   return new Puzzle();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(5);
   
 }
}



export class Racing extends Genre$Base {
 static readonly $tag = $Tags.Racing;
 readonly $tag = $Tags.Racing;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Racing {
   return Racing.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Racing {
   const $tag = $d.ui8();
   if ($tag !== 6) {
     throw new Error(`Invalid tag ${$tag} for Genre.Racing: expected 6`);
   }

   
   return new Racing();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(6);
   
 }
}



export class Rhythm extends Genre$Base {
 static readonly $tag = $Tags.Rhythm;
 readonly $tag = $Tags.Rhythm;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Rhythm {
   return Rhythm.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Rhythm {
   const $tag = $d.ui8();
   if ($tag !== 7) {
     throw new Error(`Invalid tag ${$tag} for Genre.Rhythm: expected 7`);
   }

   
   return new Rhythm();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(7);
   
 }
}



export class RPG extends Genre$Base {
 static readonly $tag = $Tags.RPG;
 readonly $tag = $Tags.RPG;

 constructor() {
   super();
 }

 static decode($d: _Decoder): RPG {
   return RPG.$do_decode($d);
 }

 static $do_decode($d: _Decoder): RPG {
   const $tag = $d.ui8();
   if ($tag !== 8) {
     throw new Error(`Invalid tag ${$tag} for Genre.RPG: expected 8`);
   }

   
   return new RPG();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(8);
   
 }
}



export class Simulation extends Genre$Base {
 static readonly $tag = $Tags.Simulation;
 readonly $tag = $Tags.Simulation;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Simulation {
   return Simulation.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Simulation {
   const $tag = $d.ui8();
   if ($tag !== 9) {
     throw new Error(`Invalid tag ${$tag} for Genre.Simulation: expected 9`);
   }

   
   return new Simulation();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(9);
   
 }
}



export class Shooter extends Genre$Base {
 static readonly $tag = $Tags.Shooter;
 readonly $tag = $Tags.Shooter;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Shooter {
   return Shooter.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Shooter {
   const $tag = $d.ui8();
   if ($tag !== 10) {
     throw new Error(`Invalid tag ${$tag} for Genre.Shooter: expected 10`);
   }

   
   return new Shooter();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(10);
   
 }
}



export class Sports extends Genre$Base {
 static readonly $tag = $Tags.Sports;
 readonly $tag = $Tags.Sports;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Sports {
   return Sports.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Sports {
   const $tag = $d.ui8();
   if ($tag !== 11) {
     throw new Error(`Invalid tag ${$tag} for Genre.Sports: expected 11`);
   }

   
   return new Sports();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(11);
   
 }
}



export class Strategy extends Genre$Base {
 static readonly $tag = $Tags.Strategy;
 readonly $tag = $Tags.Strategy;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Strategy {
   return Strategy.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Strategy {
   const $tag = $d.ui8();
   if ($tag !== 12) {
     throw new Error(`Invalid tag ${$tag} for Genre.Strategy: expected 12`);
   }

   
   return new Strategy();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(12);
   
 }
}



export class Tool extends Genre$Base {
 static readonly $tag = $Tags.Tool;
 readonly $tag = $Tags.Tool;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Tool {
   return Tool.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Tool {
   const $tag = $d.ui8();
   if ($tag !== 13) {
     throw new Error(`Invalid tag ${$tag} for Genre.Tool: expected 13`);
   }

   
   return new Tool();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(13);
   
 }
}



export class Other extends Genre$Base {
 static readonly $tag = $Tags.Other;
 readonly $tag = $Tags.Other;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Other {
   return Other.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Other {
   const $tag = $d.ui8();
   if ($tag !== 14) {
     throw new Error(`Invalid tag ${$tag} for Genre.Other: expected 14`);
   }

   
   return new Other();
 }

 encode($e: _Encoder) {
   $e.ui32(8);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(14);
   
 }
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

 constructor(readonly title: Meta_title, readonly release: Meta_release, readonly rating: Meta_rating, readonly play: Meta_play, readonly booklet: Meta_booklet) {}

 static decode($d: _Decoder): Metadata {
   const $tag = $d.ui32();
   if ($tag !== 2) {
     throw new Error(`Invalid tag ${$tag} for Metadata: expected 2`);
   }
   return Metadata.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Metadata {
   const title = Meta_title.$do_decode($d);
const release = Meta_release.$do_decode($d);
const rating = Meta_rating.$do_decode($d);
const play = Meta_play.$do_decode($d);
const booklet = Meta_booklet.$do_decode($d);
   return new Metadata(title, release, rating, play, booklet);
 }

 encode($e: _Encoder) {
   $e.ui32(2);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   (this.title).$do_encode($e);
(this.release).$do_encode($e);
(this.rating).$do_encode($e);
(this.play).$do_encode($e);
(this.booklet).$do_encode($e);
 }
}



export class Meta_title {
 static readonly $tag = 3;
 readonly $tag = 3;

 constructor(readonly author: string, readonly title: string, readonly description: string, readonly genre: ((Genre.Not_specified | Genre.Action | Genre.Figthing | Genre.Interactive_fiction | Genre.Platformer | Genre.Puzzle | Genre.Racing | Genre.Rhythm | Genre.RPG | Genre.Simulation | Genre.Shooter | Genre.Sports | Genre.Strategy | Genre.Tool | Genre.Other))[], readonly tags: (string)[], readonly thumbnail: File) {}

 static decode($d: _Decoder): Meta_title {
   const $tag = $d.ui32();
   if ($tag !== 3) {
     throw new Error(`Invalid tag ${$tag} for Meta-title: expected 3`);
   }
   return Meta_title.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Meta_title {
   const author = $d.text();
const title = $d.text();
const description = $d.text();

const genre = $d.array(() => {
 const item = Genre$Base.$do_decode($d);;
 return item;
});


const tags = $d.array(() => {
 const item = $d.text();;
 return item;
});

const thumbnail = File.$do_decode($d);
   return new Meta_title(author, title, description, genre, tags, thumbnail);
 }

 encode($e: _Encoder) {
   $e.ui32(3);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
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



export class Meta_release {
 static readonly $tag = 4;
 readonly $tag = 4;

 constructor(readonly release_type: (Release_type.Prototype | Release_type.Early_access | Release_type.Beta | Release_type.Demo | Release_type.Full), readonly release_date: Date, readonly version: Version, readonly legal_notices: string, readonly licence_name: string, readonly allow_derivative: boolean, readonly allow_commercial: boolean) {}

 static decode($d: _Decoder): Meta_release {
   const $tag = $d.ui32();
   if ($tag !== 4) {
     throw new Error(`Invalid tag ${$tag} for Meta-release: expected 4`);
   }
   return Meta_release.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Meta_release {
   const release_type = Release_type$Base.$do_decode($d);
const release_date = Date.$do_decode($d);
const version = Version.$do_decode($d);
const legal_notices = $d.text();
const licence_name = $d.text();
const allow_derivative = $d.bool();
const allow_commercial = $d.bool();
   return new Meta_release(release_type, release_date, version, legal_notices, licence_name, allow_derivative, allow_commercial);
 }

 encode($e: _Encoder) {
   $e.ui32(4);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   (this.release_type).$do_encode($e);
(this.release_date).$do_encode($e);
(this.version).$do_encode($e);
$e.text(this.legal_notices);
$e.text(this.licence_name);
$e.bool(this.allow_derivative);
$e.bool(this.allow_commercial);
 }
}



export class Meta_rating {
 static readonly $tag = 5;
 readonly $tag = 5;

 constructor(readonly rating: (Content_rating.General | Content_rating.Teen_and_up | Content_rating.Mature | Content_rating.Explicit), readonly warnings: (string)[]) {}

 static decode($d: _Decoder): Meta_rating {
   const $tag = $d.ui32();
   if ($tag !== 5) {
     throw new Error(`Invalid tag ${$tag} for Meta-rating: expected 5`);
   }
   return Meta_rating.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Meta_rating {
   const rating = Content_rating$Base.$do_decode($d);

const warnings = $d.array(() => {
 const item = $d.text();;
 return item;
});

   return new Meta_rating(rating, warnings);
 }

 encode($e: _Encoder) {
   $e.ui32(5);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   (this.rating).$do_encode($e);
$e.array((this.warnings), ($e, v) => {
  $e.text(v);
});
 }
}



export class Meta_play {
 static readonly $tag = 6;
 readonly $tag = 6;

 constructor(readonly input_methods: ((Input_method.Kate_buttons | Input_method.Touch))[], readonly local_multiplayer: (Player_range) | null, readonly online_multiplayer: (Player_range) | null, readonly languages: (Language)[], readonly accessibility: ((Accessibility.High_contrast | Accessibility.Subtitles | Accessibility.Image_captions | Accessibility.Voiced_text | Accessibility.Configurable_difficulty | Accessibility.Skippable_content))[], readonly average_duration: (Duration.Seconds | Duration.Few_minutes | Duration.Half_hour | Duration.One_hour | Duration.Few_hours | Duration.Several_hours | Duration.Unknown)) {}

 static decode($d: _Decoder): Meta_play {
   const $tag = $d.ui32();
   if ($tag !== 6) {
     throw new Error(`Invalid tag ${$tag} for Meta-play: expected 6`);
   }
   return Meta_play.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Meta_play {
   
const input_methods = $d.array(() => {
 const item = Input_method$Base.$do_decode($d);;
 return item;
});


const local_multiplayer = $d.optional(() => {
 const item = Player_range.$do_decode($d);;
 return item;
});


const online_multiplayer = $d.optional(() => {
 const item = Player_range.$do_decode($d);;
 return item;
});


const languages = $d.array(() => {
 const item = Language.$do_decode($d);;
 return item;
});


const accessibility = $d.array(() => {
 const item = Accessibility$Base.$do_decode($d);;
 return item;
});

const average_duration = Duration$Base.$do_decode($d);
   return new Meta_play(input_methods, local_multiplayer, online_multiplayer, languages, accessibility, average_duration);
 }

 encode($e: _Encoder) {
   $e.ui32(6);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.array((this.input_methods), ($e, v) => {
  (v).$do_encode($e);
});
$e.optional((this.local_multiplayer),
  ($e, v) => { (v).$do_encode($e); }
);
$e.optional((this.online_multiplayer),
  ($e, v) => { (v).$do_encode($e); }
);
$e.array((this.languages), ($e, v) => {
  (v).$do_encode($e);
});
$e.array((this.accessibility), ($e, v) => {
  (v).$do_encode($e);
});
(this.average_duration).$do_encode($e);
 }
}



export class Meta_booklet {
 static readonly $tag = 7;
 readonly $tag = 7;

 constructor(readonly pages: ((Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class))[], readonly custom_css: string) {}

 static decode($d: _Decoder): Meta_booklet {
   const $tag = $d.ui32();
   if ($tag !== 7) {
     throw new Error(`Invalid tag ${$tag} for Meta-booklet: expected 7`);
   }
   return Meta_booklet.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Meta_booklet {
   
const pages = $d.array(() => {
 const item = Booklet_expr$Base.$do_decode($d);;
 return item;
});

const custom_css = $d.text();
   return new Meta_booklet(pages, custom_css);
 }

 encode($e: _Encoder) {
   $e.ui32(7);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.array((this.pages), ($e, v) => {
  (v).$do_encode($e);
});
$e.text(this.custom_css);
 }
}



export type Release_type = Release_type.Prototype | Release_type.Early_access | Release_type.Beta | Release_type.Demo | Release_type.Full;

export abstract class Release_type$Base {
 static decode($d: _Decoder): Release_type {
   const $tag = $d.ui32();
   if ($tag !== 9) {
     throw new Error(`Invalid tag ${$tag} for Release-type: expected 9`);
   }
   return Release_type$Base.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Release_type {
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

export namespace Release_type {
 export const enum $Tags {
   Prototype,Early_access,Beta,Demo,Full
 }

 
export class Prototype extends Release_type$Base {
 static readonly $tag = $Tags.Prototype;
 readonly $tag = $Tags.Prototype;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Prototype {
   return Prototype.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Prototype {
   const $tag = $d.ui8();
   if ($tag !== 0) {
     throw new Error(`Invalid tag ${$tag} for Release-type.Prototype: expected 0`);
   }

   
   return new Prototype();
 }

 encode($e: _Encoder) {
   $e.ui32(9);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(0);
   
 }
}



export class Early_access extends Release_type$Base {
 static readonly $tag = $Tags.Early_access;
 readonly $tag = $Tags.Early_access;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Early_access {
   return Early_access.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Early_access {
   const $tag = $d.ui8();
   if ($tag !== 1) {
     throw new Error(`Invalid tag ${$tag} for Release-type.Early-access: expected 1`);
   }

   
   return new Early_access();
 }

 encode($e: _Encoder) {
   $e.ui32(9);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(1);
   
 }
}



export class Beta extends Release_type$Base {
 static readonly $tag = $Tags.Beta;
 readonly $tag = $Tags.Beta;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Beta {
   return Beta.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Beta {
   const $tag = $d.ui8();
   if ($tag !== 2) {
     throw new Error(`Invalid tag ${$tag} for Release-type.Beta: expected 2`);
   }

   
   return new Beta();
 }

 encode($e: _Encoder) {
   $e.ui32(9);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(2);
   
 }
}



export class Demo extends Release_type$Base {
 static readonly $tag = $Tags.Demo;
 readonly $tag = $Tags.Demo;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Demo {
   return Demo.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Demo {
   const $tag = $d.ui8();
   if ($tag !== 3) {
     throw new Error(`Invalid tag ${$tag} for Release-type.Demo: expected 3`);
   }

   
   return new Demo();
 }

 encode($e: _Encoder) {
   $e.ui32(9);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(3);
   
 }
}



export class Full extends Release_type$Base {
 static readonly $tag = $Tags.Full;
 readonly $tag = $Tags.Full;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Full {
   return Full.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Full {
   const $tag = $d.ui8();
   if ($tag !== 4) {
     throw new Error(`Invalid tag ${$tag} for Release-type.Full: expected 4`);
   }

   
   return new Full();
 }

 encode($e: _Encoder) {
   $e.ui32(9);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(4);
   
 }
}

}



export class Version {
 static readonly $tag = 10;
 readonly $tag = 10;

 constructor(readonly major: UInt32, readonly minor: UInt32) {}

 static decode($d: _Decoder): Version {
   const $tag = $d.ui32();
   if ($tag !== 10) {
     throw new Error(`Invalid tag ${$tag} for Version: expected 10`);
   }
   return Version.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Version {
   const major = $d.ui32();
const minor = $d.ui32();
   return new Version(major, minor);
 }

 encode($e: _Encoder) {
   $e.ui32(10);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui32(this.major);
$e.ui32(this.minor);
 }
}



export type Content_rating = Content_rating.General | Content_rating.Teen_and_up | Content_rating.Mature | Content_rating.Explicit;

export abstract class Content_rating$Base {
 static decode($d: _Decoder): Content_rating {
   const $tag = $d.ui32();
   if ($tag !== 11) {
     throw new Error(`Invalid tag ${$tag} for Content-rating: expected 11`);
   }
   return Content_rating$Base.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Content_rating {
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

export namespace Content_rating {
 export const enum $Tags {
   General,Teen_and_up,Mature,Explicit
 }

 
export class General extends Content_rating$Base {
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
     throw new Error(`Invalid tag ${$tag} for Content-rating.General: expected 0`);
   }

   
   return new General();
 }

 encode($e: _Encoder) {
   $e.ui32(11);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(0);
   
 }
}



export class Teen_and_up extends Content_rating$Base {
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
     throw new Error(`Invalid tag ${$tag} for Content-rating.Teen-and-up: expected 1`);
   }

   
   return new Teen_and_up();
 }

 encode($e: _Encoder) {
   $e.ui32(11);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(1);
   
 }
}



export class Mature extends Content_rating$Base {
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
     throw new Error(`Invalid tag ${$tag} for Content-rating.Mature: expected 2`);
   }

   
   return new Mature();
 }

 encode($e: _Encoder) {
   $e.ui32(11);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(2);
   
 }
}



export class Explicit extends Content_rating$Base {
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
     throw new Error(`Invalid tag ${$tag} for Content-rating.Explicit: expected 3`);
   }

   
   return new Explicit();
 }

 encode($e: _Encoder) {
   $e.ui32(11);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(3);
   
 }
}

}



export class Date {
 static readonly $tag = 12;
 readonly $tag = 12;

 constructor(readonly year: UInt32, readonly month: UInt8, readonly day: UInt8) {}

 static decode($d: _Decoder): Date {
   const $tag = $d.ui32();
   if ($tag !== 12) {
     throw new Error(`Invalid tag ${$tag} for Date: expected 12`);
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
   $e.ui32(12);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui32(this.year);
$e.ui8(this.month);
$e.ui8(this.day);
 }
}



export type Duration = Duration.Seconds | Duration.Few_minutes | Duration.Half_hour | Duration.One_hour | Duration.Few_hours | Duration.Several_hours | Duration.Unknown;

export abstract class Duration$Base {
 static decode($d: _Decoder): Duration {
   const $tag = $d.ui32();
   if ($tag !== 13) {
     throw new Error(`Invalid tag ${$tag} for Duration: expected 13`);
   }
   return Duration$Base.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Duration {
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

export namespace Duration {
 export const enum $Tags {
   Seconds,Few_minutes,Half_hour,One_hour,Few_hours,Several_hours,Unknown
 }

 
export class Seconds extends Duration$Base {
 static readonly $tag = $Tags.Seconds;
 readonly $tag = $Tags.Seconds;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Seconds {
   return Seconds.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Seconds {
   const $tag = $d.ui8();
   if ($tag !== 0) {
     throw new Error(`Invalid tag ${$tag} for Duration.Seconds: expected 0`);
   }

   
   return new Seconds();
 }

 encode($e: _Encoder) {
   $e.ui32(13);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(0);
   
 }
}



export class Few_minutes extends Duration$Base {
 static readonly $tag = $Tags.Few_minutes;
 readonly $tag = $Tags.Few_minutes;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Few_minutes {
   return Few_minutes.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Few_minutes {
   const $tag = $d.ui8();
   if ($tag !== 1) {
     throw new Error(`Invalid tag ${$tag} for Duration.Few-minutes: expected 1`);
   }

   
   return new Few_minutes();
 }

 encode($e: _Encoder) {
   $e.ui32(13);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(1);
   
 }
}



export class Half_hour extends Duration$Base {
 static readonly $tag = $Tags.Half_hour;
 readonly $tag = $Tags.Half_hour;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Half_hour {
   return Half_hour.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Half_hour {
   const $tag = $d.ui8();
   if ($tag !== 2) {
     throw new Error(`Invalid tag ${$tag} for Duration.Half-hour: expected 2`);
   }

   
   return new Half_hour();
 }

 encode($e: _Encoder) {
   $e.ui32(13);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(2);
   
 }
}



export class One_hour extends Duration$Base {
 static readonly $tag = $Tags.One_hour;
 readonly $tag = $Tags.One_hour;

 constructor() {
   super();
 }

 static decode($d: _Decoder): One_hour {
   return One_hour.$do_decode($d);
 }

 static $do_decode($d: _Decoder): One_hour {
   const $tag = $d.ui8();
   if ($tag !== 3) {
     throw new Error(`Invalid tag ${$tag} for Duration.One-hour: expected 3`);
   }

   
   return new One_hour();
 }

 encode($e: _Encoder) {
   $e.ui32(13);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(3);
   
 }
}



export class Few_hours extends Duration$Base {
 static readonly $tag = $Tags.Few_hours;
 readonly $tag = $Tags.Few_hours;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Few_hours {
   return Few_hours.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Few_hours {
   const $tag = $d.ui8();
   if ($tag !== 4) {
     throw new Error(`Invalid tag ${$tag} for Duration.Few-hours: expected 4`);
   }

   
   return new Few_hours();
 }

 encode($e: _Encoder) {
   $e.ui32(13);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(4);
   
 }
}



export class Several_hours extends Duration$Base {
 static readonly $tag = $Tags.Several_hours;
 readonly $tag = $Tags.Several_hours;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Several_hours {
   return Several_hours.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Several_hours {
   const $tag = $d.ui8();
   if ($tag !== 5) {
     throw new Error(`Invalid tag ${$tag} for Duration.Several-hours: expected 5`);
   }

   
   return new Several_hours();
 }

 encode($e: _Encoder) {
   $e.ui32(13);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(5);
   
 }
}



export class Unknown extends Duration$Base {
 static readonly $tag = $Tags.Unknown;
 readonly $tag = $Tags.Unknown;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Unknown {
   return Unknown.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Unknown {
   const $tag = $d.ui8();
   if ($tag !== 6) {
     throw new Error(`Invalid tag ${$tag} for Duration.Unknown: expected 6`);
   }

   
   return new Unknown();
 }

 encode($e: _Encoder) {
   $e.ui32(13);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(6);
   
 }
}

}



export type Input_method = Input_method.Kate_buttons | Input_method.Touch;

export abstract class Input_method$Base {
 static decode($d: _Decoder): Input_method {
   const $tag = $d.ui32();
   if ($tag !== 14) {
     throw new Error(`Invalid tag ${$tag} for Input-method: expected 14`);
   }
   return Input_method$Base.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Input_method {
   const $tag = $d.peek((v) => v.getUint8(0));

   switch ($tag) {
     case 0: return Input_method.Kate_buttons.decode($d);
case 1: return Input_method.Touch.decode($d);

     default:
       throw new Error(`Unknown tag ${$tag} in union Input-method`);
   }
 }
}

export namespace Input_method {
 export const enum $Tags {
   Kate_buttons,Touch
 }

 
export class Kate_buttons extends Input_method$Base {
 static readonly $tag = $Tags.Kate_buttons;
 readonly $tag = $Tags.Kate_buttons;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Kate_buttons {
   return Kate_buttons.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Kate_buttons {
   const $tag = $d.ui8();
   if ($tag !== 0) {
     throw new Error(`Invalid tag ${$tag} for Input-method.Kate-buttons: expected 0`);
   }

   
   return new Kate_buttons();
 }

 encode($e: _Encoder) {
   $e.ui32(14);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(0);
   
 }
}



export class Touch extends Input_method$Base {
 static readonly $tag = $Tags.Touch;
 readonly $tag = $Tags.Touch;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Touch {
   return Touch.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Touch {
   const $tag = $d.ui8();
   if ($tag !== 1) {
     throw new Error(`Invalid tag ${$tag} for Input-method.Touch: expected 1`);
   }

   
   return new Touch();
 }

 encode($e: _Encoder) {
   $e.ui32(14);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(1);
   
 }
}

}



export class Player_range {
 static readonly $tag = 15;
 readonly $tag = 15;

 constructor(readonly minimum: UInt32, readonly maximum: UInt32) {}

 static decode($d: _Decoder): Player_range {
   const $tag = $d.ui32();
   if ($tag !== 15) {
     throw new Error(`Invalid tag ${$tag} for Player-range: expected 15`);
   }
   return Player_range.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Player_range {
   const minimum = $d.ui32();
const maximum = $d.ui32();
   return new Player_range(minimum, maximum);
 }

 encode($e: _Encoder) {
   $e.ui32(15);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui32(this.minimum);
$e.ui32(this.maximum);
 }
}



export class Language {
 static readonly $tag = 16;
 readonly $tag = 16;

 constructor(readonly iso_code: string, readonly _interface: boolean, readonly audio: boolean, readonly text: boolean) {}

 static decode($d: _Decoder): Language {
   const $tag = $d.ui32();
   if ($tag !== 16) {
     throw new Error(`Invalid tag ${$tag} for Language: expected 16`);
   }
   return Language.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Language {
   const iso_code = $d.text();
const _interface = $d.bool();
const audio = $d.bool();
const text = $d.bool();
   return new Language(iso_code, _interface, audio, text);
 }

 encode($e: _Encoder) {
   $e.ui32(16);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.text(this.iso_code);
$e.bool(this._interface);
$e.bool(this.audio);
$e.bool(this.text);
 }
}



export type Accessibility = Accessibility.High_contrast | Accessibility.Subtitles | Accessibility.Image_captions | Accessibility.Voiced_text | Accessibility.Configurable_difficulty | Accessibility.Skippable_content;

export abstract class Accessibility$Base {
 static decode($d: _Decoder): Accessibility {
   const $tag = $d.ui32();
   if ($tag !== 17) {
     throw new Error(`Invalid tag ${$tag} for Accessibility: expected 17`);
   }
   return Accessibility$Base.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Accessibility {
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

export namespace Accessibility {
 export const enum $Tags {
   High_contrast,Subtitles,Image_captions,Voiced_text,Configurable_difficulty,Skippable_content
 }

 
export class High_contrast extends Accessibility$Base {
 static readonly $tag = $Tags.High_contrast;
 readonly $tag = $Tags.High_contrast;

 constructor() {
   super();
 }

 static decode($d: _Decoder): High_contrast {
   return High_contrast.$do_decode($d);
 }

 static $do_decode($d: _Decoder): High_contrast {
   const $tag = $d.ui8();
   if ($tag !== 0) {
     throw new Error(`Invalid tag ${$tag} for Accessibility.High-contrast: expected 0`);
   }

   
   return new High_contrast();
 }

 encode($e: _Encoder) {
   $e.ui32(17);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(0);
   
 }
}



export class Subtitles extends Accessibility$Base {
 static readonly $tag = $Tags.Subtitles;
 readonly $tag = $Tags.Subtitles;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Subtitles {
   return Subtitles.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Subtitles {
   const $tag = $d.ui8();
   if ($tag !== 1) {
     throw new Error(`Invalid tag ${$tag} for Accessibility.Subtitles: expected 1`);
   }

   
   return new Subtitles();
 }

 encode($e: _Encoder) {
   $e.ui32(17);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(1);
   
 }
}



export class Image_captions extends Accessibility$Base {
 static readonly $tag = $Tags.Image_captions;
 readonly $tag = $Tags.Image_captions;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Image_captions {
   return Image_captions.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Image_captions {
   const $tag = $d.ui8();
   if ($tag !== 2) {
     throw new Error(`Invalid tag ${$tag} for Accessibility.Image-captions: expected 2`);
   }

   
   return new Image_captions();
 }

 encode($e: _Encoder) {
   $e.ui32(17);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(2);
   
 }
}



export class Voiced_text extends Accessibility$Base {
 static readonly $tag = $Tags.Voiced_text;
 readonly $tag = $Tags.Voiced_text;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Voiced_text {
   return Voiced_text.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Voiced_text {
   const $tag = $d.ui8();
   if ($tag !== 3) {
     throw new Error(`Invalid tag ${$tag} for Accessibility.Voiced-text: expected 3`);
   }

   
   return new Voiced_text();
 }

 encode($e: _Encoder) {
   $e.ui32(17);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(3);
   
 }
}



export class Configurable_difficulty extends Accessibility$Base {
 static readonly $tag = $Tags.Configurable_difficulty;
 readonly $tag = $Tags.Configurable_difficulty;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Configurable_difficulty {
   return Configurable_difficulty.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Configurable_difficulty {
   const $tag = $d.ui8();
   if ($tag !== 4) {
     throw new Error(`Invalid tag ${$tag} for Accessibility.Configurable-difficulty: expected 4`);
   }

   
   return new Configurable_difficulty();
 }

 encode($e: _Encoder) {
   $e.ui32(17);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(4);
   
 }
}



export class Skippable_content extends Accessibility$Base {
 static readonly $tag = $Tags.Skippable_content;
 readonly $tag = $Tags.Skippable_content;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Skippable_content {
   return Skippable_content.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Skippable_content {
   const $tag = $d.ui8();
   if ($tag !== 5) {
     throw new Error(`Invalid tag ${$tag} for Accessibility.Skippable-content: expected 5`);
   }

   
   return new Skippable_content();
 }

 encode($e: _Encoder) {
   $e.ui32(17);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(5);
   
 }
}

}



export type Booklet_expr = Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class;

export abstract class Booklet_expr$Base {
 static decode($d: _Decoder): Booklet_expr {
   const $tag = $d.ui32();
   if ($tag !== 18) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr: expected 18`);
   }
   return Booklet_expr$Base.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Booklet_expr {
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

export namespace Booklet_expr {
 export const enum $Tags {
   BE_text,BE_image,BE_bold,BE_italic,BE_title,BE_subtitle,BE_subtitle2,BE_font,BE_color,BE_background,BE_columns,BE_fixed,BE_row,BE_column,BE_stack,BE_table,BE_class
 }

 
export class BE_text extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_text;
 readonly $tag = $Tags.BE_text;

 constructor(readonly value: string) {
   super();
 }

 static decode($d: _Decoder): BE_text {
   return BE_text.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_text {
   const $tag = $d.ui8();
   if ($tag !== 0) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-text: expected 0`);
   }

   const value = $d.text();
   return new BE_text(value);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(0);
   $e.text(this.value);
 }
}



export class BE_image extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_image;
 readonly $tag = $Tags.BE_image;

 constructor(readonly path: string) {
   super();
 }

 static decode($d: _Decoder): BE_image {
   return BE_image.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_image {
   const $tag = $d.ui8();
   if ($tag !== 1) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-image: expected 1`);
   }

   const path = $d.text();
   return new BE_image(path);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(1);
   $e.text(this.path);
 }
}



export class BE_bold extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_bold;
 readonly $tag = $Tags.BE_bold;

 constructor(readonly value: (Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class)) {
   super();
 }

 static decode($d: _Decoder): BE_bold {
   return BE_bold.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_bold {
   const $tag = $d.ui8();
   if ($tag !== 2) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-bold: expected 2`);
   }

   const value = Booklet_expr$Base.$do_decode($d);
   return new BE_bold(value);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(2);
   (this.value).$do_encode($e);
 }
}



export class BE_italic extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_italic;
 readonly $tag = $Tags.BE_italic;

 constructor(readonly value: (Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class)) {
   super();
 }

 static decode($d: _Decoder): BE_italic {
   return BE_italic.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_italic {
   const $tag = $d.ui8();
   if ($tag !== 3) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-italic: expected 3`);
   }

   const value = Booklet_expr$Base.$do_decode($d);
   return new BE_italic(value);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(3);
   (this.value).$do_encode($e);
 }
}



export class BE_title extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_title;
 readonly $tag = $Tags.BE_title;

 constructor(readonly value: (Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class)) {
   super();
 }

 static decode($d: _Decoder): BE_title {
   return BE_title.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_title {
   const $tag = $d.ui8();
   if ($tag !== 4) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-title: expected 4`);
   }

   const value = Booklet_expr$Base.$do_decode($d);
   return new BE_title(value);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(4);
   (this.value).$do_encode($e);
 }
}



export class BE_subtitle extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_subtitle;
 readonly $tag = $Tags.BE_subtitle;

 constructor(readonly value: (Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class)) {
   super();
 }

 static decode($d: _Decoder): BE_subtitle {
   return BE_subtitle.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_subtitle {
   const $tag = $d.ui8();
   if ($tag !== 5) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-subtitle: expected 5`);
   }

   const value = Booklet_expr$Base.$do_decode($d);
   return new BE_subtitle(value);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(5);
   (this.value).$do_encode($e);
 }
}



export class BE_subtitle2 extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_subtitle2;
 readonly $tag = $Tags.BE_subtitle2;

 constructor(readonly value: (Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class)) {
   super();
 }

 static decode($d: _Decoder): BE_subtitle2 {
   return BE_subtitle2.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_subtitle2 {
   const $tag = $d.ui8();
   if ($tag !== 6) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-subtitle2: expected 6`);
   }

   const value = Booklet_expr$Base.$do_decode($d);
   return new BE_subtitle2(value);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(6);
   (this.value).$do_encode($e);
 }
}



export class BE_font extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_font;
 readonly $tag = $Tags.BE_font;

 constructor(readonly family: string, readonly size: UInt32, readonly value: (Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class)) {
   super();
 }

 static decode($d: _Decoder): BE_font {
   return BE_font.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_font {
   const $tag = $d.ui8();
   if ($tag !== 7) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-font: expected 7`);
   }

   const family = $d.text();
const size = $d.ui32();
const value = Booklet_expr$Base.$do_decode($d);
   return new BE_font(family, size, value);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(7);
   $e.text(this.family);
$e.ui32(this.size);
(this.value).$do_encode($e);
 }
}



export class BE_color extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_color;
 readonly $tag = $Tags.BE_color;

 constructor(readonly r: UInt8, readonly g: UInt8, readonly b: UInt8, readonly value: (Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class)) {
   super();
 }

 static decode($d: _Decoder): BE_color {
   return BE_color.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_color {
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

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(8);
   $e.ui8(this.r);
$e.ui8(this.g);
$e.ui8(this.b);
(this.value).$do_encode($e);
 }
}



export class BE_background extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_background;
 readonly $tag = $Tags.BE_background;

 constructor(readonly r: UInt8, readonly g: UInt8, readonly b: UInt8, readonly value: (Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class)) {
   super();
 }

 static decode($d: _Decoder): BE_background {
   return BE_background.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_background {
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

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(9);
   $e.ui8(this.r);
$e.ui8(this.g);
$e.ui8(this.b);
(this.value).$do_encode($e);
 }
}



export class BE_columns extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_columns;
 readonly $tag = $Tags.BE_columns;

 constructor(readonly columns: UInt8, readonly value: (Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class)) {
   super();
 }

 static decode($d: _Decoder): BE_columns {
   return BE_columns.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_columns {
   const $tag = $d.ui8();
   if ($tag !== 10) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-columns: expected 10`);
   }

   const columns = $d.ui8();
const value = Booklet_expr$Base.$do_decode($d);
   return new BE_columns(columns, value);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(10);
   $e.ui8(this.columns);
(this.value).$do_encode($e);
 }
}



export class BE_fixed extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_fixed;
 readonly $tag = $Tags.BE_fixed;

 constructor(readonly x: UInt32, readonly y: UInt32, readonly value: (Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class)) {
   super();
 }

 static decode($d: _Decoder): BE_fixed {
   return BE_fixed.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_fixed {
   const $tag = $d.ui8();
   if ($tag !== 11) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-fixed: expected 11`);
   }

   const x = $d.ui32();
const y = $d.ui32();
const value = Booklet_expr$Base.$do_decode($d);
   return new BE_fixed(x, y, value);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(11);
   $e.ui32(this.x);
$e.ui32(this.y);
(this.value).$do_encode($e);
 }
}



export class BE_row extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_row;
 readonly $tag = $Tags.BE_row;

 constructor(readonly gap: UInt32, readonly align: (Booklet_align.Start | Booklet_align.Center | Booklet_align.End | Booklet_align.Justify | Booklet_align.Space_evenly), readonly value: (Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class)) {
   super();
 }

 static decode($d: _Decoder): BE_row {
   return BE_row.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_row {
   const $tag = $d.ui8();
   if ($tag !== 12) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-row: expected 12`);
   }

   const gap = $d.ui32();
const align = Booklet_align$Base.$do_decode($d);
const value = Booklet_expr$Base.$do_decode($d);
   return new BE_row(gap, align, value);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(12);
   $e.ui32(this.gap);
(this.align).$do_encode($e);
(this.value).$do_encode($e);
 }
}



export class BE_column extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_column;
 readonly $tag = $Tags.BE_column;

 constructor(readonly gap: UInt32, readonly align: (Booklet_align.Start | Booklet_align.Center | Booklet_align.End | Booklet_align.Justify | Booklet_align.Space_evenly), readonly value: (Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class)) {
   super();
 }

 static decode($d: _Decoder): BE_column {
   return BE_column.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_column {
   const $tag = $d.ui8();
   if ($tag !== 13) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-column: expected 13`);
   }

   const gap = $d.ui32();
const align = Booklet_align$Base.$do_decode($d);
const value = Booklet_expr$Base.$do_decode($d);
   return new BE_column(gap, align, value);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(13);
   $e.ui32(this.gap);
(this.align).$do_encode($e);
(this.value).$do_encode($e);
 }
}



export class BE_stack extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_stack;
 readonly $tag = $Tags.BE_stack;

 constructor(readonly values: ((Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class))[]) {
   super();
 }

 static decode($d: _Decoder): BE_stack {
   return BE_stack.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_stack {
   const $tag = $d.ui8();
   if ($tag !== 14) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-stack: expected 14`);
   }

   
const values = $d.array(() => {
 const item = Booklet_expr$Base.$do_decode($d);;
 return item;
});

   return new BE_stack(values);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(14);
   $e.array((this.values), ($e, v) => {
  (v).$do_encode($e);
});
 }
}



export class BE_table extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_table;
 readonly $tag = $Tags.BE_table;

 constructor(readonly headers: ((Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class))[], readonly rows: Booklet_row) {
   super();
 }

 static decode($d: _Decoder): BE_table {
   return BE_table.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_table {
   const $tag = $d.ui8();
   if ($tag !== 15) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-table: expected 15`);
   }

   
const headers = $d.array(() => {
 const item = Booklet_expr$Base.$do_decode($d);;
 return item;
});

const rows = Booklet_row.$do_decode($d);
   return new BE_table(headers, rows);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(15);
   $e.array((this.headers), ($e, v) => {
  (v).$do_encode($e);
});
(this.rows).$do_encode($e);
 }
}



export class BE_class extends Booklet_expr$Base {
 static readonly $tag = $Tags.BE_class;
 readonly $tag = $Tags.BE_class;

 constructor(readonly name: string, readonly value: (Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class)) {
   super();
 }

 static decode($d: _Decoder): BE_class {
   return BE_class.$do_decode($d);
 }

 static $do_decode($d: _Decoder): BE_class {
   const $tag = $d.ui8();
   if ($tag !== 16) {
     throw new Error(`Invalid tag ${$tag} for Booklet-expr.BE-class: expected 16`);
   }

   const name = $d.text();
const value = Booklet_expr$Base.$do_decode($d);
   return new BE_class(name, value);
 }

 encode($e: _Encoder) {
   $e.ui32(18);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(16);
   $e.text(this.name);
(this.value).$do_encode($e);
 }
}

}



export class Booklet_row {
 static readonly $tag = 19;
 readonly $tag = 19;

 constructor(readonly row_span: UInt32, readonly cells: (Booklet_cell)[]) {}

 static decode($d: _Decoder): Booklet_row {
   const $tag = $d.ui32();
   if ($tag !== 19) {
     throw new Error(`Invalid tag ${$tag} for Booklet-row: expected 19`);
   }
   return Booklet_row.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Booklet_row {
   const row_span = $d.ui32();

const cells = $d.array(() => {
 const item = Booklet_cell.$do_decode($d);;
 return item;
});

   return new Booklet_row(row_span, cells);
 }

 encode($e: _Encoder) {
   $e.ui32(19);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui32(this.row_span);
$e.array((this.cells), ($e, v) => {
  (v).$do_encode($e);
});
 }
}



export class Booklet_cell {
 static readonly $tag = 20;
 readonly $tag = 20;

 constructor(readonly cell_span: UInt32, readonly value: (Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class)) {}

 static decode($d: _Decoder): Booklet_cell {
   const $tag = $d.ui32();
   if ($tag !== 20) {
     throw new Error(`Invalid tag ${$tag} for Booklet-cell: expected 20`);
   }
   return Booklet_cell.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Booklet_cell {
   const cell_span = $d.ui32();
const value = Booklet_expr$Base.$do_decode($d);
   return new Booklet_cell(cell_span, value);
 }

 encode($e: _Encoder) {
   $e.ui32(20);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui32(this.cell_span);
(this.value).$do_encode($e);
 }
}



export type Booklet_align = Booklet_align.Start | Booklet_align.Center | Booklet_align.End | Booklet_align.Justify | Booklet_align.Space_evenly;

export abstract class Booklet_align$Base {
 static decode($d: _Decoder): Booklet_align {
   const $tag = $d.ui32();
   if ($tag !== 21) {
     throw new Error(`Invalid tag ${$tag} for Booklet-align: expected 21`);
   }
   return Booklet_align$Base.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Booklet_align {
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

export namespace Booklet_align {
 export const enum $Tags {
   Start,Center,End,Justify,Space_evenly
 }

 
export class Start extends Booklet_align$Base {
 static readonly $tag = $Tags.Start;
 readonly $tag = $Tags.Start;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Start {
   return Start.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Start {
   const $tag = $d.ui8();
   if ($tag !== 0) {
     throw new Error(`Invalid tag ${$tag} for Booklet-align.Start: expected 0`);
   }

   
   return new Start();
 }

 encode($e: _Encoder) {
   $e.ui32(21);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(0);
   
 }
}



export class Center extends Booklet_align$Base {
 static readonly $tag = $Tags.Center;
 readonly $tag = $Tags.Center;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Center {
   return Center.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Center {
   const $tag = $d.ui8();
   if ($tag !== 1) {
     throw new Error(`Invalid tag ${$tag} for Booklet-align.Center: expected 1`);
   }

   
   return new Center();
 }

 encode($e: _Encoder) {
   $e.ui32(21);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(1);
   
 }
}



export class End extends Booklet_align$Base {
 static readonly $tag = $Tags.End;
 readonly $tag = $Tags.End;

 constructor() {
   super();
 }

 static decode($d: _Decoder): End {
   return End.$do_decode($d);
 }

 static $do_decode($d: _Decoder): End {
   const $tag = $d.ui8();
   if ($tag !== 2) {
     throw new Error(`Invalid tag ${$tag} for Booklet-align.End: expected 2`);
   }

   
   return new End();
 }

 encode($e: _Encoder) {
   $e.ui32(21);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(2);
   
 }
}



export class Justify extends Booklet_align$Base {
 static readonly $tag = $Tags.Justify;
 readonly $tag = $Tags.Justify;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Justify {
   return Justify.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Justify {
   const $tag = $d.ui8();
   if ($tag !== 3) {
     throw new Error(`Invalid tag ${$tag} for Booklet-align.Justify: expected 3`);
   }

   
   return new Justify();
 }

 encode($e: _Encoder) {
   $e.ui32(21);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(3);
   
 }
}



export class Space_evenly extends Booklet_align$Base {
 static readonly $tag = $Tags.Space_evenly;
 readonly $tag = $Tags.Space_evenly;

 constructor() {
   super();
 }

 static decode($d: _Decoder): Space_evenly {
   return Space_evenly.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Space_evenly {
   const $tag = $d.ui8();
   if ($tag !== 4) {
     throw new Error(`Invalid tag ${$tag} for Booklet-align.Space-evenly: expected 4`);
   }

   
   return new Space_evenly();
 }

 encode($e: _Encoder) {
   $e.ui32(21);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(4);
   
 }
}

}



export type Platform = Platform.Web_archive;

export abstract class Platform$Base {
 static decode($d: _Decoder): Platform {
   const $tag = $d.ui32();
   if ($tag !== 22) {
     throw new Error(`Invalid tag ${$tag} for Platform: expected 22`);
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

 constructor(readonly html: string, readonly bridges: ((Bridge.Network_proxy | Bridge.Local_storage_proxy | Bridge.Input_proxy))[]) {
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
   $e.ui32(22);
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



export type Bridge = Bridge.Network_proxy | Bridge.Local_storage_proxy | Bridge.Input_proxy;

export abstract class Bridge$Base {
 static decode($d: _Decoder): Bridge {
   const $tag = $d.ui32();
   if ($tag !== 23) {
     throw new Error(`Invalid tag ${$tag} for Bridge: expected 23`);
   }
   return Bridge$Base.$do_decode($d);
 }

 static $do_decode($d: _Decoder): Bridge {
   const $tag = $d.peek((v) => v.getUint8(0));

   switch ($tag) {
     case 0: return Bridge.Network_proxy.decode($d);
case 1: return Bridge.Local_storage_proxy.decode($d);
case 2: return Bridge.Input_proxy.decode($d);

     default:
       throw new Error(`Unknown tag ${$tag} in union Bridge`);
   }
 }
}

export namespace Bridge {
 export const enum $Tags {
   Network_proxy,Local_storage_proxy,Input_proxy
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
   if ($tag !== 0) {
     throw new Error(`Invalid tag ${$tag} for Bridge.Network-proxy: expected 0`);
   }

   
   return new Network_proxy();
 }

 encode($e: _Encoder) {
   $e.ui32(23);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(0);
   
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
   if ($tag !== 1) {
     throw new Error(`Invalid tag ${$tag} for Bridge.Local-storage-proxy: expected 1`);
   }

   
   return new Local_storage_proxy();
 }

 encode($e: _Encoder) {
   $e.ui32(23);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(1);
   
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
   if ($tag !== 2) {
     throw new Error(`Invalid tag ${$tag} for Bridge.Input-proxy: expected 2`);
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
   $e.ui32(23);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(2);
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
   if ($tag !== 24) {
     throw new Error(`Invalid tag ${$tag} for VirtualKey: expected 24`);
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
   $e.ui32(24);
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
   $e.ui32(24);
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
   $e.ui32(24);
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
   $e.ui32(24);
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
   $e.ui32(24);
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
   $e.ui32(24);
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
   $e.ui32(24);
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
   $e.ui32(24);
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
   $e.ui32(24);
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
   $e.ui32(24);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.ui8(9);
   
 }
}

}



export class KeyboardKey {
 static readonly $tag = 25;
 readonly $tag = 25;

 constructor(readonly key: string, readonly code: string, readonly key_code: bigint) {}

 static decode($d: _Decoder): KeyboardKey {
   const $tag = $d.ui32();
   if ($tag !== 25) {
     throw new Error(`Invalid tag ${$tag} for KeyboardKey: expected 25`);
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
   $e.ui32(25);
   this.$do_encode($e);
 }

 $do_encode($e: _Encoder) {
   $e.text(this.key);
$e.text(this.code);
$e.integer(this.key_code);
 }
}


