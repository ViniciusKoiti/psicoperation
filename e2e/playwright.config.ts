import { defineConfig } from "@playwright/test";

/**
 * Playwright cross-app da PSI-044: hoje só o cenário da landing (lead →
 * API real → persistido no banco), em `e2e/specs/landing-lead.spec.ts`.
 * Não usa `page`/browser (chama a API diretamente via `HttpLeadAdapter` e
 * o banco via `docker exec psql` — ver `e2e/support/db.mjs`), então não
 * precisa de `webServer` nem de `devices["Desktop Chrome"]`; o pré-
 * requisito é a infraestrutura (Postgres/Mailpit + API Spring) já estar de
 * pé — ver `e2e/README.md` (`bash e2e/scripts/start-infra.sh` +
 * `bash e2e/scripts/start-api.sh`, ou `bash e2e/run-e2e.sh` para tudo de
 * uma vez).
 *
 * O cenário do clinic (registro → login → paciente → agenda, com UI real
 * em navegador) fica em `apps/clinic/e2e/playwright.config.ts` — roda à
 * parte, ver README.
 */
export default defineConfig({
  testDir: "./specs",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 30_000,
  projects: [{ name: "node" }],
});
