package com.psiops.api.billing.domain.command;

import com.psiops.api.billing.persistence.PaymentMethod;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.axonframework.modelling.command.TargetAggregateIdentifier;

/**
 * Registra o pagamento (administrativo) de uma cobrança. Rejeitado pelo
 * agregado ({@code ChargeAlreadyPaidException}, traduzido a 409) se a
 * cobrança já tiver pagamento registrado — ver {@code
 * ChargeEntity#handle(RegisterChargePaymentCommand)}.
 */
public record RegisterChargePaymentCommand(
    @TargetAggregateIdentifier UUID chargeId,
    long paidAmountCents,
    OffsetDateTime paidAt,
    PaymentMethod method,
    String note) {}
