import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = `http://localhost:${PORT}`;

/**
 * Playwright do @psiops/landing. O webServer sobe o app automaticamente
 * (`next dev`); em execução local com o servidor já de pé, ele é reutilizado.
 * A suíte completa (PSI-019, `e2e/landing.spec.ts`) cobre a composição
 * inteira da página, além do smoke spec da PSI-009. Browsers:
 * `pnpm exec playwright install chromium` (ver README).
 *
 * `reducedMotion: "reduce"` (risco documentado no manifesto PSI-019):
 * o motor de scroll reveal (`<ScrollReveal>`) respeita
 * `prefers-reduced-motion` e, quando ativo, nunca arma o estado oculto dos
 * elementos `.psi-reveal` — evita flakiness de asserções que rodam antes do
 * IntersectionObserver ou do fallback de ~2600ms revelarem o conteúdo.
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
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
