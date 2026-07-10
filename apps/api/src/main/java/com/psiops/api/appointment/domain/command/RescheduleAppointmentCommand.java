package com.psiops.api.appointment.domain.command;

import com.psiops.api.appointment.persistence.Weekday;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.axonframework.modelling.command.TargetAggregateIdentifier;

/**
 * Remarca uma consulta existente: novo horário e/ou duração e/ou descritor de
 * recorrência da própria ocorrência (nunca da série inteira — ver
 * {@code tasks/PSI-024.yaml}, {@code open_questions}: cancelamento/remarcação
 * afeta somente a ocorrência quando o contrato é omisso).
 *
 * <p>Carrega o estado <strong>resultante completo</strong> (não apenas os
 * campos alterados) — a resolução de "somente os campos presentes mudam"
 * (semântica de {@code AppointmentUpdateRequest}) acontece no caso de uso
 * ({@code AppointmentService}), antes do despacho deste comando, para manter
 * o agregado simples (só sobrescreve).
 */
public record RescheduleAppointmentCommand(
    @TargetAggregateIdentifier UUID appointmentId,
    OffsetDateTime newStartsAt,
    int newDurationMinutes,
    Weekday recurrenceWeekday,
    Integer recurrenceInterval,
    LocalDate recurrenceUntil,
    OffsetDateTime rescheduledAt) {}
