package com.psiops.api.auth.domain;

/**
 * Rejeição de login: e-mail não cadastrado ou senha incorreta.
 *
 * <p>Deliberadamente não distingue as duas causas na mensagem (nem em log) —
 * distinguir permitiria enumerar e-mails cadastrados por tentativa e erro.
 * Traduzida para HTTP 401 pelo {@code com.psiops.api.auth.web.AuthExceptionHandler}.
 */
public class InvalidCredentialsException extends RuntimeException {

  public InvalidCredentialsException() {
    super("e-mail ou senha inválidos");
  }
}
