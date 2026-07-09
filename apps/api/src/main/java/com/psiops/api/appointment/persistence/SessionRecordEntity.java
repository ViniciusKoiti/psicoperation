package com.psiops.api.appointment.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Registro ADMINISTRATIVO de uma consulta — tabela {@code session_records}.
 *
 * <p>Espelha o schema {@code AttendanceRecord} do contrato de appointment
 * (PSI-020), vinculado 1‑para‑1 à consulta ({@code appointmentId}).
 *
 * <p><strong>AUSÊNCIA PROPOSITAL DE DADOS CLÍNICOS</strong> (restrição de
 * produto inviolável): esta entidade contém somente o status administrativo
 * de comparecimento ({@link AttendanceStatus}) e uma anotação administrativa
 * livre ({@code administrativeNotes}). NENHUMA coluna de diagnóstico,
 * evolução, queixa, conduta ou qualquer dado clínico/de saúde existe ou deve
 * ser adicionada aqui.
 */
@Entity
@Table(name = "session_records")
public class SessionRecordEntity {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;

  @Column(name = "appointment_id", nullable = false, updatable = false, unique = true)
  private UUID appointmentId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AttendanceStatus attendance;

  @Column(name = "administrative_notes", length = 2000)
  private String administrativeNotes;

  @Column(name = "recorded_at")
  private OffsetDateTime recordedAt;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  protected SessionRecordEntity() {
    // Exigido pelo JPA.
  }

  public SessionRecordEntity(
      UUID id,
      UUID userId,
      UUID appointmentId,
      AttendanceStatus attendance,
      String administrativeNotes,
      OffsetDateTime recordedAt,
      OffsetDateTime createdAt) {
    this.id = id;
    this.userId = userId;
    this.appointmentId = appointmentId;
    this.attendance = attendance;
    this.administrativeNotes = administrativeNotes;
    this.recordedAt = recordedAt;
    this.createdAt = createdAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public UUID getAppointmentId() {
    return appointmentId;
  }

  public AttendanceStatus getAttendance() {
    return attendance;
  }

  public String getAdministrativeNotes() {
    return administrativeNotes;
  }

  public OffsetDateTime getRecordedAt() {
    return recordedAt;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
