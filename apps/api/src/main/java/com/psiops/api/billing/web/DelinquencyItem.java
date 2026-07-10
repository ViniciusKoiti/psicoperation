package com.psiops.api.billing.web;

import com.psiops.contracts.model.Charge;

/**
 * Um item da visão de inadimplência ({@code GET /charges/delinquency}): a
 * cobrança atrasada ({@link Charge}, DTO de contrato reaproveitado) mais o
 * valor corrigido calculado sobre ela (juros simples, ver {@code
 * SimpleInterestCalculator}), "hoje" como data de referência.
 *
 * @param daysLate dias corridos entre o vencimento e hoje.
 * @param interestCents componente de juros (centavos) — {@code 0} se a
 *     cobrança não tiver {@code interest} configurado.
 * @param correctedAmountCents {@code charge.amount + interestCents}.
 */
public record DelinquencyItem(Charge charge, long daysLate, long interestCents, long correctedAmountCents) {}
