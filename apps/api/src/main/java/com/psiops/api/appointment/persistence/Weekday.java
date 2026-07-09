package com.psiops.api.appointment.persistence;

/**
 * Dia da semana de uma recorrência semanal (persistência interna). Espelha os
 * valores do schema {@code WeeklyRecurrence.weekday} do contrato de
 * appointment (PSI-020).
 */
public enum Weekday {
  SEGUNDA,
  TERCA,
  QUARTA,
  QUINTA,
  SEXTA,
  SABADO,
  DOMINGO
}
