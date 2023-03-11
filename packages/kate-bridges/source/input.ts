// Handle keyboard input
declare var key_mapping: { [key: string]: [string, string, number] };

let paused = false;
const { events } = KateAPI;
const add_event_listener = window.addEventListener;

const down_listeners: ((_: KeyboardEvent) => void)[] = [];
const up_listeners: ((_: KeyboardEvent) => void)[] = [];
const down = new Set<KateTypes.InputKey>();

const on_key_update = ({
  key: kate_key,
  is_down,
}: {
  key: KateTypes.InputKey;
  is_down: boolean;
}) => {
  if (!paused) {
    const data = key_mapping[kate_key];
    if (data) {
      if (is_down) {
        down.add(kate_key);
      } else {
        down.delete(kate_key);
      }
      const listeners = is_down ? down_listeners : up_listeners;
      const type = is_down ? "keydown" : "keyup";
      const [key, code, keyCode] = data;
      const key_ev = new KeyboardEvent(type, { key, code, keyCode });
      for (const fn of listeners) {
        fn.call(document, key_ev);
      }
    }
  }
};

events.input_state_changed.listen(on_key_update);

events.paused.listen((state) => {
  if (state === true) {
    for (const key of down) {
      on_key_update({ key, is_down: false });
    }
  }
  paused = state;
});

function listen(
  this: any,
  type: string,
  listener: EventListener,
  options: any
) {
  if (type === "keydown") {
    down_listeners.push(listener);
  } else if (type === "keyup") {
    up_listeners.push(listener);
  } else if (type === "gamepadconnected" || type === "gamepaddisconnected") {
    // do nothing
  } else {
    add_event_listener.call(this, type, listener, options);
  }
}
(window as any).addEventListener = listen;
(document as any).addEventListener = listen;

// Disable gamepad input
Object.defineProperty(navigator, "getGamepads", {
  enumerable: false,
  configurable: false,
  value: () => [null, null, null, null],
});
