package com.psiops.api.billing.domain.command;

import com.psiops.api.billing.persistence.ChargeStatus;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.axonframework.modelling.command.TargetAggregateIdentifier;

/**
 * Emite uma cobrança de mensalidade para um paciente/competência. {@code
 * chargeId} é gerado pelo chamador (UUID), seguindo a convenção de
 * identificadores documentada no package-info de {@code
 * com.psiops.api.axonsample}.
 *
 * <p>{@code status} é o status inicial calculado pelo caso de uso ({@code
 * ChargeService}) a partir de {@code dueDate} — nunca {@code ATRASADA}
 * diretamente aqui: mesmo uma cobrança criada com vencimento no passado nasce
 * {@code PENDENTE} e é transicionada para {@code ATRASADA} (publicando o
 * evento {@code cobranca.atrasada}) pela varredura de detecção de atraso
 * chamada ao final da própria operação de criação — ver javadoc de {@code
 * ChargeService#detectOverdueForUser}, que documenta a assumption do
 * manifesto PSI-026 de que a detecção acontece nas operações do módulo.
 *
 * <p>Os parâmetros de juros simples são achatados em dois campos primitivos
 * (em vez do embeddable {@code SimpleInterestParams}) para manter o payload
 * do evento serializável pelo Axon via Jackson sem exigir anotações extras —
 * mesmo padrão de achatamento usado por {@code CreateAppointmentCommand} para
 * {@code WeeklyRecurrence}.
 */
public record CreateChargeCommand(
    @TargetAggregateIdentifier UUID chargeId,
    UUID userId,
    UUID patientId,
    String competence,
    long amountCents,
    LocalDate dueDate,
    ChargeStatus status,
    Double interestMonthlyRatePercent,
    Double interestFinePercent,
    OffsetDateTime createdAt) {}
