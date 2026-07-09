package com.psiops.api.axonsample.domain;

import com.psiops.api.axonsample.domain.command.CreateSampleTaskCommand;
import com.psiops.api.axonsample.domain.command.ScheduleSampleTaskReminderCommand;
import com.psiops.api.axonsample.domain.event.SampleTaskCreatedEvent;
import com.psiops.api.axonsample.domain.event.SampleTaskReminderDueEvent;
import com.psiops.api.axonsample.domain.event.SampleTaskReminderScheduledEvent;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import org.axonframework.commandhandling.CommandHandler;
import org.axonframework.deadline.annotation.DeadlineHandler;
import org.axonframework.eventsourcing.EventSourcingHandler;
import org.axonframework.modelling.command.AggregateIdentifier;
import org.axonframework.modelling.command.AggregateLifecycle;
import org.axonframework.spring.stereotype.Aggregate;

/**
 * Agregado exemplo (gabarito) para a fundação do Axon Framework — ver
 * package-info de {@code com.psiops.api.axonsample}.
 *
 * <p><strong>State-stored, não event-sourced</strong> (ver decisão em {@code
 * com.psiops.api.axon.config}): esta classe é uma entidade JPA comum,
 * carregada e salva pelo {@code GenericJpaRepository} configurado em {@link
 * com.psiops.api.axonsample.config.SampleTaskAggregateRepositoryConfig} —
 * apontado pelo atributo {@code repository} de {@link Aggregate} abaixo, para
 * que o Axon não tente usar o repositório event-sourced padrão. Em produção,
 * o {@code GenericJpaRepository} nunca reconstrói o agregado a partir do
 * histórico de eventos — ele carrega/salva a linha JPA diretamente.
 *
 * <p>Ainda assim, os {@code @CommandHandler} só chamam {@link
 * AggregateLifecycle#apply(Object)}; quem muta os campos são os {@code
 * @EventSourcingHandler} abaixo — {@code apply()} sempre invoca esses
 * handlers de forma síncrona na própria instância, independentemente do tipo
 * de repositório. Isso mantém o agregado testável com {@code
 * AggregateTestFixture} (que, por padrão, reconstrói o estado dado via
 * replay de eventos) sem abrir mão da semântica state-stored em produção: o
 * histórico nunca é relido depois que a linha é persistida.
 *
 * <p><strong>Por que o agendamento do deadline não está aqui dentro:</strong>
 * o padrão documentado do Axon injeta {@code DeadlineManager} como parâmetro
 * do {@code @CommandHandler}. Isso funciona dentro de {@code
 * AggregateTestFixture}, mas quebra em execução real (Spring, fora da
 * fixture) sempre que {@code axon-test} está no classpath: o {@code
 * FixtureResourceParameterResolverFactory} do módulo de teste se registra
 * globalmente via {@code ServiceLoader} e reivindica incondicionalmente
 * qualquer parâmetro de handler que não seja o payload da mensagem,
 * quebrando a resolução real do bean Spring. Como {@code axon-test} é
 * dependência de teste do mesmo módulo (necessária para o {@code
 * AggregateTestFixture} exigido pelo PSI-011), o agendamento foi movido para
 * {@link com.psiops.api.axonsample.application.SampleTaskReminderPolicy}, um
 * {@code @Component} Spring comum que reage a {@link
 * SampleTaskReminderScheduledEvent} e injeta {@code DeadlineManager} via
 * construtor (injeção de dependência do Spring, não resolução de parâmetro
 * de handler do Axon) — usando a sobrecarga de {@code schedule(...)} com
 * {@code ScopeDescriptor} explícito para direcionar o deadline a este
 * agregado. O {@code @DeadlineHandler} abaixo continua no agregado, que é
 * quem efetivamente recebe e reage ao deadline.
 */
@Entity
@Aggregate(repository = "sampleTaskAggregateRepository")
public class SampleTaskAggregate {

  public static final String REMINDER_DEADLINE_NAME = "sampleTaskReminder";

  @Id
  @AggregateIdentifier
  private String taskId;

  private String title;
  private boolean reminderScheduled;
  private boolean reminderDue;

  protected SampleTaskAggregate() {
    // exigido pelo JPA.
  }

  @CommandHandler
  public SampleTaskAggregate(CreateSampleTaskCommand command) {
    if (command.title() == null || command.title().isBlank()) {
      throw new SampleTaskTitleBlankException();
    }
    AggregateLifecycle.apply(new SampleTaskCreatedEvent(command.taskId(), command.title()));
  }

  @CommandHandler
  public void handle(ScheduleSampleTaskReminderCommand command) {
    if (reminderScheduled) {
      throw new IllegalStateException("lembrete já agendado para a tarefa " + taskId);
    }
    AggregateLifecycle.apply(new SampleTaskReminderScheduledEvent(taskId, command.delay()));
  }

  @DeadlineHandler(deadlineName = REMINDER_DEADLINE_NAME)
  public void onReminderDue() {
    AggregateLifecycle.apply(new SampleTaskReminderDueEvent(taskId));
  }

  @EventSourcingHandler
  public void on(SampleTaskCreatedEvent event) {
    this.taskId = event.taskId();
    this.title = event.title();
    this.reminderScheduled = false;
    this.reminderDue = false;
  }

  @EventSourcingHandler
  public void on(SampleTaskReminderScheduledEvent event) {
    this.reminderScheduled = true;
  }

  @EventSourcingHandler
  public void on(SampleTaskReminderDueEvent event) {
    this.reminderDue = true;
  }
}
