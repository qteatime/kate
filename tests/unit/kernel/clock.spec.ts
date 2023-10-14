/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */
import test, { JSHandle } from "playwright/test";
import { load } from "../unit";
import type { KateConsoleClock } from "../../../packages/kate-core/source/kernel";
import { assert_match } from "../../deps/utils";

type TestClock = Omit<KateConsoleClock, "tick"> & { tick(time: number): void };

test("@kernel clock ticks at 30 fps", async ({ page }) => {
  await page.goto("/test.html");
  await page.evaluate((x) => {
    window.requestAnimationFrame = (() => {}) as any;
  });
  const kate = await load(page);
  const clock = await kate.evaluateHandle(
    (x) => new x.kernel.KateConsoleClock() as any as TestClock
  );
  const events = await clock.evaluateHandle((x) => x.on_tick.record());
  const one_frame = await clock.evaluate((x) => x.ONE_FRAME);

  await clock.evaluate((x) => x.tick(0)); // always ticks
  await clock.evaluate((x) => x.tick(x.ONE_FRAME / 2)); // does not tick (not enough elapsed time)
  await clock.evaluate((x) => x.tick(x.ONE_FRAME)); // ticks
  await clock.evaluate((x) => x.tick(x.ONE_FRAME)); // does not tick (0 elapsed time)
  await clock.evaluate((x) => x.tick(x.ONE_FRAME * 3)); // ticks once
  await clock.evaluate((x) => x.tick(x.ONE_FRAME)); // does not tick, shouldn't happen (monotonic)

  assert_match(await events.evaluate((x) => x.trace), [0, one_frame, one_frame * 3]);
});
