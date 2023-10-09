import { type Page, test, expect } from "@playwright/test";
import * as Path from "path";
import type { kernel, os } from "../../packages/kate-core";

export type Kate = {
  kernel: typeof kernel;
  os: typeof os;
};

export type ActionContext = {
  kate: Kate;
};

type Test = {
  title: string;
  action: (ctx: ActionContext) => Promise<void>;
};

export type DescribeContext = {
  test: (title: string, action: (ctx: ActionContext) => Promise<void>) => void;
};

export function describe(title: string, setup: (ctx: DescribeContext) => void) {
  const tests: Test[] = [];
  setup({
    test: (title, action) => {
      tests.push({ title, action });
    },
  });

  test(`${title} (${tests.length})`, async ({ page }) => {
    await page.addScriptTag({ path: Path.join(__dirname, "../../www/kate/kate-latest.js") });
    for (const unit of tests) {
      console.log(`==> ${unit.title}...`);
      const result = page.evaluate(
        (fn) => eval(`(${fn})`)({ kate: (window as any).Kate }),
        unit.action.toString()
      );
      expect(
        await result.then(
          () => true,
          (e) => `${unit.title} failed: ${e}`
        )
      ).toBe(true);
    }
  });
}
