package com.psiops.api.axonsample.application;

/**
 * Modelo de leitura da projeção — nunca a entidade do agregado nem um DTO de
 * {@code packages/contracts} usado como atalho (ver convenções de queries no
 * package-info de {@code com.psiops.api.axonsample}).
 */
public record SampleTaskView(String taskId, String title, boolean reminderScheduled, boolean reminderDue) {}
