package com.psiops.api.billing.application;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

/**
 * Juros SIMPLES (lineares) sobre cobrança atrasada, calculados sobre
 * centavos inteiros — DINHEIRO É SAGRADO, nunca ponto flutuante no valor
 * corrigido (CLAUDE.md, manifesto PSI-026).
 *
 * <p><strong>Fórmula (paridade com a calculadora da landing)</strong>: dado o
 * manifesto da tarefa, {@code valor corrigido = valor original + (valor
 * original * taxa * tempo de atraso)} — a mesma fórmula de juros simples
 * exibida na landing page ("Defina a regra uma vez — 1% ao mês... e o
 * sistema aplica em todos os atrasos", ver {@code project/PsiOps
 * Landing.html}). Aqui:
 *
 * <ul>
 *   <li>{@code taxa} = {@code monthlyRatePercent / 100} (percentual ao mês);
 *   <li>{@code tempo de atraso} = {@code diasAtraso / 30} — base mensal
 *       pro rata dia (assumption do manifesto PSI-026, já que o contrato não
 *       define explicitamente taxa diária vs. mensal pro rata; ver
 *       open_question no PR).
 * </ul>
 *
 * <p><strong>Multa fora de escopo</strong>: {@code SimpleInterestParams.
 * finePercent} (contrato PSI-020) não entra nesta conta — "multa fixa" está
 * explicitamente em {@code out_of_scope} no manifesto PSI-026. Esta classe
 * calcula SOMENTE o componente de juros.
 *
 * <p><strong>Arredondamento determinístico</strong>: a multiplicação
 * intermediária é feita em {@link BigDecimal} (nunca {@code double}) e o
 * resultado final em centavos é arredondado com {@link
 * RoundingMode#HALF_UP} — escolha explícita e testada (ver {@code
 * SimpleInterestCalculatorTest}), incluindo o caso de fronteira exata em
 * {@code x,5} centavos.
 */
public final class SimpleInterestCalculator {

  private SimpleInterestCalculator() {}

  /** Dias em um mês, para a base pro rata dia da taxa mensal (ver javadoc da classe). */
  private static final BigDecimal DAYS_PER_MONTH = BigDecimal.valueOf(30);
  private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

  /**
   * Componente de juros simples, em centavos, para {@code amountCents}
   * atrasado há {@code daysLate} dias a uma taxa de {@code
   * monthlyRatePercent}% ao mês. Retorna {@code 0} se {@code daysLate <= 0},
   * {@code monthlyRatePercent <= 0} ou {@code amountCents <= 0} (nenhum
   * atraso/nenhuma taxa/nenhum valor não gera juros).
   */
  public static long interestCents(long amountCents, double monthlyRatePercent, long daysLate) {
    if (daysLate <= 0 || monthlyRatePercent <= 0 || amountCents <= 0) {
      return 0L;
    }
    BigDecimal principal = BigDecimal.valueOf(amountCents);
    BigDecimal rate = BigDecimal.valueOf(monthlyRatePercent).divide(ONE_HUNDRED, MathContext.DECIMAL64);
    BigDecimal timeFraction = BigDecimal.valueOf(daysLate).divide(DAYS_PER_MONTH, MathContext.DECIMAL64);
    BigDecimal interest = principal.multiply(rate).multiply(timeFraction);
    return interest.setScale(0, RoundingMode.HALF_UP).longValueExact();
  }

  /**
   * Valor corrigido (original + juros), em centavos: {@code amountCents +
   * interestCents(amountCents, monthlyRatePercent, daysLate)}.
   */
  public static long correctedAmountCents(long amountCents, double monthlyRatePercent, long daysLate) {
    return amountCents + interestCents(amountCents, monthlyRatePercent, daysLate);
  }
}
