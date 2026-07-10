package com.psiops.api.billing.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Payload de {@code POST /charges/generate}: dispara a geração idempotente
 * das mensalidades do mês para todos os pacientes ATIVOS da psicóloga
 * autenticada, na competência informada.
 *
 * <p><strong>Não é um DTO de contrato</strong>: o endpoint {@code
 * /charges/generate} é próprio desta implementação (PSI-026) — a
 * especificação OpenAPI (PSI-020, {@code packages/contracts/}, fora do
 * escopo permitido desta tarefa) ainda não declara um endpoint de geração em
 * lote, apenas a emissão avulsa ({@code POST /charges}, usada
 * idempotentemente por paciente/competência via o 409 documentado). Este
 * record fica em {@code com.psiops.api.billing.web} (não em {@code
 * com.psiops.contracts.model}) exatamente por isso — nenhum DTO gerado é
 * redefinido.
 */
public record GenerateChargesRequest(@NotBlank @Pattern(regexp = "^[0-9]{4}-(0[1-9]|1[0-2])$") String competence) {}
