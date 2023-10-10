import { test } from "playwright/test";
import { type Kate, describe, load } from "../../unit";
import { assert_match } from "../../../deps/utils";

test("@kernel keyboard input source forwards key presses", async ({ page }) => {
  await load(page);
  const kate = await page.evaluateHandle(() => (window as any).Kate as Kate);
  const source = await kate.evaluateHandle((x) => new x.kernel.KateKeyboardInputSource());
  await source.evaluate((x) => x.setup());
  const recording = await source.evaluateHandle((x) => x.on_button_changed.record());
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ShiftLeft");
  await page.keyboard.press("KeyF");
  await page.keyboard.press("KeyQ");
  await page.keyboard.press("KeyX");
  await page.keyboard.press("KeyZ");
  await page.keyboard.press("KeyC");
  await page.keyboard.press("KeyA");
  await page.keyboard.press("KeyS");
  const changes = await recording.evaluate((x) => x.trace);
  assert_match(changes, [
    { button: "up", is_pressed: true },
    { button: "up", is_pressed: false },
    { button: "right", is_pressed: true },
    { button: "right", is_pressed: false },
    { button: "down", is_pressed: true },
    { button: "down", is_pressed: false },
    { button: "left", is_pressed: true },
    { button: "left", is_pressed: false },
    { button: "menu", is_pressed: true },
    { button: "menu", is_pressed: false },
    { button: "capture", is_pressed: true },
    { button: "capture", is_pressed: false },
    { button: "berry", is_pressed: true },
    { button: "berry", is_pressed: false },
    { button: "x", is_pressed: true },
    { button: "x", is_pressed: false },
    { button: "o", is_pressed: true },
    { button: "o", is_pressed: false },
    { button: "sparkle", is_pressed: true },
    { button: "sparkle", is_pressed: false },
    { button: "ltrigger", is_pressed: true },
    { button: "ltrigger", is_pressed: false },
    { button: "rtrigger", is_pressed: true },
    { button: "rtrigger", is_pressed: false },
  ]);
});

test("@kernel keyboard input source can be remapped", async ({ page }) => {
  await load(page);
  const kate = await page.evaluateHandle(() => (window as any).Kate as Kate);
  const source = await kate.evaluateHandle((x) => new x.kernel.KateKeyboardInputSource());
  await source.evaluate((x) => x.setup());
  const recording = await source.evaluateHandle((x) => x.on_button_changed.record());
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("w");
  await source.evaluate((x) =>
    x.remap([
      { key: "KeyW", button: "up" },
      { key: "ArrowUp", button: "down" },
    ])
  );
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("w");

  const changes = await recording.evaluate((x) => x.trace);
  assert_match(changes, [
    { button: "up", is_pressed: true },
    { button: "up", is_pressed: false },
    { button: "down", is_pressed: true },
    { button: "down", is_pressed: false },
    { button: "up", is_pressed: true },
    { button: "up", is_pressed: false },
  ]);
});
