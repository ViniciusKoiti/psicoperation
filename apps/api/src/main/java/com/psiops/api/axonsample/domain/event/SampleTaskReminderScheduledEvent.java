package com.psiops.api.axonsample.domain.event;

import java.time.Duration;

/**
 * Fato: um lembrete foi solicitado para a tarefa, a ser agendado no {@code
 * DeadlineManager} após {@code delay}. Consumido por {@link
 * com.psiops.api.axonsample.application.SampleTaskReminderPolicy}, que
 * efetivamente chama {@code DeadlineManager.schedule(...)} (ver justificativa
 * no Javadoc de {@code SampleTaskAggregate}).
 */
public record SampleTaskReminderScheduledEvent(String taskId, Duration delay) {}
