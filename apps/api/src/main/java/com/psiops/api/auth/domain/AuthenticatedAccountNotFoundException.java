package com.psiops.api.auth.domain;

/**
 * O access token apresentado é assinado e válido, mas a conta que ele
 * referencia não existe mais (ex.: removida entre a emissão do token e esta
 * requisição). Cenário de borda, não esperado em operação normal — tratado
 * como 401 pelo {@code com.psiops.api.auth.web.AuthExceptionHandler} em vez
 * de propagar um 404/500 confuso ao cliente.
 */
public class AuthenticatedAccountNotFoundException extends RuntimeException {

  public AuthenticatedAccountNotFoundException() {
    super("conta do usuário autenticado não foi encontrada");
  }
}
