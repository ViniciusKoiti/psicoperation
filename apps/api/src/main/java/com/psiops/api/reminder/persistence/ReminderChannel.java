package com.psiops.api.reminder.persistence;

/**
 * Canal de envio do lembrete (persistência interna). Espelha os valores do
 * schema {@code ReminderChannel} do contrato de reminder (PSI-020). No MVP,
 * apenas {@code EMAIL} (WhatsApp fica para pós-MVP).
 */
public enum ReminderChannel {
  EMAIL
}
