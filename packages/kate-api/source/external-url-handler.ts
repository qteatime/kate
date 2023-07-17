void (function () {
  Object.defineProperty(window, "open", {
    configurable: true,
    value: (url: string) => {
      KateAPI.browser.open(new URL(url));
    },
  });
})();
