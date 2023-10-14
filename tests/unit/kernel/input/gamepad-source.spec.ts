/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */
import type { GamepadMapping, KateButton } from "../../../../packages/kate-core/source/kernel";
import type { MockGamepad } from "../../../mocks/gamepad";
import { describe } from "../../unit";

describe("@kernel gamepad input source", ({ test, kate, assert_match, MockGamepad }) => {
  window.requestAnimationFrame = (() => {}) as any;
  const default_mapping: GamepadMapping[] = [
    {
      type: "button",
      index: 12,
      pressed: "up",
    },
    {
      type: "button",
      index: 15,
      pressed: "right",
    },
    {
      type: "button",
      index: 13,
      pressed: "down",
    },
    {
      type: "button",
      index: 14,
      pressed: "left",
    },
    {
      type: "button",
      index: 9,
      pressed: "berry",
    },
    {
      type: "button",
      index: 8,
      pressed: "capture",
    },
    {
      type: "button",
      index: 0,
      pressed: "x",
    },
    {
      type: "button",
      index: 1,
      pressed: "o",
    },
    {
      type: "button",
      index: 2,
      pressed: "sparkle",
    },
    {
      type: "button",
      index: 3,
      pressed: "menu",
    },
    {
      type: "button",
      index: 4,
      pressed: "ltrigger",
    },
    {
      type: "button",
      index: 5,
      pressed: "rtrigger",
    },
    {
      type: "axis",
      index: 0,
      negative: "left",
      positive: "right",
    },
    {
      type: "axis",
      index: 1,
      negative: "up",
      positive: "down",
    },
  ];

  function press(gp: MockGamepad, button: KateButton, value: boolean) {
    const mapping = default_mapping.find((x) => x.type === "button" && x.pressed === button);
    gp.buttons[mapping!.index].press(value);
    gp.tick();
  }

  test("Connected gamepad emits button changed events", () => {
    const source = new kate.kernel.KateGamepadInputSource();
    source.setup();
    const recording = source.on_button_changed.record();
    const gamepad = new MockGamepad("kate");
    source.remap(default_mapping);

    // no event before connection
    recording.clear();
    gamepad.buttons[0].press(true);
    gamepad.tick();
    source.update(gamepad.timestamp);
    assert_match(recording.trace, []);
    gamepad.buttons[0].press(false);

    // events after connection
    gamepad.connect(source);
    assert_match(source.resolve_primary()?.resolve_raw(), gamepad, "gamepad is connected");

    for (const button of default_mapping) {
      switch (button.type) {
        // pressing and releasing should result in a press and release event
        case "button": {
          recording.clear();
          source.reset();
          gamepad.buttons[button.index].press(true);
          gamepad.tick();
          source.update(gamepad.timestamp);
          assert_match(
            recording.trace,
            [{ button: button.pressed, is_pressed: true }],
            `press ${button.pressed}`
          );

          recording.clear();
          gamepad.buttons[button.index].press(false);
          gamepad.tick();
          source.update(gamepad.timestamp);
          assert_match(
            recording.trace,
            [{ button: button.pressed, is_pressed: false }],
            `release ${button.pressed}`
          );
          break;
        }

        // moving the axis to each extreme should result in two events,
        // but intermediary values should not trigger an event
        case "axis": {
          recording.clear();
          source.reset();
          gamepad.move_axis(button.index, 0);
          gamepad.tick();
          source.update(gamepad.timestamp);

          gamepad.move_axis(button.index, -0.3);
          gamepad.tick();
          source.update(gamepad.timestamp);

          gamepad.move_axis(button.index, -1);
          gamepad.tick();
          source.update(gamepad.timestamp);

          gamepad.move_axis(button.index, 0.3);
          gamepad.tick();
          source.update(gamepad.timestamp);

          gamepad.move_axis(button.index, 1);
          gamepad.tick();
          source.update(gamepad.timestamp);

          gamepad.move_axis(button.index, 0);
          gamepad.tick();
          source.update(gamepad.timestamp);

          assert_match(
            recording.trace,
            [
              // 0 to -1
              { button: button.negative!, is_pressed: true },
              // -1 to 0
              { button: button.negative!, is_pressed: false },
              // 0 to 1
              { button: button.positive!, is_pressed: true },
              // 1 to 0
              { button: button.positive!, is_pressed: false },
            ],
            `axis movement: ${button.negative} - ${button.positive}`
          );
          break;
        }
      }
    }
  });

  test("Only primary gamepad generates events", () => {
    const gp1 = new MockGamepad("gp1");
    const gp2 = new MockGamepad("gp2");

    const source = new kate.kernel.KateGamepadInputSource();
    source.setup();
    source.remap(default_mapping);
    const recording = source.on_button_changed.record();

    gp1.connect(source);
    gp2.connect(source);
    source.set_primary("gp2");

    press(gp1, "x", true);
    press(gp2, "o", true);
    source.update(Math.max(gp1.timestamp, gp2.timestamp));

    assert_match(recording.trace, [{ button: "o", is_pressed: true }]);
  });

  test("With no primary set, first gamepad generates events", () => {
    const gp1 = new MockGamepad("gp1");
    const gp2 = new MockGamepad("gp2");

    const source = new kate.kernel.KateGamepadInputSource();
    source.setup();
    source.remap(default_mapping);
    const recording = source.on_button_changed.record();

    gp1.connect(source);
    gp2.connect(source);
    source.set_primary(null);

    press(gp1, "x", true);
    press(gp2, "o", true);
    source.update(Math.max(gp1.timestamp, gp2.timestamp));

    assert_match(recording.trace, [{ button: "x", is_pressed: true }]);
  });

  test("Paused gamepads do not generate events", () => {
    const gp = new MockGamepad("kate");
    const source = new kate.kernel.KateGamepadInputSource();
    source.setup();
    source.remap(default_mapping);
    const recording = source.on_button_changed.record();
    gp.connect(source);

    press(gp, "o", true);
    source.update(gp.timestamp);
    press(gp, "o", false);
    source.update(gp.timestamp);

    source.pause();
    press(gp, "x", true);
    source.update(gp.timestamp);
    press(gp, "x", false);
    source.update(gp.timestamp);

    source.unpause();
    press(gp, "sparkle", true);
    source.update(gp.timestamp);
    press(gp, "sparkle", false);
    source.update(gp.timestamp);

    assert_match(recording.trace, [
      { button: "o", is_pressed: true },
      { button: "o", is_pressed: false },
      { button: "sparkle", is_pressed: true },
      { button: "sparkle", is_pressed: false },
    ]);
  });

  test("Pausing and remapping reset the gamepad input", () => {
    const gp = new MockGamepad("kate");
    const source = new kate.kernel.KateGamepadInputSource();
    source.setup();
    source.remap(default_mapping);
    const recording = source.on_button_changed.record();
    gp.connect(source);

    press(gp, "o", true);
    source.update(gp.timestamp);

    // all buttons unpressed in kate (still held in gamepad)
    source.pause();
    source.unpause();
    source.update(gp.timestamp);
    assert_match(
      recording.trace,
      [
        { button: "o", is_pressed: true },
        { button: "o", is_pressed: false },
      ],
      "pause"
    );
    recording.clear();

    press(gp, "o", false);
    press(gp, "x", true);
    source.update(gp.timestamp);

    // all buttons unpressed in kate (still held in gamepad)
    source.remap(default_mapping);
    source.update(gp.timestamp);

    assert_match(
      recording.trace,
      [
        { button: "x", is_pressed: true },
        { button: "x", is_pressed: false },
      ],
      "remap"
    );
  });

  test("Disconnected gamepads reset the input state", () => {
    const gp = new MockGamepad("kate");
    const source = new kate.kernel.KateGamepadInputSource();
    source.setup();
    source.remap(default_mapping);
    const recording = source.on_button_changed.record();
    gp.connect(source);

    press(gp, "o", true);
    source.update(gp.timestamp);
    gp.tick();
    gp.disconnect(source);
    source.update(gp.timestamp);

    assert_match(recording.trace, [
      { button: "o", is_pressed: true },
      { button: "o", is_pressed: false },
    ]);
  });
});
