import { expect, test } from "@playwright/test";

/**
 * Caminho crítico do clinic (PSI-044 acceptance criteria) contra a API
 * Spring REAL: registro → login (automático, o próprio registro já inicia
 * sessão) → criar paciente → agendar consulta — com asserções na UI real
 * (não chama adapters diretamente, ao contrário de `e2e/specs/landing-lead.spec.ts`
 * na raiz).
 *
 * Dados isolados por execução: e-mail único a cada rodada (`uniqueEmail`
 * abaixo) — reexecutável sem intervenção manual, sem exigir reset de banco
 * entre execuções (acceptance criteria da PSI-044).
 *
 * NAVEGAÇÃO SÓ VIA CLIQUE (nunca `page.goto` depois do login): a sessão do
 * clinic vive só em memória (`SessionManager`, nunca localStorage/cookie —
 * decisão de produto documentada em `src/session/SessionManager.ts`), então
 * uma navegação de PÁGINA INTEIRA (`page.goto`) recarrega o app e derruba a
 * sessão — achado ao rodar esta suíte contra o navegador real (antes, os
 * passos após o login usavam `page.goto`, e a suíte caía de volta em
 * `/login`). Depois do primeiro `page.goto("/registrar")`, toda navegação
 * usa cliques em links/rotas internas (React Router, sem reload).
 *
 * Pré-requisito: infra + API Spring já de pé (ver `apps/clinic/e2e/playwright.config.ts`
 * e `e2e/README.md` na raiz) — os dois `webServer` deste config sobem
 * apenas o proxy CORS local e o `vite dev` do clinic, não a infra pesada.
 */

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.psiops.test`;
}

test.describe("Clinic — fluxo crítico (API real)", () => {
  test("registro → onboarding pulado → criar paciente → agendar consulta", async ({ page }) => {
    const email = uniqueEmail("psicologa");
    const password = "SenhaForte123!";
    const patientName = `Paciente E2E ${Date.now()}`;

    // --- Registro (inicia sessão automaticamente, conforme o contrato) ---
    await page.goto("/registrar");
    await page.getByLabel("Nome completo").fill("Psicóloga E2E");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Criar conta" }).click();

    // --- Onboarding: pulado inteiro (settings usa o mock em modo dev —
    // HttpSettingsAdapter ainda não persiste onboarding contra o contrato
    // real, fora do escopo desta tarefa; ver README/PR) ---
    await expect(page.getByTestId("onboarding-page")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Concluir depois" }).click();

    // --- Dashboard (sessão real confirmada: rota protegida renderizou) ---
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Pacientes" })).toBeVisible();

    // --- Criar paciente (HttpPatientsAdapter real, Bearer token da ponte
    // de src/adapters/auth/accessTokenBridge.ts) ---
    await page.getByRole("link", { name: "Pacientes" }).click();
    await expect(page).toHaveURL(/\/pacientes(\?|$)/, { timeout: 15_000 });
    await page.getByRole("link", { name: "Cadastrar paciente" }).click();

    await expect(page.getByTestId("patient-form")).toBeVisible({ timeout: 15_000 });
    await page.getByLabel("Nome").fill(patientName);
    await page.getByLabel("Valor da mensalidade").fill("250");
    await page.getByLabel("Dia de vencimento").fill("10");
    await page.getByRole("button", { name: "Cadastrar paciente" }).click();

    await expect(page).toHaveURL(/\/pacientes(\?|$)/, { timeout: 15_000 });
    await expect(page.getByTestId("patients-table")).toContainText(patientName);

    // --- Agendar consulta (HttpAgendaAdapter real) ---
    await page.getByRole("link", { name: "Agenda" }).click();
    await expect(page).toHaveURL(/\/agenda$/, { timeout: 15_000 });
    await page.getByRole("button", { name: "Nova consulta" }).click();

    // `getByTestId("new-appointment-modal")` mira o `<div class="mantine-Modal-root">`
    // externo do Mantine — um contêiner de posicionamento cujos filhos
    // (overlay/conteúdo) são `position: fixed`, então ELE MESMO tem altura
    // 0 por estrutura normal do Mantine (não é bug de CSS/produto, achado ao
    // rodar contra o navegador real): `toBeVisible()`/`toBeHidden()` nesse
    // elemento não refletem o modal estar aberto/fechado de verdade. Em vez
    // disso, checamos o `<form>` de dentro dele (`new-appointment-form`,
    // com tamanho real) e, na conclusão, a prova definitiva de sucesso é o
    // cartão da consulta aparecer na agenda.
    const modal = page.getByTestId("new-appointment-modal");
    const form = modal.getByTestId("new-appointment-form");
    await expect(form).toBeVisible({ timeout: 15_000 });

    await modal.getByLabel("Paciente").selectOption({ label: patientName });

    const today = new Date();
    const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await modal.getByLabel("Data").fill(isoDate);
    await modal.getByLabel("Horário").fill("14:00");

    await modal.getByRole("button", { name: "Agendar consulta" }).click();

    await expect(page.getByTestId("agenda-appointment").filter({ hasText: patientName })).toBeVisible({
      timeout: 15_000,
    });
  });
});
