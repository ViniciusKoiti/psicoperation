package com.psiops.api.billing.domain.event;

import com.psiops.api.billing.persistence.ChargeStatus;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Fato: uma cobrança de mensalidade foi emitida. Publicado via Axon (event
 * store JPA) para consumo futuro (ex.: PSI-029 agendando lembretes por
 * vencimento).
 */
public record ChargeCreatedEvent(
    UUID chargeId,
    UUID userId,
    UUID patientId,
    String competence,
    long amountCents,
    LocalDate dueDate,
    ChargeStatus status,
    Double interestMonthlyRatePercent,
    Double interestFinePercent,
    OffsetDateTime createdAt) {}
