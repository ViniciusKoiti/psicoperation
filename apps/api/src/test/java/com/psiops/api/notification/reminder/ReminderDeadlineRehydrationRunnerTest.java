package com.psiops.api.notification.reminder;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.psiops.api.reminder.persistence.ReminderChannel;
import com.psiops.api.reminder.persistence.ReminderEntity;
import com.psiops.api.reminder.persistence.ReminderRepository;
import com.psiops.api.reminder.persistence.ReminderStatus;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * Testes de {@link ReminderDeadlineRehydrationRunner} (PSI-029, risco do
 * manifesto: "{@code SimpleDeadlineManager} não sobrevive a restart") -
 * verifica que todo lembrete {@code AGENDADO} (de qualquer usuária) é
 * reagendado no {@link ReminderDeadlineScheduler} ao subir a aplicação,
 * inclusive um com {@code scheduledFor} já no passado (simulando um
 * lembrete perdido durante o tempo fora do ar).
 */
class ReminderDeadlineRehydrationRunnerTest {

  private final ReminderRepository reminderRepository = mock(ReminderRepository.class);
  private final ReminderDeadlineScheduler scheduler = mock(ReminderDeadlineScheduler.class);
  private final ReminderDeadlineRehydrationRunner runner =
      new ReminderDeadlineRehydrationRunner(reminderRepository, scheduler);

  private ReminderEntity agendado(OffsetDateTime scheduledFor) {
    return new ReminderEntity(
        UUID.randomUUID(),
        UUID.randomUUID(),
        ReminderChannel.EMAIL,
        "Lembrete",
        "Corpo",
        scheduledFor,
        null,
        ReminderStatus.AGENDADO,
        null,
        null,
        null,
        OffsetDateTime.now(ZoneOffset.UTC).minusDays(2));
  }

  @Test
  void rehydrate_reschedulesEveryPendingReminder_includingOnesInThePast() {
    ReminderEntity future = agendado(OffsetDateTime.now(ZoneOffset.UTC).plusHours(2));
    ReminderEntity missedWhileDown = agendado(OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(10));
    when(reminderRepository.findByStatus(ReminderStatus.AGENDADO)).thenReturn(List.of(future, missedWhileDown));

    runner.rehydrate();

    verify(scheduler, times(1)).schedule(eq(future.getId()), eq(future.getScheduledFor()));
    verify(scheduler, times(1)).schedule(eq(missedWhileDown.getId()), eq(missedWhileDown.getScheduledFor()));
  }

  @Test
  void rehydrate_withNoPendingReminders_schedulesNothing() {
    when(reminderRepository.findByStatus(ReminderStatus.AGENDADO)).thenReturn(List.of());

    runner.rehydrate();

    verify(scheduler, org.mockito.Mockito.never()).schedule(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
  }
}
