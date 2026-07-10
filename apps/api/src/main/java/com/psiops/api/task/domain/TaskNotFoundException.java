package com.psiops.api.task.domain;

import java.util.UUID;

/**
 * Nenhuma tarefa com o id informado foi encontrada <strong>para a psicóloga
 * autenticada</strong>. Lançada tanto quando o id simplesmente não existe
 * quanto quando existe mas pertence a outra usuária (ver {@code
 * TaskRepository#findByIdAndUserId}) — de propósito: o isolamento
 * multi-tenant exige que os dois casos sejam indistinguíveis pelo cliente
 * (404 sempre, nunca 403, para não vazar a existência do recurso de outro
 * tenant). Mesmo padrão de {@code
 * com.psiops.api.patient.domain.PatientNotFoundException}.
 */
public class TaskNotFoundException extends RuntimeException {

  public TaskNotFoundException(UUID taskId) {
    super("tarefa não encontrada: " + taskId);
  }
}
