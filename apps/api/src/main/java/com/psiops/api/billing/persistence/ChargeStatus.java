package com.psiops.api.billing.persistence;

/**
 * Situação de pagamento da cobrança (persistência interna). Espelha os
 * valores do schema {@code ChargeStatus} do contrato de billing (PSI-020).
 */
public enum ChargeStatus {
  EM_DIA,
  PENDENTE,
  ATRASADA
}
