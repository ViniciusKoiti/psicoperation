package com.psiops.api.lead.domain;

/**
 * Limite de submissões do formulário público de lista de espera excedido
 * para a chave corrente (IP remoto). Traduzida para HTTP 429 pelo
 * {@code com.psiops.api.lead.web.LeadExceptionHandler}.
 *
 * @see com.psiops.api.lead.application.LeadRateLimiter
 */
public class LeadRateLimitExceededException extends RuntimeException {

  public LeadRateLimitExceededException() {
    super("muitas submissões da lista de espera; aguarde antes de tentar novamente");
  }
}
