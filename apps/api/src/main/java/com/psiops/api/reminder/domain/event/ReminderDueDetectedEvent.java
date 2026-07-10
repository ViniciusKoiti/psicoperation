package com.psiops.api.reminder.domain.event;

import com.psiops.api.reminder.persistence.ReminderChannel;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Fato: o horário agendado de um lembrete foi atingido ({@code
 * @DeadlineHandler} de {@code ReminderEntity}, deadline agendado por {@code
 * com.psiops.api.notification.reminder.ReminderDeadlinePolicy}) — o lembrete
 * deve ser despachado pelo canal (email no MVP).
 *
 * <p>Publicado via Axon (event store JPA) sob o nome de fato externo {@value
 * #TYPE}, o mesmo definido pelo schema {@code ReminderDueEvent}/{@code
 * ReminderDuePayload} do contrato de evento (PSI-020): os campos abaixo
 * espelham deliberadamente {@code ReminderDuePayload} (mais o envelope
 * {@code eventId}/{@code userId}/{@code occurredAt} de {@code DomainEvent},
 * mais os dados de entrega que {@code ReminderDuePayload} não carrega —
 * {@code subject}/{@code body}, necessários ao handler de e-mail sem repetir
 * lógica de negócio), mesmo padrão documentado em {@code
 * com.psiops.api.billing.domain.event.ChargeOverdueDetectedEvent} (PSI-026):
 * um consumidor (aqui, {@code
 * com.psiops.api.notification.reminder.ReminderEmailHandler}, no mesmo
 * módulo que publica este evento) projeta este fato interno no DTO de
 * contrato {@code com.psiops.contracts.model.ReminderDueEvent} sem tradução
 * de campos.
 *
 * <p><strong>Sem mudança de estado no agregado</strong>: aplicar este evento
 * NÃO marca o lembrete como {@code ENVIADO} — isso só acontece após o e-mail
 * ser efetivamente entregue (ou falhar definitivamente), responsabilidade do
 * handler de e-mail (idempotência via {@code reminders.sent_at}/{@code
 * status}, ver {@code ReminderEmailHandler}), nunca do agregado (ver
 * restrição "handler só entrega" do manifesto PSI-029).
 */
public record ReminderDueDetectedEvent(
    UUID reminderId,
    UUID userId,
    ReminderChannel channel,
    String subject,
    String body,
    OffsetDateTime scheduledFor,
    UUID patientId,
    UUID appointmentId,
    UUID chargeId,
    OffsetDateTime occurredAt) {

  /** Nome do fato externo, igual ao valor de {@code ReminderDueEvent.TypeEnum.LEMBRETE_DEVIDO}. */
  public static final String TYPE = "lembrete.devido";
}
