package com.psiops.api.axonsample.domain.command;

import org.axonframework.modelling.command.TargetAggregateIdentifier;

/**
 * Cria a tarefa exemplo. {@code taskId} é gerado pelo chamador (UUID) — ver
 * convenção de identificadores no package-info de {@code com.psiops.api.axonsample}.
 */
public record CreateSampleTaskCommand(@TargetAggregateIdentifier String taskId, String title) {}
