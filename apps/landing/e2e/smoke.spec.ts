import { expect, test } from "@playwright/test";

// Smoke spec da PSI-009: prova que a configuração do Playwright (webServer)
// funciona. Os specs reais da landing chegam na PSI-019.
test("página inicial responde 200 com o título correto", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("PsiOps — O financeiro da sua clínica, finalmente em ordem");
});
