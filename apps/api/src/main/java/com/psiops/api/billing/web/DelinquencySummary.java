package com.psiops.api.billing.web;

import java.util.List;

/**
 * Resposta de {@code GET /charges/delinquency}: visão de inadimplência da
 * psicóloga autenticada — cobranças {@code atrasada}, com totais.
 *
 * <p>Não é um DTO de contrato (ver javadoc de {@link
 * GenerateChargesRequest} sobre o mesmo raciocínio): {@code GET
 * /charges?status=atrasada} (contrato PSI-020, {@code ChargePage}) já cobre
 * a listagem básica; este endpoint acrescenta os totais (originais e
 * corrigidos com juros) exigidos pelo acceptance criteria do manifesto
 * PSI-026 ("listagem das cobranças atrasadas com totais"), que não têm
 * campo correspondente em {@code ChargePage}.
 */
public record DelinquencySummary(
    List<DelinquencyItem> items, int count, long totalAmountCents, long totalInterestCents, long totalCorrectedAmountCents) {}
