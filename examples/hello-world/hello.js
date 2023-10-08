void (function () {
  const api = KateAPI;

  const message = document.querySelector("#message");
  const keys = ["up", "right", "down", "left", "menu", "capture", "x", "o", "ltrigger", "rtrigger"];

  let pressed = [];

  function update() {
    const pressing = keys.filter((x) => api.input.is_pressed(x));
    const pressing_message =
      pressing.length === 0
        ? "You're not pressing anything."
        : `You're pressing: ${pressing.join(", ")}.`;
    const pressed_message = pressed.length === 0 ? "" : `Last pressed: ${pressed.join(", ")}.`;

    message.textContent = `${pressing_message}\n\n${pressed_message}`;
  }

  api.timer.on_tick.listen(update);
  api.input.on_key_pressed.listen((ev) => {
    pressed = [ev.key, ...pressed].slice(0, 3);
  });
})();
