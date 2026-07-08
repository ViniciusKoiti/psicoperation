package com.psiops.api.axonsample.domain.event;

/** Fato: a tarefa exemplo foi criada. Consumido pela projeção de leitura. */
public record SampleTaskCreatedEvent(String taskId, String title) {}
