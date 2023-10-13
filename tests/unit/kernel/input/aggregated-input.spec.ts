import test, { Page } from "playwright/test";
import { Kate, load } from "../../unit";
import { MockGamepad, mock_gamepad } from "../../../mocks/gamepad";
import { assert_match } from "../../../deps/utils";

async function init(page: Page) {
  await page.goto("/test.html");
  await load(page);
  const kate = await page.evaluateHandle(() => (window as any).Kate as Kate);
  await mock_gamepad(page);
  await page.evaluate(() => {
    window.requestAnimationFrame = (() => {}) as any;
  });
  return kate;
}

test("@kernel aggregate inputs from all sources", async ({ page }) => {
  const kate = await init(page);
  const source = await kate.evaluateHandle((x) => new x.kernel.KateButtonInputAggregator());
  const MockGamepad = await kate.evaluateHandle((x) => (window as any).MockGamepad as MockGamepad);
  const state = await source.evaluateHandle((x) => x.on_state_changed.record());
  const press = await source.evaluateHandle((x) => x.on_button_pressed.record());
  const gp = await MockGamepad.evaluateHandle((x) => new x("kate"));
  await gp.evaluate((x, source) => x.connect(source.gamepad_source), source);

  await source.evaluate((x) => x.setup(document.querySelector(".kate-case")!));
  await source.evaluate((x) =>
    x.gamepad_source.remap([{ type: "button", index: 0, pressed: "x" }])
  );

  await page.keyboard.down("ArrowUp");
  await source.evaluate((x) => {
    x.update(1);
    x.tick();
  });
  await page.locator(".kc-sparkle").hover();
  await page.mouse.down();
  await source.evaluate((x) => {
    x.update(2);
    x.tick();
  });
  await page.mouse.up();
  await page.keyboard.up("ArrowUp");
  await source.evaluate((x) => {
    x.update(3);
    x.tick();
  });
  await gp.evaluate((x) => x.buttons[0].press(true));
  await gp.evaluate((x) => x.tick());
  await source.evaluate((x, gp) => x.gamepad_source.update(gp.timestamp), gp);
  await source.evaluate((x) => {
    x.update(4);
    x.tick();
  });

  assert_match(
    await state.evaluate((x) => x.trace),
    [
      { key: "up", is_down: true },
      { key: "sparkle", is_down: true },
      { key: "up", is_down: false },
      { key: "sparkle", is_down: false },
      { key: "x", is_down: true },
    ],
    "state"
  );

  assert_match(
    await press.evaluate((x) => x.trace),
    [
      { key: "up", is_repeat: false, is_long_press: false },
      { key: "sparkle", is_repeat: false, is_long_press: false },
      { key: "x", is_repeat: false, is_long_press: false },
    ],
    "presses"
  );
});
