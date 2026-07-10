package com.psiops.api.billing.domain;

import java.util.UUID;

/**
 * Rejeição de comando: já existe cobrança para o paciente nessa competência
 * (chave natural {@code userId + patientId + competence}). Traduzida para
 * 409 Problem Details pelo {@code ChargeExceptionHandler}, conforme o
 * response {@code "409": Já existe cobrança para o paciente nessa
 * competência} declarado em {@code
 * packages/contracts/openapi/paths/billing/charges.yaml}.
 *
 * <p>É também o mecanismo de idempotência da emissão avulsa ({@code POST
 * /charges}) e, por composição, da geração mensal ({@code POST
 * /charges/generate}, endpoint interno desta tarefa — ver {@code
 * ChargeService#generateMonthlyCharges}): repetir a chamada para a mesma
 * competência nunca duplica uma cobrança já existente.
 */
public class ChargeAlreadyExistsException extends RuntimeException {

  public ChargeAlreadyExistsException(UUID patientId, String competence) {
    super("já existe cobrança para o paciente " + patientId + " na competência " + competence);
  }
}
