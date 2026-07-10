package com.psiops.api.notification.appointment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.psiops.api.appointment.domain.event.AppointmentCancelledEvent;
import com.psiops.api.appointment.domain.event.AppointmentCreatedEvent;
import com.psiops.api.appointment.domain.event.AppointmentRescheduledEvent;
import com.psiops.api.appointment.persistence.AppointmentEntity;
import com.psiops.api.appointment.persistence.AppointmentRepository;
import com.psiops.api.appointment.persistence.AppointmentStatus;
import com.psiops.api.reminder.domain.command.CancelReminderCommand;
import com.psiops.api.reminder.domain.command.ScheduleReminderCommand;
import com.psiops.api.reminder.persistence.ReminderChannel;
import com.psiops.api.reminder.persistence.ReminderEntity;
import com.psiops.api.reminder.persistence.ReminderRepository;
import com.psiops.api.reminder.persistence.ReminderStatus;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.axonframework.commandhandling.gateway.CommandGateway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * Testes de {@link AppointmentReminderPolicy} (PSI-029): criação dos dois
 * lembretes automáticos (véspera/dia) a partir de {@code
 * AppointmentCreatedEvent}, cancelamento em {@code
 * AppointmentCancelledEvent}, e cancelamento + recriação em {@code
 * AppointmentRescheduledEvent}. {@link CommandGateway} e os repositórios são
 * mockados - a tradução evento→deadline real é coberta por {@code
 * ReminderDeadlinePolicyTest} (que reage a {@code ScheduleReminderCommand}
 * SOMENTE depois que o agregado publica {@code ReminderScheduledEvent}, fora
 * do escopo deste teste unitário).
 */
class AppointmentReminderPolicyTest {

  private final CommandGateway commandGateway = mock(CommandGateway.class);
  private final ReminderRepository reminderRepository = mock(ReminderRepository.class);
  private final AppointmentRepository appointmentRepository = mock(AppointmentRepository.class);

  private AppointmentReminderPolicy policy;

  @BeforeEach
  void setUp() {
    policy = new AppointmentReminderPolicy(commandGateway, reminderRepository, appointmentRepository);
  }

  @Test
  void appointmentCreated_withStartsAtFarInFuture_schedulesBothVesperaAndDiaReminders() {
    UUID appointmentId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    OffsetDateTime startsAt = OffsetDateTime.now(ZoneOffset.UTC).plusDays(10);

    policy.on(new AppointmentCreatedEvent(appointmentId, userId, patientId, startsAt, 50, null, null, null, null, OffsetDateTime.now(ZoneOffset.UTC)));

    ArgumentCaptor<ScheduleReminderCommand> captor = ArgumentCaptor.forClass(ScheduleReminderCommand.class);
    verify(commandGateway, org.mockito.Mockito.times(2)).sendAndWait(captor.capture());
    List<ScheduleReminderCommand> commands = captor.getAllValues();
    assertThat(commands).hasSize(2);
    assertThat(commands).allMatch(c -> c.userId().equals(userId));
    assertThat(commands).allMatch(c -> c.patientId().equals(patientId));
    assertThat(commands).allMatch(c -> c.appointmentId().equals(appointmentId));
    assertThat(commands).allMatch(c -> c.chargeId() == null);
    assertThat(commands).allMatch(c -> c.channel() == ReminderChannel.EMAIL);
    // Uma véspera (dia anterior) e uma no dia da consulta.
    assertThat(commands).extracting(ScheduleReminderCommand::scheduledFor).allMatch(scheduledFor -> scheduledFor.isBefore(startsAt) || scheduledFor.toLocalDate().equals(startsAt.toLocalDate()));
  }

  @Test
  void appointmentCreated_withStartsAtSoon_skipsVesperaReminderAlreadyInThePast() {
    UUID appointmentId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    // Em menos de 1h - a véspera (18h do dia anterior) certamente já passou.
    OffsetDateTime startsAt = OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(30);

    policy.on(new AppointmentCreatedEvent(appointmentId, userId, patientId, startsAt, 50, null, null, null, null, OffsetDateTime.now(ZoneOffset.UTC)));

    // Só o lembrete de "dia" pode ainda estar no futuro (dependendo do
    // horário atual); em qualquer caso, nunca mais que os dois, e a véspera
    // nunca é despachada como esta consulta está a menos de 1h de distância.
    ArgumentCaptor<ScheduleReminderCommand> captor = ArgumentCaptor.forClass(ScheduleReminderCommand.class);
    verify(commandGateway, org.mockito.Mockito.atMost(1)).sendAndWait(captor.capture());
  }

  @Test
  void appointmentCancelled_cancelsAllScheduledLinkedReminders() {
    UUID appointmentId = UUID.randomUUID();
    ReminderEntity vespera = scheduledReminderFor(appointmentId);
    ReminderEntity dia = scheduledReminderFor(appointmentId);
    when(reminderRepository.findByAppointmentIdAndStatus(appointmentId, ReminderStatus.AGENDADO))
        .thenReturn(List.of(vespera, dia));

    policy.on(new AppointmentCancelledEvent(appointmentId, AppointmentStatus.AGENDADA, AppointmentStatus.CANCELADA, OffsetDateTime.now(ZoneOffset.UTC)));

    ArgumentCaptor<CancelReminderCommand> captor = ArgumentCaptor.forClass(CancelReminderCommand.class);
    verify(commandGateway, org.mockito.Mockito.times(2)).sendAndWait(captor.capture());
    assertThat(captor.getAllValues()).extracting(CancelReminderCommand::reminderId)
        .containsExactlyInAnyOrder(vespera.getId(), dia.getId());
  }

  @Test
  void appointmentRescheduled_cancelsExistingAndSchedulesNewOnesForNewStartsAt() {
    UUID appointmentId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    ReminderEntity existing = scheduledReminderFor(appointmentId);
    when(reminderRepository.findByAppointmentIdAndStatus(appointmentId, ReminderStatus.AGENDADO)).thenReturn(List.of(existing));
    AppointmentEntity appointment =
        new AppointmentEntity(appointmentId, userId, patientId, OffsetDateTime.now(ZoneOffset.UTC).plusDays(20), 50, null, AppointmentStatus.AGENDADA, OffsetDateTime.now(ZoneOffset.UTC));
    when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(appointment));

    OffsetDateTime newStartsAt = OffsetDateTime.now(ZoneOffset.UTC).plusDays(20);
    policy.on(
        new AppointmentRescheduledEvent(
            appointmentId,
            OffsetDateTime.now(ZoneOffset.UTC).plusDays(10),
            newStartsAt,
            50,
            50,
            null,
            null,
            null,
            OffsetDateTime.now(ZoneOffset.UTC)));

    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(commandGateway, org.mockito.Mockito.times(3)).sendAndWait(captor.capture());
    long cancelCount = captor.getAllValues().stream().filter(c -> c instanceof CancelReminderCommand).count();
    long scheduleCount = captor.getAllValues().stream().filter(c -> c instanceof ScheduleReminderCommand).count();
    assertThat(cancelCount).isEqualTo(1);
    assertThat(scheduleCount).isEqualTo(2);
  }

  @Test
  void appointmentRescheduled_appointmentNotFound_doesNotScheduleNewReminders() {
    UUID appointmentId = UUID.randomUUID();
    when(reminderRepository.findByAppointmentIdAndStatus(appointmentId, ReminderStatus.AGENDADO)).thenReturn(List.of());
    when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.empty());

    policy.on(
        new AppointmentRescheduledEvent(
            appointmentId,
            OffsetDateTime.now(ZoneOffset.UTC).plusDays(10),
            OffsetDateTime.now(ZoneOffset.UTC).plusDays(20),
            50,
            50,
            null,
            null,
            null,
            OffsetDateTime.now(ZoneOffset.UTC)));

    verify(commandGateway, never()).sendAndWait(any(ScheduleReminderCommand.class));
  }

  private ReminderEntity scheduledReminderFor(UUID appointmentId) {
    UUID reminderId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    return new ReminderEntity(
        reminderId,
        userId,
        ReminderChannel.EMAIL,
        "Lembrete: consulta hoje",
        "Você tem consulta agendada para hoje.",
        OffsetDateTime.now(ZoneOffset.UTC).plusHours(2),
        null,
        ReminderStatus.AGENDADO,
        patientId,
        appointmentId,
        null,
        OffsetDateTime.now(ZoneOffset.UTC));
  }
}
