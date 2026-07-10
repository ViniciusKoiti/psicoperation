package com.psiops.api.appointment.persistence;

import com.psiops.api.appointment.domain.InvalidAppointmentStateException;
import com.psiops.api.appointment.domain.command.CancelAppointmentCommand;
import com.psiops.api.appointment.domain.command.CreateAppointmentCommand;
import com.psiops.api.appointment.domain.command.RescheduleAppointmentCommand;
import com.psiops.api.appointment.domain.event.AppointmentCancelledEvent;
import com.psiops.api.appointment.domain.event.AppointmentCreatedEvent;
import com.psiops.api.appointment.domain.event.AppointmentRescheduledEvent;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
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
 * Consulta agendada na agenda da psicóloga — tabela {@code appointments}.
 *
 * <p>Espelha o schema {@code Appointment} do contrato de appointment
 * (PSI-020). Modela só a logística da agenda (horário, duração, recorrência
 * semanal simples e status); o registro de comparecimento é administrativo e
 * vive em {@link SessionRecordEntity}. Multi-tenant estrito: toda linha
 * carrega {@code userId} da psicóloga dona da agenda.
 *
 * <p><strong>Agregado Axon state-stored (PSI-024)</strong>: esta classe é,
 * simultaneamente, a entidade JPA de persistência e o agregado Axon — mesmo
 * padrão documentado em {@code com.psiops.api.axonsample.domain.SampleTaskAggregate}
 * (repositório {@code GenericJpaRepository} explícito, ver {@link
 * com.psiops.api.appointment.config.AppointmentAggregateRepositoryConfig}).
 * Os {@code @CommandHandler} validam as invariantes do PRÓPRIO agregado
 * (ex.: só é possível remarcar uma consulta {@code agendada}); a detecção de
 * conflito de horário contra OUTRAS consultas — que exige consultar o
 * repositório — é responsabilidade do caso de uso ({@code
 * AppointmentService}), antes de despachar o comando, nunca do agregado.
 *
 * <p><strong>{@code @Id} continua {@code UUID}</strong>: {@code
 * Repository<T>#load} do Axon resolve o identificador do agregado como
 * {@code String} por padrão (rotas de comando são sempre {@code String}) —
 * mas o {@code GenericJpaRepository} aceita um {@code identifierConverter}
 * explícito ({@code String -> UUID}) para casar com o {@code @Id} real da
 * entidade sem exigir que o campo Java vire {@code String} nem que a coluna
 * {@code appointments.id} (migration V2, imutável, tipo {@code uuid}) mude —
 * ver {@link com.psiops.api.appointment.config.AppointmentAggregateRepositoryConfig}.
 */
@Entity
@Table(name = "appointments")
@Aggregate(repository = "appointmentAggregateRepository")
public class AppointmentEntity {

  @Id
  @AggregateIdentifier
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

  // ---------------------------------------------------------------------
  // Comandos e eventos Axon (PSI-024). Ver javadoc da classe: os
  // @CommandHandler só validam invariantes do PRÓPRIO agregado; conflito de
  // horário é checado antes, no caso de uso.
  // ---------------------------------------------------------------------

  @CommandHandler
  public AppointmentEntity(CreateAppointmentCommand command) {
    AggregateLifecycle.apply(
        new AppointmentCreatedEvent(
            command.appointmentId(),
            command.userId(),
            command.patientId(),
            command.startsAt(),
            command.durationMinutes(),
            command.seriesId(),
            command.recurrenceWeekday(),
            command.recurrenceInterval(),
            command.recurrenceUntil(),
            command.createdAt()));
  }

  @CommandHandler
  public void handle(RescheduleAppointmentCommand command) {
    if (status != AppointmentStatus.AGENDADA) {
      throw new InvalidAppointmentStateException(
          "não é possível remarcar uma consulta com status " + status);
    }
    AggregateLifecycle.apply(
        new AppointmentRescheduledEvent(
            id,
            startsAt,
            command.newStartsAt(),
            durationMinutes,
            command.newDurationMinutes(),
            command.recurrenceWeekday(),
            command.recurrenceInterval(),
            command.recurrenceUntil(),
            command.rescheduledAt()));
  }

  @CommandHandler
  public void handle(CancelAppointmentCommand command) {
    if (status == AppointmentStatus.CANCELADA || status == AppointmentStatus.REMARCADA) {
      // Idempotente: consulta já encerrada, nenhum evento novo é publicado.
      return;
    }
    AggregateLifecycle.apply(
        new AppointmentCancelledEvent(id, status, command.resultingStatus(), command.cancelledAt()));
  }

  @EventSourcingHandler
  public void on(AppointmentCreatedEvent event) {
    this.id = event.appointmentId();
    this.userId = event.userId();
    this.patientId = event.patientId();
    this.startsAt = event.startsAt();
    this.durationMinutes = event.durationMinutes();
    this.recurrence =
        event.recurrenceWeekday() == null
            ? null
            : new WeeklyRecurrence(
                event.recurrenceWeekday(), event.recurrenceInterval(), event.recurrenceUntil());
    this.status = AppointmentStatus.AGENDADA;
    this.createdAt = event.createdAt();
  }

  @EventSourcingHandler
  public void on(AppointmentRescheduledEvent event) {
    this.startsAt = event.newStartsAt();
    this.durationMinutes = event.newDurationMinutes();
    this.recurrence =
        event.recurrenceWeekday() == null
            ? null
            : new WeeklyRecurrence(
                event.recurrenceWeekday(), event.recurrenceInterval(), event.recurrenceUntil());
    this.status = AppointmentStatus.AGENDADA;
  }

  @EventSourcingHandler
  public void on(AppointmentCancelledEvent event) {
    this.status = event.resultingStatus();
  }
}
