/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  use: { baseURL: "http://localhost:3210", channel: "chrome", launchOptions: { args: ["--no-sandbox", "--disable-dev-shm-usage"] } },
  webServer: { command: "npm run start -- --port 3210", url: "http://localhost:3210", reuseExistingServer: false, env: { AI_GATEWAY_API_KEY: "" } },
});
