package com.psiops.api.auth.domain;

/**
 * Rejeição de registro: já existe uma conta com o e-mail informado
 * ({@code uq_users_email}, V1). Traduzida para HTTP 409 pelo
 * {@code com.psiops.api.auth.web.AuthExceptionHandler}.
 */
public class EmailAlreadyRegisteredException extends RuntimeException {

  public EmailAlreadyRegisteredException() {
    super("já existe uma conta cadastrada com o e-mail informado");
  }
}
