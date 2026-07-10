package com.psiops.api.task.application;

import com.psiops.api.task.persistence.TaskEntity;
import com.psiops.contracts.model.Task;

/**
 * Converte {@link TaskEntity} (persistência) para o DTO de contrato {@link
 * Task} (gerado de {@code packages/contracts}). O campo {@code userId} nunca
 * aparece no DTO — o escopo multi-tenant é implícito no bearer token (ver
 * schema {@code Task} em {@code components/task/schemas.yaml}).
 */
public final class TaskMapper {

  private TaskMapper() {
  }

  public static Task toContract(TaskEntity entity) {
    return new Task(entity.getId(), entity.getTitle(), entity.getCreatedAt())
        .dueDate(entity.getDueDate())
        .completedAt(entity.getCompletedAt());
  }
}
