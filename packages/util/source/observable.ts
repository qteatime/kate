/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EventStream } from "./events";

type ObservableValue<T> = T extends Observable<infer A> ? A : never;

export class Observable<A> {
  readonly stream = new EventStream<A>();

  constructor(private _value: A, private _on_disponse: () => void = () => {}) {}

  static from<T>(value: T) {
    if (value instanceof Observable) {
      return value;
    } else {
      return new Observable(value);
    }
  }

  static from_stream<T>(stream: EventStream<T>, initial: T) {
    let subscriber: (_: T) => void;
    const observable = new Observable(initial, () => {
      stream.remove(subscriber);
    });
    subscriber = (value: T) => {
      observable.value = value;
    };
    stream.listen(subscriber);
    return observable;
  }

  static is<T>(x: any): x is Observable<T> {
    if (x instanceof Observable) {
      return true;
    } else {
      return false;
    }
  }

  get value() {
    return this._value;
  }

  set value(value: A) {
    this._value = value;
    this.stream.emit(value);
  }

  dispose() {
    this.stream.dispose();
    this._on_disponse?.();
  }

  map<B>(fn: (_: A) => B) {
    const result = new Observable(fn(this.value));
    const handler = this.stream.listen((value) => {
      result.value = fn(value);
    });
    result.dispose = () => {
      this.stream.remove(handler);
    };
    return result;
  }

  filter(fn: (_: A) => boolean, initial_value: A) {
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

  fold<B>(fn: (acc: B, value: A) => B, initial: B) {
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

  zip_with<B, C>(
    that: Observable<B>,
    combine: (left: A, right: B) => C
  ): Observable<C> {
    const result = new Observable<C>(combine(this.value, that.value));
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

  zip_with2<B, C, D>(
    b: Observable<B>,
    c: Observable<C>,
    combine: (a: A, b: B, c: C) => D
  ) {
    return this.zip_with(b, (va, vb) => c.map((vc) => combine(va, vb, vc)));
  }

  zip_with3<B, C, D, E>(
    b: Observable<B>,
    c: Observable<C>,
    d: Observable<D>,
    combine: (a: A, b: B, c: C, d: D) => E
  ) {
    return this.zip_with2(b, c, (va, vb, vc) =>
      d.map((vd) => combine(va, vb, vc, vd))
    );
  }

  static zip_with<R, T extends { [key: string]: Observable<any> }>(
    items: T,
    combine: (_: { [K in keyof T]: ObservableValue<T[K]> }) => R
  ) {
    const apply = () => {
      const a = Object.entries(items);
      const b = a.map(([k, v]) => [k, v.value]);
      const c = Object.fromEntries(b);
      return combine(c);
    };
    const result = new Observable<R>(apply());
    const handlers = Object.entries(items).map(([_, v]) => {
      return [
        v,
        v.stream.listen(() => {
          result.value = apply();
        }),
      ] as const;
    });
    result.dispose = () => {
      for (const [observable, handler] of handlers) {
        observable.stream.remove(handler);
      }
    };
    return result;
  }
}
