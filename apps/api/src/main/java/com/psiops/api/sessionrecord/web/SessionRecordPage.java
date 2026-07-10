package com.psiops.api.sessionrecord.web;

import com.psiops.contracts.model.PageMeta;
import java.util.List;

/**
 * Página do histórico administrativo de um paciente ({@code GET
 * /patients/{patientId}/session-records}) — segue o mesmo formato ({@code
 * items} + {@code meta}) das páginas de contrato (ex.: {@code
 * AppointmentPage}, {@code PatientPage}), reaproveitando {@link PageMeta}
 * (DTO de contrato) para os metadados de paginação. Só {@code items} é local
 * porque a especificação (PSI-020) não declara este endpoint — ver javadoc
 * de {@link SessionRecordHistoryItem}.
 */
public record SessionRecordPage(List<SessionRecordHistoryItem> items, PageMeta meta) {}
