package com.psiops.api.reminder.domain.command;

import com.psiops.api.reminder.persistence.ReminderChannel;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.axonframework.modelling.command.TargetAggregateIdentifier;

/**
 * Agenda um lembrete (PSI-027). {@code reminderId} é gerado pelo chamador
 * (UUID), seguindo a convenção de identificadores documentada no
 * package-info de {@code com.psiops.api.axonsample}.
 *
 * <p>Os vínculos ({@code patientId}/{@code appointmentId}/{@code chargeId})
 * já chegam validados pelo caso de uso ({@code ReminderService}) — no máximo
 * um preenchido, e quando preenchido, apontando para um recurso existente do
 * próprio {@code userId} (ver javadoc de {@code ReminderService}); o {@code
 * @CommandHandler} do agregado não repete essas checagens (mesmo padrão de
 * {@code CreateAppointmentCommand}/{@code CreateChargeCommand}, que
 * documentam validações cross-repositório como responsabilidade do caso de
 * uso, não do agregado).
 *
 * <p><strong>Limite desta tarefa (PSI-027)</strong>: despachar este comando
 * publica {@code ReminderScheduledEvent} no event store JPA e deixa o
 * lembrete no estado {@code AGENDADO} — nenhum {@code DeadlineManager} é
 * envolvido aqui. O agendamento real do disparo por deadline e o envio do
 * e-mail são exclusivos da PSI-029, que deve reagir a {@code
 * ReminderScheduledEvent} para chamar {@code
 * DeadlineManager.schedule(...)} — mesmo gabarito documentado em {@code
 * com.psiops.api.axonsample.domain.command.ScheduleSampleTaskReminderCommand}.
 */
public record ScheduleReminderCommand(
    @TargetAggregateIdentifier UUID reminderId,
    UUID userId,
    ReminderChannel channel,
    String subject,
    String body,
    OffsetDateTime scheduledFor,
    UUID patientId,
    UUID appointmentId,
    UUID chargeId,
    OffsetDateTime createdAt) {}
