package com.psiops.api.axonsample.domain.command;

import java.time.Duration;
import org.axonframework.modelling.command.TargetAggregateIdentifier;

/**
 * Agenda o lembrete (deadline) da tarefa exemplo — gabarito para a base dos
 * lembretes de cobrança da PSI-029.
 */
public record ScheduleSampleTaskReminderCommand(
    @TargetAggregateIdentifier String taskId, Duration delay) {}
