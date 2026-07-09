import { expect, test } from "@playwright/test";

/**
 * Suíte E2E da landing completa (PSI-019, spec §1/§7/§8): valida a
 * composição inteira em navegador real — ordem das seções, accordion do
 * FAQ, submissão do formulário e ausência de overflow horizontal em 390px.
 *
 * O motor de scroll reveal (`<ScrollReveal>`) respeita
 * `prefers-reduced-motion`, forçado a "reduce" no `playwright.config.ts`
 * (`use.reducedMotion`): assim os elementos `.psi-reveal` nunca são armados
 * como ocultos e as asserções não dependem do IntersectionObserver ou do
 * fallback de ~2600ms terem disparado (risco de flakiness do manifesto).
 */
test.describe("Landing PsiOps", () => {
  test("renderiza todas as seções na ordem esperada (spec §1)", async ({ page }) => {
    await page.goto("/");

    // Nav (layout) + as 8 seções + footer, na ordem da referência.
    await expect(page.getByTestId("nav")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Cuidar da sua clínica");
    await expect(
      page.getByRole("heading", { level: 2, name: "Você já passou por isso?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Tudo em um lugar, finalmente." }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Simples como deve ser" }),
    ).toBeVisible();
    await expect(page.getByText("Você cuida das pessoas")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Entre na lista de espera" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Perguntas que você pode ter" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Pronto para colocar o financeiro em ordem?" }),
    ).toBeVisible();

    // Ordem vertical: cada seção-âncora aparece abaixo da anterior no DOM.
    const anchorOrder = ["#problema", "#solucao", "#como", "#lista", "#faq"];
    const tops = await page.evaluate((ids) => {
      return ids.map((id) => {
        const el = document.querySelector(id);
        return el ? el.getBoundingClientRect().top + window.scrollY : Number.NaN;
      });
    }, anchorOrder);

    expect(tops.every((value) => Number.isFinite(value))).toBe(true);
    const sorted = [...tops].sort((a, b) => a - b);
    expect(tops).toEqual(sorted);
  });

  test("CTA final e hero apontam para #lista (âncoras internas, spec §9)", async ({ page }) => {
    await page.goto("/");

    const finalCtaLink = page.getByTestId("final-cta").getByRole("link", {
      name: "Quero acesso antecipado",
    });
    await expect(finalCtaLink).toHaveAttribute("href", "#lista");

    await finalCtaLink.click();
    await expect(page).toHaveURL(/#lista$/);
    await expect(page.getByTestId("lead-form-section")).toBeInViewport();
  });

  test("accordion do FAQ mantém um item aberto por vez (spec §8.3)", async ({ page }) => {
    await page.goto("/");

    const first = page.getByRole("button", { name: "Quando vai lançar?" });
    const second = page.getByRole("button", { name: "Quanto vai custar?" });

    await expect(first).toHaveAttribute("aria-expanded", "false");

    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByText("Estamos na fase final de construção.", { exact: false }),
    ).toBeVisible();

    // Abrir o segundo fecha o primeiro (apenas um aberto por vez).
    await second.click();
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(first).toHaveAttribute("aria-expanded", "false");

    // Clicar no item aberto o fecha (toggle).
    await second.click();
    await expect(second).toHaveAttribute("aria-expanded", "false");
  });

  test("submissão do formulário com dados válidos exibe o estado de sucesso (spec §8.6)", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByTestId("lead-form-section").scrollIntoViewIfNeeded();

    // Escopado ao formulário: "WhatsApp" também casa com a região do FAQ
    // "Funciona com WhatsApp comum?" fora deste escopo.
    const form = page.getByTestId("lead-form");
    await form.getByLabel("Nome completo").fill("Maria Teste");
    await form.getByLabel("WhatsApp", { exact: true }).fill("11987654321");
    await form.getByLabel("E-mail").fill("maria@example.com");

    await form.getByRole("button", { name: "Quero acesso antecipado" }).click();

    await expect(page.getByTestId("lead-success")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Você está na lista!" })).toBeVisible();
    await expect(page.getByTestId("lead-form")).toHaveCount(0);
  });

  test("em viewport de 390px não há overflow horizontal (spec §7)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Aguarda a hidratação/layout estabilizar antes de medir.
    await expect(page.getByTestId("nav")).toBeVisible();

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    // Sem overflow: o conteúdo cabe na largura do documento (spec §7). Se
    // falhar, o culpado costuma ser um elemento absoluto do hero ou uma
    // sombra/overlay que estoura a largura (risco do manifesto).
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
