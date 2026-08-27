import { defineConfig, devices } from "@playwright/test";

// Defaults to 3000 (what CI and `npm start` normally serve). Overridable via
// PLAYWRIGHT_PORT for local runs where something else already owns 3000.
const PORT = process.env.PLAYWRIGHT_PORT || "3000";
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run build && npm start -- -p ${PORT}`,
    url: BASE_URL,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
