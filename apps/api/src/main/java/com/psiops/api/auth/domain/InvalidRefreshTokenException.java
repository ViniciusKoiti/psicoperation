package com.psiops.api.auth.domain;

/**
 * Rejeição de refresh: token ausente do store em memória, já rotacionado
 * (reuso), expirado, ou malformado. O chamador não recebe qual dessas causas
 * ocorreu — apenas que o refresh token não é mais válido, o que obriga um
 * novo login. Traduzida para HTTP 401 pelo
 * {@code com.psiops.api.auth.web.AuthExceptionHandler}.
 */
public class InvalidRefreshTokenException extends RuntimeException {

  public InvalidRefreshTokenException() {
    super("refresh token inválido, expirado ou já utilizado");
  }
}
