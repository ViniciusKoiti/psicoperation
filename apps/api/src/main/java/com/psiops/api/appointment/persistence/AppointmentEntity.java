package com.psiops.api.appointment.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Consulta agendada na agenda da psicóloga — tabela {@code appointments}.
 *
 * <p>Espelha o schema {@code Appointment} do contrato de appointment
 * (PSI-020). Modela só a logística da agenda (horário, duração, recorrência
 * semanal simples e status); o registro de comparecimento é administrativo e
 * vive em {@link SessionRecordEntity}. Multi-tenant estrito: toda linha
 * carrega {@code userId} da psicóloga dona da agenda.
 */
@Entity
@Table(name = "appointments")
public class AppointmentEntity {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;

  @Column(name = "patient_id", nullable = false)
  private UUID patientId;

  @Column(name = "starts_at", nullable = false)
  private OffsetDateTime startsAt;

  @Column(name = "duration_minutes", nullable = false)
  private int durationMinutes;

  @Embedded private WeeklyRecurrence recurrence;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AppointmentStatus status;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  protected AppointmentEntity() {
    // Exigido pelo JPA.
  }

  public AppointmentEntity(
      UUID id,
      UUID userId,
      UUID patientId,
      OffsetDateTime startsAt,
      int durationMinutes,
      WeeklyRecurrence recurrence,
      AppointmentStatus status,
      OffsetDateTime createdAt) {
    this.id = id;
    this.userId = userId;
    this.patientId = patientId;
    this.startsAt = startsAt;
    this.durationMinutes = durationMinutes;
    this.recurrence = recurrence;
    this.status = status;
    this.createdAt = createdAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public UUID getPatientId() {
    return patientId;
  }

  public OffsetDateTime getStartsAt() {
    return startsAt;
  }

  public int getDurationMinutes() {
    return durationMinutes;
  }

  public WeeklyRecurrence getRecurrence() {
    return recurrence;
  }

  public AppointmentStatus getStatus() {
    return status;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
