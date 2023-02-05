void function() {
  let paused = false;

  // -- Things that need to be patched still
  Utils.isOptionValid = (name) => {
    return ["noaudio"].includes(name);
  }

  const key_mapping = {
    up: "up",
    right: "right",
    down: "down",
    left: "left",
    a: "cancel",
    b: "ok",
    menu: "menu",
    rtrigger: "shift"
  };

  window.addEventListener("message", (ev) => {
    switch (ev.data.type) {
      case "kate:paused": {
        for (const key of Object.values(key_mapping)) {
          Input._currentState[key] = false;
        }
        paused = true;
        break;
      }
      case "kate:unpaused": {
        paused = false;
        break;
      }

      case "kate:input-changed": {
        if (!paused) {
          const name = key_mapping[ev.data.key];
          if (name) {
            Input._currentState[name] = ev.data.is_down;
          }
        }
        break;
      }
    }
  })
}();