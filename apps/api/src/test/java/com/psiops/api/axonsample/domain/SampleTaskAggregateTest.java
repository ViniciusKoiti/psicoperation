package com.psiops.api.axonsample.domain;

import com.psiops.api.axonsample.domain.command.CreateSampleTaskCommand;
import com.psiops.api.axonsample.domain.command.ScheduleSampleTaskReminderCommand;
import com.psiops.api.axonsample.domain.event.SampleTaskCreatedEvent;
import com.psiops.api.axonsample.domain.event.SampleTaskReminderScheduledEvent;
import java.time.Duration;
import java.util.UUID;
import org.axonframework.test.aggregate.AggregateTestFixture;
import org.axonframework.test.aggregate.FixtureConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Testes do agregado exemplo com {@link AggregateTestFixture} — não sobem
 * contexto Spring nem PostgreSQL: cobrem o comportamento do agregado
 * (comandos, eventos) isoladamente, como um teste unitário comum.
 *
 * <p>Não há teste aqui para o disparo do {@code @DeadlineHandler}: o
 * agendamento real acontece fora do agregado (ver {@code
 * SampleTaskReminderPolicy} e o Javadoc de {@code SampleTaskAggregate}), logo
 * a fixture — que testa só o agregado isoladamente — não tem um deadline
 * para simular. Essa ponta fica coberta pelo teste de integração real, {@code
 * SampleTaskFlowIntegrationTest#deadlineManagerSchedulesAndFiresRealReminder}.
 */
class SampleTaskAggregateTest {

  private FixtureConfiguration<SampleTaskAggregate> fixture;

  @BeforeEach
  void setUp() {
    fixture = new AggregateTestFixture<>(SampleTaskAggregate.class);
  }

  @Test
  void createsTaskAndAppliesCreatedEvent() {
    String taskId = UUID.randomUUID().toString();

    fixture
        .givenNoPriorActivity()
        .when(new CreateSampleTaskCommand(taskId, "Ligar para paciente"))
        .expectSuccessfulHandlerExecution()
        .expectEvents(new SampleTaskCreatedEvent(taskId, "Ligar para paciente"));
  }

  @Test
  void rejectsCreationWithBlankTitle() {
    String taskId = UUID.randomUUID().toString();

    fixture
        .givenNoPriorActivity()
        .when(new CreateSampleTaskCommand(taskId, "   "))
        .expectException(SampleTaskTitleBlankException.class)
        .expectNoEvents();
  }

  @Test
  void schedulesReminderEventAfterTaskCreated() {
    String taskId = UUID.randomUUID().toString();

    fixture
        .givenCommands(new CreateSampleTaskCommand(taskId, "Ligar para paciente"))
        .when(new ScheduleSampleTaskReminderCommand(taskId, Duration.ofMinutes(10)))
        .expectSuccessfulHandlerExecution()
        .expectEvents(new SampleTaskReminderScheduledEvent(taskId, Duration.ofMinutes(10)));
  }

  @Test
  void rejectsSchedulingReminderTwice() {
    String taskId = UUID.randomUUID().toString();

    fixture
        .givenCommands(
            new CreateSampleTaskCommand(taskId, "Ligar para paciente"),
            new ScheduleSampleTaskReminderCommand(taskId, Duration.ofMinutes(10)))
        .when(new ScheduleSampleTaskReminderCommand(taskId, Duration.ofMinutes(5)))
        .expectException(IllegalStateException.class)
        .expectNoEvents();
  }
}
