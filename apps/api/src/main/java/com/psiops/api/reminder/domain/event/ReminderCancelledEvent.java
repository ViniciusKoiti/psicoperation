package com.psiops.api.reminder.domain.event;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Fato: um lembrete ainda {@code AGENDADO} foi cancelado antes de disparar
 * (PSI-029) — hoje, exclusivamente porque a consulta vinculada foi remarcada
 * ou cancelada ({@code com.psiops.api.notification.appointment.
 * AppointmentReminderPolicy}). Consumido por {@code
 * com.psiops.api.notification.reminder.ReminderDeadlinePolicy}, que cancela o
 * deadline correspondente no {@code DeadlineManager} ({@code
 * DeadlineManager#cancelAllWithinScope}).
 */
public record ReminderCancelledEvent(UUID reminderId, OffsetDateTime cancelledAt) {}
