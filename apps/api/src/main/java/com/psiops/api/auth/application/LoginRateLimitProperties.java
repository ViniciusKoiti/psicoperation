package com.psiops.api.auth.application;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuração do rate-limit de login, vinculada ao prefixo
 * {@code psiops.security.rate-limit.login} em {@code application.yml}.
 *
 * @see LoginRateLimiter
 */
@ConfigurationProperties(prefix = "psiops.security.rate-limit.login")
public class LoginRateLimitProperties {

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
