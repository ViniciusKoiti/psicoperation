import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

/**
 * Composição final da landing (PSI-019, spec §1): substitui o placeholder
 * da PSI-009. Os testes unitários de cada seção (Hero.test.tsx,
 * Problema.test.tsx, etc.) continuam cobrindo o conteúdo interno — aqui só
 * validamos ordem e presença das âncoras.
 */
describe("HomePage (composição PSI-019)", () => {
  it("compõe todas as seções na ordem da referência (spec §1)", () => {
    const { container } = render(<HomePage />);
    const text = container.textContent ?? "";

    const markers = [
      "Cuidar da sua clínica é cuidar de",
      "Você já passou por isso?",
      "Tudo em um lugar, finalmente.",
      "Simples como deve ser",
      "Você cuida das pessoas",
      "Entre na lista de espera",
      "Perguntas que você pode ter",
      "Pronto para colocar o financeiro em ordem?",
    ];

    const indices = markers.map((marker) => text.indexOf(marker));

    expect(indices.every((index) => index >= 0)).toBe(true);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it("cada seção com âncora usa o id esperado (spec §1)", () => {
    render(<HomePage />);

    for (const id of ["problema", "solucao", "como", "lista", "faq"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});
