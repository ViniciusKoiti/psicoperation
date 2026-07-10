package com.psiops.api.reminder.persistence;

import com.psiops.api.reminder.domain.command.ScheduleReminderCommand;
import com.psiops.api.reminder.domain.event.ReminderScheduledEvent;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.axonframework.commandhandling.CommandHandler;
import org.axonframework.eventsourcing.EventSourcingHandler;
import org.axonframework.modelling.command.AggregateIdentifier;
import org.axonframework.modelling.command.AggregateLifecycle;
import org.axonframework.spring.stereotype.Aggregate;

/**
 * Lembrete agendado/enviado pela psicóloga a um paciente — tabela {@code
 * reminders}.
 *
 * <p>Espelha o schema {@code Reminder} do contrato de reminder (PSI-020). Os
 * vínculos ({@code patientId}/{@code appointmentId}/{@code chargeId}) são
 * todos opcionais e independentes. Multi-tenant estrito: toda linha carrega
 * {@code userId} da psicóloga dona do lembrete.
 *
 * <p><strong>Agregado Axon state-stored (PSI-027)</strong>: mesmo padrão de
 * {@code com.psiops.api.appointment.persistence.AppointmentEntity} (PSI-024)
 * e {@code com.psiops.api.billing.persistence.ChargeEntity} (PSI-026) — esta
 * classe é, simultaneamente, a entidade JPA de persistência e o agregado
 * Axon (repositório {@code GenericJpaRepository} explícito, ver {@link
 * com.psiops.api.reminder.config.ReminderAggregateRepositoryConfig}). O
 * {@code @CommandHandler} só aplica o evento de agendamento — validações que
 * dependem de outros repositórios (posse do vínculo opcional, momento no
 * futuro) são responsabilidade do caso de uso ({@code ReminderService}),
 * antes de despachar o comando (ver javadoc de {@code
 * ScheduleReminderCommand} sobre o limite desta tarefa: nenhum {@code
 * DeadlineManager} é acionado aqui — isso é exclusivo da PSI-029).
 */
@Entity
@Table(name = "reminders")
@Aggregate(repository = "reminderAggregateRepository")
public class ReminderEntity {

  @Id
  @AggregateIdentifier
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

  // ---------------------------------------------------------------------
  // Comando e evento Axon (PSI-027). Ver javadoc da classe e de {@code
  // ScheduleReminderCommand}: o @CommandHandler só aplica o fato de
  // agendamento; posse do vínculo opcional e validade do momento futuro são
  // checadas pelo caso de uso antes de despachar o comando.
  // ---------------------------------------------------------------------

  @CommandHandler
  public ReminderEntity(ScheduleReminderCommand command) {
    AggregateLifecycle.apply(
        new ReminderScheduledEvent(
            command.reminderId(),
            command.userId(),
            command.channel(),
            command.subject(),
            command.body(),
            command.scheduledFor(),
            command.patientId(),
            command.appointmentId(),
            command.chargeId(),
            command.createdAt()));
  }

  @EventSourcingHandler
  public void on(ReminderScheduledEvent event) {
    this.id = event.reminderId();
    this.userId = event.userId();
    this.channel = event.channel();
    this.subject = event.subject();
    this.body = event.body();
    this.scheduledFor = event.scheduledFor();
    this.sentAt = null;
    this.status = ReminderStatus.AGENDADO;
    this.patientId = event.patientId();
    this.appointmentId = event.appointmentId();
    this.chargeId = event.chargeId();
    this.createdAt = event.createdAt();
  }
}
