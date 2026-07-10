package com.psiops.api.notification.email;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuração do envio de e-mail (PSI-029), prefixo {@code
 * psiops.notification.email} em {@code application.yml}.
 *
 * <p>As propriedades SMTP propriamente ditas (host/porta) vivem em {@code
 * spring.mail.*} (autoconfiguração do Spring Boot, consumida por {@code
 * JavaMailSender}) - já com defaults de DEV apontando para o Mailpit do
 * docker-compose ({@code localhost:1025}, ver assumption do manifesto
 * PSI-029: "a PSI-011 provisionou o Mailpit... esta tarefa apenas as
 * consome"). Este record cobre apenas o que é específico da entrega feita
 * por este pacote: remetente e política de retry/backoff.
 */
@ConfigurationProperties(prefix = "psiops.notification.email")
public class EmailProperties {

  /** Remetente usado em todo e-mail enviado por este módulo. */
  private String from = "PsiOps <no-reply@psiops.local>";

  private Retry retry = new Retry();

  public String getFrom() {
    return from;
  }

  public void setFrom(String from) {
    this.from = from;
  }

  public Retry getRetry() {
    return retry;
  }

  public void setRetry(Retry retry) {
    this.retry = retry;
  }

  /**
   * Backoff exponencial para falhas transitórias de SMTP (ver {@code
   * RetryingEmailSender}). Falha definitiva (após esgotar {@code
   * maxAttempts}) é registrada em log - nunca trava o processador ({@code
   * email-delivery}) indefinidamente.
   */
  public static class Retry {

    /** Número máximo de tentativas de envio (inclui a primeira). */
    private int maxAttempts = 3;

    /** Espera antes da 2ª tentativa; multiplicada por {@link #multiplier} a cada nova tentativa. */
    private Duration initialBackoff = Duration.ofMillis(200);

    /** Fator de crescimento exponencial do backoff entre tentativas. */
    private double multiplier = 2.0;

    public int getMaxAttempts() {
      return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
      this.maxAttempts = maxAttempts;
    }

    public Duration getInitialBackoff() {
      return initialBackoff;
    }

    public void setInitialBackoff(Duration initialBackoff) {
      this.initialBackoff = initialBackoff;
    }

    public double getMultiplier() {
      return multiplier;
    }

    public void setMultiplier(double multiplier) {
      this.multiplier = multiplier;
    }
  }
}
