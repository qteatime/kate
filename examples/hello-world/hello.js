void function() {

  const message = document.querySelector("#message");
  const pressing = new Set();

  window.addEventListener("message", (ev) => {
    switch (ev.data.type) {
      case "kate:input-changed": {
        if (ev.data.is_down) {
          pressing.add(ev.data.key);
        } else {
          pressing.delete(ev.data.key);
        }

        if (pressing.size === 0) {
          message.textContent = "You're not pressing anything.";
        } else {
          message.textContent = `You're pressing: ${[...pressing].join(", ")}.`;
        }
      }
    }
  });

}();