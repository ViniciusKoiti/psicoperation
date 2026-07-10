package com.psiops.api.billing.domain;

import java.util.UUID;

/**
 * Nenhuma cobrança com o id informado foi encontrada <strong>para a
 * psicóloga autenticada</strong>. Lançada tanto quando o id simplesmente não
 * existe quanto quando existe mas pertence a outra usuária (ver {@code
 * ChargeRepository#findByIdAndUserId}) — de propósito: o isolamento
 * multi-tenant exige que os dois casos sejam indistinguíveis pelo cliente
 * (404 sempre, nunca 403, para não vazar a existência do recurso de outro
 * tenant).
 */
public class ChargeNotFoundException extends RuntimeException {

  public ChargeNotFoundException(UUID chargeId) {
    super("cobrança não encontrada: " + chargeId);
  }
}
