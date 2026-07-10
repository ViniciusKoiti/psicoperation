package com.psiops.api.billing.domain;

/**
 * Rejeição de comando por violação de uma regra de negócio que não é
 * "não encontrado" nem conflito de chave natural: paciente de outra
 * psicóloga, paciente arquivado recebendo uma emissão avulsa, ou competência
 * em formato inválido. Traduzida para 400 Bad Request (Problem Details) pelo
 * {@code ChargeExceptionHandler}.
 */
public class InvalidChargeStateException extends RuntimeException {

  public InvalidChargeStateException(String message) {
    super(message);
  }
}
