import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  projects: [
    {
      name: "chromium",
      testDir: "tests/unit",
      use: { ...devices["Desktop Chrome"], hasTouch: true },
    },
    {
      name: "chromium e2e",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Chrome"], hasTouch: true },
    },
    {
      name: "firefox e2e",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Firefox"], hasTouch: true },
    },
    {
      name: "webkit e2e",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Safari"], hasTouch: true },
    },
  ],
  webServer: {
    command: "node make server:start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
  use: {
    baseURL: "http://127.0.0.1:3000/",
    viewport: { width: 1040, height: 490 },
  },
});
