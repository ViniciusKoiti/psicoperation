package com.psiops.api.appointment.domain.command;

import com.psiops.api.appointment.persistence.Weekday;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.axonframework.modelling.command.TargetAggregateIdentifier;

/**
 * Agenda uma consulta (uma ocorrência). {@code appointmentId} é gerado pelo
 * chamador (UUID), seguindo a convenção de identificadores documentada no
 * package-info de {@code com.psiops.api.axonsample}.
 *
 * <p>Quando a consulta faz parte de uma série recorrente (PSI-024,
 * recorrência semanal simples materializada em ocorrências individuais),
 * {@code seriesId} é o mesmo UUID gerado uma única vez pelo caso de uso para
 * todas as ocorrências da série — vínculo por identificador de série
 * registrado no evento de domínio para auditoria, já que o schema de {@code
 * appointments} (migration V2, imutável) não tem coluna própria para isso.
 * {@code null} indica consulta avulsa (sem recorrência).
 */
public record CreateAppointmentCommand(
    @TargetAggregateIdentifier UUID appointmentId,
    UUID userId,
    UUID patientId,
    OffsetDateTime startsAt,
    int durationMinutes,
    UUID seriesId,
    Weekday recurrenceWeekday,
    Integer recurrenceInterval,
    LocalDate recurrenceUntil,
    OffsetDateTime createdAt) {}
