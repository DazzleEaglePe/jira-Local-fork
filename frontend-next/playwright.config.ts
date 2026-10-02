import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000"

/**
 * Smoke tests against a running app + Vikunja API (`pnpm build && pnpm start`, `vikunja.exe web`).
 * Uses the installed Chrome, so no browser download is needed on the corporate network.
 * Credentials: E2E_USER / E2E_PASSWORD (a local test account, never a real one).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL,
    locale: "es-PE",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
})
