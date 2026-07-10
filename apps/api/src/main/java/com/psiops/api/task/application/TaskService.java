package com.psiops.api.task.application;

import com.psiops.api.task.domain.TaskNotFoundException;
import com.psiops.api.task.persistence.TaskEntity;
import com.psiops.api.task.persistence.TaskRepository;
import com.psiops.contracts.model.PageMeta;
import com.psiops.contracts.model.Task;
import com.psiops.contracts.model.TaskCreateRequest;
import com.psiops.contracts.model.TaskPage;
import com.psiops.contracts.model.TaskUpdateRequest;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso do módulo de tarefas administrativas (PSI-027): CRUD simples
 * (título, vencimento e conclusão), listagem paginada com filtro de
 * pendência.
 *
 * <p>Tarefa não é um agregado Axon — ao contrário do lembrete (ver {@code
 * com.psiops.api.reminder.persistence.ReminderEntity}), não há
 * comando/evento nem disparo assíncrono associado a uma tarefa: é um CRUD
 * direto sobre a tabela {@code tasks}, mesmo padrão de {@code
 * com.psiops.api.patient.application.PatientService} (PSI-023).
 *
 * <p><strong>Isolamento multi-tenant estrito</strong>: todo método recebe
 * {@code userId} (resolvido pelo controller via {@code @CurrentUserId}) e
 * toda consulta/gravação passa por um método de {@link TaskRepository} que
 * filtra por {@code userId} — nunca um {@code findById} puro. Uma tarefa de
 * outra usuária é tratada como inexistente: {@link TaskNotFoundException}
 * (404) para operações por id, lista/página vazia para listagens — nunca
 * 403.
 */
@Service
public class TaskService {

  private static final int MAX_PAGE_SIZE = 100;

  private final TaskRepository taskRepository;

  public TaskService(TaskRepository taskRepository) {
    this.taskRepository = taskRepository;
  }

  @Transactional
  public Task create(UUID userId, TaskCreateRequest request) {
    TaskEntity entity =
        new TaskEntity(
            UUID.randomUUID(),
            userId,
            request.getTitle().trim(),
            request.getDueDate(),
            null,
            OffsetDateTime.now(ZoneOffset.UTC));
    taskRepository.save(entity);
    return TaskMapper.toContract(entity);
  }

  /**
   * Listagem paginada, escopada a {@code userId}, com filtro opcional {@code
   * pending}: quando {@code true}, retorna apenas tarefas não concluídas
   * ({@code completedAt IS NULL}) — conforme o contrato. Qualquer outro valor
   * (ausente ou {@code false}) não filtra por conclusão.
   */
  @Transactional(readOnly = true)
  public TaskPage list(UUID userId, int page, int size, Boolean pending) {
    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "createdAt"));

    Page<TaskEntity> result =
        Boolean.TRUE.equals(pending)
            ? taskRepository.findByUserIdAndCompletedAtIsNull(userId, pageable)
            : taskRepository.findByUserId(userId, pageable);

    List<Task> items = result.getContent().stream().map(TaskMapper::toContract).toList();
    PageMeta meta =
        new PageMeta(result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    return new TaskPage(items, meta);
  }

  /**
   * Atualiza título/vencimento e/ou conclusão. Título e vencimento seguem o
   * padrão de atualização parcial já usado em {@code PatientService#update}:
   * só os campos presentes (não nulos) no payload são alterados. {@code
   * completedAt} é diferente — conforme a descrição de {@code
   * TaskUpdateRequest} no contrato, presente conclui a tarefa (com o instante
   * informado), ausente/nulo sempre reabre, mesmo que a tarefa já estivesse
   * concluída.
   */
  @Transactional
  public Task update(UUID userId, UUID taskId, TaskUpdateRequest request) {
    TaskEntity entity = findOwned(userId, taskId);
    if (request.getTitle() != null) {
      entity.setTitle(request.getTitle().trim());
    }
    if (request.getDueDate() != null) {
      entity.setDueDate(request.getDueDate());
    }
    entity.setCompletedAt(request.getCompletedAt());
    taskRepository.save(entity);
    return TaskMapper.toContract(entity);
  }

  @Transactional
  public void delete(UUID userId, UUID taskId) {
    TaskEntity entity = findOwned(userId, taskId);
    taskRepository.delete(entity);
  }

  private TaskEntity findOwned(UUID userId, UUID taskId) {
    return taskRepository.findByIdAndUserId(taskId, userId).orElseThrow(() -> new TaskNotFoundException(taskId));
  }
}
