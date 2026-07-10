package com.psiops.api.notification.reminder;

import static org.assertj.core.api.Assertions.assertThat;

import com.psiops.api.reminder.domain.event.ReminderCancelledEvent;
import com.psiops.api.reminder.domain.event.ReminderScheduledEvent;
import com.psiops.api.reminder.persistence.ReminderChannel;
import com.psiops.api.reminder.persistence.ReminderEntity;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.axonframework.deadline.DeadlineMessage;
import org.axonframework.messaging.ScopeDescriptor;
import org.axonframework.test.deadline.ScheduledDeadlineInfo;
import org.axonframework.test.deadline.StubDeadlineManager;
import org.junit.jupiter.api.Test;

/**
 * Testes de {@link ReminderDeadlinePolicy}/{@link ReminderDeadlineScheduler}
 * com {@link StubDeadlineManager} (PSI-029): agendamento, cancelamento e
 * expiração de deadline.
 *
 * <p><strong>Por que não {@code AggregateTestFixture} aqui</strong>: o
 * agendamento do deadline acontece FORA do agregado {@code ReminderEntity}
 * (ver seu javadoc) - o {@code StubDeadlineManager} interno de uma {@code
 * AggregateTestFixture<ReminderEntity>} nunca teria nada agendado, já que
 * nada dentro do agregado chama {@code DeadlineManager.schedule(...)} (mesmo
 * padrão documentado em {@code
 * com.psiops.api.axonsample.domain.SampleTaskAggregateTest}). Este teste
 * instancia o {@code StubDeadlineManager} diretamente e o injeta no mesmo
 * {@link ReminderDeadlineScheduler} usado em produção - cobrindo
 * agendamento, cancelamento E expiração com o dublê de teste do próprio
 * Axon, exatamente onde essa lógica vive nesta arquitetura.
 */
class ReminderDeadlinePolicyTest {

  private final StubDeadlineManager deadlineManager = new StubDeadlineManager();
  private final ReminderDeadlineScheduler scheduler = new ReminderDeadlineScheduler(deadlineManager);
  private final ReminderDeadlinePolicy policy = new ReminderDeadlinePolicy(scheduler);

  private ReminderScheduledEvent scheduledEvent(UUID reminderId, OffsetDateTime scheduledFor) {
    return new ReminderScheduledEvent(
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
  void reminderScheduledEvent_schedulesDeadlineWithReminderIdAsPayload() {
    UUID reminderId = UUID.randomUUID();
    OffsetDateTime scheduledFor = OffsetDateTime.now(ZoneOffset.UTC).plusHours(1);

    policy.on(scheduledEvent(reminderId, scheduledFor));

    List<ScheduledDeadlineInfo> scheduled = deadlineManager.getScheduledDeadlines();
    assertThat(scheduled).hasSize(1);
    ScheduledDeadlineInfo info = scheduled.get(0);
    assertThat(info.getDeadlineName()).isEqualTo(ReminderEntity.REMINDER_DUE_DEADLINE_NAME);
    assertThat(info.deadlineMessage().getPayload()).isEqualTo(reminderId);
    assertThat(info.getScheduleTime()).isEqualTo(scheduledFor.toInstant());
  }

  @Test
  void reminderCancelledEvent_cancelsThePendingDeadline() {
    UUID reminderId = UUID.randomUUID();
    OffsetDateTime scheduledFor = OffsetDateTime.now(ZoneOffset.UTC).plusHours(1);
    policy.on(scheduledEvent(reminderId, scheduledFor));
    assertThat(deadlineManager.getScheduledDeadlines()).hasSize(1);

    policy.on(new ReminderCancelledEvent(reminderId, OffsetDateTime.now(ZoneOffset.UTC)));

    assertThat(deadlineManager.getScheduledDeadlines()).isEmpty();
  }

  @Test
  void cancellingOneReminder_doesNotAffectAnotherRemindersDeadline() {
    UUID reminderA = UUID.randomUUID();
    UUID reminderB = UUID.randomUUID();
    OffsetDateTime scheduledFor = OffsetDateTime.now(ZoneOffset.UTC).plusHours(1);
    policy.on(scheduledEvent(reminderA, scheduledFor));
    policy.on(scheduledEvent(reminderB, scheduledFor));

    policy.on(new ReminderCancelledEvent(reminderA, OffsetDateTime.now(ZoneOffset.UTC)));

    List<ScheduledDeadlineInfo> remaining = deadlineManager.getScheduledDeadlines();
    assertThat(remaining).hasSize(1);
    assertThat(remaining.get(0).deadlineMessage().getPayload()).isEqualTo(reminderB);
  }

  @Test
  void deadlineFiresWithReminderIdPayload_whenTimeAdvancesPastScheduledInstant() throws Exception {
    UUID reminderId = UUID.randomUUID();
    OffsetDateTime scheduledFor = OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(10);
    policy.on(scheduledEvent(reminderId, scheduledFor));

    List<Object> firedPayloads = new ArrayList<>();
    List<String> firedNames = new ArrayList<>();
    Instant advanceTo = scheduledFor.toInstant().plusSeconds(1);
    deadlineManager.advanceTimeTo(
        advanceTo,
        (ScopeDescriptor scope, DeadlineMessage<?> message) -> {
          firedNames.add(message.getDeadlineName());
          firedPayloads.add(message.getPayload());
        });

    assertThat(firedNames).containsExactly(ReminderEntity.REMINDER_DUE_DEADLINE_NAME);
    assertThat(firedPayloads).containsExactly(reminderId);
    assertThat(deadlineManager.getScheduledDeadlines()).isEmpty();
  }
}
