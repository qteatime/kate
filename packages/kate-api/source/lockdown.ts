const user_agent = "Kate";

Object.defineProperty(navigator, "userAgent", {
  value: user_agent,
  enumerable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: new Proxy(navigator, {
    has(target, key) {
      return key !== "serviceWorker" && key in target;
    },
    get(target, key) {
      return key === "serviceWorker" ? undefined : (target as any)[key];
    },
  }),
});
