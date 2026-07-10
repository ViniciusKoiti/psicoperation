import { describe, expect, it } from "vitest";

import { calculateOverdueAmount } from "./interest";

describe("calculateOverdueAmount", () => {
  it("reproduz exatamente o exemplo do card da landing (paridade — fonte de verdade do app)", () => {
    // project/PsiOps Landing.html, seção Solução, feature 3 ("Juros calculados
    // automaticamente"): R$ 350,00 atrasada há 4 dias, 1% a.m., multa de 2% →
    // juros R$ 0,47, multa R$ 7,00, total R$ 357,47.
    const result = calculateOverdueAmount({
      amountCents: 35000,
      overdueDays: 4,
      monthlyRatePercent: 1,
      finePercent: 2,
    });

    expect(result).toEqual({ interestCents: 47, fineCents: 700, totalCents: 35747 });
  });

  it("zero dias de atraso: não aplica juros nem multa, devolve o valor original (caso de borda)", () => {
    const result = calculateOverdueAmount({
      amountCents: 25000,
      overdueDays: 0,
      monthlyRatePercent: 1,
      finePercent: 2,
    });

    expect(result).toEqual({ interestCents: 0, fineCents: 0, totalCents: 25000 });
  });

  it("dias de atraso negativos são tratados como zero (defensivo)", () => {
    const result = calculateOverdueAmount({
      amountCents: 25000,
      overdueDays: -3,
      monthlyRatePercent: 1,
      finePercent: 2,
    });

    expect(result).toEqual({ interestCents: 0, fineCents: 0, totalCents: 25000 });
  });

  it("arredonda o juro fracionário para o centavo mais próximo (caso exato de ,5)", () => {
    // 100 centavos × 1% × (15/30) = 0,5 centavo exato → arredonda para 1.
    const result = calculateOverdueAmount({
      amountCents: 100,
      overdueDays: 15,
      monthlyRatePercent: 1,
      finePercent: 0,
    });

    expect(result.interestCents).toBe(1);
    expect(result.totalCents).toBe(101);
  });

  it("arredonda para baixo quando a fração é menor que meio centavo", () => {
    // 1000 centavos × 1% × (1/30) ≈ 0,333 centavo → arredonda para 0.
    const result = calculateOverdueAmount({
      amountCents: 1000,
      overdueDays: 1,
      monthlyRatePercent: 1,
      finePercent: 0,
    });

    expect(result.interestCents).toBe(0);
    expect(result.totalCents).toBe(1000);
  });

  it("multa é aplicada uma única vez sobre o valor original, sem pró-rata por dia", () => {
    const oneDay = calculateOverdueAmount({ amountCents: 10000, overdueDays: 1, monthlyRatePercent: 0, finePercent: 2 });
    const thirtyDays = calculateOverdueAmount({ amountCents: 10000, overdueDays: 30, monthlyRatePercent: 0, finePercent: 2 });

    expect(oneDay.fineCents).toBe(200);
    expect(thirtyDays.fineCents).toBe(200);
  });

  it("juros cresce linearmente com os dias de atraso (juros simples, sem capitalização)", () => {
    const tenDays = calculateOverdueAmount({ amountCents: 30000, overdueDays: 10, monthlyRatePercent: 1, finePercent: 0 });
    const twentyDays = calculateOverdueAmount({ amountCents: 30000, overdueDays: 20, monthlyRatePercent: 1, finePercent: 0 });

    expect(twentyDays.interestCents).toBe(tenDays.interestCents * 2);
  });

  it("valor original zero devolve tudo zerado, sem dividir por zero nem gerar NaN", () => {
    const result = calculateOverdueAmount({ amountCents: 0, overdueDays: 10, monthlyRatePercent: 1, finePercent: 2 });

    expect(result).toEqual({ interestCents: 0, fineCents: 0, totalCents: 0 });
  });

  it("taxas zeradas (0% juros e 0% multa) devolvem o total igual ao valor original", () => {
    const result = calculateOverdueAmount({ amountCents: 42000, overdueDays: 15, monthlyRatePercent: 0, finePercent: 0 });

    expect(result).toEqual({ interestCents: 0, fineCents: 0, totalCents: 42000 });
  });
});
