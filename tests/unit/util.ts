import { type Page, test, expect } from "@playwright/test";
import * as Path from "path";
import type { kernel, os } from "../../packages/kate-core";

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

type RecPartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? RecPartial<U>[]
    : T[K] extends object | undefined
    ? RecPartial<T[K]>
    : T[K];
};

export type DescribeContext = {
  test: (title: string, action: () => Promise<void> | void) => void;
  kate: Kate;
  assert_match: <A>(a: A, b: RecPartial<A>, tag?: string) => void;
};

export function describe(title: string, setup: (ctx: DescribeContext) => void) {
  test(`${title}`, async ({ page }) => {
    await page.addScriptTag({ path: Path.join(__dirname, "../../www/kate/kate-latest.js") });
    await page.addScriptTag({ path: Path.join(__dirname, "test-assert.js") });

    const results = await page.evaluate(
      async ({ setup }) => {
        const tests: Test[] = [];
        const results: TestResult[] = [];

        const kate = (window as any).Kate;
        const assert_match = (window as any).Assert.assert_match;
        const test: DescribeContext["test"] = (title, action) => {
          tests.push({ title, action });
        };

        eval(setup)({ test, kate, assert_match });

        for (const unit of tests) {
          console.log("Running", unit.title);
          try {
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
