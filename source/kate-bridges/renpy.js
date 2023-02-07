void function() {
  let paused = false;
  const add_event_listener = window.addEventListener;
  const key_mapping = {
    up: ["ArrowUp", "ArrowUp", 38],
    right: ["ArrowRight", "ArrowRight", 39],
    down: ["ArrowDown", "ArrowDown", 40],
    left: ["ArrowLeft", "ArrowLeft", 37],
    x: ["Escape", "Escape", 27],
    o: ["Enter", "Enter", 13],
    ltrigger: ['PageUp', 'PageUp', 33],
    rtrigger: ['PageDown', 'PageDown', 34]
  }

  const down_listeners = [];
  const up_listeners = [];
  
  window.addEventListener("message", (ev) => {
    switch (ev.data.type) {
      case "kate:paused": {
        paused = true;
        break;
      }

      case "kate:unpaused": {
        paused = false;
        break;
      }

      case "kate:input-changed": {
        if (!paused) {
          const data = key_mapping[ev.data.key];
          if (data) {
            const listeners = ev.data.is_down ? down_listeners : up_listeners;
            const type = ev.data.is_down ? "keydown" : "keyup";
            const [key, code, keyCode] = data;
            const key_ev = new KeyboardEvent(type, {key, code, keyCode});
            for (const fn of listeners) {
              fn.call(document, key_ev);
            }
          }
        }
        break;
      }
    }
  })
  
  function listen(type, listener, options) {
    if (type === "keydown") {
      down_listeners.push(listener);
    } else if (type === "keyup") {
      up_listeners.push(listener);
    } else {
      add_event_listener.call(this, type, listener, options);
    }
  };
  window.addEventListener = listen;
  document.addEventListener = listen;
}();