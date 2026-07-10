package com.psiops.api.sessionrecord.web;

import com.psiops.contracts.model.AttendanceRecord;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Um item do histórico administrativo de consultas de um paciente ({@code
 * GET /patients/{patientId}/session-records}).
 *
 * <p>Não é um DTO de contrato: a especificação (PSI-020) modela {@link
 * AttendanceRecord} apenas como o corpo de {@code PUT
 * /appointments/{appointmentId}/attendance} — sem nenhum campo de correlação
 * com a consulta/paciente — e não declara um endpoint de histórico. Mesmo
 * raciocínio de {@code com.psiops.api.billing.web.DelinquencyItem}: o
 * conteúdo administrativo em si ({@link #record()}) reaproveita
 * integralmente o DTO de contrato {@link AttendanceRecord}; só a correlação
 * (qual consulta) e a auditoria de criação são acrescentadas aqui, fora do
 * contrato.
 *
 * @param id identificador do registro administrativo (tabela {@code
 *     session_records}).
 * @param appointmentId consulta à qual este registro está vinculado.
 * @param record status de comparecimento + anotação administrativa +
 *     instante do registro (DTO de contrato reaproveitado, nunca
 *     redefinido). Sem campo clínico — ver javadoc de pacote.
 * @param createdAt instante em que o registro foi criado pela primeira vez
 *     para esta consulta.
 */
public record SessionRecordHistoryItem(
    UUID id, UUID appointmentId, AttendanceRecord record, OffsetDateTime createdAt) {}
