import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  projects: [
    {
      name: "chromium",
      testDir: "tests/unit",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium e2e",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox e2e",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit e2e",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
