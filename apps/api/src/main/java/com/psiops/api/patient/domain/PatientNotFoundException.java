package com.psiops.api.patient.domain;

import java.util.UUID;

/**
 * Nenhum paciente com o id informado foi encontrado <strong>para a psicóloga
 * autenticada</strong>. Lançada tanto quando o id simplesmente não existe
 * quanto quando existe mas pertence a outra usuária (ver {@code
 * PatientRepository#findByIdAndUserId}) — de propósito: o isolamento
 * multi-tenant exige que os dois casos sejam indistinguíveis pelo cliente
 * (404 sempre, nunca 403, para não vazar a existência do recurso de outro
 * tenant).
 */
public class PatientNotFoundException extends RuntimeException {

  public PatientNotFoundException(UUID patientId) {
    super("paciente não encontrado: " + patientId);
  }
}
