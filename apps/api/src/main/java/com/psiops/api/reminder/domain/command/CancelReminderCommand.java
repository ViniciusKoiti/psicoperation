package com.psiops.api.reminder.domain.command;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.axonframework.modelling.command.TargetAggregateIdentifier;

/**
 * Cancela um lembrete ainda {@code AGENDADO} (PSI-029).
 *
 * <p>Uso principal: {@code
 * com.psiops.api.notification.appointment.AppointmentReminderPolicy} cancela
 * os lembretes de véspera/dia vinculados a uma consulta quando ela é
 * remarcada ou cancelada ({@code AppointmentRescheduledEvent}/{@code
 * AppointmentCancelledEvent}). Não há path HTTP para cancelamento de lembrete
 * (ver javadoc de {@code ReminderService}); este comando é de uso
 * exclusivamente interno/assíncrono.
 *
 * <p><strong>Idempotência</strong>: se o lembrete já não estiver {@code
 * AGENDADO} (já {@code ENVIADO}, {@code FALHOU} ou {@code CANCELADO}), o
 * {@code @CommandHandler} não aplica evento novo — ver {@code
 * ReminderEntity#handle(CancelReminderCommand)}.
 */
public record CancelReminderCommand(@TargetAggregateIdentifier UUID reminderId, OffsetDateTime cancelledAt) {}
