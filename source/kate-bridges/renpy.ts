import {KateAPI} from "../kate-api";
declare var KateAPI: KateAPI;

void function() {
  let paused = false;
  const {events} = KateAPI;
  const add_event_listener = window.addEventListener;
  const key_mapping: {[key: string]: [string, string, number]} = {
    up: ["ArrowUp", "ArrowUp", 38],
    right: ["ArrowRight", "ArrowRight", 39],
    down: ["ArrowDown", "ArrowDown", 40],
    left: ["ArrowLeft", "ArrowLeft", 37],
    x: ["Escape", "Escape", 27],
    o: ["Enter", "Enter", 13],
    ltrigger: ['PageUp', 'PageUp', 33],
    rtrigger: ['PageDown', 'PageDown', 34]
  }

  const down_listeners: ((_: KeyboardEvent) => void)[] = [];
  const up_listeners: ((_: KeyboardEvent) => void)[] = [];

  events.input_state_changed.listen(({ key: kate_key, is_down }) => {
    if (!paused) {
      const data = key_mapping[kate_key];
      if (data) {
        const listeners = is_down ? down_listeners : up_listeners;
        const type = is_down ? "keydown" : "keyup";
        const [key, code, keyCode] = data;
        const key_ev = new KeyboardEvent(type, {key, code, keyCode});
        for (const fn of listeners) {
          fn.call(document, key_ev);
        }
      }
    }
  });

  events.paused.listen(state => {
    paused = state;
  });
  
  function listen(this: any, type: string, listener: EventListener, options: any) {
    if (type === "keydown") {
      down_listeners.push(listener);
    } else if (type === "keyup") {
      up_listeners.push(listener);
    } else {
      add_event_listener.call(this, type, listener, options);
    }
  };
  (window as any).addEventListener = listen;
  (document as any).addEventListener = listen;
}();