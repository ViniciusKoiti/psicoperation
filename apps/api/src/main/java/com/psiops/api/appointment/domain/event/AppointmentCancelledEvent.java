package com.psiops.api.appointment.domain.event;

import com.psiops.api.appointment.persistence.AppointmentStatus;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Fato: uma consulta foi cancelada ou marcada como remarcada (sem novo
 * horário ainda definido), liberando o horário. Publicado via Axon para
 * consumo futuro pela PSI-029 (cancelar o lembrete pendente da consulta).
 */
public record AppointmentCancelledEvent(
    UUID appointmentId,
    AppointmentStatus previousStatus,
    AppointmentStatus resultingStatus,
    OffsetDateTime cancelledAt) {}
