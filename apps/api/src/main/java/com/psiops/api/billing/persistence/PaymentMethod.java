package com.psiops.api.billing.persistence;

/**
 * Meio de pagamento informado no registro (administrativo, persistência
 * interna). Espelha os valores do schema {@code PaymentMethod} do contrato de
 * billing (PSI-020).
 */
public enum PaymentMethod {
  PIX,
  DINHEIRO,
  TRANSFERENCIA,
  CARTAO,
  OUTRO
}
