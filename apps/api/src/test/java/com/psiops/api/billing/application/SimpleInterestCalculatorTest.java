package com.psiops.api.billing.application;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * Cobertura do cálculo de juros simples sobre centavos (PSI-026): paridade
 * com a fórmula da calculadora da landing ({@code valor corrigido = valor
 * original + valor original * taxa * tempo de atraso}, taxa mensal pro rata
 * dia sobre base de 30 dias) e arredondamento determinístico
 * ({@link java.math.RoundingMode#HALF_UP}), incluindo casos de fronteira
 * exata em meio centavo.
 */
class SimpleInterestCalculatorTest {

  @Test
  void noDaysLate_yieldsZeroInterest() {
    assertThat(SimpleInterestCalculator.interestCents(15000L, 1.0, 0)).isZero();
    assertThat(SimpleInterestCalculator.correctedAmountCents(15000L, 1.0, 0)).isEqualTo(15000L);
  }

  @Test
  void negativeDaysLate_treatedAsNoInterest() {
    assertThat(SimpleInterestCalculator.interestCents(15000L, 1.0, -5)).isZero();
  }

  @Test
  void zeroOrNegativeRate_yieldsZeroInterest() {
    assertThat(SimpleInterestCalculator.interestCents(15000L, 0.0, 10)).isZero();
    assertThat(SimpleInterestCalculator.interestCents(15000L, -1.0, 10)).isZero();
  }

  @Test
  void zeroOrNegativeAmount_yieldsZeroInterest() {
    assertThat(SimpleInterestCalculator.interestCents(0L, 1.0, 10)).isZero();
    assertThat(SimpleInterestCalculator.interestCents(-100L, 1.0, 10)).isZero();
  }

  @Test
  void halfMonthDelay_appliesHalfTheMonthlyRate() {
    // R$150,00 (15000 centavos), 1% ao mês, 15 dias de atraso (meio mês,
    // base 30 dias): juros = 15000 * 0.01 * (15/30) = 75 centavos exatos.
    assertThat(SimpleInterestCalculator.interestCents(15000L, 1.0, 15)).isEqualTo(75L);
    assertThat(SimpleInterestCalculator.correctedAmountCents(15000L, 1.0, 15)).isEqualTo(15075L);
  }

  @Test
  void fullMonthDelay_appliesFullMonthlyRate() {
    // 15000 * 0.01 * (30/30) = 150 centavos.
    assertThat(SimpleInterestCalculator.interestCents(15000L, 1.0, 30)).isEqualTo(150L);
  }

  @Test
  void exactHalfCentBoundary_roundsHalfUp() {
    // R$1,00 (100 centavos), 1% ao mês, 15 dias: juros teórico = 100 * 0.01
    // * 0.5 = 0.5 centavos exatos — arredondamento determinístico HALF_UP
    // arredonda para 1 centavo (nunca trunca para 0, nunca banker's
    // rounding).
    assertThat(SimpleInterestCalculator.interestCents(100L, 1.0, 15)).isEqualTo(1L);
  }

  @Test
  void justBelowHalfCentBoundary_roundsDown() {
    // 333 centavos, 1% ao mês, 14 dias: 333 * 0.01 * (14/30) = 1,554 ->
    // arredonda para 2 centavos (HALF_UP de 1,554 é 2, pois >= 1,5).
    assertThat(SimpleInterestCalculator.interestCents(333L, 1.0, 14)).isEqualTo(2L);
    // 333 centavos, 1% ao mês, 13 dias: 333 * 0.01 * (13/30) = 1,443 ->
    // arredonda para 1 centavo (< 1,5).
    assertThat(SimpleInterestCalculator.interestCents(333L, 1.0, 13)).isEqualTo(1L);
  }

  @Test
  void higherRateAndLongerDelay_matchesManualExpectation() {
    // R$1.000,00 (100000 centavos), 2% ao mês, 45 dias (1,5 mês): juros =
    // 100000 * 0.02 * 1.5 = 3000 centavos exatos.
    assertThat(SimpleInterestCalculator.interestCents(100_000L, 2.0, 45)).isEqualTo(3000L);
    assertThat(SimpleInterestCalculator.correctedAmountCents(100_000L, 2.0, 45)).isEqualTo(103_000L);
  }

  @Test
  void parityWithLandingFormula_originalPlusRateTimesTime() {
    // Reproduz manualmente "valor corrigido = valor original + (valor
    // original * taxa * tempo de atraso)" do manifesto PSI-026, com taxa
    // decimal e tempo em meses (dias/30), e compara byte a byte com o
    // resultado do calculador.
    long amountCents = 27_483L; // valor não redondo, de propósito.
    double monthlyRatePercent = 1.75;
    long daysLate = 47;

    double taxa = monthlyRatePercent / 100.0;
    double tempoDeAtrasoEmMeses = daysLate / 30.0;
    long expectedInterest = Math.round(amountCents * taxa * tempoDeAtrasoEmMeses);

    assertThat(SimpleInterestCalculator.interestCents(amountCents, monthlyRatePercent, daysLate))
        .isEqualTo(expectedInterest);
  }
}
