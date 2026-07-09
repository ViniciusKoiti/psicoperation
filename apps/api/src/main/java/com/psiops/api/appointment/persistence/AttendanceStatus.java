package com.psiops.api.appointment.persistence;

/**
 * Presença administrativa do paciente na consulta (persistência interna).
 * Espelha os valores do schema {@code AttendanceStatus} do contrato de
 * appointment (PSI-020).
 *
 * <p><strong>Sem dado clínico</strong>: os únicos valores possíveis são
 * comparecimento/falta/remarcação — decisão de produto inviolável.
 */
public enum AttendanceStatus {
  COMPARECEU,
  FALTOU,
  REMARCADA
}
