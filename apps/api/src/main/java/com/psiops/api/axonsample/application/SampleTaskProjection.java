package com.psiops.api.axonsample.application;

import com.psiops.api.axonsample.application.query.FindSampleTaskQuery;
import com.psiops.api.axonsample.domain.event.SampleTaskCreatedEvent;
import com.psiops.api.axonsample.domain.event.SampleTaskReminderDueEvent;
import com.psiops.api.axonsample.domain.event.SampleTaskReminderScheduledEvent;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.axonframework.config.ProcessingGroup;
import org.axonframework.eventhandling.EventHandler;
import org.axonframework.queryhandling.QueryHandler;
import org.springframework.stereotype.Component;

/**
 * Projeção (read model) do fluxo exemplo: reage aos eventos do {@link
 * com.psiops.api.axonsample.domain.SampleTaskAggregate} e responde à query
 * de leitura via {@code QueryGateway}.
 *
 * <p>Armazenamento em memória — suficiente para o gabarito; projeções de
 * domínio reais devem persistir o read model (ex.: tabela própria via JPA,
 * criada por migration dedicada).
 *
 * <p>Grupo de processamento {@code axonsample} configurado como {@code
 * subscribing} em {@code application.yml} (síncrono com a publicação do
 * evento), o que torna esta projeção consistente imediatamente após o
 * comando retornar — ver comentário em {@code application.yml}.
 */
@Component
@ProcessingGroup("axonsample")
public class SampleTaskProjection {

  private final Map<String, SampleTaskView> views = new ConcurrentHashMap<>();

  @EventHandler
  public void on(SampleTaskCreatedEvent event) {
    views.put(event.taskId(), new SampleTaskView(event.taskId(), event.title(), false, false));
  }

  @EventHandler
  public void on(SampleTaskReminderScheduledEvent event) {
    views.computeIfPresent(
        event.taskId(),
        (id, view) -> new SampleTaskView(view.taskId(), view.title(), true, view.reminderDue()));
  }

  @EventHandler
  public void on(SampleTaskReminderDueEvent event) {
    views.computeIfPresent(
        event.taskId(),
        (id, view) ->
            new SampleTaskView(view.taskId(), view.title(), view.reminderScheduled(), true));
  }

  @QueryHandler
  public SampleTaskView handle(FindSampleTaskQuery query) {
    return views.get(query.taskId());
  }
}
