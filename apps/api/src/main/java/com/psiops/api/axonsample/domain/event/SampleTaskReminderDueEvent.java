package com.psiops.api.axonsample.domain.event;

/** Fato: o lembrete agendado disparou ({@code @DeadlineHandler} do agregado). */
public record SampleTaskReminderDueEvent(String taskId) {}
