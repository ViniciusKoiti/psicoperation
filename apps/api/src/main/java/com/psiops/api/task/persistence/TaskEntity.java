package com.psiops.api.task.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Tarefa administrativa (lembrete interno de afazer da psicóloga) — tabela
 * {@code tasks}.
 *
 * <p>Espelha o schema {@code Task} do contrato de task (PSI-020). Multi-tenant
 * estrito: toda linha carrega {@code userId} da psicóloga dona da tarefa.
 */
@Entity
@Table(name = "tasks")
public class TaskEntity {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;

  @Column(nullable = false, length = 200)
  private String title;

  @Column(name = "due_date")
  private LocalDate dueDate;

  @Column(name = "completed_at")
  private OffsetDateTime completedAt;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  protected TaskEntity() {
    // Exigido pelo JPA.
  }

  public TaskEntity(
      UUID id,
      UUID userId,
      String title,
      LocalDate dueDate,
      OffsetDateTime completedAt,
      OffsetDateTime createdAt) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.dueDate = dueDate;
    this.completedAt = completedAt;
    this.createdAt = createdAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getTitle() {
    return title;
  }

  public LocalDate getDueDate() {
    return dueDate;
  }

  public OffsetDateTime getCompletedAt() {
    return completedAt;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  // Mutadores usados pelo caso de uso de atualização/conclusão (PSI-027). A
  // entidade permanece carregada dentro de uma transação (ver
  // com.psiops.api.task.application.TaskService); o dirty-checking do
  // Hibernate persiste as alterações no commit. Mesmo padrão de {@code
  // com.psiops.api.patient.persistence.PatientEntity} (CRUD sem Axon: uma
  // tarefa não é um agregado state-stored, ao contrário do lembrete).

  public void setTitle(String title) {
    this.title = title;
  }

  public void setDueDate(LocalDate dueDate) {
    this.dueDate = dueDate;
  }

  public void setCompletedAt(OffsetDateTime completedAt) {
    this.completedAt = completedAt;
  }
}
