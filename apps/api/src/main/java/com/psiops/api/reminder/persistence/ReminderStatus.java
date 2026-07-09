package com.psiops.api.reminder.persistence;

/**
 * Situação do lembrete no ciclo de envio (persistência interna). Espelha os
 * valores do schema {@code ReminderStatus} do contrato de reminder (PSI-020).
 */
public enum ReminderStatus {
  AGENDADO,
  ENVIADO,
  FALHOU,
  CANCELADO
}
