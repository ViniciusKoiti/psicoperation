package com.psiops.api.reminder.domain.event;

import com.psiops.api.reminder.persistence.ReminderChannel;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Fato: um lembrete foi agendado. Publicado via Axon (event store JPA),
 * deixando o estado pronto para o disparo assíncrono — consumo futuro
 * exclusivo da PSI-029 (agendar o deadline real no {@code DeadlineManager} e,
 * quando devido, enviar o e-mail e publicar {@code lembrete.devido}, ver
 * {@code com.psiops.contracts.model.ReminderDueEvent}). Nenhum e-mail é
 * enviado nem deadline é agendado por este evento — ver javadoc de {@code
 * ScheduleReminderCommand}.
 */
public record ReminderScheduledEvent(
    UUID reminderId,
    UUID userId,
    ReminderChannel channel,
    String subject,
    String body,
    OffsetDateTime scheduledFor,
    UUID patientId,
    UUID appointmentId,
    UUID chargeId,
    OffsetDateTime createdAt) {}
