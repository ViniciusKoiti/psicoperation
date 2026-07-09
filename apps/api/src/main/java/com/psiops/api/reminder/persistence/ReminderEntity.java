package com.psiops.api.reminder.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Lembrete agendado/enviado pela psicóloga a um paciente — tabela {@code
 * reminders}.
 *
 * <p>Espelha o schema {@code Reminder} do contrato de reminder (PSI-020). Os
 * vínculos ({@code patientId}/{@code appointmentId}/{@code chargeId}) são
 * todos opcionais e independentes. Multi-tenant estrito: toda linha carrega
 * {@code userId} da psicóloga dona do lembrete.
 */
@Entity
@Table(name = "reminders")
public class ReminderEntity {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ReminderChannel channel;

  @Column(nullable = false, length = 200)
  private String subject;

  @Column(nullable = false, length = 2000)
  private String body;

  @Column(name = "scheduled_for", nullable = false)
  private OffsetDateTime scheduledFor;

  @Column(name = "sent_at")
  private OffsetDateTime sentAt;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ReminderStatus status;

  @Column(name = "patient_id")
  private UUID patientId;

  @Column(name = "appointment_id")
  private UUID appointmentId;

  @Column(name = "charge_id")
  private UUID chargeId;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  protected ReminderEntity() {
    // Exigido pelo JPA.
  }

  public ReminderEntity(
      UUID id,
      UUID userId,
      ReminderChannel channel,
      String subject,
      String body,
      OffsetDateTime scheduledFor,
      OffsetDateTime sentAt,
      ReminderStatus status,
      UUID patientId,
      UUID appointmentId,
      UUID chargeId,
      OffsetDateTime createdAt) {
    this.id = id;
    this.userId = userId;
    this.channel = channel;
    this.subject = subject;
    this.body = body;
    this.scheduledFor = scheduledFor;
    this.sentAt = sentAt;
    this.status = status;
    this.patientId = patientId;
    this.appointmentId = appointmentId;
    this.chargeId = chargeId;
    this.createdAt = createdAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public ReminderChannel getChannel() {
    return channel;
  }

  public String getSubject() {
    return subject;
  }

  public String getBody() {
    return body;
  }

  public OffsetDateTime getScheduledFor() {
    return scheduledFor;
  }

  public OffsetDateTime getSentAt() {
    return sentAt;
  }

  public ReminderStatus getStatus() {
    return status;
  }

  public UUID getPatientId() {
    return patientId;
  }

  public UUID getAppointmentId() {
    return appointmentId;
  }

  public UUID getChargeId() {
    return chargeId;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
