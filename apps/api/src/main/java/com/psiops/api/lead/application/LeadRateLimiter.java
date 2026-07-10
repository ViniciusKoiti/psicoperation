package com.psiops.api.lead.application;

import com.psiops.api.lead.domain.LeadRateLimitExceededException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
 * Rate-limit do formulário público de lista de espera, em memória (Bucket4j,
 * sem backend distribuído) — mesmo padrão e mesmo trade-off de
 * {@link com.psiops.api.auth.application.LoginRateLimiter} (MVP
 * single-instance, ver riscos do manifesto PSI-028).
 *
 * <p>A chave de limitação é apenas o IP remoto: diferente do login (que
 * combina IP + e-mail para não penalizar todo mundo atrás do mesmo NAT ao
 * mesmo tempo em que impede um atacante distribuído de testar uma conta-alvo
 * a partir de vários IPs), o formulário de lista de espera não tem uma
 * "conta-alvo" a proteger — o risco aqui é só volume de submissões de spam a
 * partir de uma mesma origem, então IP sozinho é a chave adequada (limitar
 * por e-mail normalizado permitiria contornar o limite trocando o e-mail a
 * cada tentativa).
 *
 * <p>O mapa de buckets cresce por IP distinto já visto; aceitável para o MVP
 * (sem expiração/lru), mesma limitação documentada em {@code LoginRateLimiter}.
 */
@Component
public class LeadRateLimiter {

  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
  private final LeadRateLimitProperties properties;

  public LeadRateLimiter(LeadRateLimitProperties properties) {
    this.properties = properties;
  }

  /**
   * Consome uma submissão da chave informada.
   *
   * @throws LeadRateLimitExceededException se a chave já esgotou as submissões disponíveis na janela
   */
  public void checkAndConsume(String key) {
    Bucket bucket = buckets.computeIfAbsent(key, k -> newBucket());
    if (!bucket.tryConsume(1)) {
      throw new LeadRateLimitExceededException();
    }
  }

  private Bucket newBucket() {
    Bandwidth limit = Bandwidth.classic(
        properties.getCapacity(),
        Refill.intervally(properties.getCapacity(), properties.getWindow()));
    return Bucket.builder().addLimit(limit).build();
  }
}
