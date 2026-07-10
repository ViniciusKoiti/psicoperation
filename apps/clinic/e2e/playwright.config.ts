import { defineConfig, devices } from "@playwright/test";

const APP_PORT = Number(process.env.CLINIC_E2E_PORT ?? 5180);
const PROXY_PORT = Number(process.env.PROXY_PORT ?? 8081);
const API_TARGET_URL = process.env.API_TARGET_URL ?? "http://localhost:8080";
const baseURL = `http://localhost:${APP_PORT}`;

/**
 * Playwright do cenário crítico do clinic (PSI-044): registro → login →
 * criar paciente → agendar consulta, contra a API Spring REAL — não contra
 * mocks (ver a checagem anti-mock, `apps/clinic/e2e/check-no-mock-in-bundle.mjs`,
 * que prova isso separadamente para o build de PRODUÇÃO; esta suíte prova o
 * FLUXO ponta a ponta).
 *
 * Pré-requisito: infraestrutura (Postgres/Mailpit + API Spring em
 * localhost:8080) já em execução — ver `e2e/README.md`
 * (`bash e2e/scripts/start-infra.sh && bash e2e/scripts/start-api.sh`, ou
 * `bash e2e/run-e2e.sh` para tudo de uma vez, infra incluída).
 *
 * Dois `webServer` (Playwright sobe/derruba os dois; NÃO sobem infra
 * pesada — Postgres/Mailpit/API — de propósito, ver README):
 *
 * 1. Proxy CORS local (`support/api-proxy.mjs`) — necessário porque a API
 *    (`apps/api`) não configura CORS (pensada para rodar atrás de um
 *    proxy que compartilhe origem com o front, o mesmo espírito do default
 *    `VITE_API_BASE_URL ?? "/api""`) e o clinic aqui roda em `vite dev`
 *    numa porta diferente da API — ver a doc do proxy para os detalhes.
 * 2. `vite dev` do clinic, com `VITE_{AUTH,PATIENTS,AGENDA}_ADAPTER=http`
 *    (força os HttpAdapters reais mesmo fora de build de produção — a
 *    mesma variável de ambiente documentada em `src/adapters/<dominio>/index.ts`)
 *    e `VITE_API_BASE_URL` apontando para o proxy acima. `VITE_SETTINGS_ADAPTER`
 *    fica de fora de propósito: o contrato ainda não modela onboarding
 *    (ver `HttpSettingsAdapter`), então o onboarding pós-registro usa o
 *    mock (padrão em modo dev) — o teste só pula o wizard ("Concluir
 *    depois"), nunca depende dele.
 */
export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `node support/api-proxy.mjs`,
      url: `http://localhost:${PROXY_PORT}/__proxy_health`,
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
      env: { PROXY_PORT: String(PROXY_PORT), API_TARGET_URL },
    },
    {
      command: `pnpm exec vite --port ${APP_PORT} --strictPort`,
      cwd: "..",
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        VITE_AUTH_ADAPTER: "http",
        VITE_PATIENTS_ADAPTER: "http",
        VITE_AGENDA_ADAPTER: "http",
        VITE_API_BASE_URL: `http://localhost:${PROXY_PORT}`,
      },
    },
  ],
});
