/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */
import test, { expect } from "playwright/test";
import { load } from "../unit";

test("@kernel resources can be taken and released", async ({ page }) => {
  await page.goto("/test.html");
  const kate = await load(page);
  const resources = await kate.evaluateHandle(
    (x) => new x.kernel.KateResources(document.querySelector("#kate-resources")!)
  );

  await expect(page.locator("#kate-resources")).toBeEmpty();

  await resources.evaluate((x) => x.take("screen-recording"));
  expect(await resources.evaluate((x) => x.is_taken("screen-recording"))).toBe(true);
  expect(await resources.evaluate((x) => x.is_taken("transient-storage"))).toBe(false);
  await expect(page.locator("#kate-resources .kate-resource-screen-recording")).toBeAttached();

  await resources.evaluate((x) => x.release("screen-recording"));
  expect(await resources.evaluate((x) => x.is_taken("screen-recording"))).toBe(false);
  await expect(page.locator("#kate-resources")).toBeEmpty();
});

test("@kernel resources are ref-counted", async ({ page }) => {
  await page.goto("/test.html");
  const kate = await load(page);
  const resources = await kate.evaluateHandle(
    (x) => new x.kernel.KateResources(document.querySelector("#kate-resources")!)
  );

  await expect(page.locator("#kate-resources")).toBeEmpty();
  await resources.evaluate((x) => x.take("screen-recording"));
  await expect(page.locator("#kate-resources .kate-resource-screen-recording")).toBeAttached();
  await resources.evaluate((x) => x.take("screen-recording"));
  await expect(page.locator("#kate-resources .kate-resource-screen-recording")).toBeAttached();
  await resources.evaluate((x) => x.release("screen-recording"));
  await expect(page.locator("#kate-resources .kate-resource-screen-recording")).toBeAttached();
  await resources.evaluate((x) => x.release("screen-recording"));
  await expect(page.locator("#kate-resources")).toBeEmpty();
  // releasing a non-acquired resource is a no-op
  await resources.evaluate((x) => x.release("screen-recording"));
  await expect(page.locator("#kate-resources")).toBeEmpty();
  // it can be taken immediately again
  await resources.evaluate((x) => x.take("screen-recording"));
  await expect(page.locator("#kate-resources .kate-resource-screen-recording")).toBeAttached();
});

test("@kernel resources has an idea of running processes", async ({ page }) => {
  await page.goto("/test.html");
  const kate = await load(page);
  const resources = await kate.evaluateHandle(
    (x) => new x.kernel.KateResources(document.querySelector("#kate-resources")!)
  );

  await expect(page.locator("#kate-resources")).toBeEmpty();
  await resources.evaluate((x) => x.set_running_process({ application_id: "kate", trusted: true }));
  await expect(page.locator("#kate-resources .kate-current-process-indicator")).toHaveAttribute(
    "data-trusted",
    ""
  );
  await expect(page.locator("#kate-resources .kate-current-process-indicator")).toHaveAttribute(
    "title",
    "kate"
  );
  await resources.evaluate((x) =>
    x.set_running_process({ application_id: "cartridge", trusted: false })
  );
  await expect(page.locator("#kate-resources .kate-current-process-indicator")).not.toHaveAttribute(
    "data-trusted",
    ""
  );
  await expect(page.locator("#kate-resources .kate-current-process-indicator")).toHaveAttribute(
    "title",
    "cartridge"
  );
  await resources.evaluate((x) => x.set_running_process(null));
  await expect(page.locator("#kate-resources")).toBeEmpty();
});
