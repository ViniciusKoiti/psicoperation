package com.psiops.api.billing.domain.command;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.axonframework.modelling.command.TargetAggregateIdentifier;

/**
 * Marca uma cobrança {@code pendente} como {@code atrasada}, disparada pelo
 * caso de uso ({@code ChargeService#detectOverdueForUser}) quando encontra,
 * para a usuária autenticada, uma cobrança com {@code dueDate} no passado e
 * sem pagamento registrado — nunca por uma varredura diária proativa (isso é
 * responsabilidade da PSI-029, fora de escopo aqui, conforme assumption do
 * manifesto PSI-026).
 *
 * <p><strong>Idempotência</strong>: se o agregado já estiver {@code
 * ATRASADA} (ou já tiver pagamento registrado), o {@code @CommandHandler}
 * não aplica evento novo — garante que {@code cobranca.atrasada} nunca seja
 * publicado duas vezes para a mesma cobrança.
 */
public record MarkChargeOverdueCommand(@TargetAggregateIdentifier UUID chargeId, OffsetDateTime detectedAt) {}
