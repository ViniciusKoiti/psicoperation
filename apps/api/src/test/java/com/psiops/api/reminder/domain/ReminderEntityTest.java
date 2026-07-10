package com.psiops.api.reminder.domain;

import com.psiops.api.reminder.domain.command.CancelReminderCommand;
import com.psiops.api.reminder.domain.command.ScheduleReminderCommand;
import com.psiops.api.reminder.domain.event.ReminderCancelledEvent;
import com.psiops.api.reminder.domain.event.ReminderScheduledEvent;
import com.psiops.api.reminder.persistence.ReminderChannel;
import com.psiops.api.reminder.persistence.ReminderEntity;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.axonframework.test.aggregate.AggregateTestFixture;
import org.axonframework.test.aggregate.FixtureConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Testes do agregado de lembrete ({@link ReminderEntity}) com {@link
 * AggregateTestFixture} - cobre {@link CancelReminderCommand} (PSI-029:
 * cancelamento idempotente) isoladamente, sem subir contexto Spring nem
 * PostgreSQL.
 *
 * <p><strong>Sem teste aqui para o disparo do {@code @DeadlineHandler}</strong>:
 * o agendamento real do deadline acontece fora do agregado (ver {@code
 * com.psiops.api.notification.reminder.ReminderDeadlinePolicy} e o javadoc de
 * {@code ReminderEntity#REMINDER_DUE_DEADLINE_NAME}) - mesma justificativa e
 * mesmo padrão de {@code
 * com.psiops.api.axonsample.domain.SampleTaskAggregateTest}: como nada
 * dentro do agregado chama {@code DeadlineManager.schedule(...)}, a fixture
 * (que usa um {@code StubDeadlineManager} interno) nunca tem um deadline
 * agendado para avançar. A expiração do deadline é coberta com {@code
 * StubDeadlineManager} diretamente contra {@code ReminderDeadlinePolicy}
 * (ver {@code
 * com.psiops.api.notification.reminder.ReminderDeadlinePolicyTest}, que
 * testa onde o agendamento realmente acontece) e ponta a ponta com o {@code
 * SimpleDeadlineManager} real em {@code
 * com.psiops.api.notification.NotificationFlowIntegrationTest}.
 */
class ReminderEntityTest {

  private FixtureConfiguration<ReminderEntity> fixture;

  @BeforeEach
  void setUp() {
    fixture = new AggregateTestFixture<>(ReminderEntity.class);
  }

  private ScheduleReminderCommand scheduleCommand(UUID reminderId, OffsetDateTime scheduledFor) {
    return new ScheduleReminderCommand(
        reminderId,
        UUID.randomUUID(),
        ReminderChannel.EMAIL,
        "Lembrete de pagamento",
        "Olá, sua mensalidade vence em breve.",
        scheduledFor,
        null,
        null,
        null,
        OffsetDateTime.now(ZoneOffset.UTC));
  }

  @Test
  void cancelsScheduledReminder() {
    UUID reminderId = UUID.randomUUID();
    OffsetDateTime scheduledFor = OffsetDateTime.now(ZoneOffset.UTC).plusDays(1);
    OffsetDateTime cancelledAt = OffsetDateTime.now(ZoneOffset.UTC);

    fixture
        .given(scheduleEvent(reminderId, scheduledFor))
        .when(new CancelReminderCommand(reminderId, cancelledAt))
        .expectSuccessfulHandlerExecution()
        .expectEvents(new ReminderCancelledEvent(reminderId, cancelledAt));
  }

  @Test
  void cancellingTwiceIsIdempotent_secondCancelEmitsNoEvent() {
    UUID reminderId = UUID.randomUUID();
    OffsetDateTime scheduledFor = OffsetDateTime.now(ZoneOffset.UTC).plusDays(1);
    OffsetDateTime firstCancel = OffsetDateTime.now(ZoneOffset.UTC);
    OffsetDateTime secondCancel = firstCancel.plusMinutes(1);

    fixture
        .given(scheduleEvent(reminderId, scheduledFor), new ReminderCancelledEvent(reminderId, firstCancel))
        .when(new CancelReminderCommand(reminderId, secondCancel))
        .expectSuccessfulHandlerExecution()
        .expectNoEvents();
  }

  private ReminderScheduledEvent scheduleEvent(UUID reminderId, OffsetDateTime scheduledFor) {
    ScheduleReminderCommand command = scheduleCommand(reminderId, scheduledFor);
    return new ReminderScheduledEvent(
        command.reminderId(),
        command.userId(),
        command.channel(),
        command.subject(),
        command.body(),
        command.scheduledFor(),
        command.patientId(),
        command.appointmentId(),
        command.chargeId(),
        command.createdAt());
  }
}
