package com.psiops.api.reminder.domain;

/**
 * Requisição de lembrete inválida por uma invariante que não é "recurso não
 * encontrado": {@code scheduledFor} não está no futuro, ou mais de um vínculo
 * (paciente/consulta/cobrança) foi informado simultaneamente (assumption do
 * manifesto PSI-027: quando um vínculo é informado, é a exatamente um
 * recurso). Mapeada para 400, mesmo padrão de {@code
 * com.psiops.api.appointment.domain.InvalidAppointmentStateException}.
 */
public class InvalidReminderStateException extends RuntimeException {

  public InvalidReminderStateException(String message) {
    super(message);
  }
}
