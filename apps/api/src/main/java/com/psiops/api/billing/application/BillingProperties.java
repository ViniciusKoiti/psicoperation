package com.psiops.api.billing.application;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuração do módulo financeiro (PSI-026), vinculada ao prefixo {@code
 * psiops.billing} em {@code application.yml}.
 *
 * <p><strong>Juros default</strong>: {@link #defaultInterest} é aplicado a
 * uma cobrança quando o payload de criação (avulsa ou da geração mensal) não
 * informa {@code interest} explicitamente — assumption do manifesto PSI-026:
 * "a taxa de juros é configurável por usuária via settings, com default
 * global em application.yml alinhado à calculadora da landing" (o contrato
 * de settings, PSI-020, ainda não tem coluna própria de juros default na
 * tabela {@code settings} — scaffold mínimo da PSI-023/PSI-011 — por isso o
 * default é, nesta tarefa, por aplicação, não por usuária; documentado como
 * open_question/assumption no PR).
 */
@ConfigurationProperties(prefix = "psiops.billing")
public class BillingProperties {

  private DefaultInterest defaultInterest = new DefaultInterest();

  public DefaultInterest getDefaultInterest() {
    return defaultInterest;
  }

  public void setDefaultInterest(DefaultInterest defaultInterest) {
    this.defaultInterest = defaultInterest;
  }

  /** Percentuais espelhando {@code SimpleInterestParams} (contrato PSI-020). */
  public static class DefaultInterest {

    /** Alinhado ao "1% ao mês" da calculadora de juros da landing (ver manifesto PSI-026). */
    private double monthlyRatePercent = 1.0;

    /** Alinhado à "multa de 2%" da landing; a aplicação da multa em si é fora de escopo (PSI-026). */
    private double finePercent = 2.0;

    public double getMonthlyRatePercent() {
      return monthlyRatePercent;
    }

    public void setMonthlyRatePercent(double monthlyRatePercent) {
      this.monthlyRatePercent = monthlyRatePercent;
    }

    public double getFinePercent() {
      return finePercent;
    }

    public void setFinePercent(double finePercent) {
      this.finePercent = finePercent;
    }
  }
}
