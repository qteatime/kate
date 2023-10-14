/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */
import test, { Page } from "playwright/test";
import { Kate, load } from "../../unit";
import { assert_match } from "../../../deps/utils";
import type { KateButton } from "../../../../packages/kate-core/source/kernel";

async function init(page: Page) {
  await page.goto("/test.html");
  await load(page);
  const kate = await page.evaluateHandle(() => (window as any).Kate as Kate);
  const source = await kate.evaluateHandle((x) => new x.kernel.KateVirtualInputSource());
  await source.evaluate((x) => x.setup(document.querySelector(".kate-case")!));
  const recording = await source.evaluateHandle((x) => x.on_button_changed.record());

  return { source, recording };
}

test("@kernel virtual buttons can be pressed", async ({ page }) => {
  const { source, recording } = await init(page);

  const buttons: { selector: string; id: KateButton }[] = [
    { selector: ".kc-berry", id: "berry" },
    { selector: ".kc-capture", id: "capture" },
    { selector: ".kc-ok", id: "o" },
    { selector: ".kc-cancel", id: "x" },
    { selector: ".kc-sparkle", id: "sparkle" },
    { selector: ".kc-menu", id: "menu" },
  ];

  for (const { selector, id } of buttons) {
    await recording.evaluate((x) => x.clear());
    await page.locator(selector).tap();
    await page.locator(selector).click();
    const changes = await recording.evaluate((x) => x.trace);
    assert_match(changes, [
      { button: id, is_pressed: true },
      { button: id, is_pressed: false },
      { button: id, is_pressed: true },
      { button: id, is_pressed: false },
    ]);
  }
});

test("@kernel virtual thumbstick can be moved", async ({ page }) => {
  const { source, recording } = await init(page);

  const thumb = await page.locator(".kc-thumb").boundingBox();
  const range = Number(await page.locator(".kc-thumb").getAttribute("data-range"));
  const center_x = thumb!.x + thumb!.width / 2;
  const center_y = thumb!.y + thumb!.height / 2;

  const directions = [
    { active: ["up"], x: 0, y: -1 },
    { active: ["up", "right"], x: 1, y: -1 },
    { active: ["right"], x: 1, y: 0 },
    { active: ["right", "down"], x: 1, y: 1 },
    { active: ["down"], x: 0, y: 1 },
    { active: ["left", "down"], x: -1, y: 1 },
    { active: ["left"], x: -1, y: 0 },
    { active: ["left", "up"], x: -1, y: -1 },
  ];

  for (const { active, x, y } of directions) {
    // Not enough movement to trigger a digital press
    await recording.evaluate((x) => x.clear());
    await page.mouse.move(center_x, center_y);
    await page.mouse.down();
    await page.mouse.move(center_x + (range / 3) * x, center_y - (range / 3) * y);
    const changes0 = await recording.evaluate((x) => x.trace);
    assert_match(
      changes0,
      [
        { button: "up", is_pressed: false },
        { button: "right", is_pressed: false },
        { button: "down", is_pressed: false },
        { button: "left", is_pressed: false },
      ],
      `not enough movement: ${active}`
    );

    // Enough movement to trigger a digital press
    await recording.evaluate((x) => x.clear());
    await page.mouse.move(center_x + range * x, center_y + range * y);
    const changes1 = await recording.evaluate((x) => x.trace);
    assert_match(
      changes1,
      [
        { button: "up", is_pressed: active.includes("up") },
        { button: "right", is_pressed: active.includes("right") },
        { button: "down", is_pressed: active.includes("down") },
        { button: "left", is_pressed: active.includes("left") },
      ],
      `enough movement: ${active}`
    );

    // Releasing should make it go back to its center position
    await recording.evaluate((x) => x.clear());
    await page.mouse.up();
    const changes2 = await recording.evaluate((x) => x.trace);
    assert_match(
      changes2,
      [
        { button: "up", is_pressed: false },
        { button: "right", is_pressed: false },
        { button: "down", is_pressed: false },
        { button: "left", is_pressed: false },
      ],
      "up"
    );
  }
});
