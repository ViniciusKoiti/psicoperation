package com.psiops.api.axonsample.application;

import com.psiops.api.axonsample.domain.SampleTaskAggregate;
import com.psiops.api.axonsample.domain.event.SampleTaskReminderScheduledEvent;
import org.axonframework.config.ProcessingGroup;
import org.axonframework.deadline.DeadlineManager;
import org.axonframework.eventhandling.EventHandler;
import org.axonframework.modelling.command.AggregateScopeDescriptor;
import org.springframework.stereotype.Component;

/**
 * Reage a {@link SampleTaskReminderScheduledEvent} e agenda o deadline real
 * no {@link DeadlineManager} — ver o Javadoc de {@code SampleTaskAggregate}
 * para a justificativa de o agendamento não acontecer dentro do próprio
 * agregado (conflito entre {@code axon-test} e a resolução de parâmetros do
 * Axon quando ambos coexistem no mesmo módulo).
 *
 * <p>Este é um {@code @Component} Spring comum — {@code DeadlineManager} chega
 * por injeção de construtor normal, sem passar pelo mecanismo de resolução
 * de parâmetros de handler do Axon. Como o agendamento acontece fora do
 * escopo de execução do agregado, usa-se a sobrecarga de {@code schedule(...)}
 * com {@link AggregateScopeDescriptor} explícito para rotear o deadline de
 * volta à instância correta de {@link SampleTaskAggregate}.
 */
@Component
@ProcessingGroup("axonsample")
public class SampleTaskReminderPolicy {

  private final DeadlineManager deadlineManager;

  public SampleTaskReminderPolicy(DeadlineManager deadlineManager) {
    this.deadlineManager = deadlineManager;
  }

  @EventHandler
  public void on(SampleTaskReminderScheduledEvent event) {
    deadlineManager.schedule(
        event.delay(),
        SampleTaskAggregate.REMINDER_DEADLINE_NAME,
        event.taskId(),
        new AggregateScopeDescriptor(SampleTaskAggregate.class.getSimpleName(), event.taskId()));
  }
}
