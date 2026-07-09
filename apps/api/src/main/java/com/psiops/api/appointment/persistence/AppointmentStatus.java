package com.psiops.api.appointment.persistence;

/**
 * Situação da consulta na agenda (persistência interna). Espelha os valores
 * do schema {@code AppointmentStatus} do contrato de appointment (PSI-020).
 */
public enum AppointmentStatus {
  AGENDADA,
  REALIZADA,
  CANCELADA,
  REMARCADA
}
