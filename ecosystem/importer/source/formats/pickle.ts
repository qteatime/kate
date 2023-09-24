/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { unreachable } from "../deps/utils";

// Note: This is based on the docs in cpython's `pickletools.py`.
//       I couldn't find a proper specification for the format, so this is
//       the closest to that I guess? Unfortunately it isn't very clear on
//       the specifics of integer encoding so I also had to look at the
//       _pickle.c implementation of that.
const enum Opcode {
  // Integers
  INT = 0x49, // "I", decimalNL !!TODO :: [] -> [x]
  BININT = 0x4a, // "J", int32LE :: [] -> [x]
  BININT1 = 0x4b, // "K", uint8 :: [] -> [x]
  BININT2 = 0x4d, // "M", uint16LE :: [] -> [x]
  LONG = 0x4c, // "L", decimalNL long !!TODO :: [] -> [x]
  LONG1 = 0x8a, // size:uint8 * uint8... :: [] -> [x]
  LONG4 = 0x8b, // size:int32LE * uint8... :: [] -> [x]

  // Strings
  STRING = 0x53, // "S", stringNL !!TODO :: [] -> [x]
  BINSTRING = 0x54, // "T", length: int32LE * uint8... :: [] -> [x]
  SHORT_BINSTRING = 0x55, // "U", length: uint8 * uint8... :: [] -> [x]

  // Raw bytes
  BINBYTES = 0x42, // "B", length: uint32LE * uint8... :: [] -> [x]
  SHORT_BINBYTES = 0x43, // "C", length: uint8 * uint8... :: [] -> [x]
  BINBYTES8 = 0x8e, // length: uint64 * uint8... !!TODO :: [] -> [x]
  BYTEARRAY8 = 0x96, // length: uint64 * uint8... !!TODO :: [] -> [x]

  // Out-of-band data
  NEXT_BUFFER = 0x97, // TODO
  READONLY_BUFFER = 0x98, // TODO

  // Basic scalars
  NONE = 0x4e, // "N", :: [] -> [x]
  NEWTRUE = 0x88, // :: [] -> [x]
  NEWFALSE = 0x89, // :: [] -> [x]

  // Unicode strings
  UNICODE = 0x56, // "V", unicodeStringNL !!TODO :: [] -> [x]
  SHORT_BINUNICODE = 0x8c, // length: int8LE * uint8... :: [] -> [x]
  BINUNICODE = 0x58, // "X", length: uint32LE * uint8... :: [] -> [x]
  BINUNICODE8 = 0x8d, // length: uint64LE * uint8 !!TODO :: [] -> [x]

  // Floating points
  FLOAT = 0x46, // "F", floatNL !!TODO :: [] -> [x]
  BINFLOAT = 0x47, // "G", float64 :: [] -> [x]

  // Lists
  EMPTY_LIST = 0x5d, // "]", :: [] -> [list]
  APPEND = 0x61, // "a", :: [list, x] -> [list ++ x]
  APPENDS = 0x65, // "e", :: [list, mark, x...] -> [list ++ ...x]
  LIST = 0x6c, // "l", :: [mark, x...] -> [list ++ ...x]

  // Tuples
  EMPTY_TUPLE = 0x29, // ")", :: [] -> [()]
  TUPLE = 0x74, // "t", :: [mark, x...] -> [(...x)]
  TUPLE1 = 0x85, // :: [x] -> [(x)]
  TUPLE2 = 0x86, // :: [x, y] -> [(x, y)]
  TUPLE3 = 0x87, // :: [x, y, z] -> [(x, y, z)]

  // Dicts
  EMPTY_DICT = 0x7d, // "}", :: [] -> [{}]
  DICT = 0x64, // "d", :: [mark, k v...] -> [{k: v, ...}]

  // Sets
  SETITEM = 0x73, // "s", :: [{}, k, v] -> [{k: v}]
  SETITEMS = 0x75, // "u", :: [{}, mark, k v...] -> [{k: v, ...}]
  EMPTY_SET = 0x8f, // :: [] -> [#{}]
  ADDITEMS = 0x90, // :: [#{}, mark, x...] -> [#{...x}]
  FROZENSET = 0x91, // :: [mark, x...] -> [#{...x}]

  // Stack manipulation
  POP = 0x30, // "0", :: [x] -> []
  DUP = 0x32, // "2", :: [x] -> [x, x]
  MARK = 0x28, // "(", :: [] -> [mark]
  POP_MARK = 0x31, // "1", :: [mark, x...] -> []

  // Memo manipulation
  GET = 0x67, // "g", decimalNL !!TODO :: <n: x> [] -> [x]
  BINGET = 0x68, // "h", uint8 :: <n: x> [] -> [x]
  LONG_BINGET = 0x6a, // "j", uint32 :: <n: x> [] -> [x]
  PUT = 0x70, // "p", decimalNL !!TODO :: [x] -> <n: x> [x]
  BINPUT = 0x71, // "q", uint8 :: [x] -> <n: x> [x]
  LONG_BINPUT = 0x72, // "r", uint32 :: [x] -> <n: x> [x]
  MEMOIZE = 0x94, // :: [x] -> <n: x> [x] --- where n is the next memo position

  // Access extensions :: hopefully not needed here
  EXT1 = 0x82, // uint8 !!TODO :: [] -> [x]
  EXT2 = 0x83, // uint16 !! TODO :: [] -> [x]
  EXT4 = 0x84, // uint32 !! TODO :: [] -> [x]

  // Python-specific object serialisation :: uh... yeah
  GLOBAL = 0x63, // "c", module StrNL, class StrNL !!TODO :: [] -> [class]
  STACK_GLOBAL = 0x93, // !! TODO :: [moduleSTR, classSTR] -> [class]
  REDUCE = 0x52, // "R", I, too, despair of having to implement this
  BUILD = 0x62, // "b",
  INST = 0x69, // "i",
  OBJ = 0x6f, // "o",
  NEWOBJ = 0x81,
  NEWOBJ_EX = 0x92,

  // Machine control
  PROTO = 0x80, // uint8 :: [] -> []
  STOP = 0x2e, // "."
  FRAME = 0x95, // uint64 (length of the buffer) :: [] -> []

  // Persistent ids
  PERSID = 0x50, // "P", stringNL !!TODO :: [] -> [x]
  BINPERSID = 0x51, // "Q", !!TODO :: [id] -> [x]
}

const enum Result {
  CONTINUE,
  HALT,
}

const LE = true;

class MarkObject {}
const mark = new MarkObject();

class Memo {
  private items = new Map<number, unknown>();

  private assert_bounds(index: number) {
    if (index < 0) {
      throw new Error(`Out of bounds`);
    }
  }

  set(index: number, value: unknown) {
    this.assert_bounds(index);
    this.items.set(index, value);
  }

  get(index: number) {
    this.assert_bounds(index);
    if (!this.items.has(index)) {
      throw new Error(`Undefined memo entry ${index}`);
    }
    return this.items.get(index);
  }

  push(value: unknown) {
    this.set(this.items.size, value);
  }
}

class Frame {
  private stack: unknown[] = [];
  readonly memo = new Memo();

  constructor() {}

  assert_empty() {
    if (this.stack.length !== 0) {
      throw new Error(`Expected an empty frame stack`);
    }
  }

  push(value: unknown) {
    this.stack.push(value);
  }

  pop_any() {
    if (this.stack.length === 0) {
      throw new Error(`Frame.pop() on an empty stack`);
    }
    return this.stack.pop();
  }

  pop() {
    return assert_not_mark(this.pop_any());
  }

  peek() {
    if (this.stack.length === 0) {
      throw new Error(`Frame.peek() on an empty stack`);
    }
    return assert_not_mark(this.stack[this.stack.length - 1]);
  }

  slice_to_mark() {
    let result = [];
    let current = this.pop_any();
    while (current !== mark) {
      result.push(current);
      current = this.pop_any();
    }
    return result.reverse();
  }
}

class Program {
  private _offset: number = 0;
  private view: DataView;
  constructor(private data: Uint8Array) {
    this.view = new DataView(data.buffer);
  }

  private assert_not_eof(offset: number) {
    if (this.is_eof(offset)) {
      throw new Error(`Offset out of bounds @ ${offset}.`);
    }
  }

  is_eof(offset: number) {
    return this._offset + offset >= this.view.byteLength;
  }

  get offset() {
    return this._offset;
  }

  get opcode(): Opcode {
    this.assert_not_eof(0);
    return this.view.getUint8(this._offset);
  }

  skip(offset: number) {
    this._offset += offset;
  }

  read_uint8(offset: number) {
    this.assert_not_eof(offset);
    return this.view.getUint8(this._offset + offset);
  }

  read_uint16(offset: number, le: boolean = false) {
    this.assert_not_eof(offset);
    return this.view.getUint16(this._offset + offset, le);
  }

  read_uint32(offset: number, le: boolean = false) {
    this.assert_not_eof(offset);
    return this.view.getUint32(this._offset + offset, le);
  }

  read_int8(offset: number) {
    this.assert_not_eof(offset);
    return this.view.getInt8(this._offset + offset);
  }

  read_int32(offset: number, le: boolean = false) {
    this.assert_not_eof(offset);
    return this.view.getInt32(this._offset + offset, le);
  }

  read_float64(offset: number, le: boolean = false) {
    this.assert_not_eof(offset);
    return this.view.getFloat64(this._offset + offset, le);
  }

  read_bytes(offset: number, length: number) {
    this.assert_not_eof(offset + length);
    return this.data.slice(
      this._offset + offset,
      this._offset + offset + length
    );
  }

  maybe_read_bytes(offset: number, length: number) {
    return this.data.slice(
      this._offset + offset,
      this._offset + offset + length
    );
  }
}

export function unpickle(data: Uint8Array) {
  const frame = new Frame();
  const program = new Program(data);
  while (true) {
    const result = step(frame, program);
    switch (result) {
      case Result.CONTINUE: {
        continue;
      }

      case Result.HALT: {
        const value = frame.pop();
        frame.assert_empty();
        return value;
      }

      default:
        throw unreachable(result, "VM result");
    }
  }
}

function step(frame: Frame, program: Program) {
  const opcode = program.opcode;

  switch (opcode) {
    case Opcode.INT: {
      throw new Error(`Unsupported INT`);
    }

    case Opcode.BININT: {
      const data = program.read_int32(1, LE);
      frame.push(data);
      program.skip(1 + 4);
      return Result.CONTINUE;
    }

    case Opcode.BININT1: {
      const data = program.read_uint8(1);
      frame.push(data);
      program.skip(1 + 1);
      return Result.CONTINUE;
    }

    case Opcode.BININT2: {
      const data = program.read_uint16(1, LE);
      frame.push(data);
      program.skip(1 + 2);
      return Result.CONTINUE;
    }

    case Opcode.LONG: {
      throw new Error(`Unsupported LONG`);
    }

    case Opcode.LONG1: {
      const size = program.read_uint8(1);
      const data = bytes_to_bigint(program.read_bytes(2, size));
      frame.push(data);
      program.skip(1 + 1 + size);
      return Result.CONTINUE;
    }

    case Opcode.LONG4: {
      const size = program.read_int32(1, LE);
      const data = bytes_to_bigint(program.read_bytes(2, size));
      frame.push(data);
      program.skip(1 + 4 + size);
      return Result.CONTINUE;
    }

    case Opcode.STRING: {
      throw new Error(`Unsupported STRING`);
    }

    case Opcode.BINSTRING: {
      const length = program.read_int32(1, LE);
      const bytes = program.read_bytes(5, length);
      const decoder = new TextDecoder();
      frame.push(decoder.decode(bytes));
      program.skip(1 + 4 + length);
      return Result.CONTINUE;
    }

    case Opcode.SHORT_BINSTRING: {
      const length = program.read_uint8(1);
      const bytes = program.read_bytes(2, length);
      const decoder = new TextDecoder();
      frame.push(decoder.decode(bytes));
      program.skip(1 + 1 + length);
      return Result.CONTINUE;
    }

    case Opcode.BINBYTES: {
      const length = program.read_uint32(1, LE);
      const bytes = program.read_bytes(5, length);
      frame.push(bytes);
      program.skip(1 + 4 + length);
      return Result.CONTINUE;
    }

    case Opcode.SHORT_BINBYTES: {
      const length = program.read_uint8(1);
      const bytes = program.read_bytes(2, length);
      frame.push(bytes);
      program.skip(1 + 1 + length);
      return Result.CONTINUE;
    }

    case Opcode.BINBYTES8: {
      throw new Error(`Unsupported BINBYTES8`);
    }

    case Opcode.BYTEARRAY8: {
      throw new Error(`Unsupported BYTEARRAY8`);
    }

    case Opcode.NEXT_BUFFER: {
      throw new Error(`Unsupported NEXT_BUFFER`);
    }

    case Opcode.READONLY_BUFFER: {
      throw new Error(`Unsupported READONLY_BUFFER`);
    }

    case Opcode.NONE: {
      frame.push(null);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.NEWTRUE: {
      frame.push(true);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.NEWFALSE: {
      frame.push(false);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.UNICODE: {
      throw new Error(`Unsupported UNICODE`);
    }

    case Opcode.BINUNICODE: {
      const length = program.read_uint32(1, LE);
      const bytes = program.read_bytes(5, length);
      const decoder = new TextDecoder();
      frame.push(decoder.decode(bytes));
      program.skip(1 + 4 + length);
      return Result.CONTINUE;
    }

    case Opcode.SHORT_BINUNICODE: {
      const length = program.read_int8(1);
      if (length < 0) {
        throw new Error(`Invalid SHORT_BINUNICODE length: ${length}`);
      }
      const bytes = program.read_bytes(2, length);
      const decoder = new TextDecoder();
      frame.push(decoder.decode(bytes));
      program.skip(1 + 1 + length);
      return Result.CONTINUE;
    }

    case Opcode.BINUNICODE8: {
      throw new Error(`Unsupported BINUNICODE8`);
    }

    case Opcode.FLOAT: {
      throw new Error(`Unsupported FLOAT`);
    }

    case Opcode.BINFLOAT: {
      const data = program.read_float64(1);
      frame.push(data);
      program.skip(1 + 8);
      return Result.CONTINUE;
    }

    case Opcode.EMPTY_LIST: {
      frame.push([]);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.APPEND: {
      const object = frame.pop();
      const list = assert_list(frame.pop());
      list.push(object);
      frame.push(list);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.APPENDS: {
      const objects = frame.slice_to_mark();
      const list = assert_list(frame.pop());
      list.push(...objects);
      frame.push(list);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.LIST: {
      const objects = frame.slice_to_mark();
      frame.push(objects);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.EMPTY_TUPLE: {
      frame.push([]);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.TUPLE: {
      const objects = frame.slice_to_mark();
      frame.push(objects);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.TUPLE1: {
      const x = frame.pop();
      frame.push([x]);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.TUPLE2: {
      const y = frame.pop();
      const x = frame.pop();
      frame.push([x, y]);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.TUPLE3: {
      const z = frame.pop();
      const y = frame.pop();
      const x = frame.pop();
      frame.push([x, y, z]);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.EMPTY_DICT: {
      frame.push(new Map());
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.DICT: {
      const pairs = frame.slice_to_mark();
      const map = new Map();
      set_pairs(map, pairs);
      frame.push(map);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.SETITEM: {
      const value = frame.pop();
      const key = frame.pop();
      const map = assert_map(frame.pop());
      map.set(key, value);
      frame.push(map);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.SETITEMS: {
      const pairs = frame.slice_to_mark();
      const map = assert_map(frame.pop());
      set_pairs(map, pairs);
      frame.push(map);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.EMPTY_SET: {
      frame.push(new Set());
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.ADDITEMS: {
      const objects = frame.slice_to_mark();
      const set = assert_set(frame.pop());
      for (const x of objects) {
        set.add(x);
      }
      frame.push(set);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.FROZENSET: {
      const objects = frame.slice_to_mark();
      const set = new Set();
      for (const x of objects) {
        set.add(x);
      }
      Object.freeze(set);
      frame.push(set);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.POP: {
      frame.pop();
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.DUP: {
      frame.push(frame.peek());
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.MARK: {
      frame.push(mark);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.POP_MARK: {
      frame.slice_to_mark();
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.GET: {
      throw new Error(`Unsupported GET`);
    }

    case Opcode.BINGET: {
      const index = program.read_uint8(1);
      const value = frame.memo.get(index);
      frame.push(value);
      program.skip(1 + 1);
      return Result.CONTINUE;
    }

    case Opcode.LONG_BINGET: {
      const index = program.read_uint32(1);
      const value = frame.memo.get(index);
      frame.push(value);
      program.skip(1 + 4);
      return Result.CONTINUE;
    }

    case Opcode.PUT: {
      throw new Error(`Unsupported PUT`);
    }

    case Opcode.BINPUT: {
      const index = program.read_uint8(1);
      const value = frame.peek();
      frame.memo.set(index, value);
      program.skip(1 + 1);
      return Result.CONTINUE;
    }

    case Opcode.LONG_BINPUT: {
      const index = program.read_uint32(1);
      const value = frame.peek();
      frame.memo.set(index, value);
      program.skip(1 + 4);
      return Result.CONTINUE;
    }

    case Opcode.MEMOIZE: {
      const value = frame.peek();
      frame.memo.push(value);
      program.skip(1);
      return Result.CONTINUE;
    }

    case Opcode.EXT1:
    case Opcode.EXT2:
    case Opcode.EXT4: {
      throw new Error(`Unsupported: extensions ${opcode}`);
    }

    case Opcode.GLOBAL:
    case Opcode.STACK_GLOBAL:
    case Opcode.REDUCE:
    case Opcode.BUILD:
    case Opcode.INST:
    case Opcode.OBJ:
    case Opcode.NEWOBJ:
    case Opcode.NEWOBJ_EX: {
      throw new Error(`Unsupported: python-specific serialisation ${opcode}`);
    }

    case Opcode.PROTO: {
      const version = program.read_uint8(1);
      if (version < 1 || version > 5) {
        throw new Error(`Unsupported pickle version: ${version}`);
      }
      program.skip(1 + 1);
      return Result.CONTINUE;
    }

    case Opcode.STOP: {
      return Result.HALT;
    }

    case Opcode.FRAME: {
      program.skip(1 + 8);
      return Result.CONTINUE;
    }

    case Opcode.PERSID: {
      throw new Error(`Unsupported PERSID`);
    }

    case Opcode.BINPERSID: {
      throw new Error(`Unsupported BINPERSID`);
    }

    default:
      throw unreachable(
        opcode,
        `Unsupported opcode ${opcode} (at ${program.offset}`
      );
  }
}

function assert_list(x: unknown): unknown[] {
  if (Array.isArray(x)) {
    return x;
  } else {
    throw new Error(`Expected Array: ${typeof x}`);
  }
}

function assert_map(x: unknown): Map<unknown, unknown> {
  if (x instanceof Map) {
    return x;
  } else {
    throw new Error(`Expected Map: ${typeof x}`);
  }
}

function assert_set(x: unknown): Set<unknown> {
  if (x instanceof Set) {
    return x;
  } else {
    throw new Error(`Expected Set: ${typeof x}`);
  }
}

function assert_not_mark(x: unknown): unknown {
  if (x === mark) {
    throw new Error(`Unexpected STACK_MARK`);
  }
  return x;
}

function set_pairs(map: Map<unknown, unknown>, pairs: unknown[]) {
  if (pairs.length % 2 !== 0) {
    throw new Error(`Invalid DICT pairs`);
  }
  for (let i = 0; i < pairs.length; i += 2) {
    const key = pairs[i];
    const value = pairs[i + 1];
    map.set(key, value);
  }
  return map;
}

function bytes_to_bigint(bytes: Uint8Array) {
  const buffer = new Uint8Array(8);
  buffer.set(bytes, 0);
  const view = new DataView(buffer.buffer);
  var value = view.getBigInt64(0, true);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`Unsupported integer range`);
  }
  return Number(value);
}
