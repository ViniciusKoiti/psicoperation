package com.psiops.api.appointment.domain;

import java.util.UUID;

/**
 * Nenhuma consulta com o id informado foi encontrada <strong>para a
 * psicóloga autenticada</strong>. Lançada tanto quando o id simplesmente não
 * existe quanto quando existe mas pertence a outra usuária (ver {@code
 * AppointmentRepository#findByIdAndUserId}) — de propósito: o isolamento
 * multi-tenant exige que os dois casos sejam indistinguíveis pelo cliente
 * (404 sempre, nunca 403, para não vazar a existência do recurso de outro
 * tenant).
 */
public class AppointmentNotFoundException extends RuntimeException {

  public AppointmentNotFoundException(UUID appointmentId) {
    super("consulta não encontrada: " + appointmentId);
  }
}
