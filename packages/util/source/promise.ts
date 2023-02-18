export interface Deferred<A> {
  promise: Promise<A>;
  resolve: (_: A) => void;
  reject: (_: any) => void;
}

export function defer<A>() {
  const p: Deferred<A> = Object.create(null);
  p.promise = new Promise((resolve, reject) => {
    p.resolve = resolve;
    p.reject = reject;
  });
  return p;
}

export function sleep(ms: number) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}
