package com.psiops.api.billing.web;

import com.psiops.contracts.model.Charge;
import java.util.List;

/**
 * Resposta de {@code POST /charges/generate} — ver javadoc de {@link
 * GenerateChargesRequest} sobre este endpoint não fazer parte do contrato
 * OpenAPI ainda. Os itens de {@link #created()} são o DTO de contrato
 * {@link Charge} (reaproveitado, nunca redefinido).
 *
 * @param created cobranças efetivamente criadas nesta chamada (vazio se a
 *     competência já tinha sido totalmente gerada — idempotência).
 * @param alreadyExisted quantos pacientes ativos já tinham cobrança para a
 *     competência (não recriadas).
 * @param archivedSkipped quantos pacientes arquivados (status {@code
 *     inativo}) foram ignorados (nunca recebem cobrança nova).
 */
public record GenerateChargesResponse(List<Charge> created, int alreadyExisted, int archivedSkipped) {}
