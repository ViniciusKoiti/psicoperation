package com.psiops.api.billing.domain.event;

import com.psiops.api.billing.persistence.PaymentMethod;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Fato: o pagamento de uma cobrança foi registrado (administrativo). O
 * agregado transiciona o status para {@code EM_DIA} ao aplicar este evento —
 * inclusive quando a cobrança já estava {@code ATRASADA} (ver
 * {@code ChargeEntity#on(ChargePaymentRegisteredEvent)}).
 */
public record ChargePaymentRegisteredEvent(
    UUID chargeId,
    long paidAmountCents,
    OffsetDateTime paidAt,
    PaymentMethod method,
    String note) {}
