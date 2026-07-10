package com.psiops.api.lead.application;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuração do rate-limit do formulário público de lista de espera,
 * vinculada ao prefixo {@code psiops.security.rate-limit.leads} em
 * {@code application.yml}.
 *
 * @see LeadRateLimiter
 */
@ConfigurationProperties(prefix = "psiops.security.rate-limit.leads")
public class LeadRateLimitProperties {

  private int capacity = 5;
  private Duration window = Duration.ofMinutes(1);

  public int getCapacity() {
    return capacity;
  }

  public void setCapacity(int capacity) {
    this.capacity = capacity;
  }

  public Duration getWindow() {
    return window;
  }

  public void setWindow(Duration window) {
    this.window = window;
  }
}
