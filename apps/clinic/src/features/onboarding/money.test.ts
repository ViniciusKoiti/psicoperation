import { describe, expect, it } from "vitest";

import { centsToReais, formatCentsAsBRL, reaisToCents } from "./money";

describe("money (valor de sessão em centavos BRL formatado como moeda brasileira)", () => {
  it("formatCentsAsBRL formata centavos inteiros como R$ pt-BR", () => {
    expect(formatCentsAsBRL(15000)).toBe("R$ 150,00");
    expect(formatCentsAsBRL(99)).toBe("R$ 0,99");
    expect(formatCentsAsBRL(0)).toBe("R$ 0,00");
  });

  it("reaisToCents converte reais (NumberInput) para centavos inteiros", () => {
    expect(reaisToCents(150)).toBe(15000);
    expect(reaisToCents(0.99)).toBe(99);
    expect(reaisToCents(150.5)).toBe(15050);
  });

  it("centsToReais é o inverso de reaisToCents para valores exatos em centavos", () => {
    expect(centsToReais(15000)).toBe(150);
    expect(centsToReais(99)).toBe(0.99);
  });
});
