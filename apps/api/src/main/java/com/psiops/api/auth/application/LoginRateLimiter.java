package com.psiops.api.auth.application;

import com.psiops.api.auth.domain.LoginRateLimitExceededException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
 * Rate-limit de força bruta no login, em memória (Bucket4j, sem backend
 * distribuído) — mesma classe de trade-off do refresh token em memória (ver
 * {@link RefreshTokenService}): não compartilha estado entre instâncias, mas
 * é suficiente para o MVP single-instance (ver riscos do manifesto PSI-022).
 *
 * <p>A chave de limitação combina IP remoto e e-mail tentado
 * ({@code "ip|email"}) — não apenas IP (evitaria bloquear só um atacante
 * genérico, mas também penalizaria todos atrás do mesmo NAT/proxy) nem
 * apenas e-mail (permitiria um atacante distribuído testar senhas de uma
 * conta-alvo a partir de IPs diferentes sem jamais esbarrar no limite).
 *
 * <p>O mapa de buckets cresce um pouco por combinação distinta de IP+e-mail
 * já tentada; aceitável para o MVP (sem expiração/lru), a ser revisto se o
 * volume de tentativas de login se tornar um problema de memória.
 */
@Component
public class LoginRateLimiter {

  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
  private final LoginRateLimitProperties properties;

  public LoginRateLimiter(LoginRateLimitProperties properties) {
    this.properties = properties;
  }

  /**
   * Consome uma tentativa da chave informada.
   *
   * @throws LoginRateLimitExceededException se a chave já esgotou as tentativas disponíveis na janela
   */
  public void checkAndConsume(String key) {
    Bucket bucket = buckets.computeIfAbsent(key, k -> newBucket());
    if (!bucket.tryConsume(1)) {
      throw new LoginRateLimitExceededException();
    }
  }

  private Bucket newBucket() {
    Bandwidth limit = Bandwidth.classic(
        properties.getCapacity(),
        Refill.intervally(properties.getCapacity(), properties.getWindow()));
    return Bucket.builder().addLimit(limit).build();
  }
}
