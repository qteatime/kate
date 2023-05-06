// This proxy translates Kate's pointer input API (mouse movement/click)
// into regular web pointer events. You provide an element that will
// receive the events.
declare var SELECTOR: string;

void (function () {
  const MAX_RETRIES = 60;

  function try_monitor(retries: number) {
    const element = document.querySelector(SELECTOR);
    if (element instanceof HTMLElement) {
      do_monitor(element);
    } else if (retries > 0) {
      setTimeout(() => try_monitor(retries - 1), 1_000);
    } else {
      console.warn(
        `[Kate] could not find '${SELECTOR}' to proxy pointer events in ${MAX_RETRIES} seconds. Giving up.`
      );
    }
  }

  function do_monitor(element: HTMLElement) {
    const pointer = KateAPI.pointer_input;
    const bounds = element.getBoundingClientRect();
    function translate_location(ev: KateTypes.PointerLocation) {
      return {
        x: ev.x - bounds.x,
        y: ev.y - bounds.y,
      };
    }
    function make_move_event(ev0: KateTypes.PointerLocation) {
      const ev = translate_location(ev0);
      return new MouseEvent("mousemove", {
        screenX: ev.x,
        screenY: ev.y,
        clientX: ev.x,
        clientY: ev.y,
      });
    }
    function make_press_event(
      type: "mousedown" | "mouseup" | "click" | "contextmenu",
      ev0: KateTypes.PointerClick
    ) {
      const loc = translate_location(ev0.location);
      return new MouseEvent(type, {
        screenX: loc.x,
        screenY: loc.y,
        clientX: loc.x,
        clientY: loc.y,
        button: ev0.button,
      });
    }

    pointer.on_moved.listen((ev0) => {
      const ev = make_move_event(ev0);
      element.dispatchEvent(ev);
    });

    pointer.on_down.listen((ev0) => {
      element.dispatchEvent(make_press_event("mousedown", ev0));
    });

    pointer.on_up.listen((ev0) => {
      element.dispatchEvent(make_press_event("mouseup", ev0));
    });

    pointer.on_clicked.listen((ev0) => {
      element.dispatchEvent(make_press_event("click", ev0));
    });

    pointer.on_alternate.listen((ev0) => {
      element.dispatchEvent(make_press_event("contextmenu", ev0));
    });
  }

  try_monitor(MAX_RETRIES);
})();
