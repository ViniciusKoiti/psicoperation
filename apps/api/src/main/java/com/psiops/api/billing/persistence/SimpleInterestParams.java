package com.psiops.api.billing.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Parâmetros de juros SIMPLES aplicados sobre cobrança atrasada (embutido em
 * {@link ChargeEntity}). Espelha o schema {@code SimpleInterestParams} do
 * contrato de billing (PSI-020); o cálculo do montante devido é
 * responsabilidade da camada de aplicação (fora do escopo desta tarefa).
 */
@Embeddable
public class SimpleInterestParams {

  @Column(name = "interest_monthly_rate_percent")
  private Double monthlyRatePercent;

  @Column(name = "interest_fine_percent")
  private Double finePercent;

  protected SimpleInterestParams() {
    // Exigido pelo JPA.
  }

  public SimpleInterestParams(Double monthlyRatePercent, Double finePercent) {
    this.monthlyRatePercent = monthlyRatePercent;
    this.finePercent = finePercent;
  }

  public Double getMonthlyRatePercent() {
    return monthlyRatePercent;
  }

  public Double getFinePercent() {
    return finePercent;
  }
}
