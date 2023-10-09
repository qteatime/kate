import { describe } from "../util";

describe("@kernel button-based input", ({ test, kate, assert_match }) => {
  const keys = [
    "up",
    "right",
    "down",
    "left",
    "o",
    "x",
    "sparkle",
    "berry",
    "menu",
    "capture",
    "ltrigger",
    "rtrigger",
  ] as const;

  const base_state = () => ({
    up: { pressed: false, count: 0 },
    right: { pressed: false, count: 0 },
    down: { pressed: false, count: 0 },
    left: { pressed: false, count: 0 },
    o: { pressed: false, count: 0 },
    x: { pressed: false, count: 0 },
    sparkle: { pressed: false, count: 0 },
    berry: { pressed: false, count: 0 },
    menu: { pressed: false, count: 0 },
    capture: { pressed: false, count: 0 },
    ltrigger: { pressed: false, count: 0 },
    rtrigger: { pressed: false, count: 0 },
  });

  test("Pressing buttons", () => {
    const buttons = new kate.kernel.KateButtons();
    const pattern = base_state();
    assert_match(buttons.state, pattern, "initial state");

    for (const key of keys) {
      buttons.update(key, true);
      pattern[key].pressed = true;
      pattern[key].count = 1;
      assert_match(buttons.state, pattern, `press ${key}`);
    }

    for (const key of keys) {
      buttons.update(key, false);
      pattern[key].pressed = false;
      pattern[key].count = -1;
      assert_match(buttons.state, pattern, `release ${key}`);
    }
  });

  test("Counting presses and changes on tick", () => {
    const buttons = new kate.kernel.KateButtons();
    const pattern = base_state();
    assert_match(buttons.state, pattern, "initial state");

    buttons.update("up", true);
    pattern.up = { pressed: true, count: 1 };
    assert_match(buttons.state, pattern, "press");

    assert_match(buttons.all_changed, [{ id: "up", pressed: true, count: 1 }], "press changes");

    buttons.tick();
    pattern.up = { pressed: true, count: 2 };
    assert_match(buttons.state, pattern, "tick 1 state");
    assert_match(buttons.all_changed, [{ id: "up", pressed: true, count: 2 }], "tick 1 changes");

    buttons.update("up", false);
    pattern.up = { pressed: false, count: -1 };
    assert_match(buttons.state, pattern, "release state");
    assert_match(buttons.all_changed, [{ id: "up", pressed: false, count: -1 }], "release changes");

    buttons.tick();
    pattern.up = { pressed: false, count: 0 };
    assert_match(buttons.state, pattern, "tick 2 state");
    assert_match(buttons.all_changed, [{ id: "up", pressed: false, count: 0 }], "tick 2 changes");

    buttons.tick();
    assert_match(buttons.state, pattern, "tick 3 state");
    assert_match(buttons.all_changed, [], "tick 3 changes");
  });

  test("Resetting all buttons", () => {
    const buttons = new kate.kernel.KateButtons();
    const pattern = base_state();
    assert_match(buttons.state, pattern, "initial state");

    for (const key of keys) {
      pattern[key] = { pressed: true, count: 1 };
      buttons.update(key, true);
    }
    assert_match(buttons.state, pattern, "all pressed");

    buttons.reset();
    assert_match(buttons.state, base_state(), "after reset");
    assert_match(
      buttons.all_changed.sort((a, b) => a.id.localeCompare(b.id)),
      keys
        .map((x) => ({ id: x, pressed: false, count: 0 }))
        .sort((a, b) => a.id.localeCompare(b.id)),
      "after reset changes"
    );
  });

  test("Resetting one button", () => {
    const buttons = new kate.kernel.KateButtons();
    const pattern = base_state();
    assert_match(buttons.state, pattern, "initial state");

    buttons.update("up", true);
    pattern.up = { pressed: true, count: 1 };
    assert_match(buttons.state, pattern, "after pressed");

    buttons.force_reset("up");
    assert_match(buttons.state, base_state(), "after reset");
    assert_match(
      buttons.all_changed,
      [{ id: "up", pressed: false, count: 0 }],
      "after reset changes"
    );
  });

  test("Ticks wrap frame counts around", () => {
    const buttons = new kate.kernel.KateButtons();

    buttons.update("up", true);
    buttons.state.up.count = 2 ** 32 - 2;
    buttons.tick();

    assert_match(buttons.state, { up: { pressed: true, count: 2 ** 32 - 1 } }, "first tick state");
    assert_match(
      buttons.all_changed,
      [{ id: "up", pressed: true, count: 2 ** 32 - 1 }],
      "first tick changes"
    );

    buttons.tick();
    assert_match(buttons.state, { up: { pressed: true, count: 2 } }, "second tick state");
    assert_match(
      buttons.all_changed,
      [{ id: "up", pressed: true, count: 2 }],
      "second tick changes"
    );
  });

  test("is_pressed()", () => {
    const buttons = new kate.kernel.KateButtons();
    assert_match(buttons.is_pressed("up"), false, "before press");
    buttons.update("up", true);
    assert_match(buttons.is_pressed("up"), true, "after press");
    buttons.tick();
    assert_match(buttons.is_pressed("up"), true, "after tick");
    buttons.update("up", false);
    assert_match(buttons.is_pressed("up"), false, "after release");
  });

  test("is_just_pressed()", () => {
    const buttons = new kate.kernel.KateButtons();
    assert_match(buttons.is_just_pressed("up"), false, "before press");
    buttons.update("up", true);
    assert_match(buttons.is_just_pressed("up"), true, "after press");
    buttons.tick();
    assert_match(buttons.is_just_pressed("up"), false, "after tick");
  });

  test("is_just_released()", () => {
    const buttons = new kate.kernel.KateButtons();
    assert_match(buttons.is_just_released("up"), false, "before release");
    buttons.update("up", true);
    assert_match(buttons.is_just_released("up"), false, "after press");
    buttons.update("up", false);
    assert_match(buttons.is_just_released("up"), true, "after release");
    buttons.tick();
    assert_match(buttons.is_just_released("up"), false, "after tick");
  });

  test("frames_pressed()", () => {
    const buttons = new kate.kernel.KateButtons();
    assert_match(buttons.frames_pressed("up"), 0);
    buttons.update("up", true);
    assert_match(buttons.frames_pressed("up"), 1);
    buttons.tick();
    assert_match(buttons.frames_pressed("up"), 2);
    buttons.update("up", false);
    assert_match(buttons.frames_pressed("up"), -1);
    buttons.tick();
    assert_match(buttons.frames_pressed("up"), 0, "after release tick");
  });
});
