/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export class EventStream<A> {
  private subscribers: ((_: A) => void)[] = [];
  private on_dispose = () => {};

  listen(fn: (_: A) => void) {
    this.remove(fn);
    this.subscribers.push(fn);
    return fn;
  }

  remove(fn: (_: A) => void) {
    this.subscribers = this.subscribers.filter((x) => x !== fn);
    return this;
  }

  once(fn: (_: A) => void) {
    const handler = this.listen((x) => {
      this.remove(handler);
      fn(x);
    });
    return handler;
  }

  emit(ev: A) {
    for (const fn of this.subscribers) {
      fn(ev);
    }
  }

  dispose() {
    this.on_dispose();
  }

  filter(fn: (_: A) => boolean) {
    const stream = new EventStream<A>();
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

  map<B>(fn: (_: A) => B) {
    const stream = new EventStream<B>();
    const subscriber = this.listen((ev) => {
      stream.emit(fn(ev));
    });
    stream.on_dispose = () => {
      this.remove(subscriber);
    };
    return stream;
  }

  record() {
    let trace: A[] = [];
    const subscriber = this.listen((ev) => trace.push(ev));
    const stream = this;

    return {
      get trace() {
        return trace.slice();
      },
      clear() {
        trace = [];
      },
      stop() {
        stream.remove(subscriber);
      },
    };
  }
}
