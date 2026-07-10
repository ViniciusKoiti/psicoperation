package com.psiops.api.appointment.domain.event;

import com.psiops.api.appointment.persistence.Weekday;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Fato: uma consulta foi agendada. Publicado via Axon (event store JPA) para
 * consumo futuro pela PSI-029 (agendamento de lembretes por deadline).
 *
 * @param seriesId identificador de série (mesmo valor em todas as ocorrências
 *     materializadas de uma recorrência semanal); {@code null} para consulta
 *     avulsa.
 */
public record AppointmentCreatedEvent(
    UUID appointmentId,
    UUID userId,
    UUID patientId,
    OffsetDateTime startsAt,
    int durationMinutes,
    UUID seriesId,
    Weekday recurrenceWeekday,
    Integer recurrenceInterval,
    LocalDate recurrenceUntil,
    OffsetDateTime createdAt) {}
