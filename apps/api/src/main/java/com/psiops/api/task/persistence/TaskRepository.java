package com.psiops.api.task.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repositório de tarefas administrativas ({@link TaskEntity}), escopado por usuária.
 *
 * <p><strong>Isolamento multi-tenant (PSI-027)</strong>: toda consulta usada
 * pelo módulo de tarefas acima da camada de persistência passa por um dos
 * métodos aqui — todos recebem {@code userId} e o incluem no filtro (nunca um
 * {@code findById} puro). Mesmo padrão de {@code
 * com.psiops.api.patient.persistence.PatientRepository} (PSI-023).
 */
public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {

  List<TaskEntity> findByUserId(UUID userId);

  /** Busca uma tarefa pelo id, mas somente se pertencer a {@code userId}. */
  Optional<TaskEntity> findByIdAndUserId(UUID id, UUID userId);

  Page<TaskEntity> findByUserId(UUID userId, Pageable pageable);

  /** Tarefas não concluídas ({@code completedAt IS NULL}) da usuária — filtro {@code pending=true}. */
  Page<TaskEntity> findByUserIdAndCompletedAtIsNull(UUID userId, Pageable pageable);
}
