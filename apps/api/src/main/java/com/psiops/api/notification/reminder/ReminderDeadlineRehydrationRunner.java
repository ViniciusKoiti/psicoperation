package com.psiops.api.notification.reminder;

import com.psiops.api.reminder.persistence.ReminderEntity;
import com.psiops.api.reminder.persistence.ReminderRepository;
import com.psiops.api.reminder.persistence.ReminderStatus;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reidratação de deadlines no startup (PSI-029, risco documentado no
 * manifesto: "{@code SimpleDeadlineManager} não sobrevive a restart da
 * aplicação").
 *
 * <p><strong>Por que reidratação, e não db-scheduler/JobRunr</strong>:
 * ambos exigiriam tabelas próprias, e a única migration permitida nesta
 * tarefa é nenhuma (as tabelas disponíveis são as da PSI-021/V2, imutáveis).
 * Em vez de trocar o {@code DeadlineManager}, este componente relê do banco
 * (coluna já existente {@code reminders.status}) todo lembrete ainda {@code
 * AGENDADO} - de QUALQUER usuária, não apenas quem estiver logada no momento
 * do restart - e reagenda seu deadline via {@link ReminderDeadlineScheduler},
 * a mesma lógica usada em tempo real por {@link ReminderDeadlinePolicy}.
 *
 * <p>Cobre, de graça, tanto lembretes gerais (PSI-027, criados via {@code
 * POST /reminders}) quanto os de véspera/dia de consulta (PSI-029, criados
 * por {@code
 * com.psiops.api.notification.appointment.AppointmentReminderPolicy}) - ambos
 * são a mesma entidade {@link ReminderEntity}.
 *
 * <p><strong>Lembretes cujo {@code scheduledFor} já passou</strong> durante o
 * tempo em que a aplicação esteve fora do ar são reagendados do mesmo jeito
 * - {@code DeadlineManager.schedule} com um instante no passado dispara
 * assim que possível (delay negativo é tratado como zero pelo {@code
 * ScheduledExecutorService} subjacente do {@code SimpleDeadlineManager}),
 * então o lembrete ainda é entregue, só que atrasado em vez de silenciosamente
 * perdido - trade-off aceitável e documentado para o MVP.
 *
 * <p><strong>Sem risco de agendamento duplicado</strong>: como o processo
 * acabou de subir, o {@code SimpleDeadlineManager} em memória está
 * necessariamente vazio - não há deadline pré-existente que este runner
 * possa duplicar.
 */
@Component
public class ReminderDeadlineRehydrationRunner {

  private static final Logger log = LoggerFactory.getLogger(ReminderDeadlineRehydrationRunner.class);

  private final ReminderRepository reminderRepository;
  private final ReminderDeadlineScheduler scheduler;

  public ReminderDeadlineRehydrationRunner(ReminderRepository reminderRepository, ReminderDeadlineScheduler scheduler) {
    this.reminderRepository = reminderRepository;
    this.scheduler = scheduler;
  }

  @EventListener(ApplicationReadyEvent.class)
  @Transactional(readOnly = true)
  public void rehydrate() {
    List<ReminderEntity> pending = reminderRepository.findByStatus(ReminderStatus.AGENDADO);
    for (ReminderEntity reminder : pending) {
      scheduler.schedule(reminder.getId(), reminder.getScheduledFor());
    }
    log.info(
        "Reidratação de deadlines (PSI-029): {} lembrete(s) AGENDADO(s) reagendado(s) no DeadlineManager após inicialização",
        pending.size());
  }
}
