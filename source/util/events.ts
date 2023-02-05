export class EventStream<A> {
  private subscribers: ((_: A) => void)[] = [];

  listen(fn: (_: A) => void) {
    this.remove(fn);
    this.subscribers.push(fn);
    return this;
  }

  remove(fn: (_: A) => void) {
    this.subscribers = this.subscribers.filter(x => x !== fn);
    return this;
  }

  emit(ev: A) {
    for (const fn of this.subscribers) {
      fn(ev);
    }
  }
}