package com.psiops.api.notification.reminder;

import com.psiops.api.reminder.domain.event.ReminderCancelledEvent;
import com.psiops.api.reminder.domain.event.ReminderScheduledEvent;
import org.axonframework.config.ProcessingGroup;
import org.axonframework.eventhandling.EventHandler;
import org.springframework.stereotype.Component;

/**
 * Traduz o ciclo de vida de um lembrete ({@code ReminderEntity}, PSI-027) em
 * deadlines reais no {@code DeadlineManager} (PSI-029).
 *
 * <p>Mesmo gabarito de {@code
 * com.psiops.api.axonsample.application.SampleTaskReminderPolicy}: um {@code
 * @Component} Spring comum (injeção de construtor, não resolução de
 * parâmetro de handler Axon) reagindo a eventos de domínio - ver javadoc de
 * {@code ReminderEntity} sobre por que o agendamento não acontece dentro do
 * próprio agregado.
 *
 * <p>Processing group {@code reminder-deadlines} (modo {@code subscribing},
 * ver {@code application.yml}): agendar/cancelar um deadline é uma operação
 * rápida e sem I/O externo (ao contrário do envio de e-mail), então rodar
 * síncrono com a publicação do evento é seguro e torna o comportamento
 * determinístico (sem depender de polling em teste) - diferente do grupo
 * {@code email-delivery}, que isola justamente as chamadas de SMTP.
 */
@Component
@ProcessingGroup("reminder-deadlines")
public class ReminderDeadlinePolicy {

  private final ReminderDeadlineScheduler scheduler;

  public ReminderDeadlinePolicy(ReminderDeadlineScheduler scheduler) {
    this.scheduler = scheduler;
  }

  @EventHandler
  public void on(ReminderScheduledEvent event) {
    scheduler.schedule(event.reminderId(), event.scheduledFor());
  }

  @EventHandler
  public void on(ReminderCancelledEvent event) {
    scheduler.cancel(event.reminderId());
  }
}
