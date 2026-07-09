package com.psiops.api.axonsample;

import static org.assertj.core.api.Assertions.assertThat;

import com.psiops.api.axonsample.application.SampleTaskView;
import com.psiops.api.axonsample.application.query.FindSampleTaskQuery;
import com.psiops.api.axonsample.domain.SampleTaskTitleBlankException;
import com.psiops.api.axonsample.domain.command.CreateSampleTaskCommand;
import com.psiops.api.axonsample.domain.command.ScheduleSampleTaskReminderCommand;
import com.psiops.api.support.ContainersConfig;
import com.psiops.api.support.EphemeralAxonSchema;
import java.time.Duration;
import java.util.UUID;
import org.axonframework.commandhandling.gateway.CommandGateway;
import org.axonframework.queryhandling.QueryGateway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/**
 * Fluxo exemplo fim-a-fim (gabarito da PSI-011): comando via {@code
 * CommandGateway} → agregado state-stored → evento → projeção → consulta via
 * {@code QueryGateway}; e o {@code DeadlineManager} configurado agendando e
 * disparando um lembrete de verdade (não o stub do {@code AggregateTestFixture}).
 *
 * <p>Schema efêmero de teste (tabelas do Axon criadas pelo Hibernate) via
 * {@link EphemeralAxonSchema}.
 */
@SpringBootTest
@Import(ContainersConfig.class)
@EphemeralAxonSchema
class SampleTaskFlowIntegrationTest {

  @Autowired private CommandGateway commandGateway;
  @Autowired private QueryGateway queryGateway;

  @Test
  void dispatchedCommandReachesAggregateAndProjectionIsQueryable() {
    String taskId = UUID.randomUUID().toString();

    commandGateway.sendAndWait(new CreateSampleTaskCommand(taskId, "Ligar para paciente"));

    SampleTaskView view =
        queryGateway
            .query(new FindSampleTaskQuery(taskId), SampleTaskView.class)
            .join();

    assertThat(view).isNotNull();
    assertThat(view.taskId()).isEqualTo(taskId);
    assertThat(view.title()).isEqualTo("Ligar para paciente");
    assertThat(view.reminderScheduled()).isFalse();
    assertThat(view.reminderDue()).isFalse();
  }

  @Test
  void rejectedCommandNeverReachesGateway() {
    String taskId = UUID.randomUUID().toString();

    // sendAndWait propaga a exceção de domínio diretamente (não embrulhada),
    // já que SampleTaskTitleBlankException é uma RuntimeException.
    org.junit.jupiter.api.Assertions.assertThrows(
        SampleTaskTitleBlankException.class,
        () -> commandGateway.sendAndWait(new CreateSampleTaskCommand(taskId, " ")));

    SampleTaskView view = queryGateway.query(new FindSampleTaskQuery(taskId), SampleTaskView.class).join();
    assertThat(view).isNull();
  }

  @Test
  void deadlineManagerSchedulesAndFiresRealReminder() throws InterruptedException {
    String taskId = UUID.randomUUID().toString();
    commandGateway.sendAndWait(new CreateSampleTaskCommand(taskId, "Ligar para paciente"));
    commandGateway.sendAndWait(
        new ScheduleSampleTaskReminderCommand(taskId, Duration.ofMillis(200)));

    // DeadlineManager real (SimpleDeadlineManager, agendamento em memória via
    // ScheduledExecutorService) — sem Awaitility no classpath, faz-se
    // polling manual até o deadline disparar ou o prazo esgotar.
    SampleTaskView view = null;
    long deadline = System.nanoTime() + Duration.ofSeconds(5).toNanos();
    while (System.nanoTime() < deadline) {
      view = queryGateway.query(new FindSampleTaskQuery(taskId), SampleTaskView.class).join();
      if (view != null && view.reminderDue()) {
        break;
      }
      Thread.sleep(100);
    }

    assertThat(view).isNotNull();
    assertThat(view.reminderScheduled()).isTrue();
    assertThat(view.reminderDue()).isTrue();
  }
}
