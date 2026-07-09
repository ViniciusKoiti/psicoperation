package com.psiops.api.auth.domain;

/**
 * Limite de tentativas de login excedido para a chave corrente (IP + e-mail).
 * Traduzida para HTTP 429 pelo {@code com.psiops.api.auth.web.AuthExceptionHandler}.
 *
 * @see com.psiops.api.auth.application.LoginRateLimiter
 */
public class LoginRateLimitExceededException extends RuntimeException {

  public LoginRateLimitExceededException() {
    super("muitas tentativas de login; aguarde antes de tentar novamente");
  }
}
