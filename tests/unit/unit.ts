/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */
import { type Page, test, expect } from "@playwright/test";
import * as Path from "path";
import type { kernel, os } from "../../packages/kate-core/build";
import type { assert_match } from "../deps/utils";
import { MockGamepad, mock_gamepad } from "../mocks/gamepad";

export type Kate = {
  kernel: typeof kernel;
  os: typeof os;
};

type TestResult = {
  title: string;
  passed: boolean;
  reason?: string;
};

type Test = {
  title: string;
  action: () => Promise<void> | void;
};

export type DescribeContext = {
  test: (title: string, action: () => Promise<void> | void) => void;
  kate: Kate;
  MockGamepad: MockGamepad;
  assert_match: typeof assert_match;
};

export async function load(page: Page) {
  await page.addScriptTag({ path: Path.join(__dirname, "../../www/kate/kate-latest.js") });
  return await page.evaluateHandle(() => (window as any).Kate as Kate);
}

export function describe(title: string, setup: (ctx: DescribeContext) => void) {
  test(`${title}`, async ({ page }) => {
    await load(page);
    await mock_gamepad(page);
    await page.addScriptTag({ path: Path.join(__dirname, "test-assert.js") });

    const results = await page.evaluate(
      async ({ setup }) => {
        const tests: Test[] = [];
        const results: TestResult[] = [];

        const kate = (window as any).Kate;
        const assert_match = (window as any).Assert.assert_match;
        const MockGamepad = (window as any).MockGamepad;
        const test: DescribeContext["test"] = (title, action) => {
          tests.push({ title, action });
        };
        console.log("mock: ", MockGamepad);

        eval(setup)({ test, kate, assert_match, MockGamepad });

        for (const unit of tests) {
          console.log("Running", unit.title);
          try {
            MockGamepad.reset_slots();
            await unit.action();
            results.push({ title: unit.title, passed: true });
          } catch (e) {
            console.error("==> Error:", e);
            results.push({ title: unit.title, passed: false, reason: String(e) });
          }
        }

        return results;
      },
      { setup: setup.toString() }
    );

    console.log("==", title);
    for (const result of results) {
      if (result.passed) {
        console.log("-- [OK]", result.title);
      } else {
        console.log("-- [ERR]", result.title);
        console.log(`Reason: ${result.reason}`);
      }
    }
    console.log("=====");

    const failed = results.filter((x) => !x.passed);
    expect(failed.length).toBe(0);
  });
}
