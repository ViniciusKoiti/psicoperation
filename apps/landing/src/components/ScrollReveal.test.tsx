import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScrollReveal } from "./ScrollReveal";

/**
 * jsdom não implementa `IntersectionObserver` (nem em `@testing-library`
 * nem no ambiente do Vitest deste app), então `<ScrollReveal>` cai no ramo
 * de fallback "revela tudo de imediato" nestes testes — o que também serve
 * como cobertura explícita desse fallback (spec §8.1, acceptance criteria
 * PSI-019: "nenhum conteúdo permanece oculto se o observer falhar").
 */
describe("ScrollReveal", () => {
  afterEach(() => {
    document.documentElement.className = "";
    vi.unstubAllGlobals();
  });

  it("não renderiza nenhum elemento visível (efeito colateral apenas)", () => {
    const { container } = render(<ScrollReveal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("arma html.psi-reveal-on e revela elementos .psi-reveal (fallback sem IntersectionObserver)", () => {
    document.body.innerHTML = '<div class="psi-reveal" data-testid="marked"></div>';

    render(<ScrollReveal />);

    expect(document.documentElement).toHaveClass("psi-reveal-on");
    expect(document.querySelector('[data-testid="marked"]')).toHaveClass("psi-reveal--in");
  });

  it("respeita prefers-reduced-motion: nunca arma o estado oculto", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia,
    );
    document.body.innerHTML = '<div class="psi-reveal" data-testid="marked"></div>';

    render(<ScrollReveal />);

    expect(document.documentElement).not.toHaveClass("psi-reveal-on");
  });
});
