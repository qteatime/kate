/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EventStream } from "../../util/build/events";

export class Observable<A> {
  readonly stream = new EventStream<A>();

  constructor(private _value: A) {}

  get value() {
    return this._value;
  }

  set value(value: A) {
    this.stream.emit(value);
    this._value = value;
  }

  dispose() {}

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
}
