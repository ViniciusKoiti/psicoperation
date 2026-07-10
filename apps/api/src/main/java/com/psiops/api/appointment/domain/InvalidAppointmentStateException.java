package com.psiops.api.appointment.domain;

/**
 * Rejeição de comando por violação de uma regra de negócio que não é
 * conflito de horário nem "não encontrado": dia da semana de {@code
 * recurrence.weekday} inconsistente com {@code startsAt}, {@code
 * recurrence.until} anterior à data de {@code startsAt}, remarcação de uma
 * consulta que não está {@code agendada}, ou transição de status não
 * suportada por este endpoint. Traduzida para 400 Bad Request (Problem
 * Details) pelo {@code AppointmentExceptionHandler}.
 */
public class InvalidAppointmentStateException extends RuntimeException {

  public InvalidAppointmentStateException(String message) {
    super(message);
  }
}
