package com.psiops.api.appointment.domain;

import java.util.UUID;

/**
 * Rejeição de comando: o horário solicitado (criação ou remarcação) se
 * sobrepõe a outra consulta ativa ({@code agendada}/{@code realizada}) da
 * mesma psicóloga. Traduzida para 409 Problem Details pelo {@code
 * AppointmentExceptionHandler}, conforme o contrato (PSI-020).
 *
 * <p>Consultas {@code cancelada}/{@code remarcada} nunca disparam esta
 * exceção — não contam como conflito (ver {@code
 * AppointmentService#assertNoConflict}).
 */
public class AppointmentConflictException extends RuntimeException {

  public AppointmentConflictException(UUID conflictingAppointmentId) {
    super("horário conflita com a consulta " + conflictingAppointmentId);
  }
}
