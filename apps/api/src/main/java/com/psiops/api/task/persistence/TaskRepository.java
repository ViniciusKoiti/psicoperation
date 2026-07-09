package com.psiops.api.task.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repositório de tarefas administrativas ({@link TaskEntity}), escopado por usuária. */
public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {

  List<TaskEntity> findByUserId(UUID userId);
}
