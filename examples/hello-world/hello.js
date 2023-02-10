void (function () {
  const api = KateAPI;

  const message = document.querySelector("#message");
  const keys = [
    "up",
    "right",
    "down",
    "left",
    "menu",
    "capture",
    "x",
    "o",
    "ltrigger",
    "rtrigger",
  ];

  function update() {
    const pressing = keys.filter((x) => api.input.is_down(x));
    if (pressing.length === 0) {
      message.textContent = "You're not pressing anything.";
    } else {
      message.textContent = `You're pressing: ${pressing.join(", ")}.`;
    }

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
})();
