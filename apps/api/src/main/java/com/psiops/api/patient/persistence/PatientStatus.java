package com.psiops.api.patient.persistence;

/**
 * Situação cadastral do paciente na carteira da psicóloga (persistência
 * interna). Espelha os valores do schema {@code PatientStatus} do contrato
 * (PSI-020): {@code ativo} recebe cobranças; {@code inativo} foi arquivado e
 * não gera novas mensalidades.
 *
 * <p>Este enum é interno ao domínio (armazenado via {@code EnumType.STRING});
 * a conversão para o DTO de contrato {@code com.psiops.contracts.model.PatientStatus}
 * é responsabilidade do mapper de uma tarefa futura (PSI-022 em diante).
 */
public enum PatientStatus {
  ATIVO,
  INATIVO
}
