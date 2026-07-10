package com.psiops.api.billing.domain;

import java.util.UUID;

/**
 * Rejeição de comando: a cobrança já tem pagamento registrado. Traduzida
 * para 409 Problem Details pelo {@code ChargeExceptionHandler}, conforme o
 * response {@code "409": Cobrança já paga} declarado em {@code
 * packages/contracts/openapi/paths/billing/charge-payment.yaml}.
 */
public class ChargeAlreadyPaidException extends RuntimeException {

  public ChargeAlreadyPaidException(UUID chargeId) {
    super("cobrança já paga: " + chargeId);
  }
}
