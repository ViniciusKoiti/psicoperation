import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = `http://localhost:${PORT}`;

/**
 * Playwright do @psiops/landing. O webServer sobe o app automaticamente
 * (`next dev`); em execução local com o servidor já de pé, ele é reutilizado.
 * Nesta fase (PSI-009) há apenas um smoke spec; os e2e reais chegam na
 * PSI-019. Browsers: `pnpm exec playwright install chromium` (ver README).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
