package com.psiops.api.billing.domain.event;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Fato: uma cobrança pendente foi detectada como atrasada (vencida e sem
 * pagamento registrado) durante uma operação do módulo financeiro (consulta,
 * listagem, geração mensal ou registro de pagamento de outra cobrança) — não
 * por uma varredura diária proativa, que é responsabilidade da PSI-029 (fora
 * de escopo aqui, ver assumption do manifesto PSI-026).
 *
 * <p>Publicado via Axon (event store JPA, {@code domain_event_entry}) sob o
 * nome de fato externo {@value #TYPE}, o mesmo definido pelo schema {@code
 * ChargeOverdueEvent}/{@code ChargeOverduePayload} do contrato de evento
 * (PSI-020): os campos abaixo espelham deliberadamente {@code
 * ChargeOverduePayload} (mais o envelope {@code eventId}/{@code userId}/
 * {@code occurredAt} de {@code DomainEvent}), para que um consumidor futuro
 * (PSI-029) possa projetar este evento de domínio diretamente no formato do
 * contrato sem tradução de campos. Não é, em si, o DTO gerado {@code
 * ChargeOverdueEvent} de {@code com.psiops.contracts.model} — este é um
 * evento de domínio interno (record simples, serializado via Jackson pelo
 * Axon), e o DTO de contrato é reservado à borda HTTP/webhook, que é
 * responsabilidade de quem consumir este evento.
 *
 * <p><strong>Sem duplicação</strong>: o agregado ({@link
 * com.psiops.api.billing.persistence.ChargeEntity}) só aplica este evento
 * uma vez por cobrança — ver idempotência documentada em {@link
 * com.psiops.api.billing.domain.command.MarkChargeOverdueCommand}.
 */
public record ChargeOverdueDetectedEvent(
    UUID eventId,
    UUID chargeId,
    UUID userId,
    UUID patientId,
    String competence,
    long amountCents,
    LocalDate dueDate,
    OffsetDateTime occurredAt) {

  /** Nome do fato externo, igual ao valor de {@code ChargeOverdueEvent.TypeEnum.COBRANCA_ATRASADA}. */
  public static final String TYPE = "cobranca.atrasada";
}
