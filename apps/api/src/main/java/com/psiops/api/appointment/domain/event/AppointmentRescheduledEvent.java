package com.psiops.api.appointment.domain.event;

import com.psiops.api.appointment.persistence.Weekday;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Fato: uma consulta foi remarcada (novo horário e/ou duração e/ou descritor
 * de recorrência da ocorrência). Publicado via Axon para consumo futuro pela
 * PSI-029 (re-agendar/cancelar o lembrete pendente da consulta).
 */
public record AppointmentRescheduledEvent(
    UUID appointmentId,
    OffsetDateTime previousStartsAt,
    OffsetDateTime newStartsAt,
    int previousDurationMinutes,
    int newDurationMinutes,
    Weekday recurrenceWeekday,
    Integer recurrenceInterval,
    LocalDate recurrenceUntil,
    OffsetDateTime rescheduledAt) {}
