import { describe, expect, it } from "vitest";

import { centsToReais, formatCentsAsBRL, reaisToCents } from "./money";

describe("money", () => {
  it("formata centavos como moeda brasileira", () => {
    expect(formatCentsAsBRL(25000)).toBe("R$ 250,00");
    expect(formatCentsAsBRL(99)).toBe("R$ 0,99");
    expect(formatCentsAsBRL(0)).toBe("R$ 0,00");
  });

  it("converte reais para centavos inteiros, arredondando", () => {
    expect(reaisToCents(250)).toBe(25000);
    expect(reaisToCents(0.1 + 0.2)).toBe(30);
  });

  it("converte centavos para reais", () => {
    expect(centsToReais(25000)).toBe(250);
    expect(centsToReais(99)).toBe(0.99);
  });
});
