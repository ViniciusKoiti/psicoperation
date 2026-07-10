package com.psiops.api.task.web;

import com.psiops.api.auth.web.CurrentUserId;
import com.psiops.api.task.application.TaskService;
import com.psiops.contracts.model.Task;
import com.psiops.contracts.model.TaskCreateRequest;
import com.psiops.contracts.model.TaskPage;
import com.psiops.contracts.model.TaskUpdateRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de tarefas administrativas conforme os contratos em {@code
 * packages/contracts/openapi/paths/task/*.yaml} (PSI-027): {@code GET
 * /tasks}, {@code POST /tasks}, {@code PUT /tasks/{taskId}} e {@code DELETE
 * /tasks/{taskId}}.
 *
 * <p>Todos os DTOs de request/response vêm de {@code
 * com.psiops.contracts.model} (gerados de {@code openapi.yaml}); nenhum é
 * redefinido aqui.
 *
 * <p><strong>Isolamento multi-tenant</strong>: todo método resolve {@code
 * userId} exclusivamente via {@code @CurrentUserId} (nunca lê o {@code
 * SecurityContextHolder} diretamente) e repassa ao {@link TaskService}, que
 * garante que toda consulta/gravação seja escopada a essa usuária.
 *
 * <p>O contrato não declara {@code GET /tasks/{taskId}} (nenhum path de
 * leitura por id, ao contrário de patient/appointment/charge) — este
 * controller expõe exatamente os quatro métodos do contrato, nada além.
 */
@RestController
@RequestMapping("/tasks")
public class TaskController {

  private final TaskService taskService;

  public TaskController(TaskService taskService) {
    this.taskService = taskService;
  }

  @GetMapping
  public TaskPage list(
      @CurrentUserId UUID userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) Boolean pending) {
    return taskService.list(userId, page, size, pending);
  }

  @PostMapping
  public ResponseEntity<Task> create(@CurrentUserId UUID userId, @Valid @RequestBody TaskCreateRequest request) {
    Task created = taskService.create(userId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @PutMapping("/{taskId}")
  public Task update(
      @CurrentUserId UUID userId, @PathVariable UUID taskId, @Valid @RequestBody TaskUpdateRequest request) {
    return taskService.update(userId, taskId, request);
  }

  @DeleteMapping("/{taskId}")
  public ResponseEntity<Void> delete(@CurrentUserId UUID userId, @PathVariable UUID taskId) {
    taskService.delete(userId, taskId);
    return ResponseEntity.noContent().build();
  }
}
