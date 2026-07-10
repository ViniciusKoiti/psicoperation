package com.psiops.api.notification.reminder;

import com.psiops.api.reminder.persistence.ReminderEntity;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.axonframework.deadline.DeadlineManager;
import org.axonframework.modelling.command.AggregateScopeDescriptor;
import org.springframework.stereotype.Component;

/**
 * Agenda/cancela o deadline real de um {@link ReminderEntity} no {@link
 * DeadlineManager} (PSI-029). Extraído como componente próprio para ser
 * reutilizado tanto por {@link ReminderDeadlinePolicy} (reage a eventos em
 * tempo real) quanto por {@link ReminderDeadlineRehydrationRunner}
 * (reagenda no startup) - a mesma lógica de agendamento, chamada em dois
 * gatilhos diferentes.
 *
 * <p>Aponta sempre para o mesmo agregado ({@link ReminderEntity}, via {@link
 * AggregateScopeDescriptor}), nunca para o agregado de consulta ou de
 * cobrança - mesmo os lembretes de véspera/dia de consulta (criados por
 * {@code com.psiops.api.notification.appointment.AppointmentReminderPolicy})
 * são {@code ReminderEntity} comuns.
 */
@Component
public class ReminderDeadlineScheduler {

  private final DeadlineManager deadlineManager;

  public ReminderDeadlineScheduler(DeadlineManager deadlineManager) {
    this.deadlineManager = deadlineManager;
  }

  /**
   * Agenda o deadline para o instante {@code scheduledFor}. Se já estiver no
   * passado (ex.: reidratação após um reinício mais longo que o atraso
   * planejado), o {@code DeadlineManager} dispara assim que possível - ver
   * javadoc de {@code ReminderDeadlineRehydrationRunner}.
   */
  public void schedule(UUID reminderId, OffsetDateTime scheduledFor) {
    deadlineManager.schedule(
        scheduledFor.toInstant(),
        ReminderEntity.REMINDER_DUE_DEADLINE_NAME,
        reminderId,
        scope(reminderId));
  }

  /** Cancela todo deadline pendente para o lembrete (idempotente: sem efeito se não houver nenhum agendado). */
  public void cancel(UUID reminderId) {
    deadlineManager.cancelAllWithinScope(ReminderEntity.REMINDER_DUE_DEADLINE_NAME, scope(reminderId));
  }

  private AggregateScopeDescriptor scope(UUID reminderId) {
    return new AggregateScopeDescriptor(ReminderEntity.class.getSimpleName(), reminderId);
  }
}
